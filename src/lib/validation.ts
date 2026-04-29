import { z } from 'zod';
import type { AppState } from './appState';
import type { DietDay, FoodItem, WeeklyDiet, Workout, WorkoutExercise, UserProfile, WaterData, WeightLog, Meal } from '../data/types';

const muscleGroupSchema = z.enum(['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Core']);
const sexSchema = z.enum(['Masculino', 'Feminino']);
const activityLevelSchema = z.enum(['Sedentario', 'Leve', 'Moderado', 'Intenso', 'Atleta']);
const goalSchema = z.enum(['Perda de gordura', 'Manutenção', 'Ganho de massa']);
const dietTypeSchema = z.enum(['Equilibrada', 'Baixo carboidrato', 'Alta em carboidrato']);
const mediaTypeSchema = z.enum(['image', 'video', 'gif', 'none']);
const nonEmptyStringSchema = z.string().trim().min(1);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const birthDateSchema = z.union([z.literal(''), dateSchema]);

export const userProfileSchema = z.object({
  currentWeight: z.number().nonnegative(),
  heightCm: z.number().nonnegative(),
  birthDate: birthDateSchema,
  age: z.number().int().nonnegative(),
  sex: sexSchema,
  activityLevel: activityLevelSchema,
  goal: goalSchema,
  dietType: dietTypeSchema
});

const profileReadySchema = userProfileSchema.extend({
  currentWeight: z.number().positive(),
  heightCm: z.number().positive(),
  birthDate: dateSchema
});

export const workoutExerciseSchema = z.object({
  id: nonEmptyStringSchema,
  source: z.literal('local'),
  sourceId: nonEmptyStringSchema.optional(),
  name: nonEmptyStringSchema,
  ptName: nonEmptyStringSchema.optional(),
  muscleGroup: muscleGroupSchema,
  mediaType: mediaTypeSchema,
  mediaUrl: z.string().trim().min(1).nullable(),
  mediaUrls: z.array(nonEmptyStringSchema).max(2).optional(),
  loadKg: z.number().nonnegative(),
  reps: z.number().positive(),
  sets: z.number().positive(),
  restSeconds: z.number().nonnegative(),
  done: z.boolean()
});

export const workoutSchema = z.object({
  id: nonEmptyStringSchema,
  name: nonEmptyStringSchema,
  muscleGroups: z.array(muscleGroupSchema),
  exercises: z.array(workoutExerciseSchema)
});

const workoutExerciseForSaveSchema = workoutExerciseSchema.extend({
  sourceId: nonEmptyStringSchema
});

const workoutForSaveSchema = workoutSchema.extend({
  exercises: z.array(workoutExerciseForSaveSchema).min(1)
});

export const waterDataSchema = z.object({
  goalMl: z.number().nonnegative(),
  consumedMl: z.number().nonnegative(),
  updatedAt: dateSchema
});

export const foodItemSchema = z.object({
  id: nonEmptyStringSchema,
  foodId: z.number().int().optional(),
  name: nonEmptyStringSchema,
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  fiber: z.number().nonnegative(),
  quantity: z.number().positive(),
  unit: nonEmptyStringSchema,
  baseQuantity: z.number().positive(),
  baseUnit: nonEmptyStringSchema
});

export const mealSchema = z.object({
  id: nonEmptyStringSchema,
  name: nonEmptyStringSchema,
  foods: z.array(foodItemSchema).min(1)
});

export const dietDaySchema = z.object({
  id: nonEmptyStringSchema,
  label: nonEmptyStringSchema,
  mealIds: z.array(nonEmptyStringSchema),
  completedMealIds: z.array(nonEmptyStringSchema)
});

export const weeklyDietSchema = z.object({
  id: nonEmptyStringSchema,
  meals: z.array(mealSchema),
  days: z.array(dietDaySchema).min(1)
});

export const weightLogSchema = z.object({
  date: z.string().min(1),
  weight: z.number().positive()
});

export const appStateSchema = z.object({
  profile: userProfileSchema,
  workouts: z.array(workoutSchema),
  workoutsUpdatedAt: dateSchema,
  water: waterDataSchema,
  weeklyDiet: weeklyDietSchema,
  weightHistory: z.array(weightLogSchema)
});

function filterValidItems<Value>(items: unknown, schema: z.ZodType<Value>): Value[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.reduce<Value[]>((result, item) => {
    const parsed = schema.safeParse(item);

    if (parsed.success) {
      result.push(parsed.data);
    }

    return result;
  }, []);
}

export function validateProfile(profile: UserProfile, fallback: UserProfile): UserProfile {
  const parsed = userProfileSchema.safeParse(profile);
  return parsed.success ? parsed.data as UserProfile : fallback;
}

export function validateWaterData(water: WaterData, fallback: WaterData): WaterData {
  const parsed = waterDataSchema.safeParse(water);
  return parsed.success ? parsed.data as WaterData : fallback;
}

export function validateWeeklyDiet(diet: WeeklyDiet, fallback: WeeklyDiet): WeeklyDiet {
  const mealList = filterValidItems(diet.meals, mealSchema) as Meal[];
  const validMealIds = new Set(mealList.map((meal) => meal.id));
  const nextDays = fallback.days.map((fallbackDay, index) => {
    const rawDay = Array.isArray(diet.days) ? diet.days[index] : undefined;
    const parsedDay = dietDaySchema.safeParse(rawDay);
    const nextDay: DietDay = parsedDay.success ? parsedDay.data as DietDay : fallbackDay;
    const mealIds = nextDay.mealIds.filter((mealId) => validMealIds.has(mealId));

    return {
      ...nextDay,
      mealIds,
      completedMealIds: nextDay.completedMealIds.filter((mealId) => mealIds.includes(mealId))
    };
  });

  return {
    id: nonEmptyStringSchema.safeParse(diet.id).success ? String(diet.id).trim() : fallback.id,
    meals: mealList,
    days: nextDays
  };
}

export function validateWeightHistory(history: unknown): WeightLog[] {
  return filterValidItems(history, weightLogSchema) as WeightLog[];
}

export function validateWorkouts(workouts: unknown): Workout[] {
  return filterValidItems(workouts, workoutSchema) as Workout[];
}

export function validateAppState(state: AppState): AppState | null {
  const parsed = appStateSchema.safeParse(state);
  return parsed.success ? parsed.data as AppState : null;
}

export function isValidWorkoutExercise(exercise: WorkoutExercise): boolean {
  return workoutExerciseSchema.safeParse(exercise).success;
}

export function isValidWorkout(workout: Workout): boolean {
  return workoutSchema.safeParse(workout).success;
}

export function isProfileReady(profile: UserProfile): boolean {
  return profileReadySchema.safeParse(profile).success;
}

export function isValidWorkoutExerciseForSave(exercise: WorkoutExercise): boolean {
  return workoutExerciseForSaveSchema.safeParse(exercise).success;
}

export function isValidWorkoutForSave(workout: Workout): boolean {
  return workoutForSaveSchema.safeParse(workout).success;
}

export function isValidFoodItem(food: FoodItem): boolean {
  return foodItemSchema.safeParse(food).success;
}

export function isValidMeal(meal: Meal): boolean {
  return mealSchema.safeParse(meal).success;
}

export function isValidDayMealSelection(mealIds: string[], meals: Meal[]): boolean {
  if (mealIds.length === 0) {
    return false;
  }

  const validMealIds = new Set(meals.map((meal) => meal.id));
  return mealIds.every((mealId) => validMealIds.has(mealId));
}
