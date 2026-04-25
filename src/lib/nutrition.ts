import { ActivityLevel, GoalType, NutritionTargets, Sex, UserProfile } from '../data/types';

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
