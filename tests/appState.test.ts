import test from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultAppState,
  normalizeWorkoutProgressState,
  normalizeWorkoutProgressForToday,
  sanitizeAppStateForSave,
  serializeWorkoutProgressState
} from '../src/lib/appState';
import type { AppState } from '../src/lib/appState';
import { getTodayDateString } from '../src/lib/date';

function createState(overrides: Partial<AppState> = {}): AppState {
  return {
    ...defaultAppState,
    ...overrides
  };
}

test('normalizeWorkoutProgressState mantém progresso quando updatedAt é hoje', () => {
  const today = getTodayDateString();
  const persisted = serializeWorkoutProgressState([
    {
      id: 'w-1',
      name: 'Upper',
      muscleGroups: ['Peito'],
      exercises: [
        {
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
          done: true
        }
      ]
    }
  ], today);

  const state = normalizeWorkoutProgressState(persisted);

  assert.equal(state.workoutsUpdatedAt, today);
  assert.equal(state.workouts[0]?.exercises[0]?.done, true);
});

test('normalizeWorkoutProgressForToday reseta exercícios concluídos quando o dia mudou', () => {
  const state = normalizeWorkoutProgressForToday([
    {
      id: 'w-1',
      name: 'Leg day',
      muscleGroups: ['Pernas'],
      exercises: [
        {
          id: 'e-1',
          source: 'local',
          sourceId: 'squat',
          name: 'Agachamento',
          ptName: 'Agachamento',
          muscleGroup: 'Pernas',
          mediaType: 'none',
          mediaUrl: null,
          loadKg: 40,
          reps: 10,
          sets: 4,
          restSeconds: 90,
          done: true
        }
      ]
    }
  ], '2000-01-01');

  assert.notEqual(state.workoutsUpdatedAt, '2000-01-01');
  assert.equal(state.workouts[0]?.exercises[0]?.done, false);
});

test('sanitizeAppStateForSave normaliza payload e remove weightHistory inválido', () => {
  const unsafeState = createState({
    profile: {
      ...defaultAppState.profile,
      birthDate: '05-04-2000',
      age: 26
    },
    workouts: [
      {
        id: 'w-1',
        name: 'Push',
        muscleGroups: ['Peito'],
        exercises: [
          {
            id: 'e-1',
            source: 'local',
            name: 'Supino',
            ptName: 'Supino',
            sourceId: 'bench-press',
            muscleGroup: 'Peito',
            mediaType: 'none',
            mediaUrl: null,
            loadKg: 70,
            reps: 8,
            sets: 4,
            restSeconds: 90,
            done: true
          }
        ]
      }
    ],
    workoutsUpdatedAt: '2001-01-01',
    water: {
      goalMl: 3000,
      consumedMl: 1800,
      updatedAt: '2001-01-01'
    },
    weeklyDiet: {
      id: 'diet-1',
      meals: [],
      days: []
    },
    weightHistory: [
      { date: '28/04/2026', weight: 80 },
      { date: '29/04/2026', weight: '81' as never },
      { date: 123 as never, weight: 82 }
    ]
  });

  const sanitized = sanitizeAppStateForSave(unsafeState);

  assert.equal(sanitized.workouts[0]?.exercises[0]?.done, false);
  assert.notEqual(sanitized.workoutsUpdatedAt, '2001-01-01');
  assert.equal(sanitized.profile.birthDate, '2000-04-05');
  assert.equal(sanitized.water.consumedMl, 0);
  assert.notEqual(sanitized.water.updatedAt, '2001-01-01');
  assert.equal(sanitized.weeklyDiet.days.length, 7);
  assert.deepEqual(sanitized.weightHistory, [{ date: '28/04/2026', weight: 80 }]);
});
