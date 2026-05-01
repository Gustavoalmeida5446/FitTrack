import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import {
  buildAppRedirectUrl,
  buildCleanAuthRedirectPath,
  buildPasswordResetRedirectUrl,
  hasPasswordRecoveryParams
} from '../lib/authRedirect';
import { supabase } from '../lib/supabaseClient';

export interface AuthActionResult {
  success: boolean;
  requiresEmailConfirmation?: boolean;
}

function getAppRedirectUrl() {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return buildAppRedirectUrl(import.meta.env.BASE_URL, window.location.origin);
}

function getPasswordResetRedirectUrl() {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return buildPasswordResetRedirectUrl(import.meta.env.BASE_URL, window.location.origin);
}

export function isPasswordRecoveryRedirect() {
  if (typeof window === 'undefined') {
    return false;
  }

  return hasPasswordRecoveryParams(window.location.search, window.location.hash);
}

export function clearAuthRedirectUrl() {
  if (typeof window === 'undefined') {
    return;
  }

  window.history.replaceState({}, document.title, buildCleanAuthRedirectPath(window.location.pathname));
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Erro ao carregar sessão', error);
    return null;
  }

  return data.session;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error('Erro ao fazer login', error);
    return null;
  }

  return data.session;
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthActionResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getAppRedirectUrl()
    }
  });

  if (error) {
    console.error('Erro ao criar conta', error);
    return { success: false };
  }

  return {
    success: true,
    requiresEmailConfirmation: !data.session
  };
}

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getPasswordResetRedirectUrl()
  });

  if (error) {
    console.error('Erro ao solicitar recuperação de senha', error);
    return false;
  }

  return true;
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({
    password
  });

  if (error) {
    console.error('Erro ao atualizar senha', error);
    return false;
  }

  return true;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Erro ao sair', error);
    return false;
  }

  return true;
}

export function onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}
