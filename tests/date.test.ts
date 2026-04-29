import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAgeFromBirthDate,
  formatBirthDateForDatePicker,
  getDietDayIdForDate,
  normalizeBirthDateDisplay,
  normalizeBirthDateForStorage,
  parseBirthDateForDatePicker
} from '../src/lib/date';

test('calculateAgeFromBirthDate considera aniversário ainda não ocorrido no ano', () => {
  const age = calculateAgeFromBirthDate('2000-10-10', new Date('2026-04-28T12:00:00Z'));

  assert.equal(age, 25);
});

test('calculateAgeFromBirthDate aceita data em formato dd-mm-aaaa', () => {
  const age = calculateAgeFromBirthDate('10-04-2000', new Date('2026-04-28T12:00:00Z'));

  assert.equal(age, 26);
});

test('normalizeBirthDateDisplay normaliza para dd-mm-aaaa', () => {
  assert.equal(normalizeBirthDateDisplay('2000-04-05'), '05-04-2000');
});

test('normalizeBirthDateForStorage normaliza para aaaa-mm-dd', () => {
  assert.equal(normalizeBirthDateForStorage('05-04-2000'), '2000-04-05');
  assert.equal(normalizeBirthDateForStorage('2000-04-05'), '2000-04-05');
});

test('formatBirthDateForDatePicker retorna valor visual compatível com o seletor', () => {
  assert.equal(formatBirthDateForDatePicker('2000-04-05'), '05-04-2000');
});

test('parseBirthDateForDatePicker aceita formatos salvo e exibido', () => {
  assert.deepEqual(parseBirthDateForDatePicker('2000-04-05'), new Date(2000, 3, 5));
  assert.deepEqual(parseBirthDateForDatePicker('05-04-2000'), new Date(2000, 3, 5));
});

test('getDietDayIdForDate usa base de segunda a domingo', () => {
  assert.equal(getDietDayIdForDate(new Date('2026-04-27T12:00:00Z')), 'd-1');
  assert.equal(getDietDayIdForDate(new Date('2026-05-03T12:00:00Z')), 'd-7');
});
