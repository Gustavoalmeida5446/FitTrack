export function getTodayDateString(date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  return formatter.format(date);
}

export function formatDatePtBr(date = new Date()): string {
  return date.toLocaleDateString('pt-BR');
}

export function getSingleDatePickerValue(value: string | string[] | undefined | null): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function parseBirthDateParts(birthDate: string): { year: number; month: number; day: number } | null {
  const parts = birthDate.split('-').map(Number);

  if (parts.length !== 3 || parts.some((part) => !part)) {
    return null;
  }

  if (String(parts[0]).length === 4) {
    const [year, month, day] = parts;
    return { year, month, day };
  }

  const [day, month, year] = parts;
  return { year, month, day };
}

export function normalizeBirthDateDisplay(birthDate: string): string {
  const parsedDate = parseBirthDateParts(birthDate);

  if (!parsedDate) {
    return '';
  }

  const day = String(parsedDate.day).padStart(2, '0');
  const month = String(parsedDate.month).padStart(2, '0');
  const year = String(parsedDate.year).padStart(4, '0');

  return `${day}-${month}-${year}`;
}

export function calculateAgeFromBirthDate(birthDate: string, today = new Date()): number {
  const parsedDate = parseBirthDateParts(birthDate);

  if (!parsedDate) {
    return 0;
  }

  const { year, month, day } = parsedDate;

  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();
  const hasHadBirthdayThisYear = todayMonth > month || (todayMonth === month && todayDay >= day);

  return Math.max(0, todayYear - year - (hasHadBirthdayThisYear ? 0 : 1));
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
