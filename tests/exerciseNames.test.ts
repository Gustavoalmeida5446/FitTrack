import test from 'node:test';
import assert from 'node:assert/strict';
import exercisesData from '../exercises.json';
import { getCatalogExercisePtName, getExerciseDisplayName } from '../src/lib/exerciseNames';

interface ExerciseRecord {
  id: string;
  name: string;
}

test('resolve tradução pelo sourceId para exercícios antigos sem ptName salvo', () => {
  assert.equal(getExerciseDisplayName('Barbell_Curl', 'Barbell Curl'), 'Rosca direta com barra');
});

test('prioriza ptName salvo para preservar ajustes existentes do usuário', () => {
  assert.equal(
    getExerciseDisplayName('Barbell_Curl', 'Barbell Curl', 'Rosca favorita'),
    'Rosca favorita'
  );
});

test('mantém fallback quando sourceId não existe no catálogo', () => {
  assert.equal(getExerciseDisplayName('custom-id', 'Custom Exercise'), 'Custom Exercise');
});

test('catálogo tem tradução para exercício conhecido', () => {
  assert.equal(getCatalogExercisePtName('Barbell_Curl'), 'Rosca direta com barra');
});

test('todos os exercícios do catálogo principal têm tradução em português', () => {
  const missingTranslations = (exercisesData as ExerciseRecord[])
    .filter((exercise) => !getCatalogExercisePtName(exercise.id))
    .map((exercise) => `${exercise.id} (${exercise.name})`);

  assert.deepEqual(missingTranslations, []);
});
