import exercisesData from '../../exercises.json';
import exerciseNamePtData from '../data/exercise-name-pt.json';
import type { ExerciseMediaType, MuscleGroup } from '../data/types';

export interface ExerciseRecord {
  id: string;
  name: string;
  force: string | null;
  level: string | null;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
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

const exercises = exercisesData as ExerciseRecord[];
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
  if (normalizedName === normalizedQuery) return 8;
  if (normalizedName.startsWith(normalizedQuery)) return 7;
  if (normalizedName.includes(` ${normalizedQuery}`) || normalizedName.includes(`${normalizedQuery} `)) return 6;
  if (normalizedName.includes(normalizedQuery)) return 5;

  const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);
  if (queryTerms.length === 0) return -1;

  const matchedTerms = queryTerms.filter((term) => normalizedName.includes(term)).length;
  if (matchedTerms === queryTerms.length) return 4;
  if (matchedTerms > 0) return 1;

  return -1;
}

function getExerciseDisplayName(exercise: ExerciseRecord): string {
  return exerciseNamePt[exercise.id]?.ptName?.trim()
    || exercise.name;
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

export function getAllExercises(): ExerciseOption[] {
  return exercises.map(mapExerciseOption);
}

export function searchExercises(query: string): ExerciseOption[] {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [];
  }

  return exercises
    .map((exercise) => ({
      exercise,
      score: Math.max(...getExerciseSearchTexts(exercise).map((text) => getSearchScore(text, normalizedQuery)))
    }))
    .filter((item) => item.score >= 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return getExerciseDisplayName(a.exercise).localeCompare(getExerciseDisplayName(b.exercise), 'pt-BR');
    })
    .map((item) => mapExerciseOption(item.exercise));
}

export function getExerciseById(id: string): ExerciseOption | undefined {
  const exercise = exercises.find((item) => item.id === id);
  return exercise ? mapExerciseOption(exercise) : undefined;
}

export function getExercisesByMuscle(muscle: string): ExerciseOption[] {
  const normalizedMuscle = normalizeSearchValue(muscle);

  return exercises
    .filter((exercise) => [...exercise.primaryMuscles, ...exercise.secondaryMuscles].some((item) => normalizeSearchValue(item) === normalizedMuscle))
    .map(mapExerciseOption);
}

export function getExercisesByEquipment(equipment: string): ExerciseOption[] {
  const normalizedEquipment = normalizeSearchValue(equipment);

  return exercises
    .filter((exercise) => normalizeSearchValue(exercise.equipment ?? '') === normalizedEquipment)
    .map(mapExerciseOption);
}

export function getExercisesByCategory(category: string): ExerciseOption[] {
  const normalizedCategory = normalizeSearchValue(category);

  return exercises
    .filter((exercise) => normalizeSearchValue(exercise.category ?? '') === normalizedCategory)
    .map(mapExerciseOption);
}
