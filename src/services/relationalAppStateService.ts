import type { Session } from '@supabase/supabase-js';
import type { AppState } from '../lib/appState';
import type { Workout } from '../data/types';
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
  const deleteResult = await supabase
    .from('app_weight_logs')
    .delete()
    .eq('user_id', userId);

  if (deleteResult.error) {
    console.error('Erro ao limpar histórico de peso relacional', deleteResult.error);
    return false;
  }

  if (weightHistory.length === 0) {
    return true;
  }

  const { error } = await supabase
    .from('app_weight_logs')
    .insert(weightHistory.map((item, index) => ({
      id: stableId(userId, 'weight', item.date, index),
      user_id: userId,
      legacy_id: item.date,
      position: index,
      logged_at: item.date,
      weight: item.weight
    })));

  if (error) {
    console.error('Erro ao salvar histórico de peso relacional', error);
    return false;
  }

  return true;
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
        id: stableId(userId, 'workout', workout.id, 'exercise', exercise.id, 'set', setIndex + 1),
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

  const workoutDelete = await supabase.from('app_workouts').delete().eq('user_id', userId);
  if (workoutDelete.error) {
    console.error('Erro ao limpar treinos relacionais', workoutDelete.error);
    return false;
  }

  if (workoutRows.length > 0) {
    const { error } = await supabase.from('app_workouts').insert(workoutRows);
    if (error) {
      console.error('Erro ao salvar treinos relacionais', error);
      return false;
    }
  }

  if (exerciseRows.length > 0) {
    const { error } = await supabase.from('app_workout_exercises').insert(exerciseRows);
    if (error) {
      console.error('Erro ao salvar exercícios relacionais', error);
      return false;
    }
  }

  if (setRows.length > 0) {
    const { error } = await supabase.from('app_workout_exercise_sets').insert(setRows);
    if (error) {
      console.error('Erro ao salvar séries relacionais', error);
      return false;
    }
  }

  return true;
}
