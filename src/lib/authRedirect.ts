export function buildAppRedirectUrl(baseUrl: string, origin: string) {
  return new URL(baseUrl, origin).toString();
}

export function buildPasswordResetRedirectUrl(baseUrl: string, origin: string) {
  const url = new URL(baseUrl, origin);
  url.searchParams.set('type', 'recovery');

  return url.toString();
}

export function hasPasswordRecoveryParams(search: string, hash: string) {
  const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
  const searchParams = new URLSearchParams(search.replace(/^\?/, ''));

  return hashParams.get('type') === 'recovery' || searchParams.get('type') === 'recovery';
}

export function buildCleanAuthRedirectPath(pathname: string) {
  return pathname || '/';
}
