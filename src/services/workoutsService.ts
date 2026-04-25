import { supabase } from '../lib/supabaseClient';

export async function getWorkouts() {
  const { data, error } = await supabase.functions.invoke('hyper-action');

  if (error) {
    console.error('Erro ao buscar dados', error);
    return null;
  }

  return data;
}

export async function main() {
  const workouts = await getWorkouts();
  console.log(workouts);
  return workouts;
}
