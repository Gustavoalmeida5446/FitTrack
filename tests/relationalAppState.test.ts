import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultAppState } from '../src/lib/appState';
import {
  convertAppStateToRelationalRecords,
  convertRelationalRecordsToAppState,
  createWorkoutExerciseSetRecords
} from '../src/lib/relationalAppState';
import type { AppState } from '../src/lib/appState';

function createLegacyState(): AppState {
  return {
    ...defaultAppState,
    profile: {
      ...defaultAppState.profile,
      currentWeight: 82,
      heightCm: 180,
      birthDate: '1990-01-02',
      age: 36
    },
    water: {
      goalMl: 3000,
      consumedMl: 1250,
      updatedAt: '2026-05-01'
    },
    weightHistory: [
      { date: '01/05/2026', weight: 82 }
    ],
    workouts: [
      {
        id: 'w-1',
        name: 'Treino A',
        muscleGroups: ['Pernas'],
        exercises: [
          {
            id: 'e-1',
            source: 'local',
            sourceId: 'Thigh_Abductor',
            name: 'Thigh Abductor',
            ptName: 'Abdução de quadril na máquina',
            muscleGroup: 'Pernas',
            mediaType: 'image',
            mediaUrl: 'https://example.com/0.jpg',
            mediaUrls: ['https://example.com/0.jpg', 'https://example.com/1.jpg'],
            loadKg: 35,
            reps: 12,
            sets: 3,
            restSeconds: 60,
            done: true
          }
        ]
      }
    ],
    weeklyDiet: {
      id: 'diet-1',
      progressUpdatedAt: '2026-05-01',
      meals: [
        {
          id: 'm-1',
          name: 'Cafe',
          foods: [
            {
              id: 'f-1',
              foodId: 10,
              name: 'Ovo',
              calories: 100,
              protein: 10,
              carbs: 1,
              fat: 7,
              fiber: 0,
              quantity: 2,
              unit: 'un',
              baseQuantity: 1,
              baseUnit: 'un'
            }
          ]
        }
      ],
      days: [
        {
          id: 'd-1',
          label: 'Segunda',
          mealIds: ['m-1'],
          completedMealIds: ['m-1']
        }
      ]
    }
  };
}

test('createWorkoutExerciseSetRecords expande sets legados em series relacionais', () => {
  const sets = createWorkoutExerciseSetRecords('u-1', 'w-1', 'e-1', 3, 35, 12, true);

  assert.equal(sets.length, 3);
  assert.deepEqual(sets.map((item) => item.position), [0, 1, 2]);
  assert.deepEqual(sets.map((item) => item.loadKg), [35, 35, 35]);
  assert.deepEqual(sets.map((item) => item.reps), [12, 12, 12]);
  assert.deepEqual(sets.map((item) => item.done), [true, true, true]);
});

test('convertAppStateToRelationalRecords preserva dados principais do JSON legado', () => {
  const records = convertAppStateToRelationalRecords('u-1', createLegacyState());

  assert.equal(records.profile.currentWeight, 82);
  assert.equal(records.water.consumedMl, 1250);
  assert.equal(records.weightHistory.length, 1);
  assert.equal(records.workouts.length, 1);
  assert.equal(records.workouts[0]?.legacyId, 'w-1');
  assert.equal(records.workoutExercises.length, 1);
  assert.equal(records.workoutExercises[0]?.legacyId, 'e-1');
  assert.equal(records.workoutExercises[0]?.sourceId, 'Thigh_Abductor');
  assert.equal(records.workoutExerciseSets.length, 3);
  assert.equal(records.dietMeals.length, 1);
  assert.equal(records.dietFoods.length, 1);
  assert.equal(records.dietDays.length, 1);
  assert.equal(records.dietDayMeals.length, 1);
  assert.equal(records.dietCompletedMeals.length, 1);
});

test('convertAppStateToRelationalRecords gera ids estaveis para conversao idempotente', () => {
  const state = createLegacyState();
  const firstRun = convertAppStateToRelationalRecords('u-1', state);
  const secondRun = convertAppStateToRelationalRecords('u-1', state);

  assert.deepEqual(firstRun, secondRun);
  assert.equal(new Set(firstRun.workouts.map((item) => item.id)).size, firstRun.workouts.length);
  assert.equal(new Set(firstRun.workoutExercises.map((item) => item.id)).size, firstRun.workoutExercises.length);
  assert.equal(new Set(firstRun.workoutExerciseSets.map((item) => item.id)).size, firstRun.workoutExerciseSets.length);
});

test('convertRelationalRecordsToAppState reconstrói o estado usado pela UI', () => {
  const legacyState = createLegacyState();
  const records = convertAppStateToRelationalRecords('u-1', legacyState);
  const restoredState = convertRelationalRecordsToAppState(records, '2026-05-01');

  assert.deepEqual(restoredState.profile, legacyState.profile);
  assert.deepEqual(restoredState.water, legacyState.water);
  assert.deepEqual(restoredState.weightHistory, legacyState.weightHistory);
  assert.deepEqual(restoredState.workouts, legacyState.workouts);
  assert.deepEqual(restoredState.weeklyDiet, legacyState.weeklyDiet);
  assert.equal(restoredState.workoutsUpdatedAt, '2026-05-01');
});
