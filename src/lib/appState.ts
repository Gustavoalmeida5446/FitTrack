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
  getWorkoutProgressUpdatedAt,
  getWorkoutStateFormat,
  LegacyProfile,
  LegacyWeeklyDiet,
  LegacyWorkout,
  LegacyWorkoutState,
  PersistedWorkoutState,
  normalizeLegacyProfile,
  normalizeLegacyWeeklyDiet,
  normalizeLegacyWorkoutList
} from './legacyState';
import {
  validateAppState,
  validateProfile,
  validateWaterData,
  validateWeeklyDiet,
  validateWeightHistory,
  validateWorkouts
} from './validation';

export interface AppState {
  profile: UserProfile;
  workouts: Workout[];
  workoutsUpdatedAt: string;
  water: WaterData;
  weeklyDiet: WeeklyDiet;
  weightHistory: WeightLog[];
}

export const PERSISTED_WORKOUT_STATE_VERSION = 1;

// AppState é o shape em memória usado pela UI.
// Para persistência remota, o único formato novo que escrevemos para treinos é:
// { version: 1, updatedAt: 'YYYY-MM-DD', workouts: Workout[] }
//
// A leitura ainda aceita formatos antigos via legacyState.ts para manter compatibilidade,
// mas esse arquivo trata o formato acima como o caminho principal do projeto.

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

function normalizeWorkoutList(workouts?: Workout[] | PersistedWorkoutState | LegacyWorkoutState | LegacyWorkout[] | null): Workout[] {
  return normalizeLegacyWorkoutList(workouts);
}

export function normalizeWorkoutState(workouts?: Workout[] | PersistedWorkoutState | LegacyWorkoutState | LegacyWorkout[] | null): Workout[] {
  return normalizeWorkoutList(workouts);
}

export function normalizeWorkoutProgressState(workouts?: Workout[] | PersistedWorkoutState | LegacyWorkoutState | LegacyWorkout[] | null): Pick<AppState, 'workouts' | 'workoutsUpdatedAt'> {
  const today = getTodayDateString();
  const workoutStateFormat = getWorkoutStateFormat(workouts);
  const rawUpdatedAt = getWorkoutProgressUpdatedAt(workouts);
  const normalizedWorkouts = normalizeWorkoutList(workouts);

  if (workoutStateFormat === 'empty' || workoutStateFormat === 'unknown') {
    return {
      workouts: [],
      workoutsUpdatedAt: today
    };
  }

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
    version: PERSISTED_WORKOUT_STATE_VERSION,
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
  const sanitizedState: AppState = {
    profile: validateProfile(normalizeProfile(state.profile), normalizeProfile()),
    workouts: validateWorkouts(workoutState.workouts),
    workoutsUpdatedAt: workoutState.workoutsUpdatedAt,
    water: validateWaterData(normalizeWaterData(state.water), normalizeWaterData(defaultAppState.water)),
    weeklyDiet: validateWeeklyDiet(normalizeWeeklyDiet(state.weeklyDiet), createEmptyWeeklyDiet()),
    weightHistory: validateWeightHistory(state.weightHistory)
  };

  return validateAppState(sanitizedState) ?? sanitizedState;
}

export function hasSuspiciousWorkoutData(workouts: Workout[]): boolean {
  return workouts.some((workout) => workout.exercises.some((exercise) => {
    const looksLikeFallbackName = exercise.name.trim() === 'Exercício';
    const isMissingExerciseReference = !exercise.sourceId && !exercise.ptName;

    return looksLikeFallbackName && isMissingExerciseReference;
  }));
}
