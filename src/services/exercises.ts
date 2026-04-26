import exercisesPt from '../data/exercises-pt.json';
import type { ExerciseMediaType, MuscleGroup } from '../data/types';

export interface ExerciseRecord {
  id: string;
  nome: string;
  nomeOriginal: string;
  forca: string | null;
  nivel: string | null;
  mecanica: string | null;
  equipamento: string | null;
  musculosPrimarios: string[];
  musculosSecundarios: string[];
  instrucoes: string[];
  instrucoesOriginais: string[];
  categoria: string | null;
  imagens: string[];
}

export interface ExerciseOption {
  id: string;
  sourceId: string;
  name: string;
  muscleGroup: MuscleGroup;
  mediaType: ExerciseMediaType;
  mediaUrl: string | null;
  mediaUrls: string[];
  category: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
}

const exercises = exercisesPt as ExerciseRecord[];
const muscleGroupMap: Record<string, MuscleGroup> = {
  peito: 'Peito',
  costas: 'Costas',
  quadriceps: 'Pernas',
  isquiotibiais: 'Pernas',
  gluteos: 'Pernas',
  panturrilhas: 'Pernas',
  ombros: 'Ombros',
  biceps: 'Braços',
  triceps: 'Braços',
  antebracos: 'Braços',
  abdominais: 'Core',
  lombar: 'Core'
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
  if (normalizedName === normalizedQuery) return 4;
  if (normalizedName.startsWith(normalizedQuery)) return 3;

  const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);
  if (queryTerms.length === 0) return -1;

  const containsAllTerms = queryTerms.every((term) => normalizedName.includes(term));
  if (!containsAllTerms) return -1;

  return 2;
}

function inferMuscleGroup(exercise: ExerciseRecord): MuscleGroup {
  const muscles = [...(exercise.musculosPrimarios ?? []), ...(exercise.musculosSecundarios ?? [])];

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
  const mediaUrls = exercise.imagens.slice(0, 2);

  return {
    id: exercise.id,
    sourceId: exercise.id,
    name: exercise.nome,
    muscleGroup: inferMuscleGroup(exercise),
    mediaType: mediaUrls.length > 0 ? 'image' : 'none',
    mediaUrl: mediaUrls[0] ?? null,
    mediaUrls,
    category: exercise.categoria ?? null,
    equipment: exercise.equipamento ?? null,
    primaryMuscles: exercise.musculosPrimarios ?? [],
    secondaryMuscles: exercise.musculosSecundarios ?? []
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
      score: getSearchScore(exercise.nome, normalizedQuery)
    }))
    .filter((item) => item.score >= 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.exercise.nome.localeCompare(b.exercise.nome, 'pt-BR');
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
    .filter((exercise) => [...exercise.musculosPrimarios, ...exercise.musculosSecundarios].some((item) => normalizeSearchValue(item) === normalizedMuscle))
    .map(mapExerciseOption);
}

export function getExercisesByEquipment(equipment: string): ExerciseOption[] {
  const normalizedEquipment = normalizeSearchValue(equipment);

  return exercises
    .filter((exercise) => normalizeSearchValue(exercise.equipamento ?? '') === normalizedEquipment)
    .map(mapExerciseOption);
}

export function getExercisesByCategory(category: string): ExerciseOption[] {
  const normalizedCategory = normalizeSearchValue(category);

  return exercises
    .filter((exercise) => normalizeSearchValue(exercise.categoria ?? '') === normalizedCategory)
    .map(mapExerciseOption);
}
