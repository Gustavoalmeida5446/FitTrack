import exerciseNamePtData from '../data/exercise-name-pt.json';

interface ExerciseTranslationRecord {
  ptName?: string;
  aliases?: string[];
}

const exerciseNamePt = exerciseNamePtData as Record<string, ExerciseTranslationRecord>;

function cleanExerciseName(value?: string | null): string {
  return value?.trim() ?? '';
}

export function getCatalogExercisePtName(sourceId?: string | null): string | undefined {
  const ptName = sourceId ? cleanExerciseName(exerciseNamePt[sourceId]?.ptName) : '';

  return ptName || undefined;
}

export function getCatalogExerciseAliases(sourceId?: string | null): string[] {
  return sourceId ? (exerciseNamePt[sourceId]?.aliases ?? []).filter(Boolean) : [];
}

export function getExerciseDisplayName(
  sourceId?: string | null,
  fallbackName?: string | null,
  savedPtName?: string | null
): string {
  return cleanExerciseName(savedPtName)
    || getCatalogExercisePtName(sourceId)
    || cleanExerciseName(fallbackName)
    || 'Exercício';
}
