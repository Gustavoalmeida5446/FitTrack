import exercisesDataUrl from '../../exercises.json?url';
import exerciseNamePtData from '../data/exercise-name-pt.json';
import type { ExerciseMediaType, MuscleGroup } from '../data/types';
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

interface ExerciseTranslationRecord {
  ptName?: string;
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
  normalizedSearchTexts: string[];
}

interface RankedExerciseResult {
  exercise: ExerciseRecord;
  displayName: string;
  score: number;
}

const exerciseNamePt = exerciseNamePtData as Record<string, ExerciseTranslationRecord>;
const exerciseImageBaseUrl = 'https://yuhonas.github.io/free-exercise-db/exercises/';
const exerciseAliases: Record<string, string[]> = {
  Lat_Pulldown: ['pulley frente', 'puxada alta', 'pulley frontal'],
  'Close-Grip_Front_Lat_Pulldown': ['pulley frente pegada fechada', 'puxada frontal pegada fechada'],
  Seated_Leg_Curl: ['cadeira flexora', 'flexora sentada'],
  Lying_Leg_Curls: ['mesa flexora', 'flexora deitado'],
  Leg_Extensions: ['cadeira extensora', 'extensora'],
  Smith_Machine_Bench_Press: ['supino maquina', 'supino barra guiada', 'supino smith'],
  Chair_Squat: ['agachamento barra guiada', 'agachamento smith'],
  Barbell_Squat: ['agachamento livre'],
  Seated_Cable_Rows: ['remada baixa', 'remada sentado'],
  Leverage_Chest_Press: ['supino articulado maquina']
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

let indexedExercisesPromise: Promise<IndexedExerciseRecord[]> | null = null;

function getSearchScore(normalizedName: string, normalizedQuery: string, queryTerms: string[]): number {
  if (!normalizedQuery) return -1;
  if (normalizedName === normalizedQuery) return 8;
  if (normalizedName.startsWith(normalizedQuery)) return 7;
  if (normalizedName.includes(` ${normalizedQuery}`) || normalizedName.includes(`${normalizedQuery} `)) return 6;
  if (normalizedName.includes(normalizedQuery)) return 5;

  if (queryTerms.length === 0) return -1;

  const matchedTerms = queryTerms.filter((term) => normalizedName.includes(term)).length;
  if (matchedTerms === queryTerms.length) return 4;
  if (matchedTerms > 0) return 1;

  return -1;
}

function getExerciseDisplayName(exercise: ExerciseRecord): string {
  return exerciseNamePt[exercise.id]?.ptName?.trim() || exercise.name;
}

function getExerciseSearchTexts(exercise: ExerciseRecord): string[] {
  return [
    getExerciseDisplayName(exercise),
    exercise.name,
    exercise.equipment ?? '',
    exercise.category ?? '',
    ...(exercise.primaryMuscles ?? []),
    ...(exercise.secondaryMuscles ?? []),
    ...(exerciseAliases[exercise.id] ?? [])
  ].filter(Boolean);
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
  const ptName = getExerciseDisplayName(exercise);

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
        displayName: getExerciseDisplayName(exercise),
        normalizedSearchTexts: getExerciseSearchTexts(exercise).map((text) => normalizeSearchValue(text))
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
  const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);

  if (!normalizedQuery) {
    return [];
  }

  const indexedExercises = await loadIndexedExercises();
  const rankedResults = indexedExercises.reduce<RankedExerciseResult[]>((results, item) => {
    const score = Math.max(...item.normalizedSearchTexts.map((text) => getSearchScore(text, normalizedQuery, queryTerms)));

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
