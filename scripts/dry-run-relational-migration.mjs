import { readFileSync } from 'node:fs';

const backupPath = process.argv[2];

if (!backupPath) {
  console.error('Uso: node scripts/dry-run-relational-migration.mjs backups/user_app_states_YYYYMMDD_HHMMSS.jsonl');
  process.exit(1);
}

const rows = readFileSync(backupPath, 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => JSON.parse(line));

const totals = {
  users: rows.length,
  profiles: 0,
  waterDays: 0,
  weightLogs: 0,
  workouts: 0,
  workoutExercises: 0,
  workoutExerciseSets: 0,
  diets: 0,
  dietMeals: 0,
  dietFoods: 0,
  dietDays: 0,
  dietDayMeals: 0,
  dietCompletedMeals: 0
};

for (const row of rows) {
  const profile = row.profile ?? null;
  const water = row.water ?? null;
  const workoutsPayload = row.workouts ?? null;
  const weeklyDiet = row.weekly_diet ?? null;
  const weightHistory = Array.isArray(row.weight_history) ? row.weight_history : [];
  const workouts = Array.isArray(workoutsPayload)
    ? workoutsPayload
    : Array.isArray(workoutsPayload?.workouts) ? workoutsPayload.workouts : [];
  const meals = Array.isArray(weeklyDiet?.meals) ? weeklyDiet.meals : [];
  const days = Array.isArray(weeklyDiet?.days) ? weeklyDiet.days : [];

  if (profile) totals.profiles += 1;
  if (water) totals.waterDays += 1;
  totals.weightLogs += weightHistory.length;
  totals.workouts += workouts.length;
  totals.workoutExercises += workouts.reduce((count, workout) => {
    const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];
    return count + exercises.length;
  }, 0);
  totals.workoutExerciseSets += workouts.reduce((count, workout) => {
    const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];
    return count + exercises.reduce((setCount, exercise) => setCount + Math.max(0, Math.floor(Number(exercise.sets) || 0)), 0);
  }, 0);
  if (weeklyDiet) totals.diets += 1;
  totals.dietMeals += meals.length;
  totals.dietFoods += meals.reduce((count, meal) => {
    const foods = Array.isArray(meal.foods) ? meal.foods : [];
    return count + foods.length;
  }, 0);
  totals.dietDays += days.length;
  totals.dietDayMeals += days.reduce((count, day) => {
    const mealIds = Array.isArray(day.mealIds) ? day.mealIds : [];
    return count + mealIds.length;
  }, 0);
  totals.dietCompletedMeals += days.reduce((count, day) => {
    const completedMealIds = Array.isArray(day.completedMealIds) ? day.completedMealIds : [];
    return count + completedMealIds.length;
  }, 0);
}

console.log('Dry-run da migracao relacional');
console.log(`Arquivo: ${backupPath}`);
console.log('');

for (const [name, value] of Object.entries(totals)) {
  console.log(`${name}: ${value}`);
}

console.log('');
console.log('Nada foi gravado no banco.');
