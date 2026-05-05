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
import { loadRelationalAppStateSnapshot } from './relationalAppStateService';

interface RemoteAppStateRow {
  profile: AppState['profile'];
  workouts: unknown;
  water: AppState['water'];
  weekly_diet: unknown;
  weight_history: AppState['weightHistory'];
  updated_at?: string | null;
}

function isMissingUpdatedAtColumnError(error: { message?: string; details?: string; hint?: string; code?: string } | null): boolean {
  if (!error) {
    return false;
  }

  const errorText = `${error.message ?? ''} ${error.details ?? ''} ${error.hint ?? ''}`.toLowerCase();

  return error.code === '42703' || errorText.includes('updated_at');
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

function shouldUseRelationalState(remoteUpdatedAt: string | null | undefined, relationalUpdatedAt: string): boolean {
  if (!relationalUpdatedAt) {
    return false;
  }

  if (!remoteUpdatedAt) {
    return true;
  }

  return relationalUpdatedAt >= remoteUpdatedAt;
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

  const row = {
    user_id: session.user.id,
    profile: validState.profile,
    workouts: serializeWorkoutProgressState(validState.workouts, validState.workoutsUpdatedAt),
    water: validState.water,
    weekly_diet: validState.weeklyDiet,
    weight_history: validState.weightHistory
  };
  const { error } = await supabase
    .from('user_app_states')
    .insert({
      ...row,
      updated_at: new Date().toISOString()
    });

  if (isMissingUpdatedAtColumnError(error)) {
    const fallbackResult = await supabase
      .from('user_app_states')
      .insert(row);

    if (fallbackResult.error) {
      console.error('Erro ao criar estado remoto', fallbackResult.error);
      return null;
    }

    return validState;
  }

  if (error) {
    console.error('Erro ao criar estado remoto', error);
    return null;
  }

  return validState;
}

export async function loadRemoteAppState(session: Session): Promise<AppState | null> {
  const result = await supabase
    .from('user_app_states')
    .select('profile, workouts, water, weekly_diet, weight_history, updated_at')
    .eq('user_id', session.user.id)
    .maybeSingle();
  const fallbackResult = result.error && isMissingUpdatedAtColumnError(result.error)
    ? await supabase
      .from('user_app_states')
      .select('profile, workouts, water, weekly_diet, weight_history')
      .eq('user_id', session.user.id)
      .maybeSingle()
    : null;
  const data = fallbackResult ? fallbackResult.data : result.data;
  const error = fallbackResult ? fallbackResult.error : result.error;

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

  const remoteRow = data as RemoteAppStateRow;
  const mappedState = mapRemoteRow(remoteRow);
  const relationalSnapshot = await loadRelationalAppStateSnapshot(session, mappedState.workoutsUpdatedAt);

  if (relationalSnapshot && shouldUseRelationalState(remoteRow.updated_at, relationalSnapshot.updatedAt)) {
    return relationalSnapshot.state;
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

  const row = {
    user_id: session.user.id,
    profile: validState.profile,
    workouts: serializeWorkoutProgressState(validState.workouts, validState.workoutsUpdatedAt),
    water: validState.water,
    weekly_diet: validState.weeklyDiet,
    weight_history: validState.weightHistory
  };
  const { error } = await supabase
    .from('user_app_states')
    .upsert({
      ...row,
      updated_at: new Date().toISOString()
    });

  if (isMissingUpdatedAtColumnError(error)) {
    const fallbackResult = await supabase
      .from('user_app_states')
      .upsert(row);

    if (fallbackResult.error) {
      console.error('Erro ao salvar estado remoto', fallbackResult.error);
      return false;
    }

    return true;
  }

  if (error) {
    console.error('Erro ao salvar estado remoto', error);
    return false;
  }

  return true;
}
