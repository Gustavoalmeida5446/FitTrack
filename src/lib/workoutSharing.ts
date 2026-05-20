import type { Workout, WorkoutExercise } from '../data/types';
import { isValidWorkoutForSave } from './validation';
import { normalizeWorkoutExerciseSets, summarizeWorkoutExerciseSets } from './workoutSets';

const workoutExportType = 'fittrack.workout';
const workoutExportVersion = 1;

interface WorkoutExportFile {
  type: typeof workoutExportType;
  version: typeof workoutExportVersion;
  exportedAt: string;
  workout: Workout;
}

interface ImportedWorkoutResult {
  success: boolean;
  workout?: Workout;
  message?: string;
}

function resetExerciseProgress(exercise: WorkoutExercise): WorkoutExercise {
  const setsDetail = normalizeWorkoutExerciseSets(exercise).map((set) => ({ ...set, done: false }));
  const setSummary = summarizeWorkoutExerciseSets(setsDetail);

  return {
    ...exercise,
    ...setSummary,
    done: false,
    setsDetail
  };
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `imported-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function cloneWorkoutForImport(workout: Workout): Workout {
  const nextWorkoutId = createId();

  return {
    id: nextWorkoutId,
    name: `${workout.name} (importado)`,
    muscleGroups: workout.muscleGroups,
    archivedAt: null,
    exercises: workout.exercises.map((exercise) => {
      const nextExerciseId = createId();
      const setsDetail = normalizeWorkoutExerciseSets(exercise).map((set, setIndex) => ({
        id: `${nextExerciseId}-set-${setIndex + 1}`,
        loadKg: set.loadKg,
        reps: set.reps,
        done: false
      }));
      const setSummary = summarizeWorkoutExerciseSets(setsDetail);

      return {
        ...exercise,
        id: nextExerciseId,
        ...setSummary,
        done: false,
        setsDetail
      };
    })
  };
}

export function getWorkoutExportFileName(workout: Workout): string {
  const safeName = workout.name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${safeName || 'treino'}-fittrack.json`;
}

export function createWorkoutExportText(workout: Workout): string {
  const exportFile: WorkoutExportFile = {
    type: workoutExportType,
    version: workoutExportVersion,
    exportedAt: new Date().toISOString(),
    workout: {
      ...workout,
      archivedAt: null,
      exercises: workout.exercises.map(resetExerciseProgress)
    }
  };

  return JSON.stringify(exportFile, null, 2);
}

export function parseImportedWorkoutFile(fileText: string): ImportedWorkoutResult {
  let parsedFile: unknown;

  try {
    parsedFile = JSON.parse(fileText);
  } catch {
    return {
      success: false,
      message: 'Arquivo de treino inválido.'
    };
  }

  if (!parsedFile || typeof parsedFile !== 'object') {
    return {
      success: false,
      message: 'Arquivo de treino inválido.'
    };
  }

  const exportFile = parsedFile as Partial<WorkoutExportFile>;

  if (exportFile.type !== workoutExportType || exportFile.version !== workoutExportVersion || !exportFile.workout) {
    return {
      success: false,
      message: 'Este arquivo não parece ser um treino exportado pelo FitTrack.'
    };
  }

  const importedWorkout = cloneWorkoutForImport(exportFile.workout);

  if (!isValidWorkoutForSave(importedWorkout)) {
    return {
      success: false,
      message: 'O treino importado está incompleto ou corrompido.'
    };
  }

  return {
    success: true,
    workout: importedWorkout
  };
}
