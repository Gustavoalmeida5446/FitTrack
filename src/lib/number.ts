export function getSafeNumber(value: number | string, fallback: number): number {
  const parsedValue = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

export function parseDecimalNumber(value: number | string, fallback = 0): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }

  const normalizedValue = value.replace(',', '.');
  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

export function roundToDecimalPlaces(value: number, decimalPlaces = 1): number {
  return Number(value.toFixed(decimalPlaces));
}
