let accessToken = null;

async function loginWger() {
  const response = await fetch('https://wger.de/api/v2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: 'gustavoalmeida5446',
      password: 'msr7ig4jFMXfGS!'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.log('Status do login:', response.status);
    console.log('Resposta do login:', errorText);
    throw new Error('Erro ao autenticar');
  }

  return response.json();
}

async function getWorkouts() {
  const response = await fetch('https://wger.de/api/v2/workout/', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar dados');
  }

  return response.json();
}

async function main() {
  try {
    const data = await loginWger();
    accessToken = data.access;
  } catch (error) {
    console.log(error);
    console.log('Erro ao autenticar');
    return;
  }

  try {
    const workouts = await getWorkouts();
    console.log(workouts);
  } catch (error) {
    console.log(error);
    console.log('Erro ao buscar dados');
  }
}

main();
