export type MuscleGroup = 'Peito' | 'Costas' | 'Pernas' | 'Ombros' | 'Braços' | 'Core';
export type Sex = 'Masculino' | 'Feminino';
export type ActivityLevel = 'Sedentario' | 'Leve' | 'Moderado' | 'Intenso' | 'Atleta';
export type GoalType = 'Perda de gordura' | 'Manutenção' | 'Ganho de massa';
export type ExerciseMediaType = 'image' | 'video' | 'gif' | 'none';

export interface WorkoutExercise {
  id: string;
  source: 'manual' | 'local';
  sourceId?: string;
  name: string;
  muscleGroup: MuscleGroup;
  mediaType: ExerciseMediaType;
  mediaUrl: string | null;
  loadKg: number;
  reps: number;
  sets: number;
  restSeconds: number;
  done: boolean;
}

export interface Workout {
  id: string;
  name: string;
  muscleGroups: MuscleGroup[];
  exercises: WorkoutExercise[];
}

export interface WaterData {
  goalMl: number;
  consumedMl: number;
  updatedAt: string;
}

export interface FoodItem {
  id: string;
  foodId?: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  quantityGrams: number;
  baseQuantityGrams: number;
}

export interface Meal {
  id: string;
  name: string;
  foods: FoodItem[];
}

export interface DietDay {
  id: string;
  label: string;
  mealIds: string[];
  completedMealIds: string[];
}

export interface WeeklyDiet {
  id: string;
  meals: Meal[];
  days: DietDay[];
}

export interface UserProfile {
  currentWeight: number;
  heightCm: number;
  age: number;
  sex: Sex;
  activityLevel: ActivityLevel;
  goal: GoalType;
}

export interface WeightLog {
  date: string;
  weight: number;
}

export interface NutritionTargets {
  caloriesDaily: number;
  proteinDaily: number;
  carbsDaily: number;
  fatDaily: number;
  waterDailyMl: number;
}
