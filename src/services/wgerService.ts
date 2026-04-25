import { mockWorkouts } from '../data/mockData';

export interface ExerciseOption {
  id: string;
  name: string;
}

interface WgerExercise {
  id?: number;
  uuid?: string;
  name?: string;
}

interface WgerExercisesResponse {
  results?: WgerExercise[];
}

const WGER_EXERCISES_URL = 'https://wger.de/api/v2/exerciseinfo/';

const fallbackExerciseNames = [
  'Supino reto',
  'Supino inclinado',
  'Crucifixo',
  'Desenvolvimento',
  'Elevação lateral',
  'Remada baixa',
  'Puxada frontal',
  'Barra fixa',
  'Rosca direta',
  'Rosca martelo',
  'Tríceps pulley',
  'Agachamento livre',
  'Leg press',
  'Cadeira extensora',
  'Mesa flexora',
  'Levantamento terra',
  'Stiff',
  'Panturrilha em pé',
  'Prancha',
  'Abdominal infra'
];

let cachedExercises: ExerciseOption[] | null = null;

function createExerciseOption(name: string, id?: string | number): ExerciseOption {
  return {
    id: String(id ?? name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')),
    name
  };
}

function getLocalExercises(): ExerciseOption[] {
  const workoutExerciseNames = mockWorkouts.flatMap((workout) => workout.exercises.map((exercise) => exercise.name));
  const uniqueNames = [...new Set([...fallbackExerciseNames, ...workoutExerciseNames])];

  return uniqueNames.map((name) => createExerciseOption(name));
}

async function fetchWgerExercises(): Promise<ExerciseOption[]> {
  const response = await fetch(`${WGER_EXERCISES_URL}?limit=200`, {
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`wger request failed with status ${response.status}`);
  }

  const data = await response.json() as WgerExercisesResponse;
  const names = (data.results ?? [])
    .map((exercise) => {
      const value = exercise.name?.trim();
      if (!value) return null;

      return createExerciseOption(value, exercise.uuid ?? exercise.id ?? value);
    })
    .filter((exercise): exercise is ExerciseOption => Boolean(exercise));

  return names;
}

async function loadExercises(): Promise<ExerciseOption[]> {
  if (cachedExercises) {
    return cachedExercises;
  }

  try {
    const remoteExercises = await fetchWgerExercises();

    if (remoteExercises.length > 0) {
      cachedExercises = remoteExercises;
      return cachedExercises;
    }
  } catch (error) {
    console.warn('Falha ao carregar exercicios da API wger; usando fallback local.', error);
  }

  cachedExercises = getLocalExercises();
  return cachedExercises;
}

export async function searchExercises(query: string): Promise<ExerciseOption[]> {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  const exercises = await loadExercises();

  return exercises
    .filter((item) => item.name.toLowerCase().includes(normalizedQuery))
    .slice(0, 10);
}
