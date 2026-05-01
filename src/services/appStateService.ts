import type { Session } from '@supabase/supabase-js';
import {
  AppState,
  defaultAppState,
  hasSuspiciousWorkoutData,
  normalizeProfile,
  normalizeWaterData,
  normalizeWeeklyDiet,
  normalizeWorkoutProgressState,
  sanitizeAppStateForSave,
  serializeWorkoutProgressState
} from '../lib/appState';
import { supabase } from '../lib/supabaseClient';
import { validateAppState } from '../lib/validation';
import { loadRelationalAppState } from './relationalAppStateService';

interface RemoteAppStateRow {
  profile: AppState['profile'];
  workouts: unknown;
  water: AppState['water'];
  weekly_diet: unknown;
  weight_history: AppState['weightHistory'];
}

// Formato remoto atual:
// - profile: UserProfile normalizado
// - workouts: { version: 1, updatedAt: 'YYYY-MM-DD', workouts: Workout[] }
// - water: WaterData normalizado
// - weekly_diet: WeeklyDiet normalizado
// - weight_history: WeightLog[]
//
// A normalização continua aceitando formatos legados para leitura, mas todo save remoto
// passa por sanitize + serialização do formato atual para reduzir novas ambiguidades.
// A distinção entre envelope atual, array antigo, legado com exerciseLibrary e payload
// desconhecido fica centralizada em legacyState.ts.
function mapRemoteRow(row: RemoteAppStateRow): AppState {
  const workoutState = normalizeWorkoutProgressState(row.workouts as AppState['workouts']);
  const mappedState: AppState = {
    profile: normalizeProfile(row.profile),
    workouts: workoutState.workouts,
    workoutsUpdatedAt: workoutState.workoutsUpdatedAt,
    water: normalizeWaterData(row.water),
    weeklyDiet: normalizeWeeklyDiet(row.weekly_diet as AppState['weeklyDiet']),
    weightHistory: Array.isArray(row.weight_history) ? row.weight_history : []
  };

  return validateAppState(mappedState) ?? sanitizeAppStateForSave(mappedState);
}

async function createRemoteAppState(session: Session, state: AppState) {
  const sanitizedState = sanitizeAppStateForSave(state);
  const validState = validateAppState(sanitizedState);

  if (!validState) {
    console.error('Estado remoto bloqueado: payload inválido.');
    return null;
  }

  if (hasSuspiciousWorkoutData(validState.workouts)) {
    console.error('Estado remoto bloqueado: treinos com aparência de dados corrompidos.');
    return null;
  }

  const { error } = await supabase
    .from('user_app_states')
    .insert({
      user_id: session.user.id,
      profile: validState.profile,
      workouts: serializeWorkoutProgressState(validState.workouts, validState.workoutsUpdatedAt),
      water: validState.water,
      weekly_diet: validState.weeklyDiet,
      weight_history: validState.weightHistory
    });

  if (error) {
    console.error('Erro ao criar estado remoto', error);
    return null;
  }

  return validState;
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
  const relationalState = await loadRelationalAppState(session, mappedState.workoutsUpdatedAt);

  if (relationalState) {
    return relationalState;
  }

  return mappedState;
}

export async function saveRemoteAppState(session: Session, state: AppState) {
  const sanitizedState = sanitizeAppStateForSave(state);
  const validState = validateAppState(sanitizedState);

  if (!validState) {
    console.error('Save remoto bloqueado: payload inválido.');
    return false;
  }

  if (hasSuspiciousWorkoutData(validState.workouts)) {
    console.error('Save remoto bloqueado: treinos com aparência de dados corrompidos.');
    return false;
  }

  const { error } = await supabase
    .from('user_app_states')
    .upsert({
      user_id: session.user.id,
      profile: validState.profile,
      workouts: serializeWorkoutProgressState(validState.workouts, validState.workoutsUpdatedAt),
      water: validState.water,
      weekly_diet: validState.weeklyDiet,
      weight_history: validState.weightHistory
    });

  if (error) {
    console.error('Erro ao salvar estado remoto', error);
    return false;
  }

  return true;
}
