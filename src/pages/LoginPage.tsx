import { ChevronLeft, Login } from '@carbon/icons-react';
import { Button, PasswordInput, TextInput, Tile } from '@carbon/react';
import { useState } from 'react';
import { PageContainer } from '../components/PageContainer';

interface Props {
  onBack: () => void;
  onLogin: (email: string, password: string) => Promise<boolean>;
}

export function LoginPage({ onBack, onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const canSubmit = email.trim() && password.trim() && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setErrorMessage('');

    const success = await onLogin(email.trim(), password);

    if (!success) {
      setErrorMessage('Não foi possível entrar com esse e-mail e senha.');
    }

    setIsSubmitting(false);
  };

  return (
    <PageContainer title="Login" subtitle="Acesse sua conta do Supabase" actions={<Button kind="ghost" size="sm" renderIcon={ChevronLeft} iconDescription="Voltar" onClick={onBack}>Voltar</Button>}>
      <div className="stack">
        <Tile className="card metric-card auth-card">
          <div className="card-head">
            <div className="card-head__group">
              <div className="icon-badge icon-badge--primary card-head__badge">
                <Login size={20} />
              </div>
              <div className="card-head__title">
                <h3>Entrar</h3>
                <p>Use seu e-mail e senha para continuar</p>
              </div>
            </div>
          </div>
          <div className="auth-form">
            <TextInput id="login-email" type="email" labelText="E-mail" value={email} onChange={(event) => setEmail(event.target.value)} />
            <PasswordInput id="login-password" labelText="Senha" value={password} onChange={(event) => setPassword(event.target.value)} />
            {errorMessage ? <p className="auth-message auth-message--error">{errorMessage}</p> : null}
            <div className="setup-card__footer">
              <Button disabled={!canSubmit} onClick={handleSubmit}>
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </Button>
            </div>
          </div>
        </Tile>
      </div>
    </PageContainer>
  );
}
