import test from 'node:test';
import assert from 'node:assert/strict';
import { getExerciseSearchScore, type ExerciseSearchDocument } from '../src/lib/exerciseSearch';

const tricepsExtension: ExerciseSearchDocument = {
  fields: [
    { value: 'Tríceps unilateral com halter', weight: 5 },
    { value: 'Dumbbell One-Arm Triceps Extension', weight: 4 },
    { value: 'one-arm dumbbell overhead triceps extension', weight: 4 },
    { value: 'tríceps francês', weight: 4 },
    { value: 'triceps', weight: 3 },
    { value: 'dumbbell', weight: 3 }
  ]
};

const dumbbellSquat: ExerciseSearchDocument = {
  fields: [
    { value: 'Agachamento com halteres', weight: 5 },
    { value: 'Dumbbell Squat', weight: 4 },
    { value: 'agachamento halter', weight: 4 },
    { value: 'quadriceps', weight: 3 },
    { value: 'dumbbell', weight: 3 }
  ]
};

const abdominalCrunch: ExerciseSearchDocument = {
  fields: [
    { value: 'Abdominal na máquina', weight: 5 },
    { value: 'Ab Crunch Machine', weight: 4 },
    { value: 'abdominals', weight: 3 },
    { value: 'machine', weight: 3 }
  ]
};

const dumbbellRow: ExerciseSearchDocument = {
  fields: [
    { value: 'Remada unilateral com halter', weight: 5 },
    { value: 'One-Arm Dumbbell Row', weight: 4 },
    { value: 'middle_back', weight: 3 },
    { value: 'dumbbell', weight: 3 }
  ]
};

test('busca longa de extensão de tríceps prioriza exercício relacionado', () => {
  const query = 'Seated One-Arm Dumbbell Overhead Triceps Extension';

  assert.ok(getExerciseSearchScore(query, tricepsExtension) > getExerciseSearchScore(query, dumbbellSquat));
  assert.equal(getExerciseSearchScore(query, abdominalCrunch), -1);
  assert.equal(getExerciseSearchScore(query, dumbbellRow), -1);
});

test('busca por triceps overhead extension evita exercícios sem relação', () => {
  const query = 'triceps overhead extension';

  assert.ok(getExerciseSearchScore(query, tricepsExtension) > 0);
  assert.equal(getExerciseSearchScore(query, dumbbellSquat), -1);
  assert.equal(getExerciseSearchScore(query, abdominalCrunch), -1);
});

test('busca em português encontra termos equivalentes em inglês', () => {
  assert.ok(getExerciseSearchScore('extensão tríceps halter', tricepsExtension) > 0);
  assert.ok(getExerciseSearchScore('tríceps francês', tricepsExtension) > 0);
});

test('busca de agachamento com halter funciona em português e inglês', () => {
  assert.ok(getExerciseSearchScore('agachamento halter', dumbbellSquat) > 0);
  assert.ok(getExerciseSearchScore('dumbbell squat', dumbbellSquat) > 0);
  assert.equal(getExerciseSearchScore('dumbbell squat', abdominalCrunch), -1);
});

test('termo sem relação fica abaixo do corte de relevância', () => {
  const query = 'movimento inexistente sem relacao';

  assert.equal(getExerciseSearchScore(query, tricepsExtension), -1);
  assert.equal(getExerciseSearchScore(query, dumbbellSquat), -1);
  assert.equal(getExerciseSearchScore(query, abdominalCrunch), -1);
});
