import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { AppState } from '../lib/appState';
import { supabase } from '../lib/supabaseClient';
import { loadRemoteAppState, saveRemoteAppState } from '../services/appStateService';

const relationalRealtimeTables = [
  'app_profiles',
  'app_water_days',
  'app_weight_logs',
  'app_workouts',
  'app_workout_exercises',
  'app_workout_exercise_sets',
  'app_diets',
  'app_diet_meals',
  'app_diet_foods',
  'app_diet_days',
  'app_diet_day_meals',
  'app_diet_completed_meals'
] as const;

interface UseRemoteAppStateParams {
  session: Session | null;
  appState: AppState;
  onHydrate: (state: AppState) => void;
  onReset: () => void;
}

interface UseRemoteAppStateResult {
  isRemoteReady: boolean;
  hasPendingRemoteSave: boolean;
  remoteSyncError: 'load' | 'save' | null;
  markRemoteSavePending: () => void;
}

export function useRemoteAppState({
  session,
  appState,
  onHydrate,
  onReset
}: UseRemoteAppStateParams): UseRemoteAppStateResult {
  const [isRemoteReady, setIsRemoteReady] = useState(false);
  const [hasPendingRemoteSave, setHasPendingRemoteSave] = useState(false);
  const [remoteSaveRetryTick, setRemoteSaveRetryTick] = useState(0);
  const [realtimeRefreshTick, setRealtimeRefreshTick] = useState(0);
  const [remoteSyncError, setRemoteSyncError] = useState<'load' | 'save' | null>(null);

  useEffect(() => {
    setIsRemoteReady(false);
  }, [session]);

  useEffect(() => {
    if (!session) {
      onReset();
      setHasPendingRemoteSave(false);
      setRemoteSaveRetryTick(0);
      setRemoteSyncError(null);
      setIsRemoteReady(true);
      return;
    }

    let isActive = true;
    setIsRemoteReady(false);

    void loadRemoteAppState(session).then((remoteState) => {
      if (!isActive) {
        return;
      }

      if (!remoteState) {
        setRemoteSyncError('load');
        setIsRemoteReady(true);
        return;
      }

      onHydrate(remoteState);
      setHasPendingRemoteSave(false);
      setRemoteSaveRetryTick(0);
      setRemoteSyncError(null);
      setIsRemoteReady(true);
    });

    return () => {
      isActive = false;
    };
  }, [onHydrate, onReset, realtimeRefreshTick, session]);

  useEffect(() => {
    if (!session || !isRemoteReady) {
      return undefined;
    }

    let refreshTimeoutId: number | null = null;
    const userId = session.user.id;
    const channel = supabase.channel(`app-state:${userId}`);
    const scheduleRefresh = () => {
      if (hasPendingRemoteSave) {
        return;
      }

      if (refreshTimeoutId) {
        window.clearTimeout(refreshTimeoutId);
      }

      refreshTimeoutId = window.setTimeout(() => {
        setRealtimeRefreshTick((currentTick) => currentTick + 1);
      }, 500);
    };

    relationalRealtimeTables.forEach((table) => {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `user_id=eq.${userId}`
        },
        scheduleRefresh
      );
    });

    void channel.subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error('Realtime de estado do app indisponível:', status);
      }
    });

    return () => {
      if (refreshTimeoutId) {
        window.clearTimeout(refreshTimeoutId);
      }

      void supabase.removeChannel(channel);
    };
  }, [hasPendingRemoteSave, isRemoteReady, session]);

  useEffect(() => {
    if (!session || !isRemoteReady || !hasPendingRemoteSave) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void saveRemoteAppState(session, appState).then((didSave) => {
        if (didSave) {
          setHasPendingRemoteSave(false);
          setRemoteSaveRetryTick(0);
          setRemoteSyncError(null);
          return;
        }

        setRemoteSyncError('save');
        window.setTimeout(() => {
          setRemoteSaveRetryTick((currentTick) => currentTick + 1);
        }, 2000);
      });
    }, 400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [appState, hasPendingRemoteSave, isRemoteReady, remoteSaveRetryTick, session]);

  const markRemoteSavePending = useCallback(() => {
    setHasPendingRemoteSave(true);
  }, []);

  return {
    isRemoteReady,
    hasPendingRemoteSave,
    remoteSyncError,
    markRemoteSavePending
  };
}
