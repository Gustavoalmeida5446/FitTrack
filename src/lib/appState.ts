import { ActivityLevel, GoalType, Sex, UserProfile, WaterData, WeeklyDiet, WeightLog, Workout } from '../data/types';
import { getTodayDateString } from './date';

export interface AppState {
  profile: UserProfile;
  workouts: Workout[];
  water: WaterData;
  weeklyDiet: WeeklyDiet;
  weightHistory: WeightLog[];
}

function createEmptyProfile(): UserProfile {
  return {
    currentWeight: 0,
    heightCm: 0,
    age: 0,
    sex: 'Masculino' as Sex,
    activityLevel: 'Moderado' as ActivityLevel,
    goal: 'Manutenção' as GoalType
  };
}

function createEmptyWeeklyDiet(): WeeklyDiet {
  return {
    id: 'diet-empty',
    days: Array.from({ length: 7 }, (_, index) => ({
      id: `d-${index + 1}`,
      label: `Dia ${index + 1}`,
      meals: []
    }))
  };
}

function createEmptyWater(): WaterData {
  return {
    goalMl: 0,
    consumedMl: 0,
    updatedAt: getTodayDateString()
  };
}

export const defaultAppState: AppState = {
  profile: createEmptyProfile(),
  workouts: [] as Workout[],
  water: createEmptyWater(),
  weeklyDiet: createEmptyWeeklyDiet(),
  weightHistory: [] as WeightLog[]
};

export function normalizeWaterData(water?: WaterData): WaterData {
  const fallback = water ?? defaultAppState.water;
  const today = getTodayDateString();

  if (fallback.updatedAt === today) {
    return fallback;
  }

  return {
    ...fallback,
    consumedMl: 0,
    updatedAt: today
  };
}
