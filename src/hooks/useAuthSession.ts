import { useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  clearAuthRedirectUrl,
  getCurrentSession,
  isPasswordRecoveryRedirect,
  onAuthStateChange
} from '../services/authService';

interface UseAuthSessionResult {
  session: Session | null;
  setSession: (session: Session | null) => void;
  isAuthReady: boolean;
  isPasswordRecovery: boolean;
  clearPasswordRecovery: () => void;
}

export function useAuthSession(): UseAuthSessionResult {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const sessionUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    sessionUserIdRef.current = session?.user.id ?? null;
  }, [session]);

  useEffect(() => {
    void getCurrentSession().then((currentSession) => {
      const hasRecoveryRedirect = isPasswordRecoveryRedirect();
      setIsPasswordRecovery(Boolean(currentSession) && hasRecoveryRedirect);

      if (hasRecoveryRedirect) {
        clearAuthRedirectUrl();
      }

      setSession(currentSession);
      setIsAuthReady(true);
    });

    const { data } = onAuthStateChange((event, nextSession) => {
      const previousUserId = sessionUserIdRef.current;
      const nextUserId = nextSession?.user.id ?? null;

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setIsPasswordRecovery(false);
        setIsAuthReady(true);
        return;
      }

      if (event === 'PASSWORD_RECOVERY') {
        setSession(nextSession);
        setIsPasswordRecovery(true);
        clearAuthRedirectUrl();
        setIsAuthReady(true);
        return;
      }

      if (!nextSession) {
        setIsAuthReady(true);
        return;
      }

      // Ignore token refreshes and same-user revalidation so tab focus does not
      // relaunch onboarding or reset the current in-app view.
      if (previousUserId === nextUserId) {
        setIsAuthReady(true);
        return;
      }

      setSession(nextSession);
      setIsAuthReady(true);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    setSession,
    isAuthReady,
    isPasswordRecovery,
    clearPasswordRecovery: () => setIsPasswordRecovery(false)
  };
}
