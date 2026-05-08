import test from 'node:test';
import assert from 'node:assert/strict';
import { getAuthErrorMessage } from '../src/lib/authErrors';

test('mensagem de cadastro explica conta já existente', () => {
  assert.equal(
    getAuthErrorMessage('signup', { code: 'user_already_exists', message: 'User already exists' }),
    'Já existe uma conta com este e-mail. Entre com sua senha ou use "Esqueci minha senha".'
  );
});

test('mensagem de login explica e-mail não confirmado', () => {
  assert.equal(
    getAuthErrorMessage('login', { code: 'email_not_confirmed', message: 'Email not confirmed' }),
    'Seu e-mail ainda não foi confirmado. Abra o link enviado pelo Supabase e tente entrar novamente.'
  );
});

test('mensagem de cadastro explica limite de envio de e-mails', () => {
  assert.equal(
    getAuthErrorMessage('signup', { code: 'over_email_send_rate_limit', status: 429 }),
    'Muitos e-mails foram enviados em pouco tempo. Aguarde alguns minutos antes de tentar novamente.'
  );
});
