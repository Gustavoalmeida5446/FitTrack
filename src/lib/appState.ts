import {
  ActivityLevel,
  DietType,
  GoalType,
  Sex,
  UserProfile,
  WaterData,
  WeeklyDiet,
  WeightLog,
  Workout
} from '../data/types';
import { getTodayDateString, weekDayLabels } from './date';
import {
  LegacyProfile,
  LegacyWeeklyDiet,
  LegacyWorkout,
  LegacyWorkoutState,
  PersistedWorkoutState,
  normalizeLegacyProfile,
  normalizeLegacyWeeklyDiet,
  normalizeLegacyWorkoutList
} from './legacyState';

export interface AppState {
  profile: UserProfile;
  workouts: Workout[];
  workoutsUpdatedAt: string;
  water: WaterData;
  weeklyDiet: WeeklyDiet;
  weightHistory: WeightLog[];
}

function createEmptyProfile(): UserProfile {
  return {
    currentWeight: 0,
    heightCm: 0,
    birthDate: '',
    age: 0,
    sex: 'Masculino' as Sex,
    activityLevel: 'Moderado' as ActivityLevel,
    goal: 'Manutenção' as GoalType,
    dietType: 'Equilibrada' as DietType
  };
}

export function normalizeProfile(profile?: LegacyProfile): UserProfile {
  const fallback = createEmptyProfile();

  return normalizeLegacyProfile(profile, fallback);
}

function createEmptyWeeklyDiet(): WeeklyDiet {
  return {
    id: 'diet-empty',
    meals: [],
    days: weekDayLabels.map((label, index) => ({
      id: `d-${index + 1}`,
      label,
      mealIds: [],
      completedMealIds: []
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
  profile: normalizeProfile(),
  workouts: [],
  workoutsUpdatedAt: getTodayDateString(),
  water: createEmptyWater(),
  weeklyDiet: createEmptyWeeklyDiet(),
  weightHistory: [] as WeightLog[]
};

function resetWorkoutProgress(workouts: Workout[]): Workout[] {
  return workouts.map((workout) => ({
    ...workout,
    exercises: workout.exercises.map((exercise) => ({
      ...exercise,
      done: false
    }))
  }));
}

function normalizeWorkoutList(workouts?: Workout[] | LegacyWorkoutState | LegacyWorkout[] | null): Workout[] {
  return normalizeLegacyWorkoutList(workouts);
}

export function normalizeWorkoutState(workouts?: Workout[] | LegacyWorkoutState | LegacyWorkout[] | null): Workout[] {
  return normalizeWorkoutList(workouts);
}

export function normalizeWorkoutProgressState(workouts?: Workout[] | PersistedWorkoutState | LegacyWorkoutState | LegacyWorkout[] | null): Pick<AppState, 'workouts' | 'workoutsUpdatedAt'> {
  const today = getTodayDateString();
  const rawUpdatedAt = workouts && !Array.isArray(workouts) && typeof workouts === 'object'
    ? 'updatedAt' in workouts && typeof workouts.updatedAt === 'string'
      ? workouts.updatedAt
      : 'progressUpdatedAt' in workouts && typeof workouts.progressUpdatedAt === 'string'
        ? workouts.progressUpdatedAt
        : ''
    : '';
  const normalizedWorkouts = normalizeWorkoutList(workouts);

  if (rawUpdatedAt === today) {
    return {
      workouts: normalizedWorkouts,
      workoutsUpdatedAt: today
    };
  }

  return {
    workouts: resetWorkoutProgress(normalizedWorkouts),
    workoutsUpdatedAt: today
  };
}

export function serializeWorkoutProgressState(workouts: Workout[], workoutsUpdatedAt: string): PersistedWorkoutState {
  return {
    updatedAt: workoutsUpdatedAt,
    workouts
  };
}

export function normalizeWorkoutProgressForToday(workouts: Workout[], workoutsUpdatedAt: string): Pick<AppState, 'workouts' | 'workoutsUpdatedAt'> {
  const today = getTodayDateString();

  if (workoutsUpdatedAt === today) {
    return {
      workouts,
      workoutsUpdatedAt
    };
  }

  return {
    workouts: resetWorkoutProgress(workouts),
    workoutsUpdatedAt: today
  };
}

export function normalizeWeeklyDiet(diet?: WeeklyDiet | LegacyWeeklyDiet | null): WeeklyDiet {
  const baseDays = createEmptyWeeklyDiet().days;
  return normalizeLegacyWeeklyDiet(diet, baseDays) ?? createEmptyWeeklyDiet();
}

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

export function sanitizeAppStateForSave(state: AppState): AppState {
  const workoutState = normalizeWorkoutProgressState(serializeWorkoutProgressState(state.workouts, state.workoutsUpdatedAt));

  return {
    profile: normalizeProfile(state.profile),
    workouts: workoutState.workouts,
    workoutsUpdatedAt: workoutState.workoutsUpdatedAt,
    water: normalizeWaterData(state.water),
    weeklyDiet: normalizeWeeklyDiet(state.weeklyDiet),
    weightHistory: Array.isArray(state.weightHistory)
      ? state.weightHistory.filter((entry) => typeof entry?.date === 'string' && typeof entry?.weight === 'number')
      : []
  };
}

export function hasSuspiciousWorkoutData(workouts: Workout[]): boolean {
  return workouts.some((workout) => workout.exercises.some((exercise) => {
    const looksLikeFallbackName = exercise.name.trim() === 'Exercício';
    const isMissingExerciseReference = !exercise.sourceId && !exercise.ptName;

    return looksLikeFallbackName && isMissingExerciseReference;
  }));
}
