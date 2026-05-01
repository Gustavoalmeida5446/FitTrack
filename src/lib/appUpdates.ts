import { DietDay, WaterData, WeightLog, Workout, WorkoutExerciseSet } from '../data/types';
import { formatDatePtBr } from './date';
import { normalizeWorkoutExerciseSets, summarizeWorkoutExerciseSets } from './workoutSets';

export function createWeightHistoryEntry(weight: number, date = new Date()): WeightLog {
  return {
    date: formatDatePtBr(date),
    weight
  };
}

export function getCurrentWeightFromHistory(history: WeightLog[], fallbackWeight = 0): number {
  return history[0]?.weight ?? fallbackWeight;
}

export function addWaterAmount(water: WaterData, amount: number, updatedAt: string): WaterData {
  return {
    ...water,
    consumedMl: water.consumedMl + amount,
    updatedAt
  };
}

export function toggleWorkoutExerciseDone(workout: Workout, exerciseId: string): Workout {
  return {
    ...workout,
    exercises: workout.exercises.map((exercise) => {
      if (exercise.id !== exerciseId) {
        return exercise;
      }

      const nextDone = !exercise.done;
      const setsDetail = normalizeWorkoutExerciseSets(exercise).map((set) => ({ ...set, done: nextDone }));

      return {
        ...exercise,
        ...summarizeWorkoutExerciseSets(setsDetail),
        setsDetail
      };
    })
  };
}

export function updateWorkoutExerciseLoad(workout: Workout, exerciseId: string, loadKg: number): Workout {
  return {
    ...workout,
    exercises: workout.exercises.map((exercise) => {
      if (exercise.id !== exerciseId) {
        return exercise;
      }

      const setsDetail = normalizeWorkoutExerciseSets(exercise).map((set) => ({ ...set, loadKg }));

      return {
        ...exercise,
        ...summarizeWorkoutExerciseSets(setsDetail),
        setsDetail
      };
    })
  };
}

export function updateWorkoutExerciseSet(
  workout: Workout,
  exerciseId: string,
  setId: string,
  patch: Partial<Pick<WorkoutExerciseSet, 'loadKg' | 'reps' | 'done'>>
): Workout {
  return {
    ...workout,
    exercises: workout.exercises.map((exercise) => {
      if (exercise.id !== exerciseId) {
        return exercise;
      }

      const setsDetail = normalizeWorkoutExerciseSets(exercise).map((set) => (
        set.id === setId ? { ...set, ...patch } : set
      ));

      return {
        ...exercise,
        ...summarizeWorkoutExerciseSets(setsDetail),
        setsDetail
      };
    })
  };
}

export function toggleCompletedMealForDay(day: DietDay, mealId: string): DietDay {
  return {
    ...day,
    completedMealIds: day.completedMealIds.includes(mealId)
      ? day.completedMealIds.filter((item) => item !== mealId)
      : [...day.completedMealIds, mealId]
  };
}

export function syncCompletedMealsWithSelection(day: DietDay, mealIds: string[]): DietDay {
  return {
    ...day,
    mealIds,
    completedMealIds: day.completedMealIds.filter((mealId) => mealIds.includes(mealId))
  };
}

export function clearDietDayMeals(day: DietDay): DietDay {
  return {
    ...day,
    mealIds: [],
    completedMealIds: []
  };
}
