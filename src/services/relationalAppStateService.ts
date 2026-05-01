import type { Session } from '@supabase/supabase-js';
import type { AppState } from '../lib/appState';
import type { WeeklyDiet, Workout } from '../data/types';
import {
  RelationalAppStateRecords,
  convertRelationalRecordsToAppState
} from '../lib/relationalAppState';
import { supabase } from '../lib/supabaseClient';

function stableId(...parts: Array<string | number>) {
  return parts.map((part) => encodeURIComponent(String(part))).join(':');
}

function mapRowList<Row>(data: Row[] | null): Row[] {
  return Array.isArray(data) ? data : [];
}

async function deleteMissingRows(tableName: string, userId: string, currentIds: string[]) {
  const { data, error } = await supabase
    .from(tableName)
    .select('id')
    .eq('user_id', userId);

  if (error) {
    console.error(`Erro ao buscar linhas antigas em ${tableName}`, error);
    return false;
  }

  const currentIdSet = new Set(currentIds);
  const oldIds = mapRowList(data).map((item) => item.id).filter((id) => !currentIdSet.has(id));

  for (const id of oldIds) {
    const deleteResult = await supabase.from(tableName).delete().eq('id', id);

    if (deleteResult.error) {
      console.error(`Erro ao remover linha antiga em ${tableName}`, deleteResult.error);
      return false;
    }
  }

  return true;
}

async function softDeleteMissingRows(tableName: string, userId: string, currentIds: string[]) {
  const { data, error } = await supabase
    .from(tableName)
    .select('id')
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (error) {
    console.error(`Erro ao buscar linhas antigas em ${tableName}`, error);
    return false;
  }

  const currentIdSet = new Set(currentIds);
  const oldIds = mapRowList(data).map((item) => item.id).filter((id) => !currentIdSet.has(id));

  for (const id of oldIds) {
    const updateResult = await supabase
      .from(tableName)
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateResult.error) {
      console.error(`Erro ao marcar linha antiga em ${tableName}`, updateResult.error);
      return false;
    }
  }

  return true;
}

export async function loadRelationalAppState(session: Session, workoutsUpdatedAt: string): Promise<AppState | null> {
  const userId = session.user.id;
  const [
    profileResult,
    waterResult,
    weightResult,
    workoutResult,
    exerciseResult,
    setResult,
    dietResult,
    mealResult,
    foodResult,
    dayResult,
    dayMealResult,
    completedMealResult
  ] = await Promise.all([
    supabase.from('app_profiles').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('app_water_days').select('*').eq('user_id', userId).order('day', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('app_weight_logs').select('*').eq('user_id', userId).order('position', { ascending: true }),
    supabase.from('app_workouts').select('*').eq('user_id', userId).is('deleted_at', null).order('position', { ascending: true }),
    supabase.from('app_workout_exercises').select('*').eq('user_id', userId).is('deleted_at', null).order('position', { ascending: true }),
    supabase.from('app_workout_exercise_sets').select('*').eq('user_id', userId).order('position', { ascending: true }),
    supabase.from('app_diets').select('*').eq('user_id', userId).limit(1).maybeSingle(),
    supabase.from('app_diet_meals').select('*').eq('user_id', userId).is('deleted_at', null).order('position', { ascending: true }),
    supabase.from('app_diet_foods').select('*').eq('user_id', userId).order('position', { ascending: true }),
    supabase.from('app_diet_days').select('*').eq('user_id', userId).order('position', { ascending: true }),
    supabase.from('app_diet_day_meals').select('*').eq('user_id', userId).order('position', { ascending: true }),
    supabase.from('app_diet_completed_meals').select('*').eq('user_id', userId)
  ]);

  const hasError = [
    profileResult,
    waterResult,
    weightResult,
    workoutResult,
    exerciseResult,
    setResult,
    dietResult,
    mealResult,
    foodResult,
    dayResult,
    dayMealResult,
    completedMealResult
  ].some((result) => result.error);

  if (hasError || !profileResult.data || !waterResult.data || !dietResult.data) {
    return null;
  }

  const records: RelationalAppStateRecords = {
    profile: {
      id: profileResult.data.id,
      userId: profileResult.data.user_id,
      currentWeight: Number(profileResult.data.current_weight),
      heightCm: Number(profileResult.data.height_cm),
      birthDate: profileResult.data.birth_date ?? '',
      age: Number(profileResult.data.age),
      sex: profileResult.data.sex,
      activityLevel: profileResult.data.activity_level,
      goal: profileResult.data.goal,
      dietType: profileResult.data.diet_type
    },
    water: {
      id: waterResult.data.id,
      userId: waterResult.data.user_id,
      goalMl: Number(waterResult.data.goal_ml),
      consumedMl: Number(waterResult.data.consumed_ml),
      updatedAt: waterResult.data.day
    },
    weightHistory: mapRowList(weightResult.data).map((item) => ({
      id: item.id,
      userId: item.user_id,
      position: Number(item.position),
      date: item.logged_at,
      weight: Number(item.weight)
    })),
    workouts: mapRowList(workoutResult.data).map((item) => ({
      id: item.id,
      userId: item.user_id,
      legacyId: item.legacy_id,
      name: item.name,
      position: Number(item.position),
      muscleGroups: item.muscle_groups
    })),
    workoutExercises: mapRowList(exerciseResult.data).map((item) => ({
      id: item.id,
      userId: item.user_id,
      workoutId: item.workout_id,
      legacyId: item.legacy_id,
      source: 'local',
      sourceId: item.source_id ?? undefined,
      name: item.name,
      ptName: item.pt_name ?? undefined,
      muscleGroup: item.muscle_group,
      mediaType: item.media_type,
      mediaUrl: item.media_url,
      mediaUrls: item.media_urls,
      loadKg: Number(item.load_kg),
      reps: Number(item.reps),
      sets: Number(item.sets),
      restSeconds: Number(item.rest_seconds),
      done: Boolean(item.done),
      position: Number(item.position)
    })),
    workoutExerciseSets: mapRowList(setResult.data).map((item) => ({
      id: item.id,
      userId: item.user_id,
      workoutId: item.workout_id,
      exerciseId: item.exercise_id,
      position: Number(item.position),
      loadKg: Number(item.load_kg),
      reps: Number(item.reps),
      done: Boolean(item.done)
    })),
    diet: {
      id: dietResult.data.id,
      userId: dietResult.data.user_id,
      legacyId: dietResult.data.legacy_id,
      progressUpdatedAt: dietResult.data.progress_updated_at
    },
    dietMeals: mapRowList(mealResult.data).map((item) => ({
      id: item.id,
      userId: item.user_id,
      dietId: item.diet_id,
      legacyId: item.legacy_id,
      name: item.name,
      position: Number(item.position)
    })),
    dietFoods: mapRowList(foodResult.data).map((item) => ({
      id: item.id,
      userId: item.user_id,
      mealId: item.meal_id,
      legacyId: item.legacy_id,
      foodId: item.food_id ?? undefined,
      name: item.name,
      calories: Number(item.calories),
      protein: Number(item.protein),
      carbs: Number(item.carbs),
      fat: Number(item.fat),
      fiber: Number(item.fiber),
      quantity: Number(item.quantity),
      unit: item.unit,
      baseQuantity: Number(item.base_quantity),
      baseUnit: item.base_unit,
      position: Number(item.position)
    })),
    dietDays: mapRowList(dayResult.data).map((item) => ({
      id: item.id,
      userId: item.user_id,
      dietId: item.diet_id,
      legacyId: item.legacy_id,
      label: item.label,
      position: Number(item.position)
    })),
    dietDayMeals: mapRowList(dayMealResult.data).map((item) => ({
      id: item.id,
      userId: item.user_id,
      dayId: item.day_id,
      mealId: item.meal_id,
      position: Number(item.position)
    })),
    dietCompletedMeals: mapRowList(completedMealResult.data).map((item) => ({
      id: item.id,
      userId: item.user_id,
      dayId: item.day_id,
      mealId: item.meal_id
    }))
  };

  return convertRelationalRecordsToAppState(records, workoutsUpdatedAt);
}

export async function saveRelationalProfile(session: Session, profile: AppState['profile']) {
  const userId = session.user.id;
  const { error } = await supabase
    .from('app_profiles')
    .upsert({
      id: stableId(userId, 'profile'),
      user_id: userId,
      current_weight: profile.currentWeight,
      height_cm: profile.heightCm,
      birth_date: profile.birthDate || null,
      age: profile.age,
      sex: profile.sex,
      activity_level: profile.activityLevel,
      goal: profile.goal,
      diet_type: profile.dietType,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    console.error('Erro ao salvar perfil relacional', error);
    return false;
  }

  return true;
}

export async function saveRelationalWater(session: Session, water: AppState['water']) {
  const userId = session.user.id;
  const { error } = await supabase
    .from('app_water_days')
    .upsert({
      id: stableId(userId, 'water', water.updatedAt),
      user_id: userId,
      day: water.updatedAt,
      goal_ml: water.goalMl,
      consumed_ml: water.consumedMl,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,day'
    });

  if (error) {
    console.error('Erro ao salvar água relacional', error);
    return false;
  }

  return true;
}

export async function replaceRelationalWeightHistory(session: Session, weightHistory: AppState['weightHistory']) {
  const userId = session.user.id;
  const rows = weightHistory.map((item, index) => ({
    id: stableId(userId, 'weight', item.date, index),
    user_id: userId,
    legacy_id: item.date,
    position: index,
    logged_at: item.date,
    weight: item.weight
  }));

  if (rows.length > 0) {
    const { error } = await supabase.from('app_weight_logs').upsert(rows);

    if (error) {
      console.error('Erro ao salvar histórico de peso relacional', error);
      return false;
    }
  }

  return deleteMissingRows('app_weight_logs', userId, rows.map((item) => item.id));
}

export async function replaceRelationalWorkouts(session: Session, workouts: Workout[]) {
  const userId = session.user.id;
  const workoutRows = workouts.map((workout, workoutIndex) => ({
    id: stableId(userId, 'workout', workout.id),
    user_id: userId,
    legacy_id: workout.id,
    name: workout.name,
    position: workoutIndex,
    muscle_groups: workout.muscleGroups,
    deleted_at: null,
    updated_at: new Date().toISOString()
  }));
  const exerciseRows = workouts.flatMap((workout) => {
    const workoutId = stableId(userId, 'workout', workout.id);

    return workout.exercises.map((exercise, exerciseIndex) => {
      const mediaUrls = Array.isArray(exercise.mediaUrls)
        ? exercise.mediaUrls.filter(Boolean)
        : exercise.mediaUrl ? [exercise.mediaUrl] : [];

      return {
        id: stableId(userId, 'workout', workout.id, 'exercise', exercise.id),
        user_id: userId,
        workout_id: workoutId,
        legacy_id: exercise.id,
        source: 'local',
        source_id: exercise.sourceId,
        name: exercise.name,
        pt_name: exercise.ptName,
        muscle_group: exercise.muscleGroup,
        media_type: exercise.mediaType,
        media_url: exercise.mediaUrl,
        media_urls: mediaUrls,
        load_kg: exercise.loadKg,
        reps: exercise.reps,
        sets: exercise.sets,
        rest_seconds: exercise.restSeconds,
        done: exercise.done,
        position: exerciseIndex,
        deleted_at: null,
        updated_at: new Date().toISOString()
      };
    });
  });
  const setRows = workouts.flatMap((workout) => {
    const workoutId = stableId(userId, 'workout', workout.id);

    return workout.exercises.flatMap((exercise) => {
      const exerciseId = stableId(userId, 'workout', workout.id, 'exercise', exercise.id);
      const setCount = Math.max(0, Math.floor(exercise.sets));

      return Array.from({ length: setCount }, (_, setIndex) => ({
        id: stableId(userId, 'workout', workoutId, 'exercise', exerciseId, 'set', setIndex + 1),
        user_id: userId,
        workout_id: workoutId,
        exercise_id: exerciseId,
        position: setIndex,
        load_kg: exercise.loadKg,
        reps: exercise.reps,
        done: exercise.done,
        updated_at: new Date().toISOString()
      }));
    });
  });

  if (workoutRows.length > 0) {
    const { error } = await supabase.from('app_workouts').upsert(workoutRows);
    if (error) {
      console.error('Erro ao salvar treinos relacionais', error);
      return false;
    }
  }

  if (exerciseRows.length > 0) {
    const { error } = await supabase.from('app_workout_exercises').upsert(exerciseRows);
    if (error) {
      console.error('Erro ao salvar exercícios relacionais', error);
      return false;
    }
  }

  if (setRows.length > 0) {
    const { error } = await supabase.from('app_workout_exercise_sets').upsert(setRows, {
      onConflict: 'exercise_id,position'
    });
    if (error) {
      console.error('Erro ao salvar séries relacionais', error);
      return false;
    }
  }

  const didSoftDeleteWorkouts = await softDeleteMissingRows('app_workouts', userId, workoutRows.map((item) => item.id));
  const didSoftDeleteExercises = await softDeleteMissingRows('app_workout_exercises', userId, exerciseRows.map((item) => item.id));
  const didDeleteSets = await deleteMissingRows('app_workout_exercise_sets', userId, setRows.map((item) => item.id));

  return didSoftDeleteWorkouts && didSoftDeleteExercises && didDeleteSets;
}

export async function replaceRelationalDiet(session: Session, diet: WeeklyDiet) {
  const userId = session.user.id;
  const dietId = stableId(userId, 'diet', diet.id);
  const mealRows = diet.meals.map((meal, mealIndex) => ({
    id: stableId(userId, 'diet', diet.id, 'meal', meal.id),
    user_id: userId,
    diet_id: dietId,
    legacy_id: meal.id,
    name: meal.name,
    position: mealIndex,
    deleted_at: null,
    updated_at: new Date().toISOString()
  }));
  const foodRows = diet.meals.flatMap((meal) => meal.foods.map((food, foodIndex) => ({
    id: stableId(userId, 'diet', diet.id, 'meal', meal.id, 'food', food.id),
    user_id: userId,
    meal_id: stableId(userId, 'diet', diet.id, 'meal', meal.id),
    legacy_id: food.id,
    food_id: food.foodId,
    name: food.name,
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    fiber: food.fiber,
    quantity: food.quantity,
    unit: food.unit,
    base_quantity: food.baseQuantity,
    base_unit: food.baseUnit,
    position: foodIndex,
    updated_at: new Date().toISOString()
  })));
  const dayRows = diet.days.map((day, dayIndex) => ({
    id: stableId(userId, 'diet', diet.id, 'day', day.id),
    user_id: userId,
    diet_id: dietId,
    legacy_id: day.id,
    label: day.label,
    position: dayIndex,
    updated_at: new Date().toISOString()
  }));
  const dayMealRows = diet.days.flatMap((day) => day.mealIds.map((mealId, mealIndex) => ({
    id: stableId(userId, 'diet', diet.id, 'day', day.id, 'meal', mealId),
    user_id: userId,
    day_id: stableId(userId, 'diet', diet.id, 'day', day.id),
    meal_id: stableId(userId, 'diet', diet.id, 'meal', mealId),
    position: mealIndex
  })));
  const completedMealRows = diet.days.flatMap((day) => day.completedMealIds.map((mealId) => ({
    id: stableId(userId, 'diet', diet.id, 'day', day.id, 'completedMeal', mealId),
    user_id: userId,
    day_id: stableId(userId, 'diet', diet.id, 'day', day.id),
    meal_id: stableId(userId, 'diet', diet.id, 'meal', mealId)
  })));

  const dietResult = await supabase.from('app_diets').upsert({
    id: dietId,
    user_id: userId,
    legacy_id: diet.id,
    progress_updated_at: diet.progressUpdatedAt,
    updated_at: new Date().toISOString()
  });
  if (dietResult.error) {
    console.error('Erro ao salvar dieta relacional', dietResult.error);
    return false;
  }

  if (mealRows.length > 0) {
    const { error } = await supabase.from('app_diet_meals').upsert(mealRows);
    if (error) {
      console.error('Erro ao salvar refeições relacionais', error);
      return false;
    }
  }

  if (foodRows.length > 0) {
    const { error } = await supabase.from('app_diet_foods').upsert(foodRows);
    if (error) {
      console.error('Erro ao salvar alimentos relacionais', error);
      return false;
    }
  }

  if (dayRows.length > 0) {
    const { error } = await supabase.from('app_diet_days').upsert(dayRows);
    if (error) {
      console.error('Erro ao salvar dias de dieta relacionais', error);
      return false;
    }
  }

  if (dayMealRows.length > 0) {
    const { error } = await supabase.from('app_diet_day_meals').upsert(dayMealRows);
    if (error) {
      console.error('Erro ao salvar vínculos de dieta relacionais', error);
      return false;
    }
  }

  if (completedMealRows.length > 0) {
    const { error } = await supabase.from('app_diet_completed_meals').upsert(completedMealRows);
    if (error) {
      console.error('Erro ao salvar progresso de dieta relacional', error);
      return false;
    }
  }

  const didSoftDeleteMeals = await softDeleteMissingRows('app_diet_meals', userId, mealRows.map((item) => item.id));
  const didDeleteFoods = await deleteMissingRows('app_diet_foods', userId, foodRows.map((item) => item.id));
  const didDeleteDayMeals = await deleteMissingRows('app_diet_day_meals', userId, dayMealRows.map((item) => item.id));
  const didDeleteCompletedMeals = await deleteMissingRows('app_diet_completed_meals', userId, completedMealRows.map((item) => item.id));

  return didSoftDeleteMeals && didDeleteFoods && didDeleteDayMeals && didDeleteCompletedMeals;
}
