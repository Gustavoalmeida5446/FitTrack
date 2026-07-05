import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import {
  buildAppRedirectUrl,
  buildCleanAuthRedirectPath,
  buildPasswordResetRedirectUrl,
  hasPasswordRecoveryParams
} from '../lib/authRedirect';
import { getAuthErrorMessage } from '../lib/authErrors';
import { supabase } from '../lib/supabaseClient';

export interface AuthActionResult {
  success: boolean;
  requiresEmailConfirmation?: boolean;
  message?: string;
}

export interface AuthSessionResult extends AuthActionResult {
  session: Session | null;
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

export async function signInWithEmail(email: string, password: string): Promise<AuthSessionResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error('Erro ao fazer login', error);
    return {
      success: false,
      session: null,
      message: getAuthErrorMessage('login', error)
    };
  }

  return {
    success: Boolean(data.session),
    session: data.session,
    message: data.session ? undefined : 'Não foi possível iniciar sua sessão agora. Tente novamente.'
  };
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
    return {
      success: false,
      message: getAuthErrorMessage('signup', error)
    };
  }

  const requiresEmailConfirmation = !data.session;

  return {
    success: true,
    requiresEmailConfirmation,
    message: requiresEmailConfirmation
      ? 'Conta criada. Enviamos um e-mail de confirmação; confirme seu e-mail antes de entrar.'
      : 'Conta criada com sucesso. Você já pode usar o app.'
  };
}

export async function resendSignupConfirmation(email: string): Promise<AuthActionResult> {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: getAppRedirectUrl()
    }
  });

  if (error) {
    console.error('Erro ao reenviar confirmação de cadastro', error);
    return {
      success: false,
      requiresEmailConfirmation: true,
      message: getAuthErrorMessage('signup', error)
    };
  }

  return {
    success: true,
    requiresEmailConfirmation: true,
    message: 'Enviamos um novo e-mail de confirmação. Confira sua caixa de entrada e spam.'
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
