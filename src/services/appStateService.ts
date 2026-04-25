import type { Session } from '@supabase/supabase-js';
import { AppState, defaultAppState, normalizeWaterData } from '../lib/appState';
import { mockUserProfile, mockWeeklyDiet, mockWeightHistory, mockWorkouts } from '../data/mockData';
import { supabase } from '../lib/supabaseClient';

interface RemoteAppStateRow {
  profile: AppState['profile'];
  workouts: AppState['workouts'];
  water: AppState['water'];
  weekly_diet: AppState['weeklyDiet'];
  weight_history: AppState['weightHistory'];
}

function mapRemoteRow(row: RemoteAppStateRow): AppState {
  return {
    profile: row.profile,
    workouts: row.workouts,
    water: normalizeWaterData(row.water),
    weeklyDiet: row.weekly_diet,
    weightHistory: row.weight_history
  };
}

function isLegacyMockState(state: AppState): boolean {
  const matchesMockWorkouts = JSON.stringify(state.workouts) === JSON.stringify(mockWorkouts);
  const matchesMockDiet = JSON.stringify(state.weeklyDiet) === JSON.stringify(mockWeeklyDiet);
  const matchesMockProfile = JSON.stringify(state.profile) === JSON.stringify(mockUserProfile);
  const matchesMockWeightHistory = JSON.stringify(state.weightHistory) === JSON.stringify(mockWeightHistory);

  return matchesMockWorkouts || matchesMockDiet || (matchesMockProfile && matchesMockWeightHistory);
}

async function replaceRemoteAppState(session: Session, state: AppState) {
  const { error } = await supabase
    .from('user_app_states')
    .upsert({
      user_id: session.user.id,
      profile: state.profile,
      workouts: state.workouts,
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
      workouts: state.workouts,
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
      workouts: state.workouts,
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
