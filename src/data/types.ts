export type MuscleGroup = 'Peito' | 'Costas' | 'Pernas' | 'Ombros' | 'Braços' | 'Core';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  mediaType: 'image' | 'video' | 'gif';
  mediaUrl: string;
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
  exercises: Exercise[];
}

export interface WaterData {
  goalMl: number;
  consumedMl: number;
}

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
}

export interface Meal {
  id: string;
  name: string;
  foods: FoodItem[];
  done: boolean;
}

export interface DietDay {
  id: string;
  label: string;
  meals: Meal[];
}

export interface WeeklyDiet {
  id: string;
  days: DietDay[];
}

export interface UserProfile {
  currentWeight: number;
  heightCm: number;
  age: number;
  sex: 'Masculino' | 'Feminino';
  activityLevel: string;
  goal: string;
}

export interface WeightLog {
  date: string;
  weight: number;
}

export interface NutritionTargets {
  caloriesDaily: number;
  proteinDaily: number;
  waterDailyMl: number;
}
