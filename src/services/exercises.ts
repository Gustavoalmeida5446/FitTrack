import exercisesDataUrl from '../../exercises.json?url';
import type { ExerciseMediaType, MuscleGroup } from '../data/types';
import { getExerciseSearchScore, type ExerciseSearchField } from '../lib/exerciseSearch';
import { getCatalogExerciseAliases, getExerciseDisplayName } from '../lib/exerciseNames';
import { normalizeSearchValue } from '../lib/search';

interface ExerciseRecord {
  id: string;
  name: string;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  category: string | null;
  images: string[];
}

export interface ExerciseOption {
  id: string;
  sourceId: string;
  name: string;
  ptName?: string;
  muscleGroup: MuscleGroup;
  mediaType: ExerciseMediaType;
  mediaUrl: string | null;
  mediaUrls: string[];
  category: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
}

interface IndexedExerciseRecord {
  exercise: ExerciseRecord;
  displayName: string;
  searchFields: ExerciseSearchField[];
}

interface RankedExerciseResult {
  exercise: ExerciseRecord;
  displayName: string;
  score: number;
}

const exerciseImageBaseUrl = 'https://yuhonas.github.io/free-exercise-db/exercises/';
const exerciseAliases: Record<string, string[]> = {
  'Wide-Grip_Lat_Pulldown': ['pulley frente', 'puxada alta', 'pulley frontal', 'puxada aberta', 'pulley costas'],
  'Full_Range-Of-Motion_Lat_Pulldown': ['pulley frente', 'puxada alta', 'pulley frontal'],
  One_Arm_Lat_Pulldown: ['pulley unilateral', 'puxada unilateral'],
  'V-Bar_Pulldown': ['pulley triangulo', 'pulley com triangulo', 'puxada triangulo'],
  Underhand_Cable_Pulldowns: ['pulley supinado', 'puxada supinada'],
  'Close-Grip_Front_Lat_Pulldown': ['pulley frente pegada fechada', 'puxada frontal pegada fechada'],
  Seated_Leg_Curl: ['cadeira flexora', 'flexora sentada'],
  Lying_Leg_Curls: ['mesa flexora', 'flexora deitado'],
  Standing_Leg_Curl: ['flexora em pé'],
  Leg_Extensions: ['cadeira extensora', 'extensora'],
  'Single-Leg_Leg_Extension': ['cadeira extensora unilateral', 'extensora unilateral'],
  Smith_Machine_Bench_Press: ['supino maquina', 'supino barra guiada', 'supino smith'],
  Smith_Machine_Squat: ['agachamento barra guiada', 'agachamento smith'],
  Barbell_Full_Squat: ['agachamento livre'],
  Seated_Cable_Rows: ['remada baixa', 'remada sentado'],
  Elevated_Cable_Rows: ['remada baixa elevada', 'remada no cabo'],
  Leverage_Chest_Press: ['supino articulado maquina'],
  Leverage_Incline_Chest_Press: ['supino inclinado articulado maquina'],
  Leverage_Decline_Chest_Press: ['supino declinado articulado maquina'],
  Thigh_Abductor: ['abducao de quadril', 'abdução de quadril', 'abdutor', 'cadeira abdutora', 'maquina abdutora'],
  Thigh_Adductor: ['aducao de quadril', 'adução de quadril', 'adutor', 'cadeira adutora', 'maquina adutora']
};
const muscleGroupMap: Record<string, MuscleGroup> = {
  chest: 'Peito',
  lats: 'Costas',
  middle_back: 'Costas',
  lower_back: 'Costas',
  traps: 'Costas',
  neck: 'Costas',
  quadriceps: 'Pernas',
  hamstrings: 'Pernas',
  glutes: 'Pernas',
  calves: 'Pernas',
  abductors: 'Pernas',
  adductors: 'Pernas',
  shoulders: 'Ombros',
  biceps: 'Braços',
  triceps: 'Braços',
  forearms: 'Braços',
  abdominals: 'Core'
};
const musclePtMap: Record<string, string> = {
  abdominals: 'abdômen',
  abductors: 'abdutores',
  adductors: 'adutores',
  biceps: 'bíceps',
  calves: 'panturrilhas',
  chest: 'peito',
  forearms: 'antebraços',
  glutes: 'glúteos',
  hamstrings: 'posteriores',
  lats: 'dorsais',
  lower_back: 'lombar',
  middle_back: 'costas',
  neck: 'pescoço',
  quadriceps: 'quadríceps',
  shoulders: 'ombros',
  traps: 'trapézio',
  triceps: 'tríceps'
};
const equipmentPtMap: Record<string, string> = {
  bands: 'elástico',
  barbell: 'barra',
  'body only': 'peso corporal',
  cable: 'cabo pulley',
  dumbbell: 'halter halteres',
  'e-z curl bar': 'barra w',
  exercise: 'exercício',
  kettlebells: 'kettlebell',
  machine: 'máquina aparelho',
  other: 'outro',
  rope: 'corda'
};
const categoryPtMap: Record<string, string> = {
  cardio: 'cardio',
  olympic_weightlifting: 'levantamento olímpico',
  plyometrics: 'pliometria',
  powerlifting: 'levantamento de força',
  strength: 'musculação força',
  stretching: 'alongamento',
  strongman: 'strongman'
};

let indexedExercisesPromise: Promise<IndexedExerciseRecord[]> | null = null;

function getExerciseAliases(exercise: ExerciseRecord): string[] {
  return [
    ...(exerciseAliases[exercise.id] ?? []),
    ...getCatalogExerciseAliases(exercise.id)
  ].filter(Boolean);
}

function getTranslatedValues(values: string[], translationMap: Record<string, string>): string[] {
  return values.map((value) => translationMap[normalizeSearchValue(value)] ?? '').filter(Boolean);
}

function inferMuscleGroup(exercise: ExerciseRecord): MuscleGroup {
  const muscles = [...(exercise.primaryMuscles ?? []), ...(exercise.secondaryMuscles ?? [])];

  for (const muscle of muscles) {
    const normalizedMuscle = normalizeSearchValue(muscle);
    const mappedGroup = muscleGroupMap[normalizedMuscle];

    if (mappedGroup) {
      return mappedGroup;
    }
  }

  return 'Peito';
}

function mapExerciseOption(exercise: ExerciseRecord): ExerciseOption {
  const mediaUrls = exercise.images.slice(0, 2).map((imagePath) => `${exerciseImageBaseUrl}${imagePath}`);
  const ptName = getExerciseDisplayName(exercise.id, exercise.name);

  return {
    id: exercise.id,
    sourceId: exercise.id,
    name: exercise.name,
    ptName,
    muscleGroup: inferMuscleGroup(exercise),
    mediaType: mediaUrls.length > 0 ? 'image' : 'none',
    mediaUrl: mediaUrls[0] ?? null,
    mediaUrls,
    category: exercise.category ?? null,
    equipment: exercise.equipment ?? null,
    primaryMuscles: exercise.primaryMuscles ?? [],
    secondaryMuscles: exercise.secondaryMuscles ?? []
  };
}

function getExerciseSearchFields(exercise: ExerciseRecord): ExerciseSearchField[] {
  const muscles = [...(exercise.primaryMuscles ?? []), ...(exercise.secondaryMuscles ?? [])];
  const normalizedEquipment = exercise.equipment ? normalizeSearchValue(exercise.equipment) : '';
  const normalizedCategory = exercise.category ? normalizeSearchValue(exercise.category) : '';

  return [
    { value: getExerciseDisplayName(exercise.id, exercise.name), weight: 5 },
    { value: exercise.name, weight: 4 },
    ...getExerciseAliases(exercise).map((alias) => ({ value: alias, weight: 4 })),
    ...muscles.map((muscle) => ({ value: muscle, weight: 3 })),
    ...getTranslatedValues(muscles, musclePtMap).map((muscle) => ({ value: muscle, weight: 3 })),
    { value: inferMuscleGroup(exercise), weight: 3 },
    { value: exercise.equipment ?? '', weight: 3 },
    { value: equipmentPtMap[normalizedEquipment] ?? '', weight: 3 },
    { value: exercise.category ?? '', weight: 1 },
    { value: categoryPtMap[normalizedCategory] ?? '', weight: 1 }
  ].filter((field) => field.value.trim().length > 0);
}

async function loadIndexedExercises(): Promise<IndexedExerciseRecord[]> {
  if (!indexedExercisesPromise) {
    indexedExercisesPromise = fetch(exercisesDataUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Não foi possível carregar os exercícios.');
        }

        return response.json() as Promise<ExerciseRecord[]>;
      })
      .then((exercises) => exercises.map((exercise) => ({
        exercise,
        displayName: getExerciseDisplayName(exercise.id, exercise.name),
        searchFields: getExerciseSearchFields(exercise)
      })))
      .catch((error) => {
        indexedExercisesPromise = null;
        throw error;
      });
  }

  return indexedExercisesPromise;
}

function insertRankedExerciseResult(results: RankedExerciseResult[], nextResult: RankedExerciseResult, limit?: number) {
  let insertIndex = results.findIndex((currentResult) => {
    if (nextResult.score !== currentResult.score) {
      return nextResult.score > currentResult.score;
    }

    return nextResult.displayName.localeCompare(currentResult.displayName, 'pt-BR') < 0;
  });

  if (insertIndex === -1) {
    insertIndex = results.length;
  }

  results.splice(insertIndex, 0, nextResult);

  if (limit && results.length > limit) {
    results.length = limit;
  }
}

export async function searchExercises(query: string, limit?: number): Promise<ExerciseOption[]> {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) {
    return [];
  }

  const indexedExercises = await loadIndexedExercises();
  const rankedResults = indexedExercises.reduce<RankedExerciseResult[]>((results, item) => {
    const score = getExerciseSearchScore(query, { fields: item.searchFields });

    if (score < 0) {
      return results;
    }

    insertRankedExerciseResult(results, {
      exercise: item.exercise,
      displayName: item.displayName,
      score
    }, limit);

    return results;
  }, []);

  return rankedResults.map((item) => mapExerciseOption(item.exercise));
}
