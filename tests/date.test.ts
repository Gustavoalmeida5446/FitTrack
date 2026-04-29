import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAgeFromBirthDate, getDietDayIdForDate, normalizeBirthDateDisplay } from '../src/lib/date';

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

test('getDietDayIdForDate usa base de segunda a domingo', () => {
  assert.equal(getDietDayIdForDate(new Date('2026-04-27T12:00:00Z')), 'd-1');
  assert.equal(getDietDayIdForDate(new Date('2026-05-03T12:00:00Z')), 'd-7');
});
