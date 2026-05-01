import type {
  ActivityLevel,
  DietType,
  ExerciseMediaType,
  GoalType,
  MuscleGroup,
  Sex
} from '../data/types';
import type { AppState } from './appState';
import { normalizeWorkoutExerciseSets, summarizeWorkoutExerciseSets } from './workoutSets';

export interface RelationalProfileRecord {
  id: string;
  userId: string;
  currentWeight: number;
  heightCm: number;
  birthDate: string;
  age: number;
  sex: Sex;
  activityLevel: ActivityLevel;
  goal: GoalType;
  dietType: DietType;
}

export interface RelationalWaterRecord {
  id: string;
  userId: string;
  goalMl: number;
  consumedMl: number;
  updatedAt: string;
}

export interface RelationalWeightRecord {
  id: string;
  userId: string;
  position: number;
  date: string;
  weight: number;
}

export interface RelationalWorkoutRecord {
  id: string;
  userId: string;
  legacyId: string;
  name: string;
  position: number;
  muscleGroups: MuscleGroup[];
}

export interface RelationalWorkoutExerciseRecord {
  id: string;
  userId: string;
  workoutId: string;
  legacyId: string;
  source: 'local';
  sourceId?: string;
  name: string;
  ptName?: string;
  muscleGroup: MuscleGroup;
  mediaType: ExerciseMediaType;
  mediaUrl: string | null;
  mediaUrls: string[];
  loadKg: number;
  reps: number;
  sets: number;
  restSeconds: number;
  done: boolean;
  position: number;
}

export interface RelationalWorkoutExerciseSetRecord {
  id: string;
  userId: string;
  workoutId: string;
  exerciseId: string;
  position: number;
  loadKg: number;
  reps: number;
  done: boolean;
}

export interface RelationalDietRecord {
  id: string;
  userId: string;
  legacyId: string;
  progressUpdatedAt: string;
}

export interface RelationalDietMealRecord {
  id: string;
  userId: string;
  dietId: string;
  legacyId: string;
  name: string;
  position: number;
}

export interface RelationalDietFoodRecord {
  id: string;
  userId: string;
  mealId: string;
  legacyId: string;
  foodId?: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  quantity: number;
  unit: string;
  baseQuantity: number;
  baseUnit: string;
  position: number;
}

export interface RelationalDietDayRecord {
  id: string;
  userId: string;
  dietId: string;
  legacyId: string;
  label: string;
  position: number;
}

export interface RelationalDietDayMealRecord {
  id: string;
  userId: string;
  dayId: string;
  mealId: string;
  position: number;
}

export interface RelationalDietCompletedMealRecord {
  id: string;
  userId: string;
  dayId: string;
  mealId: string;
}

export interface RelationalAppStateRecords {
  profile: RelationalProfileRecord;
  water: RelationalWaterRecord;
  weightHistory: RelationalWeightRecord[];
  workouts: RelationalWorkoutRecord[];
  workoutExercises: RelationalWorkoutExerciseRecord[];
  workoutExerciseSets: RelationalWorkoutExerciseSetRecord[];
  diet: RelationalDietRecord;
  dietMeals: RelationalDietMealRecord[];
  dietFoods: RelationalDietFoodRecord[];
  dietDays: RelationalDietDayRecord[];
  dietDayMeals: RelationalDietDayMealRecord[];
  dietCompletedMeals: RelationalDietCompletedMealRecord[];
}

function stableId(...parts: Array<string | number>) {
  return parts.map((part) => encodeURIComponent(String(part))).join(':');
}

export function createWorkoutExerciseSetRecords(
  userId: string,
  workoutId: string,
  exerciseId: string,
  sets: number,
  loadKg: number,
  reps: number,
  done: boolean
): RelationalWorkoutExerciseSetRecord[] {
  const setCount = Math.max(0, Math.floor(sets));

  return Array.from({ length: setCount }, (_, index) => ({
    id: stableId(userId, 'workout', workoutId, 'exercise', exerciseId, 'set', index + 1),
    userId,
    workoutId,
    exerciseId,
    position: index,
    loadKg,
    reps,
    done
  }));
}

export function convertAppStateToRelationalRecords(userId: string, state: AppState): RelationalAppStateRecords {
  const profile: RelationalProfileRecord = {
    id: stableId(userId, 'profile'),
    userId,
    currentWeight: state.profile.currentWeight,
    heightCm: state.profile.heightCm,
    birthDate: state.profile.birthDate,
    age: state.profile.age,
    sex: state.profile.sex,
    activityLevel: state.profile.activityLevel,
    goal: state.profile.goal,
    dietType: state.profile.dietType
  };
  const water: RelationalWaterRecord = {
    id: stableId(userId, 'water', state.water.updatedAt),
    userId,
    goalMl: state.water.goalMl,
    consumedMl: state.water.consumedMl,
    updatedAt: state.water.updatedAt
  };
  const weightHistory = state.weightHistory.map((item, index): RelationalWeightRecord => ({
    id: stableId(userId, 'weight', item.date, index),
    userId,
    position: index,
    date: item.date,
    weight: item.weight
  }));
  const workouts: RelationalWorkoutRecord[] = [];
  const workoutExercises: RelationalWorkoutExerciseRecord[] = [];
  const workoutExerciseSets: RelationalWorkoutExerciseSetRecord[] = [];

  state.workouts.forEach((workout, workoutIndex) => {
    const workoutId = stableId(userId, 'workout', workout.id);

    workouts.push({
      id: workoutId,
      userId,
      legacyId: workout.id,
      name: workout.name,
      position: workoutIndex,
      muscleGroups: workout.muscleGroups
    });

    workout.exercises.forEach((exercise, exerciseIndex) => {
      const exerciseId = stableId(userId, 'workout', workout.id, 'exercise', exercise.id);
      const mediaUrls = Array.isArray(exercise.mediaUrls)
        ? exercise.mediaUrls.filter(Boolean)
        : exercise.mediaUrl ? [exercise.mediaUrl] : [];

      workoutExercises.push({
        id: exerciseId,
        userId,
        workoutId,
        legacyId: exercise.id,
        source: 'local',
        sourceId: exercise.sourceId,
        name: exercise.name,
        ptName: exercise.ptName,
        muscleGroup: exercise.muscleGroup,
        mediaType: exercise.mediaType,
        mediaUrl: exercise.mediaUrl,
        mediaUrls,
        loadKg: exercise.loadKg,
        reps: exercise.reps,
        sets: exercise.sets,
        restSeconds: exercise.restSeconds,
        done: exercise.done,
        position: exerciseIndex
      });

      workoutExerciseSets.push(...normalizeWorkoutExerciseSets(exercise).map((set, setIndex) => ({
        id: stableId(userId, 'workout', workoutId, 'exercise', exerciseId, 'set', setIndex + 1),
        userId,
        workoutId,
        exerciseId,
        position: setIndex,
        loadKg: set.loadKg,
        reps: set.reps,
        done: set.done
      })));
    });
  });

  const dietId = stableId(userId, 'diet', state.weeklyDiet.id);
  const diet: RelationalDietRecord = {
    id: dietId,
    userId,
    legacyId: state.weeklyDiet.id,
    progressUpdatedAt: state.weeklyDiet.progressUpdatedAt
  };
  const dietMeals = state.weeklyDiet.meals.map((meal, mealIndex): RelationalDietMealRecord => ({
    id: stableId(userId, 'diet', state.weeklyDiet.id, 'meal', meal.id),
    userId,
    dietId,
    legacyId: meal.id,
    name: meal.name,
    position: mealIndex
  }));
  const dietFoods = state.weeklyDiet.meals.flatMap((meal) => {
    const mealId = stableId(userId, 'diet', state.weeklyDiet.id, 'meal', meal.id);

    return meal.foods.map((food, foodIndex): RelationalDietFoodRecord => ({
      id: stableId(userId, 'diet', state.weeklyDiet.id, 'meal', meal.id, 'food', food.id),
      userId,
      mealId,
      legacyId: food.id,
      foodId: food.foodId,
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fiber: food.fiber,
      quantity: food.quantity,
      unit: food.unit,
      baseQuantity: food.baseQuantity,
      baseUnit: food.baseUnit,
      position: foodIndex
    }));
  });
  const dietDays = state.weeklyDiet.days.map((day, dayIndex): RelationalDietDayRecord => ({
    id: stableId(userId, 'diet', state.weeklyDiet.id, 'day', day.id),
    userId,
    dietId,
    legacyId: day.id,
    label: day.label,
    position: dayIndex
  }));
  const dietDayMeals = state.weeklyDiet.days.flatMap((day) => {
    const dayId = stableId(userId, 'diet', state.weeklyDiet.id, 'day', day.id);

    return day.mealIds.map((mealId, mealIndex): RelationalDietDayMealRecord => ({
      id: stableId(userId, 'diet', state.weeklyDiet.id, 'day', day.id, 'meal', mealId),
      userId,
      dayId,
      mealId: stableId(userId, 'diet', state.weeklyDiet.id, 'meal', mealId),
      position: mealIndex
    }));
  });
  const dietCompletedMeals = state.weeklyDiet.days.flatMap((day) => {
    const dayId = stableId(userId, 'diet', state.weeklyDiet.id, 'day', day.id);

    return day.completedMealIds.map((mealId): RelationalDietCompletedMealRecord => ({
      id: stableId(userId, 'diet', state.weeklyDiet.id, 'day', day.id, 'completedMeal', mealId),
      userId,
      dayId,
      mealId: stableId(userId, 'diet', state.weeklyDiet.id, 'meal', mealId)
    }));
  });

  return {
    profile,
    water,
    weightHistory,
    workouts,
    workoutExercises,
    workoutExerciseSets,
    diet,
    dietMeals,
    dietFoods,
    dietDays,
    dietDayMeals,
    dietCompletedMeals
  };
}

export function convertRelationalRecordsToAppState(records: RelationalAppStateRecords, workoutsUpdatedAt: string): AppState {
  const workouts = [...records.workouts]
    .sort((a, b) => a.position - b.position)
    .map((workout) => ({
      id: workout.legacyId,
      name: workout.name,
      muscleGroups: workout.muscleGroups,
      exercises: records.workoutExercises
        .filter((exercise) => exercise.workoutId === workout.id)
        .sort((a, b) => a.position - b.position)
        .map((exercise) => {
          const setsDetail = records.workoutExerciseSets
            .filter((set) => set.exerciseId === exercise.id)
            .sort((a, b) => a.position - b.position)
            .map((set, setIndex) => ({
              id: `${exercise.legacyId}-set-${setIndex + 1}`,
              loadKg: set.loadKg,
              reps: set.reps,
              done: set.done
            }));
          const setSummary = setsDetail.length > 0
            ? summarizeWorkoutExerciseSets(setsDetail)
            : {
              loadKg: exercise.loadKg,
              reps: exercise.reps,
              sets: exercise.sets,
              done: exercise.done
            };

          return {
            id: exercise.legacyId,
            source: 'local' as const,
            sourceId: exercise.sourceId,
            name: exercise.name,
            ptName: exercise.ptName,
            muscleGroup: exercise.muscleGroup,
            mediaType: exercise.mediaType,
            mediaUrl: exercise.mediaUrl,
            mediaUrls: exercise.mediaUrls,
            loadKg: setSummary.loadKg,
            reps: setSummary.reps,
            sets: setSummary.sets,
            setsDetail: setsDetail.length > 0 ? setsDetail : undefined,
            restSeconds: exercise.restSeconds,
            done: setSummary.done
          };
        })
    }));
  const meals = [...records.dietMeals]
    .sort((a, b) => a.position - b.position)
    .map((meal) => ({
      id: meal.legacyId,
      name: meal.name,
      foods: records.dietFoods
        .filter((food) => food.mealId === meal.id)
        .sort((a, b) => a.position - b.position)
        .map((food) => ({
          id: food.legacyId,
          foodId: food.foodId,
          name: food.name,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          fiber: food.fiber,
          quantity: food.quantity,
          unit: food.unit,
          baseQuantity: food.baseQuantity,
          baseUnit: food.baseUnit
        }))
    }));
  const days = [...records.dietDays]
    .sort((a, b) => a.position - b.position)
    .map((day) => ({
      id: day.legacyId,
      label: day.label,
      mealIds: records.dietDayMeals
        .filter((dayMeal) => dayMeal.dayId === day.id)
        .sort((a, b) => a.position - b.position)
        .map((dayMeal) => records.dietMeals.find((meal) => meal.id === dayMeal.mealId)?.legacyId)
        .filter((mealId): mealId is string => Boolean(mealId)),
      completedMealIds: records.dietCompletedMeals
        .filter((completedMeal) => completedMeal.dayId === day.id)
        .map((completedMeal) => records.dietMeals.find((meal) => meal.id === completedMeal.mealId)?.legacyId)
        .filter((mealId): mealId is string => Boolean(mealId))
    }));

  return {
    profile: {
      currentWeight: records.profile.currentWeight,
      heightCm: records.profile.heightCm,
      birthDate: records.profile.birthDate,
      age: records.profile.age,
      sex: records.profile.sex,
      activityLevel: records.profile.activityLevel,
      goal: records.profile.goal,
      dietType: records.profile.dietType
    },
    workouts,
    workoutsUpdatedAt,
    water: {
      goalMl: records.water.goalMl,
      consumedMl: records.water.consumedMl,
      updatedAt: records.water.updatedAt
    },
    weeklyDiet: {
      id: records.diet.legacyId,
      progressUpdatedAt: records.diet.progressUpdatedAt,
      meals,
      days
    },
    weightHistory: [...records.weightHistory]
      .sort((a, b) => a.position - b.position)
      .map((item) => ({
        date: item.date,
        weight: item.weight
      }))
  };
}
