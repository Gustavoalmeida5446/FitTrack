import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultAppState, sanitizeAppStateForSave } from '../src/lib/appState';
import {
  getLoginFormErrors,
  isProfileReady,
  isValidDayMealSelection,
  isValidFoodItem,
  isValidMeal,
  isValidWorkout,
  isValidWorkoutExercise,
  isValidWorkoutExerciseForSave,
  isValidWorkoutForSave,
  getSignupFormErrors,
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

test('isProfileReady só aceita perfil completo para metas', () => {
  assert.equal(isProfileReady(defaultAppState.profile), false);
  assert.equal(isProfileReady({
    ...defaultAppState.profile,
    currentWeight: 80,
    heightCm: 180,
    birthDate: '2000-04-05',
    age: 26
  }), true);
});

test('isValidWorkoutExerciseForSave exige sourceId', () => {
  assert.equal(isValidWorkoutExerciseForSave({
    id: 'e-1',
    source: 'local',
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
  }), false);
});

test('isValidWorkoutForSave exige pelo menos um exercício válido', () => {
  assert.equal(isValidWorkoutForSave({
    id: 'w-1',
    name: 'Treino A',
    muscleGroups: ['Peito'],
    exercises: []
  }), false);
});

test('isValidDayMealSelection exige ids válidos e pelo menos uma refeição', () => {
  const meals = [{ id: 'm-1', name: 'Cafe', foods: [{ id: 'f-1', name: 'Ovo', calories: 1, protein: 1, carbs: 1, fat: 1, fiber: 1, quantity: 1, unit: 'un', baseQuantity: 1, baseUnit: 'un' }] }];

  assert.equal(isValidDayMealSelection([], meals), false);
  assert.equal(isValidDayMealSelection(['m-2'], meals), false);
  assert.equal(isValidDayMealSelection(['m-1'], meals), true);
});

test('getLoginFormErrors valida e-mail e senha no login', () => {
  assert.deepEqual(getLoginFormErrors('', ''), {
    email: 'Informe seu e-mail.',
    password: 'Informe sua senha.',
    confirmPassword: ''
  });

  assert.deepEqual(getLoginFormErrors('usuario-invalido', '123456'), {
    email: 'Digite um e-mail válido.',
    password: '',
    confirmPassword: ''
  });
});

test('getSignupFormErrors valida senha mínima e confirmação', () => {
  assert.deepEqual(getSignupFormErrors('teste@email.com', '123', '321'), {
    email: '',
    password: 'Use pelo menos 6 caracteres na senha.',
    confirmPassword: 'As senhas não coincidem.',
  });

  assert.deepEqual(getSignupFormErrors('teste@email.com', '123456', '123456'), {
    email: '',
    password: '',
    confirmPassword: ''
  });
});

test('validateAppState rejeita histórico de peso com data fora do padrão dd/mm/aaaa', () => {
  assert.equal(validateAppState({
    ...defaultAppState,
    weightHistory: [
      { date: '29/04/2026', weight: 80 },
      { date: '2026-04-29', weight: 81 }
    ]
  }), null);
});

test('sanitizeAppStateForSave não apaga a dieta inteira por uma refeição inválida', () => {
  const sanitized = sanitizeAppStateForSave({
    ...defaultAppState,
    weeklyDiet: {
      id: 'diet-1',
      meals: [
        {
          id: 'm-1',
          name: 'Cafe',
          foods: [{ id: 'f-1', name: 'Ovo', calories: 100, protein: 10, carbs: 1, fat: 7, fiber: 0, quantity: 2, unit: 'un', baseQuantity: 2, baseUnit: 'un' }]
        },
        {
          id: 'm-2',
          name: '',
          foods: []
        } as never
      ],
      days: [
        {
          id: 'd-1',
          label: 'Segunda',
          mealIds: ['m-1', 'm-2'],
          completedMealIds: ['m-1', 'm-2']
        },
        ...defaultAppState.weeklyDiet.days.slice(1)
      ]
    }
  });

  assert.equal(sanitized.weeklyDiet.meals.length, 1);
  assert.equal(sanitized.weeklyDiet.meals[0]?.id, 'm-1');
  assert.deepEqual(sanitized.weeklyDiet.days[0]?.mealIds, ['m-1']);
  assert.deepEqual(sanitized.weeklyDiet.days[0]?.completedMealIds, ['m-1']);
});
