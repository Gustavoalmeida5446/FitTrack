import { ActivityLevel, DietDay, GoalType, Meal, NutritionTargets, Sex, UserProfile } from '../data/types';

const activityMultipliers: Record<ActivityLevel, number> = {
  Sedentario: 1.2,
  Leve: 1.375,
  Moderado: 1.55,
  Intenso: 1.725,
  Atleta: 1.9
};

const goalAdjustments: Record<GoalType, number> = {
  'Perda de gordura': -350,
  'Manutenção': 0,
  'Ganho de massa': 250
};

function getBmr(weightKg: number, heightCm: number, age: number, sex: Sex): number {
  const sexAdjustment = sex === 'Masculino' ? 5 : -161;
  return 10 * weightKg + 6.25 * heightCm - 5 * age + sexAdjustment;
}

export function calculateNutritionTargets(profile: UserProfile): NutritionTargets {
  if (profile.currentWeight <= 0 || profile.heightCm <= 0 || profile.age <= 0) {
    return {
      caloriesDaily: 0,
      proteinDaily: 0,
      carbsDaily: 0,
      fatDaily: 0,
      waterDailyMl: 0
    };
  }

  const bmr = getBmr(profile.currentWeight, profile.heightCm, profile.age, profile.sex);
  const maintenanceCalories = bmr * activityMultipliers[profile.activityLevel];
  const caloriesDaily = Math.max(1200, Math.round(maintenanceCalories + goalAdjustments[profile.goal]));
  const proteinDaily = Math.round(profile.currentWeight * (profile.goal === 'Ganho de massa' ? 2.1 : 1.9));
  const fatDaily = Math.round(profile.currentWeight * 0.9);
  const remainingCalories = caloriesDaily - proteinDaily * 4 - fatDaily * 9;
  const carbsDaily = Math.max(80, Math.round(remainingCalories / 4));
  const waterDailyMl = Math.round(profile.currentWeight * 35);

  return {
    caloriesDaily,
    proteinDaily,
    carbsDaily,
    fatDaily,
    waterDailyMl
  };
}

export interface DietProgressTotals {
  plannedCalories: number;
  plannedProtein: number;
  consumedCalories: number;
  consumedProtein: number;
}

export function calculateDietProgress(meals: Meal[], completedMealIds: string[]): DietProgressTotals {
  return meals.reduce<DietProgressTotals>((totals, meal) => {
    const mealCalories = meal.foods.reduce((sum, food) => sum + food.calories, 0);
    const mealProtein = meal.foods.reduce((sum, food) => sum + food.protein, 0);
    const isCompleted = completedMealIds.includes(meal.id);

    return {
      plannedCalories: totals.plannedCalories + mealCalories,
      plannedProtein: totals.plannedProtein + mealProtein,
      consumedCalories: totals.consumedCalories + (isCompleted ? mealCalories : 0),
      consumedProtein: totals.consumedProtein + (isCompleted ? mealProtein : 0)
    };
  }, {
    plannedCalories: 0,
    plannedProtein: 0,
    consumedCalories: 0,
    consumedProtein: 0
  });
}

export function getDietStatusText(current: number, target: number, unit: string): string {
  if (target <= 0) {
    return 'Preencha as metas no perfil.';
  }

  const difference = Math.round((target - current) * 10) / 10;

  if (Math.abs(difference) < 1) {
    return `Na meta de ${unit}.`;
  }

  if (difference > 0) {
    return `Faltam ${difference}${unit}.`;
  }

  return `${Math.abs(difference)}${unit} acima da meta.`;
}

export function getMealsForDietDay(day: DietDay | undefined, meals: Meal[]): Meal[] {
  if (!day) {
    return [];
  }

  return meals.filter((meal) => day.mealIds.includes(meal.id));
}
