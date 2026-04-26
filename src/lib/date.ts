export function getTodayDateString(date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  return formatter.format(date);
}

export const weekDayLabels = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
  'Domingo'
] as const;

export function getDietDayIdForDate(date = new Date()): string {
  const dayOfWeek = date.getDay();
  const mondayBasedIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  return `d-${mondayBasedIndex + 1}`;
}
