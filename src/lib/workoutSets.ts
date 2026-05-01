import type { WorkoutExercise, WorkoutExerciseSet } from '../data/types';

export function createWorkoutExerciseSets(
  exerciseId: string,
  count: number,
  loadKg: number,
  reps: number,
  done = false
): WorkoutExerciseSet[] {
  const setCount = Math.max(0, Math.floor(count));

  return Array.from({ length: setCount }, (_, index) => ({
    id: `${exerciseId}-set-${index + 1}`,
    loadKg,
    reps,
    done
  }));
}

export function normalizeWorkoutExerciseSets(exercise: WorkoutExercise): WorkoutExerciseSet[] {
  if (Array.isArray(exercise.setsDetail) && exercise.setsDetail.length > 0) {
    return exercise.setsDetail.map((set, index) => ({
      id: set.id || `${exercise.id}-set-${index + 1}`,
      loadKg: set.loadKg,
      reps: set.reps,
      done: Boolean(set.done)
    }));
  }

  return createWorkoutExerciseSets(exercise.id, exercise.sets, exercise.loadKg, exercise.reps, exercise.done);
}

export function summarizeWorkoutExerciseSets(sets: WorkoutExerciseSet[]) {
  const firstSet = sets[0];

  return {
    loadKg: firstSet?.loadKg ?? 0,
    reps: firstSet?.reps ?? 0,
    sets: sets.length,
    done: sets.length > 0 && sets.every((set) => set.done)
  };
}

export function withNormalizedWorkoutExerciseSets(exercise: WorkoutExercise): WorkoutExercise {
  const setsDetail = normalizeWorkoutExerciseSets(exercise);
  const summary = summarizeWorkoutExerciseSets(setsDetail);

  return {
    ...exercise,
    ...summary,
    setsDetail
  };
}
