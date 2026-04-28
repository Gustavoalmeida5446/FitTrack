import tacoFoods from '../data/taco-foods.json';
import { normalizeSearchValue } from '../lib/search';

export type FoodMeasurementUnit = 'g' | 'ml' | 'un';

export interface FoodItem {
  id: number;
  codigo: number;
  nome: string;
  categoria: string;
  kcal: number | null;
  proteina: number | null;
  carboidrato: number | null;
  gordura: number | null;
  fibra: number | null;
  porcaoBase: string | null;
  unidadeMedida?: FoodMeasurementUnit | null;
  gramasPorUnidade?: number | null;
}

const foods = tacoFoods as FoodItem[];
const indexedFoods = foods.map((food) => ({
  food,
  normalizedName: normalizeSearchValue(food.nome)
}));

interface RankedFoodResult {
  food: FoodItem;
  score: number;
}

function getSearchScore(normalizedName: string, normalizedQuery: string, queryTerms: string[]): number {
  if (!normalizedQuery) return -1;
  if (normalizedName === normalizedQuery) return 4;
  if (normalizedName.startsWith(normalizedQuery)) return 3;
  if (queryTerms.length === 0) return -1;

  const containsAllTerms = queryTerms.every((term) => normalizedName.includes(term));
  if (!containsAllTerms) return -1;

  return 2;
}

export function getAllFoods(): FoodItem[] {
  return foods;
}

function insertRankedFoodResult(results: RankedFoodResult[], nextResult: RankedFoodResult, limit?: number) {
  let insertIndex = results.findIndex((currentResult) => {
    if (nextResult.score !== currentResult.score) {
      return nextResult.score > currentResult.score;
    }

    return nextResult.food.nome.localeCompare(currentResult.food.nome, 'pt-BR') < 0;
  });

  if (insertIndex === -1) {
    insertIndex = results.length;
  }

  results.splice(insertIndex, 0, nextResult);

  if (limit && results.length > limit) {
    results.length = limit;
  }
}

export function searchFoods(query: string, limit?: number): FoodItem[] {
  const normalizedQuery = normalizeSearchValue(query);
  const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);

  if (!normalizedQuery) {
    return [];
  }

  const rankedResults = indexedFoods.reduce<RankedFoodResult[]>((results, item) => {
    const score = getSearchScore(item.normalizedName, normalizedQuery, queryTerms);

    if (score < 0) {
      return results;
    }

    insertRankedFoodResult(results, {
      food: item.food,
      score
    }, limit);

    return results;
  }, []);

  return rankedResults.map((item) => item.food);
}

export function getFoodById(id: number): FoodItem | undefined {
  return foods.find((food) => food.id === id);
}

export function getFoodMeasurementUnit(food: FoodItem): FoodMeasurementUnit {
  if (food.unidadeMedida === 'ml' || food.unidadeMedida === 'un') {
    return food.unidadeMedida;
  }

  return 'g';
}

export function getFoodDefaultQuantity(food: FoodItem): number {
  return getFoodMeasurementUnit(food) === 'un' ? 1 : 100;
}

export function convertFoodQuantityToGrams(food: FoodItem, quantity: number): number {
  const unit = getFoodMeasurementUnit(food);

  if (unit === 'un') {
    return quantity * (food.gramasPorUnidade ?? 0);
  }

  return quantity;
}
