import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { AppState } from '../lib/appState';
import { loadRemoteAppState, saveRemoteAppState } from '../services/appStateService';

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
  }, [onHydrate, onReset, session]);

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
