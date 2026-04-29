import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultAppState } from '../src/lib/appState';
import {
  isValidFoodItem,
  isValidMeal,
  isValidWorkout,
  isValidWorkoutExercise,
  validateAppState
} from '../src/lib/validation';

test('isValidWorkoutExercise aceita exercício simples válido', () => {
  assert.equal(isValidWorkoutExercise({
    id: 'e-1',
    source: 'local',
    sourceId: 'push-up',
    name: 'Flexão',
    ptName: 'Flexão',
    muscleGroup: 'Peito',
    mediaType: 'none',
    mediaUrl: null,
    loadKg: 0,
    reps: 12,
    sets: 4,
    restSeconds: 60,
    done: false
  }), true);
});

test('isValidWorkout rejeita treino sem nome', () => {
  assert.equal(isValidWorkout({
    id: 'w-1',
    name: '   ',
    muscleGroups: ['Peito'],
    exercises: []
  }), false);
});

test('isValidFoodItem rejeita quantidade zerada', () => {
  assert.equal(isValidFoodItem({
    id: 'f-1',
    name: 'Arroz',
    calories: 120,
    protein: 2,
    carbs: 24,
    fat: 1,
    fiber: 1,
    quantity: 0,
    unit: 'g',
    baseQuantity: 100,
    baseUnit: 'g'
  }), false);
});

test('isValidMeal aceita refeição com alimento válido', () => {
  assert.equal(isValidMeal({
    id: 'm-1',
    name: 'Café',
    foods: [{
      id: 'f-1',
      name: 'Ovo',
      calories: 100,
      protein: 10,
      carbs: 1,
      fat: 7,
      fiber: 0,
      quantity: 2,
      unit: 'un',
      baseQuantity: 2,
      baseUnit: 'un'
    }]
  }), true);
});

test('validateAppState aceita o estado padrão do app', () => {
  assert.deepEqual(validateAppState(defaultAppState), defaultAppState);
});
