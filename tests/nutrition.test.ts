import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDietProgress, calculateNutritionTargets } from '../src/lib/nutrition';
import type { Meal, UserProfile } from '../src/data/types';

test('calculateNutritionTargets retorna metas coerentes para perfil válido', () => {
  const profile: UserProfile = {
    currentWeight: 80,
    heightCm: 180,
    birthDate: '1998-02-14',
    age: 28,
    sex: 'Masculino',
    activityLevel: 'Moderado',
    goal: 'Ganho de massa',
    dietType: 'Equilibrada'
  };

  const targets = calculateNutritionTargets(profile);

  assert.deepEqual(targets, {
    caloriesDaily: 3025,
    proteinDaily: 144,
    carbsDaily: 468,
    fatDaily: 64,
    waterDailyMl: 2800
  });
});

test('calculateNutritionTargets zera metas quando faltam dados base', () => {
  const profile: UserProfile = {
    currentWeight: 0,
    heightCm: 180,
    birthDate: '',
    age: 0,
    sex: 'Masculino',
    activityLevel: 'Moderado',
    goal: 'Manutenção',
    dietType: 'Equilibrada'
  };

  assert.deepEqual(calculateNutritionTargets(profile), {
    caloriesDaily: 0,
    proteinDaily: 0,
    carbsDaily: 0,
    fatDaily: 0,
    waterDailyMl: 0
  });
});

test('calculateDietProgress soma planejado e consumido só para refeições concluídas', () => {
  const meals: Meal[] = [
    {
      id: 'm-1',
      name: 'Café',
      foods: [
        { id: 'f-1', name: 'Ovo', calories: 100, protein: 10, carbs: 1, fat: 7, fiber: 0, quantity: 2, unit: 'un', baseQuantity: 2, baseUnit: 'un' }
      ]
    },
    {
      id: 'm-2',
      name: 'Almoço',
      foods: [
        { id: 'f-2', name: 'Arroz', calories: 200, protein: 4, carbs: 42, fat: 1, fiber: 1, quantity: 150, unit: 'g', baseQuantity: 100, baseUnit: 'g' }
      ]
    }
  ];

  const progress = calculateDietProgress(meals, ['m-2']);

  assert.deepEqual(progress, {
    plannedCalories: 300,
    plannedProtein: 14,
    consumedCalories: 200,
    consumedProtein: 4
  });
});
