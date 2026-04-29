export function getSafeNumber(value: number | string, fallback: number): number {
  const parsedValue = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

export function parseNumberInputValue(value: number | string): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const normalizedValue = value.trim().replace(',', '.');

  if (!normalizedValue || normalizedValue === '-' || normalizedValue === '.' || normalizedValue.endsWith('.')) {
    return null;
  }

  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

export function parseDecimalNumber(value: number | string, fallback = 0): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }

  const normalizedValue = value.replace(',', '.');
  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

export function formatNumberWithFixedDecimals(value: number, decimalPlaces: number): string {
  return Number.isFinite(value) ? value.toFixed(decimalPlaces) : (0).toFixed(decimalPlaces);
}

export function formatNumberWithFixedDecimalsPtBr(value: number, decimalPlaces: number): string {
  return formatNumberWithFixedDecimals(value, decimalPlaces).replace('.', ',');
}

export function parseDigitScaledNumberInput(value: number | string, decimalPlaces: number): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const digitsOnly = value.replace(/\D/g, '');

  if (!digitsOnly) {
    return null;
  }

  const parsedValue = Number(digitsOnly) / 10 ** decimalPlaces;

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

export function roundToDecimalPlaces(value: number, decimalPlaces = 1): number {
  return Number(value.toFixed(decimalPlaces));
}

export function formatFixedDecimal(value: number, decimalPlaces = 1): string {
  return roundToDecimalPlaces(value, decimalPlaces).toFixed(decimalPlaces);
}

export function formatRoundedInteger(value: number): string {
  return String(Math.round(value));
}

export function calculateClampedPercentage(current: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((current / total) * 100));
}
