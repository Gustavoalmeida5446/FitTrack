import { ChevronLeft, Login, UserAvatar } from '@carbon/icons-react';
import { Button, PasswordInput, TextInput, Tile } from '@carbon/react';
import { useEffect, useState } from 'react';
import { CardHeader } from '../components/CardHeader';
import { PageContainer } from '../components/PageContainer';
import {
  getEmailFormErrors,
  getLoginFormErrors,
  getPasswordResetFormErrors,
  getSignupFormErrors
} from '../lib/validation';
import appLogo from '../../favicon/android-chrome-192x192.png';

interface Props {
  onBack?: () => void;
  onLogin: (email: string, password: string) => Promise<boolean>;
  onSignUp: (email: string, password: string) => Promise<{ success: boolean; requiresEmailConfirmation?: boolean }>;
  onRequestPasswordReset: (email: string) => Promise<boolean>;
  onUpdatePassword: (password: string) => Promise<boolean>;
  isPasswordRecoveryActive?: boolean;
  onCancelPasswordRecovery?: () => Promise<void> | void;
}

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'reset-password';

export function LoginPage({
  onBack,
  onLogin,
  onSignUp,
  onRequestPasswordReset,
  onUpdatePassword,
  isPasswordRecoveryActive = false,
  onCancelPasswordRecovery
}: Props) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [hasTouchedEmail, setHasTouchedEmail] = useState(false);
  const [hasTouchedPassword, setHasTouchedPassword] = useState(false);
  const [hasTouchedConfirmPassword, setHasTouchedConfirmPassword] = useState(false);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const isSignupMode = mode === 'signup';
  const isForgotPasswordMode = mode === 'forgot-password';
  const isResetPasswordMode = mode === 'reset-password';
  const fieldErrors = isSignupMode
    ? getSignupFormErrors(email, password, confirmPassword)
    : isForgotPasswordMode
      ? getEmailFormErrors(email)
      : isResetPasswordMode
        ? getPasswordResetFormErrors(password, confirmPassword)
        : getLoginFormErrors(email, password);
  const emailError = (hasTouchedEmail || hasTriedSubmit) ? fieldErrors.email : '';
  const passwordError = (hasTouchedPassword || hasTriedSubmit) ? fieldErrors.password : '';
  const confirmPasswordError = (isSignupMode || isResetPasswordMode) && (hasTouchedConfirmPassword || hasTriedSubmit)
    ? fieldErrors.confirmPassword
    : '';

  const resetMessages = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  const resetTouchState = () => {
    setHasTouchedEmail(false);
    setHasTouchedPassword(false);
    setHasTouchedConfirmPassword(false);
    setHasTriedSubmit(false);
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    if (nextMode !== 'forgot-password') {
      setEmail('');
    }
    setPassword('');
    setConfirmPassword('');
    resetTouchState();
    resetMessages();
  };

  useEffect(() => {
    if (isPasswordRecoveryActive) {
      setMode('reset-password');
      setPassword('');
      setConfirmPassword('');
      resetTouchState();
      resetMessages();
      return;
    }

    setMode((currentMode) => currentMode === 'reset-password' ? 'login' : currentMode);
  }, [isPasswordRecoveryActive]);

  useEffect(() => {
    if (!errorMessage && !successMessage) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
  }, [confirmPassword, email, password]);

  const title = isSignupMode
    ? 'Criar conta'
    : isForgotPasswordMode
      ? 'Recuperar senha'
      : isResetPasswordMode
        ? 'Definir nova senha'
        : 'Entrar';
  const description = isSignupMode
    ? 'Cadastre-se para começar a usar o app'
    : isForgotPasswordMode
      ? 'Informe seu e-mail para receber o link de recuperação'
      : isResetPasswordMode
        ? 'Escolha uma nova senha para sua conta'
        : 'Acesse sua conta';
  const submitLabel = isSignupMode
    ? 'Criar conta'
    : isForgotPasswordMode
      ? 'Enviar link'
      : isResetPasswordMode
        ? 'Atualizar senha'
        : 'Entrar';
  const submittingLabel = isSignupMode
    ? 'Criando conta...'
    : isForgotPasswordMode
      ? 'Enviando...'
      : isResetPasswordMode
        ? 'Atualizando...'
        : 'Entrando...';

  const handleSubmit = async () => {
    setHasTriedSubmit(true);

    if (fieldErrors.email || fieldErrors.password || confirmPasswordError || ((isSignupMode || isResetPasswordMode) && fieldErrors.confirmPassword)) {
      return;
    }

    setIsSubmitting(true);
    resetMessages();

    if (isForgotPasswordMode) {
      const success = await onRequestPasswordReset(email.trim());

      if (!success) {
        setErrorMessage('Não foi possível enviar o link de recuperação agora.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage('Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.');
      setIsSubmitting(false);
      return;
    }

    if (isResetPasswordMode) {
      const success = await onUpdatePassword(password);

      if (!success) {
        setErrorMessage('Não foi possível atualizar sua senha agora.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage('Senha atualizada com sucesso. Agora você pode entrar normalmente.');
      setMode('login');
      setPassword('');
      setConfirmPassword('');
      resetTouchState();
      setIsSubmitting(false);
      return;
    }

    if (!isSignupMode) {
      const success = await onLogin(email.trim(), password);

      if (!success) {
        setErrorMessage('Não foi possível entrar com esse e-mail e senha.');
      }

      setIsSubmitting(false);
      return;
    }

    const result = await onSignUp(email.trim(), password);

    if (!result.success) {
      setErrorMessage('Não foi possível criar sua conta agora.');
      setIsSubmitting(false);
      return;
    }

    setSuccessMessage(result.requiresEmailConfirmation ? 'Conta criada. Confirme seu e-mail para entrar.' : 'Conta criada com sucesso. Você já pode usar o app.');
    setPassword('');
    setConfirmPassword('');
    resetTouchState();
    setIsSubmitting(false);
  };

  return (
    <PageContainer
      title={(
        <span className="app-title">
          <img src={appLogo} alt="" className="app-title__logo" />
          <span>FitTrack</span>
        </span>
      )}
      subtitle="Entre ou crie sua conta para acessar seus dados"
      actions={onBack ? <Button kind="ghost" size="sm" renderIcon={ChevronLeft} iconDescription="Voltar" onClick={onBack}>Voltar</Button> : undefined}
    >
      <div className="stack">
        <Tile className="card metric-card auth-hero-card">
          <div className="auth-hero-card__badge">
            <UserAvatar size={22} />
          </div>
          <div className="auth-hero-card__content">
            <h2>Seu treino, dieta e progresso em um só lugar</h2>
            <p>Use sua conta para salvar treinos, montar dieta e acompanhar sua meta diária de água e macros.</p>
          </div>
        </Tile>

        <Tile className="card metric-card auth-card">
          {!isForgotPasswordMode && !isResetPasswordMode ? (
            <div className="auth-mode-switch" role="tablist" aria-label="Modo de autenticação">
              <button type="button" className={`auth-mode-switch__item ${mode === 'login' ? 'auth-mode-switch__item--active' : ''}`} onClick={() => switchMode('login')}>
                Entrar
              </button>
              <button type="button" className={`auth-mode-switch__item ${mode === 'signup' ? 'auth-mode-switch__item--active' : ''}`} onClick={() => switchMode('signup')}>
                Criar conta
              </button>
            </div>
          ) : null}

          <CardHeader
            icon={<Login size={20} />}
            title={title}
            description={description}
          />

          <div className="auth-form">
            {!isResetPasswordMode ? (
              <>
                <TextInput
                  id="login-email"
                  type="email"
                  labelText="E-mail"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onBlur={() => setHasTouchedEmail(true)}
                />
                {emailError ? <p className="auth-message auth-message--error">{emailError}</p> : null}
              </>
            ) : null}
            {!isForgotPasswordMode ? (
              <>
                <PasswordInput
                  id="login-password"
                  labelText={isResetPasswordMode ? 'Nova senha' : 'Senha'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onBlur={() => setHasTouchedPassword(true)}
                  helperText={isSignupMode || isResetPasswordMode ? 'Use pelo menos 6 caracteres.' : undefined}
                />
                {passwordError ? <p className="auth-message auth-message--error">{passwordError}</p> : null}
                {isSignupMode || isResetPasswordMode ? (
                  <>
                    <PasswordInput
                      id="login-confirm-password"
                      labelText="Confirmar senha"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      onBlur={() => setHasTouchedConfirmPassword(true)}
                    />
                    {confirmPasswordError ? <p className="auth-message auth-message--error">{confirmPasswordError}</p> : null}
                  </>
                ) : null}
              </>
            ) : null}
            {errorMessage ? <p className="auth-message auth-message--error">{errorMessage}</p> : null}
            {successMessage ? <p className="auth-message auth-message--success">{successMessage}</p> : null}
            {mode === 'login' ? (
              <div className="auth-form__actions">
                <button type="button" className="auth-link-button" onClick={() => switchMode('forgot-password')}>
                  Esqueci minha senha
                </button>
              </div>
            ) : null}
            {mode === 'forgot-password' ? (
              <div className="auth-form__actions">
                <button type="button" className="auth-link-button" onClick={() => switchMode('login')}>
                  Voltar para entrar
                </button>
              </div>
            ) : null}
            {mode === 'reset-password' && onCancelPasswordRecovery ? (
              <div className="auth-form__actions">
                <button type="button" className="auth-link-button" onClick={() => void onCancelPasswordRecovery()}>
                  Cancelar recuperação
                </button>
              </div>
            ) : null}
            <div className="setup-card__footer">
              <Button disabled={isSubmitting} onClick={handleSubmit}>
                {isSubmitting ? submittingLabel : submitLabel}
              </Button>
            </div>
          </div>
        </Tile>
      </div>
    </PageContainer>
  );
}
