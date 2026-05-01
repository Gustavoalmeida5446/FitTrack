import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const backupPath = process.argv[2];

if (!backupPath) {
  console.error('Uso: node scripts/migrate-relational-from-backup.mjs backups/user_app_states_YYYYMMDD_HHMMSS.jsonl');
  process.exit(1);
}

if (!process.env.PGPASSWORD) {
  console.error('Defina PGPASSWORD antes de rodar.');
  process.exit(1);
}

const rows = readFileSync(backupPath, 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => JSON.parse(line));

const sqlLines = [
  'begin;',
  "select 'Migrando backup JSON para tabelas relacionais novas';"
];

function id(...parts) {
  return parts.map((part) => encodeURIComponent(String(part))).join(':');
}

function sql(value) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '0';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function jsonSql(value) {
  return `${sql(JSON.stringify(value ?? []))}::jsonb`;
}

function dateSql(value) {
  return value ? sql(value) : 'null';
}

function dateOrFallback(value, fallback) {
  if (value) return value;
  if (fallback) return String(fallback).slice(0, 10);
  return '1970-01-01';
}

function add(line) {
  sqlLines.push(line);
}

for (const row of rows) {
  const userId = row.user_id;
  const profile = row.profile ?? {};
  const water = row.water ?? {};
  const weightHistory = Array.isArray(row.weight_history) ? row.weight_history : [];
  const workoutsPayload = row.workouts ?? {};
  const workouts = Array.isArray(workoutsPayload)
    ? workoutsPayload
    : Array.isArray(workoutsPayload.workouts) ? workoutsPayload.workouts : [];
  const weeklyDiet = row.weekly_diet ?? {};
  const fallbackDate = dateOrFallback(row.updated_at, '1970-01-01');
  const meals = Array.isArray(weeklyDiet.meals) ? weeklyDiet.meals : [];
  const days = Array.isArray(weeklyDiet.days) ? weeklyDiet.days : [];
  const migrationId = id(userId, 'migration', 'json-to-relational-v1');

  add(`insert into public.app_data_migrations (id, user_id, migration_name, status) values (${sql(migrationId)}, ${sql(userId)}, 'json-to-relational-v1', 'pending') on conflict (user_id, migration_name) do update set status = 'pending', error_message = null, updated_at = timezone('utc', now());`);

  add(`insert into public.app_profiles (id, user_id, current_weight, height_cm, birth_date, age, sex, activity_level, goal, diet_type) values (${sql(id(userId, 'profile'))}, ${sql(userId)}, ${sql(profile.currentWeight ?? 0)}, ${sql(profile.heightCm ?? 0)}, ${dateSql(profile.birthDate)}, ${sql(profile.age ?? 0)}, ${sql(profile.sex ?? 'Masculino')}, ${sql(profile.activityLevel ?? 'Moderado')}, ${sql(profile.goal ?? 'Manutenção')}, ${sql(profile.dietType ?? 'Equilibrada')}) on conflict (user_id) do update set current_weight = excluded.current_weight, height_cm = excluded.height_cm, birth_date = excluded.birth_date, age = excluded.age, sex = excluded.sex, activity_level = excluded.activity_level, goal = excluded.goal, diet_type = excluded.diet_type, updated_at = timezone('utc', now());`);

  const waterDate = dateOrFallback(water.updatedAt, fallbackDate);
  add(`insert into public.app_water_days (id, user_id, day, goal_ml, consumed_ml) values (${sql(id(userId, 'water', waterDate))}, ${sql(userId)}, ${dateSql(waterDate)}, ${sql(water.goalMl ?? 0)}, ${sql(water.consumedMl ?? 0)}) on conflict (user_id, day) do update set goal_ml = excluded.goal_ml, consumed_ml = excluded.consumed_ml, updated_at = timezone('utc', now());`);

  weightHistory.forEach((item, index) => {
    add(`insert into public.app_weight_logs (id, user_id, legacy_id, position, logged_at, weight) values (${sql(id(userId, 'weight', item.date ?? 'unknown', index))}, ${sql(userId)}, ${sql(item.date ?? String(index))}, ${sql(index)}, ${sql(item.date ?? '')}, ${sql(item.weight ?? 0)}) on conflict (id) do update set position = excluded.position, logged_at = excluded.logged_at, weight = excluded.weight;`);
  });

  workouts.forEach((workout, workoutIndex) => {
    const workoutId = id(userId, 'workout', workout.id);
    const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];

    add(`insert into public.app_workouts (id, user_id, legacy_id, name, position, muscle_groups) values (${sql(workoutId)}, ${sql(userId)}, ${sql(workout.id)}, ${sql(workout.name ?? 'Treino')}, ${sql(workoutIndex)}, ${jsonSql(workout.muscleGroups ?? [])}) on conflict (user_id, legacy_id) do update set name = excluded.name, position = excluded.position, muscle_groups = excluded.muscle_groups, updated_at = timezone('utc', now());`);

    exercises.forEach((exercise, exerciseIndex) => {
      const exerciseId = id(userId, 'workout', workout.id, 'exercise', exercise.id);
      const mediaUrls = Array.isArray(exercise.mediaUrls)
        ? exercise.mediaUrls.filter(Boolean)
        : exercise.mediaUrl ? [exercise.mediaUrl] : [];
      const setCount = Math.max(0, Math.floor(Number(exercise.sets) || 0));

      add(`insert into public.app_workout_exercises (id, user_id, workout_id, legacy_id, source, source_id, name, pt_name, muscle_group, media_type, media_url, media_urls, load_kg, reps, sets, rest_seconds, done, position) values (${sql(exerciseId)}, ${sql(userId)}, ${sql(workoutId)}, ${sql(exercise.id)}, 'local', ${sql(exercise.sourceId)}, ${sql(exercise.name ?? 'Exercício')}, ${sql(exercise.ptName)}, ${sql(exercise.muscleGroup ?? 'Peito')}, ${sql(exercise.mediaType ?? 'none')}, ${sql(exercise.mediaUrl)}, ${jsonSql(mediaUrls)}, ${sql(exercise.loadKg ?? 0)}, ${sql(exercise.reps ?? 1)}, ${sql(exercise.sets ?? 1)}, ${sql(exercise.restSeconds ?? 0)}, ${sql(Boolean(exercise.done))}, ${sql(exerciseIndex)}) on conflict (user_id, workout_id, legacy_id) do update set source_id = excluded.source_id, name = excluded.name, pt_name = excluded.pt_name, muscle_group = excluded.muscle_group, media_type = excluded.media_type, media_url = excluded.media_url, media_urls = excluded.media_urls, load_kg = excluded.load_kg, reps = excluded.reps, sets = excluded.sets, rest_seconds = excluded.rest_seconds, done = excluded.done, position = excluded.position, updated_at = timezone('utc', now());`);

      for (let setIndex = 0; setIndex < setCount; setIndex += 1) {
        add(`insert into public.app_workout_exercise_sets (id, user_id, workout_id, exercise_id, position, load_kg, reps, done) values (${sql(id(userId, 'workout', workoutId, 'exercise', exerciseId, 'set', setIndex + 1))}, ${sql(userId)}, ${sql(workoutId)}, ${sql(exerciseId)}, ${sql(setIndex)}, ${sql(exercise.loadKg ?? 0)}, ${sql(exercise.reps ?? 1)}, ${sql(Boolean(exercise.done))}) on conflict (exercise_id, position) do update set load_kg = excluded.load_kg, reps = excluded.reps, done = excluded.done, updated_at = timezone('utc', now());`);
      }
    });
  });

  const dietId = id(userId, 'diet', weeklyDiet.id ?? 'diet-empty');
  const dietProgressDate = dateOrFallback(weeklyDiet.progressUpdatedAt, fallbackDate);
  add(`insert into public.app_diets (id, user_id, legacy_id, progress_updated_at) values (${sql(dietId)}, ${sql(userId)}, ${sql(weeklyDiet.id ?? 'diet-empty')}, ${dateSql(dietProgressDate)}) on conflict (user_id, legacy_id) do update set progress_updated_at = excluded.progress_updated_at, updated_at = timezone('utc', now());`);

  meals.forEach((meal, mealIndex) => {
    const mealId = id(userId, 'diet', weeklyDiet.id ?? 'diet-empty', 'meal', meal.id);
    const foods = Array.isArray(meal.foods) ? meal.foods : [];

    add(`insert into public.app_diet_meals (id, user_id, diet_id, legacy_id, name, position) values (${sql(mealId)}, ${sql(userId)}, ${sql(dietId)}, ${sql(meal.id)}, ${sql(meal.name ?? 'Refeição')}, ${sql(mealIndex)}) on conflict (user_id, diet_id, legacy_id) do update set name = excluded.name, position = excluded.position, updated_at = timezone('utc', now());`);

    foods.forEach((food, foodIndex) => {
      add(`insert into public.app_diet_foods (id, user_id, meal_id, legacy_id, food_id, name, calories, protein, carbs, fat, fiber, quantity, unit, base_quantity, base_unit, position) values (${sql(id(userId, 'diet', weeklyDiet.id ?? 'diet-empty', 'meal', meal.id, 'food', food.id))}, ${sql(userId)}, ${sql(mealId)}, ${sql(food.id)}, ${sql(food.foodId)}, ${sql(food.name ?? 'Alimento')}, ${sql(food.calories ?? 0)}, ${sql(food.protein ?? 0)}, ${sql(food.carbs ?? 0)}, ${sql(food.fat ?? 0)}, ${sql(food.fiber ?? 0)}, ${sql(food.quantity ?? 0)}, ${sql(food.unit ?? 'g')}, ${sql(food.baseQuantity ?? 0)}, ${sql(food.baseUnit ?? 'g')}, ${sql(foodIndex)}) on conflict (user_id, meal_id, legacy_id) do update set food_id = excluded.food_id, name = excluded.name, calories = excluded.calories, protein = excluded.protein, carbs = excluded.carbs, fat = excluded.fat, fiber = excluded.fiber, quantity = excluded.quantity, unit = excluded.unit, base_quantity = excluded.base_quantity, base_unit = excluded.base_unit, position = excluded.position, updated_at = timezone('utc', now());`);
    });
  });

  days.forEach((day, dayIndex) => {
    const dayId = id(userId, 'diet', weeklyDiet.id ?? 'diet-empty', 'day', day.id);
    const mealIds = Array.isArray(day.mealIds) ? day.mealIds : [];
    const completedMealIds = Array.isArray(day.completedMealIds) ? day.completedMealIds : [];

    add(`insert into public.app_diet_days (id, user_id, diet_id, legacy_id, label, position) values (${sql(dayId)}, ${sql(userId)}, ${sql(dietId)}, ${sql(day.id)}, ${sql(day.label ?? 'Dia')}, ${sql(dayIndex)}) on conflict (user_id, diet_id, legacy_id) do update set label = excluded.label, position = excluded.position, updated_at = timezone('utc', now());`);

    mealIds.forEach((mealId, mealIndex) => {
      const relationalMealId = id(userId, 'diet', weeklyDiet.id ?? 'diet-empty', 'meal', mealId);
      add(`insert into public.app_diet_day_meals (id, user_id, day_id, meal_id, position) values (${sql(id(userId, 'diet', weeklyDiet.id ?? 'diet-empty', 'day', day.id, 'meal', mealId))}, ${sql(userId)}, ${sql(dayId)}, ${sql(relationalMealId)}, ${sql(mealIndex)}) on conflict (day_id, meal_id) do update set position = excluded.position;`);
    });

    completedMealIds.forEach((mealId) => {
      const relationalMealId = id(userId, 'diet', weeklyDiet.id ?? 'diet-empty', 'meal', mealId);
      add(`insert into public.app_diet_completed_meals (id, user_id, day_id, meal_id) values (${sql(id(userId, 'diet', weeklyDiet.id ?? 'diet-empty', 'day', day.id, 'completedMeal', mealId))}, ${sql(userId)}, ${sql(dayId)}, ${sql(relationalMealId)}) on conflict (day_id, meal_id) do nothing;`);
    });
  });

  add(`update public.app_data_migrations set status = 'done', error_message = null, updated_at = timezone('utc', now()) where user_id = ${sql(userId)} and migration_name = 'json-to-relational-v1';`);
}

sqlLines.push('commit;');

const tempDir = mkdtempSync(join(tmpdir(), 'fittrack-migration-'));
const sqlPath = join(tempDir, 'migration.sql');
writeFileSync(sqlPath, sqlLines.join('\n'));

const result = spawnSync('psql', [
  'host=db.vzduymscsnuwbolucnag.supabase.co port=5432 user=postgres dbname=postgres sslmode=require',
  '-v',
  'ON_ERROR_STOP=1',
  '-f',
  sqlPath
], {
  env: process.env,
  stdio: 'inherit'
});

rmSync(tempDir, { recursive: true, force: true });

process.exit(result.status ?? 1);
