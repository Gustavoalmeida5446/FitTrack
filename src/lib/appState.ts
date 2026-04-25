import { mockUserProfile, mockWater, mockWeeklyDiet, mockWeightHistory, mockWorkouts } from '../data/mockData';
import { UserProfile, WaterData, WeeklyDiet, WeightLog, Workout } from '../data/types';

const APP_STATE_KEY = 'fittrack:app-state';
const APP_STATE_VERSION = 1;

export interface AppState {
  profile: UserProfile;
  workouts: Workout[];
  water: WaterData;
  weeklyDiet: WeeklyDiet;
  weightHistory: WeightLog[];
}

interface PersistedAppState {
  version: number;
  data: Partial<AppState>;
}

export const defaultAppState: AppState = {
  profile: mockUserProfile,
  workouts: mockWorkouts,
  water: mockWater,
  weeklyDiet: mockWeeklyDiet,
  weightHistory: mockWeightHistory
};

export function loadAppState(): AppState {
  if (typeof window === 'undefined') return defaultAppState;

  try {
    const raw = window.localStorage.getItem(APP_STATE_KEY);
    if (!raw) return defaultAppState;

    const parsed = JSON.parse(raw) as PersistedAppState;
    if (!parsed.data) return defaultAppState;

    const data = parsed.data;

    return {
      profile: data.profile ?? defaultAppState.profile,
      workouts: data.workouts ?? defaultAppState.workouts,
      water: data.water ?? defaultAppState.water,
      weeklyDiet: data.weeklyDiet ?? defaultAppState.weeklyDiet,
      weightHistory: data.weightHistory ?? defaultAppState.weightHistory
    };
  } catch {
    return defaultAppState;
  }
}

export function saveAppState(data: AppState) {
  if (typeof window === 'undefined') return;

  const payload: PersistedAppState = {
    version: APP_STATE_VERSION,
    data
  };

  window.localStorage.setItem(APP_STATE_KEY, JSON.stringify(payload));
}
