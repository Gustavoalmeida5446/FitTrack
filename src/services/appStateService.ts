import type { Session } from '@supabase/supabase-js';
import { AppState, defaultAppState, normalizeWaterData } from '../lib/appState';
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

  return mapRemoteRow(data as RemoteAppStateRow);
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
