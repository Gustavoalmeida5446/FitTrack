import { DietDay, WaterData, WeightLog, Workout } from '../data/types';
import { formatDatePtBr } from './date';

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
    exercises: workout.exercises.map((exercise) => exercise.id === exerciseId ? { ...exercise, done: !exercise.done } : exercise)
  };
}

export function updateWorkoutExerciseLoad(workout: Workout, exerciseId: string, loadKg: number): Workout {
  return {
    ...workout,
    exercises: workout.exercises.map((exercise) => exercise.id === exerciseId ? { ...exercise, loadKg } : exercise)
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
