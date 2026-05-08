type AuthErrorContext = 'login' | 'signup' | 'password-reset' | 'password-update';

interface AuthErrorLike {
  code?: string;
  message?: string;
  status?: number;
}

function normalizeErrorText(error: AuthErrorLike) {
  return `${error.code ?? ''} ${error.message ?? ''}`.toLowerCase();
}

export function getAuthErrorMessage(context: AuthErrorContext, error: AuthErrorLike | null | undefined): string {
  if (!error) {
    return context === 'signup'
      ? 'Não foi possível criar sua conta agora. Tente novamente em instantes.'
      : 'Não foi possível concluir a operação agora. Tente novamente em instantes.';
  }

  const errorText = normalizeErrorText(error);

  if (error.code === 'email_not_confirmed' || errorText.includes('email not confirmed')) {
    return 'Seu e-mail ainda não foi confirmado. Abra o link enviado pelo Supabase e tente entrar novamente.';
  }

  if (
    error.code === 'email_exists'
    || error.code === 'user_already_exists'
    || errorText.includes('already registered')
    || errorText.includes('already exists')
  ) {
    return 'Já existe uma conta com este e-mail. Entre com sua senha ou use "Esqueci minha senha".';
  }

  if (error.code === 'invalid_credentials') {
    return 'E-mail ou senha incorretos. Confira os dados e tente novamente.';
  }

  if (error.code === 'signup_disabled') {
    return 'O cadastro está desativado no Supabase neste momento.';
  }

  if (error.code === 'email_provider_disabled') {
    return 'Cadastro por e-mail está desativado no Supabase neste momento.';
  }

  if (error.code === 'email_address_invalid' || errorText.includes('invalid email')) {
    return 'Este e-mail não parece válido. Confira o endereço e tente novamente.';
  }

  if (error.code === 'weak_password' || errorText.includes('weak password')) {
    return 'A senha não atende aos requisitos de segurança do Supabase. Tente uma senha mais forte.';
  }

  if (error.code === 'over_email_send_rate_limit') {
    return 'Muitos e-mails foram enviados em pouco tempo. Aguarde alguns minutos antes de tentar novamente.';
  }

  if (error.code === 'over_request_rate_limit' || error.status === 429) {
    return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos antes de tentar novamente.';
  }

  if (context === 'signup') {
    return 'Não foi possível criar sua conta agora. Confira os dados e tente novamente.';
  }

  if (context === 'login') {
    return 'Não foi possível entrar com esse e-mail e senha.';
  }

  if (context === 'password-reset') {
    return 'Não foi possível enviar o link de recuperação agora.';
  }

  return 'Não foi possível atualizar sua senha agora.';
}
