import { parseDecimalNumber, roundToDecimalPlaces } from './number';

export interface ParsedPortionBase {
  amount: number;
  unit: string;
}

export function parsePortionBase(portionBase: string | null | undefined): ParsedPortionBase {
  const rawValue = portionBase?.trim() ?? '';
  const match = rawValue.match(/^(\d+(?:[.,]\d+)?)\s*(.+)$/);

  if (!match) {
    return {
      amount: 100,
      unit: 'g'
    };
  }

  return {
    amount: parseDecimalNumber(match[1], 100),
    unit: match[2].trim()
  };
}

export function roundFoodMacro(value: number): number {
  return roundToDecimalPlaces(value, 1);
}
