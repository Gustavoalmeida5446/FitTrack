import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAppRedirectUrl,
  buildCleanAuthRedirectPath,
  buildPasswordResetRedirectUrl,
  hasPasswordRecoveryParams
} from '../src/lib/authRedirect';

test('buildAppRedirectUrl preserva base do deploy', () => {
  assert.equal(buildAppRedirectUrl('/FitTrack/', 'https://example.com'), 'https://example.com/FitTrack/');
});

test('buildPasswordResetRedirectUrl adiciona type recovery na base do app', () => {
  assert.equal(buildPasswordResetRedirectUrl('/FitTrack/', 'https://example.com'), 'https://example.com/FitTrack/?type=recovery');
});

test('hasPasswordRecoveryParams detecta recovery em query ou hash', () => {
  assert.equal(hasPasswordRecoveryParams('?type=recovery', ''), true);
  assert.equal(hasPasswordRecoveryParams('', '#type=recovery&access_token=token'), true);
  assert.equal(hasPasswordRecoveryParams('?type=signup', ''), false);
});

test('buildCleanAuthRedirectPath limpa query e hash preservando o path', () => {
  assert.equal(buildCleanAuthRedirectPath('/FitTrack/'), '/FitTrack/');
  assert.equal(buildCleanAuthRedirectPath(''), '/');
});
