import {
  ActivityLevel,
  FoodItem,
  DietType,
  DietDay,
  GoalType,
  Meal,
  MuscleGroup,
  Sex,
  UserProfile,
  WaterData,
  WeeklyDiet,
  WeightLog,
  Workout,
  WorkoutExercise
} from '../data/types';
import { calculateAgeFromBirthDate, getTodayDateString, normalizeBirthDateDisplay, weekDayLabels } from './date';

export interface AppState {
  profile: UserProfile;
  workouts: Workout[];
  workoutsUpdatedAt: string;
  water: WaterData;
  weeklyDiet: WeeklyDiet;
  weightHistory: WeightLog[];
}

type LegacyExercise = WorkoutExercise | {
  id: string;
  exerciseId?: string;
  source?: 'manual' | 'local';
  sourceId?: string;
  name: string;
  ptName?: string;
  muscleGroup: MuscleGroup;
  mediaType?: WorkoutExercise['mediaType'];
  mediaUrl?: string | null;
  mediaUrls?: string[];
  loadKg: number;
  reps: number;
  sets: number;
  restSeconds: number;
  done: boolean;
};

type LegacyWorkout = {
  id: string;
  name: string;
  muscleGroups: MuscleGroup[];
  exercises: LegacyExercise[];
};

type LegacyWorkoutState = {
  updatedAt?: string;
  progressUpdatedAt?: string;
  exerciseLibrary?: Array<{
    id: string;
    source?: 'manual' | 'local';
    sourceId?: string;
    name: string;
    ptName?: string;
    muscleGroup: MuscleGroup;
    mediaType?: WorkoutExercise['mediaType'];
    mediaUrl?: string | null;
    mediaUrls?: string[];
  }>;
    workouts?: Array<{
      id: string;
      name: string;
    muscleGroups: MuscleGroup[];
    exercises: Array<{
      id: string;
      exerciseId: string;
      loadKg: number;
      reps: number;
      sets: number;
      restSeconds: number;
      done: boolean;
    }>;
  }>;
};

type PersistedWorkoutState = {
  updatedAt?: string;
  workouts?: Workout[];
};

type LegacyMeal = Meal & { done?: boolean };
type LegacyDietDay = { id: string; label: string; meals?: LegacyMeal[] };
type LegacyWeeklyDiet = { id?: string; days?: LegacyDietDay[] };
type LegacyFoodItem = FoodItem & {
  quantityGrams?: number;
  baseQuantityGrams?: number;
};
type LegacyProfile = Partial<UserProfile> | null | undefined;

function createEmptyProfile(): UserProfile {
  return {
    currentWeight: 0,
    heightCm: 0,
    birthDate: '',
    age: 0,
    sex: 'Masculino' as Sex,
    activityLevel: 'Moderado' as ActivityLevel,
    goal: 'Manutenção' as GoalType,
    dietType: 'Equilibrada' as DietType
  };
}

export function normalizeProfile(profile?: LegacyProfile): UserProfile {
  const fallback = createEmptyProfile();

  return {
    currentWeight: typeof profile?.currentWeight === 'number' ? profile.currentWeight : fallback.currentWeight,
    heightCm: typeof profile?.heightCm === 'number' ? profile.heightCm : fallback.heightCm,
    birthDate: typeof profile?.birthDate === 'string' ? normalizeBirthDateDisplay(profile.birthDate) : fallback.birthDate,
    age: typeof profile?.birthDate === 'string' && profile.birthDate
      ? calculateAgeFromBirthDate(profile.birthDate)
      : typeof profile?.age === 'number' ? profile.age : fallback.age,
    sex: profile?.sex === 'Feminino' ? 'Feminino' : 'Masculino',
    activityLevel: ['Sedentario', 'Leve', 'Moderado', 'Intenso', 'Atleta'].includes(String(profile?.activityLevel))
      ? profile?.activityLevel as ActivityLevel
      : fallback.activityLevel,
    goal: ['Perda de gordura', 'Manutenção', 'Ganho de massa'].includes(String(profile?.goal))
      ? profile?.goal as GoalType
      : fallback.goal,
    dietType: ['Equilibrada', 'Baixo carboidrato', 'Alta em carboidrato'].includes(String(profile?.dietType))
      ? profile?.dietType as DietType
      : fallback.dietType
  };
}

function createEmptyWeeklyDiet(): WeeklyDiet {
  return {
    id: 'diet-empty',
    meals: [],
    days: weekDayLabels.map((label, index) => ({
      id: `d-${index + 1}`,
      label,
      mealIds: [],
      completedMealIds: []
    }))
  };
}

function createEmptyWater(): WaterData {
  return {
    goalMl: 0,
    consumedMl: 0,
    updatedAt: getTodayDateString()
  };
}

function normalizeWorkoutExercise(exercise: LegacyExercise): WorkoutExercise {
  const mediaUrls = Array.isArray(exercise.mediaUrls)
    ? exercise.mediaUrls.filter(Boolean).slice(0, 2)
    : exercise.mediaUrl ? [exercise.mediaUrl] : [];

  return {
    id: exercise.id,
    source: exercise.source ?? 'manual',
    sourceId: exercise.sourceId,
    name: exercise.name,
    ptName: exercise.ptName,
    muscleGroup: exercise.muscleGroup,
    mediaType: exercise.mediaType ?? (mediaUrls.length > 0 ? 'image' : 'none'),
    mediaUrl: mediaUrls[0] ?? exercise.mediaUrl ?? null,
    mediaUrls,
    loadKg: exercise.loadKg,
    reps: exercise.reps,
    sets: exercise.sets,
    restSeconds: exercise.restSeconds,
    done: Boolean(exercise.done)
  };
}

export const defaultAppState: AppState = {
  profile: normalizeProfile(),
  workouts: [],
  workoutsUpdatedAt: getTodayDateString(),
  water: createEmptyWater(),
  weeklyDiet: createEmptyWeeklyDiet(),
  weightHistory: [] as WeightLog[]
};

function resetWorkoutProgress(workouts: Workout[]): Workout[] {
  return workouts.map((workout) => ({
    ...workout,
    exercises: workout.exercises.map((exercise) => ({
      ...exercise,
      done: false
    }))
  }));
}

function normalizeWorkoutList(workouts?: Workout[] | LegacyWorkoutState | LegacyWorkout[] | null): Workout[] {
  if (!workouts) {
    return [];
  }

  if (Array.isArray(workouts)) {
    return workouts.map((workout) => ({
      id: workout.id,
      name: workout.name,
      muscleGroups: Array.isArray(workout.muscleGroups) ? workout.muscleGroups : [],
      exercises: Array.isArray(workout.exercises) ? workout.exercises.map(normalizeWorkoutExercise) : []
    }));
  }

  const library = Array.isArray(workouts.exerciseLibrary) ? workouts.exerciseLibrary : [];
  const nextWorkouts = Array.isArray(workouts.workouts) ? workouts.workouts : [];

  return nextWorkouts.map((workout) => ({
    id: workout.id,
    name: workout.name,
    muscleGroups: Array.isArray(workout.muscleGroups) ? workout.muscleGroups : [],
    exercises: Array.isArray(workout.exercises) ? workout.exercises.map((exercise) => {
      const definition = library.find((item) => item.id === exercise.exerciseId);
      const mediaUrls = Array.isArray(definition?.mediaUrls)
        ? definition.mediaUrls.filter(Boolean).slice(0, 2)
        : definition?.mediaUrl ? [definition.mediaUrl] : [];

      return {
        id: exercise.id,
        source: definition?.source ?? 'manual',
        sourceId: definition?.sourceId,
        name: definition?.name ?? 'Exercício',
        ptName: definition?.ptName,
        muscleGroup: definition?.muscleGroup ?? 'Peito',
        mediaType: definition?.mediaType ?? (mediaUrls.length > 0 ? 'image' : 'none'),
        mediaUrl: mediaUrls[0] ?? definition?.mediaUrl ?? null,
        mediaUrls,
        loadKg: exercise.loadKg,
        reps: exercise.reps,
        sets: exercise.sets,
        restSeconds: exercise.restSeconds,
        done: Boolean(exercise.done)
      };
    }) : []
  }));
}

export function normalizeWorkoutState(workouts?: Workout[] | LegacyWorkoutState | LegacyWorkout[] | null): Workout[] {
  return normalizeWorkoutList(workouts);
}

export function normalizeWorkoutProgressState(workouts?: Workout[] | PersistedWorkoutState | LegacyWorkoutState | LegacyWorkout[] | null): Pick<AppState, 'workouts' | 'workoutsUpdatedAt'> {
  const today = getTodayDateString();
  const rawUpdatedAt = workouts && !Array.isArray(workouts) && typeof workouts === 'object'
    ? 'updatedAt' in workouts && typeof workouts.updatedAt === 'string'
      ? workouts.updatedAt
      : 'progressUpdatedAt' in workouts && typeof workouts.progressUpdatedAt === 'string'
        ? workouts.progressUpdatedAt
        : ''
    : '';
  const normalizedWorkouts = normalizeWorkoutList(workouts);

  if (rawUpdatedAt === today) {
    return {
      workouts: normalizedWorkouts,
      workoutsUpdatedAt: today
    };
  }

  return {
    workouts: resetWorkoutProgress(normalizedWorkouts),
    workoutsUpdatedAt: today
  };
}

export function serializeWorkoutProgressState(workouts: Workout[], workoutsUpdatedAt: string): PersistedWorkoutState {
  return {
    updatedAt: workoutsUpdatedAt,
    workouts
  };
}

export function normalizeWorkoutProgressForToday(workouts: Workout[], workoutsUpdatedAt: string): Pick<AppState, 'workouts' | 'workoutsUpdatedAt'> {
  const today = getTodayDateString();

  if (workoutsUpdatedAt === today) {
    return {
      workouts,
      workoutsUpdatedAt
    };
  }

  return {
    workouts: resetWorkoutProgress(workouts),
    workoutsUpdatedAt: today
  };
}

export function normalizeWeeklyDiet(diet?: WeeklyDiet | LegacyWeeklyDiet | null): WeeklyDiet {
  if (!diet) {
    return createEmptyWeeklyDiet();
  }

  const baseDays = createEmptyWeeklyDiet().days;

  if ('meals' in diet && Array.isArray(diet.meals)) {
    const days = Array.isArray(diet.days) ? diet.days : [];

    return {
      id: diet.id ?? 'diet-empty',
      meals: diet.meals.map((meal) => ({
        id: meal.id,
        name: meal.name,
        foods: Array.isArray(meal.foods) ? meal.foods.map((food) => {
          const legacyFood = food as LegacyFoodItem;

          return {
          ...food,
          quantity: typeof legacyFood.quantity === 'number' ? legacyFood.quantity : typeof legacyFood.quantityGrams === 'number' ? legacyFood.quantityGrams : 0,
          unit: typeof food.unit === 'string' && food.unit.trim() ? food.unit : 'g',
          baseQuantity: typeof legacyFood.baseQuantity === 'number' ? legacyFood.baseQuantity : typeof legacyFood.baseQuantityGrams === 'number' ? legacyFood.baseQuantityGrams : 100,
          baseUnit: typeof food.baseUnit === 'string' && food.baseUnit.trim() ? food.baseUnit : 'g'
          };
        }) : []
      })),
      days: baseDays.map((baseDay) => {
        const existingDay = days.find((day) => day.id === baseDay.id);

        if (!existingDay) {
          return baseDay;
        }

        return {
          id: existingDay.id,
          label: !existingDay.label || /^Dia \d+$/i.test(existingDay.label) ? baseDay.label : existingDay.label,
          mealIds: Array.isArray(existingDay.mealIds) ? existingDay.mealIds : [],
          completedMealIds: Array.isArray(existingDay.completedMealIds) ? existingDay.completedMealIds : []
        };
      })
    };
  }

  const meals: Meal[] = [];
  const days = Array.isArray(diet.days) ? diet.days : [];

  const normalizedDays: DietDay[] = baseDays.map((baseDay) => {
    const legacyDay = days.find((day) => day.id === baseDay.id) as LegacyDietDay | undefined;

    if (!legacyDay) {
      return baseDay;
    }

    const dayMeals = Array.isArray(legacyDay.meals) ? legacyDay.meals : [];
    const mealIds = dayMeals.map((meal) => {
      meals.push({
        id: meal.id,
        name: meal.name,
        foods: Array.isArray(meal.foods) ? meal.foods.map((food) => {
          const legacyFood = food as LegacyFoodItem;

          return {
          ...food,
          quantity: typeof legacyFood.quantity === 'number' ? legacyFood.quantity : typeof legacyFood.quantityGrams === 'number' ? legacyFood.quantityGrams : 0,
          unit: typeof food.unit === 'string' && food.unit.trim() ? food.unit : 'g',
          baseQuantity: typeof legacyFood.baseQuantity === 'number' ? legacyFood.baseQuantity : typeof legacyFood.baseQuantityGrams === 'number' ? legacyFood.baseQuantityGrams : 100,
          baseUnit: typeof food.baseUnit === 'string' && food.baseUnit.trim() ? food.baseUnit : 'g'
          };
        }) : []
      });

      return meal.id;
    });

    return {
      id: legacyDay.id,
      label: !legacyDay.label || /^Dia \d+$/i.test(legacyDay.label) ? baseDay.label : legacyDay.label,
      mealIds,
      completedMealIds: dayMeals.filter((meal) => Boolean(meal.done)).map((meal) => meal.id)
    };
  });

  return {
    id: diet.id ?? 'diet-empty',
    meals,
    days: normalizedDays
  };
}

export function normalizeWaterData(water?: WaterData): WaterData {
  const fallback = water ?? defaultAppState.water;
  const today = getTodayDateString();

  if (fallback.updatedAt === today) {
    return fallback;
  }

  return {
    ...fallback,
    consumedMl: 0,
    updatedAt: today
  };
}
