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

function normalizeSearchValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function getSearchScore(name: string, query: string): number {
  const normalizedName = normalizeSearchValue(name);
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) return -1;
  if (normalizedName === normalizedQuery) return 4;
  if (normalizedName.startsWith(normalizedQuery)) return 3;

  const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);
  if (queryTerms.length === 0) return -1;

  const containsAllTerms = queryTerms.every((term) => normalizedName.includes(term));
  if (!containsAllTerms) return -1;

  return 2;
}

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
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];

  const exercises = await loadExercises();

  return exercises
    .map((item) => ({
      item,
      score: getSearchScore(item.name, normalizedQuery)
    }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.item.name.localeCompare(b.item.name, 'pt-BR');
    })
    .map((entry) => entry.item)
    .slice(0, 10);
}
