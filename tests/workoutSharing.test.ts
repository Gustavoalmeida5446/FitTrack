import test from 'node:test';
import assert from 'node:assert/strict';
import type { Workout } from '../src/data/types';
import {
  createWorkoutExportText,
  getWorkoutExportFileName,
  parseImportedWorkoutFile
} from '../src/lib/workoutSharing';

function createWorkout(): Workout {
  return {
    id: 'w-1',
    name: 'Treino A/B',
    muscleGroups: ['Peito'],
    archivedAt: '2026-05-20T12:00:00.000Z',
    exercises: [
      {
        id: 'e-1',
        source: 'local',
        sourceId: 'push-up',
        name: 'Push-up',
        ptName: 'Flexão',
        muscleGroup: 'Peito',
        mediaType: 'none',
        mediaUrl: null,
        mediaUrls: [],
        loadKg: 0,
        reps: 12,
        sets: 2,
        setsDetail: [
          { id: 'e-1-set-1', loadKg: 0, reps: 12, done: true },
          { id: 'e-1-set-2', loadKg: 0, reps: 10, done: false }
        ],
        restSeconds: 60,
        done: true
      }
    ]
  };
}

test('getWorkoutExportFileName gera nome simples para download', () => {
  assert.equal(getWorkoutExportFileName(createWorkout()), 'treino-a-b-fittrack.json');
});

test('exportacao e importacao recriam treino ativo com novo id', () => {
  const workout = createWorkout();
  const result = parseImportedWorkoutFile(createWorkoutExportText(workout));

  assert.equal(result.success, true);
  assert.ok(result.workout);
  assert.notEqual(result.workout?.id, workout.id);
  assert.equal(result.workout?.name, 'Treino A/B (importado)');
  assert.equal(result.workout?.archivedAt, null);
  assert.equal(result.workout?.exercises[0]?.done, false);
  assert.equal(result.workout?.exercises[0]?.setsDetail?.[0]?.done, false);
});

test('importacao rejeita JSON que nao e treino do FitTrack', () => {
  const result = parseImportedWorkoutFile(JSON.stringify({ type: 'outro-arquivo' }));

  assert.equal(result.success, false);
});
