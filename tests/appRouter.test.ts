import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAppRoutePath, parseAppRoute } from '../src/lib/appRouter';

test('parseAppRoute reconhece rotas principais com base de deploy', () => {
  assert.deepEqual(parseAppRoute('/FitTrack/', '/FitTrack/'), {
    view: 'home',
    selectedWorkoutId: '',
    selectedDayId: ''
  });

  assert.deepEqual(parseAppRoute('/FitTrack/treinos', '/FitTrack/'), {
    view: 'workout-setup',
    selectedWorkoutId: '',
    selectedDayId: ''
  });

  assert.deepEqual(parseAppRoute('/FitTrack/dieta', '/FitTrack/'), {
    view: 'diet-setup',
    selectedWorkoutId: '',
    selectedDayId: ''
  });

  assert.deepEqual(parseAppRoute('/FitTrack/perfil', '/FitTrack/'), {
    view: 'goals',
    selectedWorkoutId: '',
    selectedDayId: ''
  });
});

test('parseAppRoute reconhece rotas de detalhe', () => {
  assert.deepEqual(parseAppRoute('/FitTrack/treinos/w-1', '/FitTrack/'), {
    view: 'workout',
    selectedWorkoutId: 'w-1',
    selectedDayId: ''
  });

  assert.deepEqual(parseAppRoute('/FitTrack/dieta/d-2', '/FitTrack/'), {
    view: 'diet-day',
    selectedWorkoutId: '',
    selectedDayId: 'd-2'
  });
});

test('buildAppRoutePath monta rotas sob a base do app', () => {
  assert.equal(buildAppRoutePath({ view: 'home', selectedWorkoutId: '', selectedDayId: '' }, '/FitTrack/'), '/FitTrack/');
  assert.equal(buildAppRoutePath({ view: 'workout-setup', selectedWorkoutId: '', selectedDayId: '' }, '/FitTrack/'), '/FitTrack/treinos');
  assert.equal(buildAppRoutePath({ view: 'diet-setup', selectedWorkoutId: '', selectedDayId: '' }, '/FitTrack/'), '/FitTrack/dieta');
  assert.equal(buildAppRoutePath({ view: 'goals', selectedWorkoutId: '', selectedDayId: '' }, '/FitTrack/'), '/FitTrack/perfil');
  assert.equal(buildAppRoutePath({ view: 'workout', selectedWorkoutId: 'w 1', selectedDayId: '' }, '/FitTrack/'), '/FitTrack/treinos/w%201');
  assert.equal(buildAppRoutePath({ view: 'diet-day', selectedWorkoutId: '', selectedDayId: 'd 2' }, '/FitTrack/'), '/FitTrack/dieta/d%202');
});

test('parseAppRoute usa inicio como fallback para rota desconhecida', () => {
  assert.deepEqual(parseAppRoute('/FitTrack/nao-existe', '/FitTrack/'), {
    view: 'home',
    selectedWorkoutId: '',
    selectedDayId: ''
  });
});
