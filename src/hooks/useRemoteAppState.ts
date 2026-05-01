import { useCallback, useEffect, useRef, useState } from 'react';
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
  const userId = session?.user.id ?? '';
  const [isRemoteReady, setIsRemoteReady] = useState(false);
  const [hasPendingRemoteSave, setHasPendingRemoteSave] = useState(false);
  const [remoteSaveRetryTick, setRemoteSaveRetryTick] = useState(0);
  const [realtimeRefreshTick, setRealtimeRefreshTick] = useState(0);
  const [remoteSyncError, setRemoteSyncError] = useState<'load' | 'save' | null>(null);
  const hasPendingRemoteSaveRef = useRef(false);
  const missedRealtimeRefreshRef = useRef(false);

  useEffect(() => {
    missedRealtimeRefreshRef.current = false;
    setIsRemoteReady(false);
  }, [userId]);

  useEffect(() => {
    hasPendingRemoteSaveRef.current = hasPendingRemoteSave;
  }, [hasPendingRemoteSave]);

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
  }, [onHydrate, onReset, realtimeRefreshTick, userId]);

  useEffect(() => {
    if (!userId || !isRemoteReady) {
      return undefined;
    }

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let subscribeTimeoutId: number | null = null;
    let refreshTimeoutId: number | null = null;
    const scheduleRefresh = () => {
      if (hasPendingRemoteSaveRef.current) {
        missedRealtimeRefreshRef.current = true;
        return;
      }

      if (refreshTimeoutId) {
        window.clearTimeout(refreshTimeoutId);
      }

      refreshTimeoutId = window.setTimeout(() => {
        setRealtimeRefreshTick((currentTick) => currentTick + 1);
      }, 500);
    };

    // Avoid opening a socket for transient mounts, like React StrictMode's dev check.
    subscribeTimeoutId = window.setTimeout(() => {
      channel = supabase.channel(`app-state:${userId}`);

      relationalRealtimeTables.forEach((table) => {
        channel?.on(
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
    }, 250);

    return () => {
      if (subscribeTimeoutId) {
        window.clearTimeout(subscribeTimeoutId);
      }

      if (refreshTimeoutId) {
        window.clearTimeout(refreshTimeoutId);
      }

      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [isRemoteReady, userId]);

  useEffect(() => {
    if (!userId || !isRemoteReady || hasPendingRemoteSave || !missedRealtimeRefreshRef.current) {
      return;
    }

    missedRealtimeRefreshRef.current = false;
    setRealtimeRefreshTick((currentTick) => currentTick + 1);
  }, [hasPendingRemoteSave, isRemoteReady, userId]);

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
