import type { Session } from '@supabase/supabase-js';
import {
  AppState,
  defaultAppState,
  normalizeProfile,
  normalizeWaterData,
  normalizeWeeklyDiet,
  normalizeWorkoutProgressState,
  serializeWorkoutProgressState
} from '../lib/appState';
import { supabase } from '../lib/supabaseClient';

interface RemoteAppStateRow {
  profile: AppState['profile'];
  workouts: unknown;
  water: AppState['water'];
  weekly_diet: unknown;
  weight_history: AppState['weightHistory'];
}

function mapRemoteRow(row: RemoteAppStateRow): AppState {
  const workoutState = normalizeWorkoutProgressState(row.workouts as AppState['workouts']);

  return {
    profile: normalizeProfile(row.profile),
    workouts: workoutState.workouts,
    workoutsUpdatedAt: workoutState.workoutsUpdatedAt,
    water: normalizeWaterData(row.water),
    weeklyDiet: normalizeWeeklyDiet(row.weekly_diet as AppState['weeklyDiet']),
    weightHistory: Array.isArray(row.weight_history) ? row.weight_history : []
  };
}

function isLegacyMockState(state: AppState): boolean {
  const looksLikeMockWorkout = state.workouts.some((workout) => ['Push A', 'Pull B'].includes(workout.name));
  const looksLikeMockDiet = state.weeklyDiet.meals.some((meal) => ['Café da manhã', 'Almoço', 'Jantar'].includes(meal.name));
  const looksLikeMockProfile = state.profile.currentWeight === 78 && state.profile.heightCm === 175;

  return looksLikeMockWorkout || looksLikeMockDiet || looksLikeMockProfile;
}

async function replaceRemoteAppState(session: Session, state: AppState) {
  const { error } = await supabase
    .from('user_app_states')
    .upsert({
      user_id: session.user.id,
      profile: state.profile,
      workouts: serializeWorkoutProgressState(state.workouts, state.workoutsUpdatedAt),
      water: state.water,
      weekly_diet: state.weeklyDiet,
      weight_history: state.weightHistory
    });

  if (error) {
    console.error('Erro ao substituir estado remoto', error);
    return null;
  }

  return state;
}

async function createRemoteAppState(session: Session, state: AppState) {
  const { error } = await supabase
    .from('user_app_states')
    .insert({
      user_id: session.user.id,
      profile: state.profile,
      workouts: serializeWorkoutProgressState(state.workouts, state.workoutsUpdatedAt),
      water: state.water,
      weekly_diet: state.weeklyDiet,
      weight_history: state.weightHistory
    });

  if (error) {
    console.error('Erro ao criar estado remoto', error);
    return null;
  }

  return state;
}

export async function loadRemoteAppState(session: Session): Promise<AppState | null> {
  const { data, error } = await supabase
    .from('user_app_states')
    .select('profile, workouts, water, weekly_diet, weight_history')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (error) {
    console.error('Erro ao carregar estado remoto', error);
    return null;
  }

  if (!data) {
    return createRemoteAppState(session, {
      ...defaultAppState,
      water: normalizeWaterData(defaultAppState.water)
    });
  }

  const mappedState = mapRemoteRow(data as RemoteAppStateRow);

  if (isLegacyMockState(mappedState)) {
    return replaceRemoteAppState(session, {
      ...defaultAppState,
      water: normalizeWaterData(defaultAppState.water)
    });
  }

  return mappedState;
}

export async function saveRemoteAppState(session: Session, state: AppState) {
  const { error } = await supabase
    .from('user_app_states')
    .upsert({
      user_id: session.user.id,
      profile: state.profile,
      workouts: serializeWorkoutProgressState(state.workouts, state.workoutsUpdatedAt),
      water: state.water,
      weekly_diet: state.weeklyDiet,
      weight_history: state.weightHistory
    });

  if (error) {
    console.error('Erro ao salvar estado remoto', error);
    return false;
  }

  return true;
}
