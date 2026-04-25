const WGER_TOKEN_URL = 'https://wger.de/api/v2/token';
const WGER_WORKOUTS_URL = 'https://wger.de/api/v2/workout/';
const wgerUsername = import.meta.env.VITE_WGER_USERNAME;
const wgerPassword = import.meta.env.VITE_WGER_PASSWORD;

let accessToken: string | null = null;

export async function loginWger() {
  if (!wgerUsername || !wgerPassword) {
    throw new Error('Credenciais do wger nao configuradas');
  }

  const response = await fetch(WGER_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: wgerUsername,
      password: wgerPassword
    })
  });

  if (!response.ok) {
    throw new Error('Erro ao autenticar');
  }

  const data = await response.json();
  accessToken = data.access;
  return data;
}

export async function getWgerAccessToken() {
  if (accessToken) return accessToken;

  const data = await loginWger();
  accessToken = data.access;
  return accessToken;
}

export async function getWorkouts() {
  const token = await getWgerAccessToken();

  const response = await fetch(WGER_WORKOUTS_URL, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar dados');
  }

  return response.json();
}
