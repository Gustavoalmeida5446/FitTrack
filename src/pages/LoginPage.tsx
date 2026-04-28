import { ChevronLeft, Login, UserAvatar } from '@carbon/icons-react';
import { Button, PasswordInput, TextInput, Tile } from '@carbon/react';
import { useEffect, useMemo, useState } from 'react';
import { CardHeader } from '../components/CardHeader';
import { PageContainer } from '../components/PageContainer';

interface Props {
  onBack?: () => void;
  onLogin: (email: string, password: string) => Promise<boolean>;
  onSignUp: (email: string, password: string) => Promise<{ success: boolean; requiresEmailConfirmation?: boolean }>;
}

type AuthMode = 'login' | 'signup';

export function LoginPage({ onBack, onLogin, onSignUp }: Props) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const isSignupMode = mode === 'signup';

  const canSubmit = useMemo(() => {
    if (!email.trim() || !password.trim() || isSubmitting) {
      return false;
    }

    if (isSignupMode) {
      return confirmPassword.trim() && password === confirmPassword && password.length >= 6;
    }

    return true;
  }, [confirmPassword, email, isSubmitting, isSignupMode, password]);

  const resetMessages = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setConfirmPassword('');
    resetMessages();
  };

  useEffect(() => {
    if (!errorMessage && !successMessage) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
  }, [confirmPassword, email, password]);

  const title = isSignupMode ? 'Criar conta' : 'Entrar';
  const description = isSignupMode ? 'Cadastre-se para começar a usar o app' : 'Acesse sua conta';
  const submitLabel = isSignupMode ? 'Criar conta' : 'Entrar';
  const submittingLabel = isSignupMode ? 'Criando conta...' : 'Entrando...';

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    resetMessages();

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
    setConfirmPassword('');
    setIsSubmitting(false);
  };

  return (
    <PageContainer title="FitTrack" subtitle="Entre ou crie sua conta para acessar seus dados" actions={onBack ? <Button kind="ghost" size="sm" renderIcon={ChevronLeft} iconDescription="Voltar" onClick={onBack}>Voltar</Button> : undefined}>
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
          <div className="auth-mode-switch" role="tablist" aria-label="Modo de autenticação">
            <button type="button" className={`auth-mode-switch__item ${mode === 'login' ? 'auth-mode-switch__item--active' : ''}`} onClick={() => switchMode('login')}>
              Entrar
            </button>
            <button type="button" className={`auth-mode-switch__item ${mode === 'signup' ? 'auth-mode-switch__item--active' : ''}`} onClick={() => switchMode('signup')}>
              Criar conta
            </button>
          </div>

          <CardHeader
            icon={<Login size={20} />}
            title={title}
            description={description}
          />

          <div className="auth-form">
            <TextInput id="login-email" type="email" labelText="E-mail" value={email} onChange={(event) => setEmail(event.target.value)} />
            <PasswordInput id="login-password" labelText="Senha" value={password} onChange={(event) => setPassword(event.target.value)} helperText={isSignupMode ? 'Use pelo menos 6 caracteres.' : undefined} />
            {isSignupMode ? (
              <PasswordInput id="login-confirm-password" labelText="Confirmar senha" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            ) : null}
            {isSignupMode && confirmPassword && password !== confirmPassword ? <p className="auth-message auth-message--error">As senhas não coincidem.</p> : null}
            {errorMessage ? <p className="auth-message auth-message--error">{errorMessage}</p> : null}
            {successMessage ? <p className="auth-message auth-message--success">{successMessage}</p> : null}
            <div className="setup-card__footer">
              <Button disabled={!canSubmit} onClick={handleSubmit}>
                {isSubmitting ? submittingLabel : submitLabel}
              </Button>
            </div>
          </div>
        </Tile>
      </div>
    </PageContainer>
  );
}
