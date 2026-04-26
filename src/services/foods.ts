import tacoFoods from '../data/taco-foods.json';

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

function normalizeSearchValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function getSearchScore(name: string, query: string): number {
  const normalizedName = normalizeSearchValue(name);
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) return -1;
  if (normalizedName === normalizedQuery) return 4;
  if (normalizedName.startsWith(normalizedQuery)) return 3;

  const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);
  if (queryTerms.length === 0) return -1;

  const containsAllTerms = queryTerms.every((term) => normalizedName.includes(term));
  if (!containsAllTerms) return -1;

  return 2;
}

export function getAllFoods(): FoodItem[] {
  return foods;
}

export function searchFoods(query: string): FoodItem[] {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [];
  }

  return foods
    .map((food) => ({
      food,
      score: getSearchScore(food.nome, normalizedQuery)
    }))
    .filter((item) => item.score >= 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.food.nome.localeCompare(b.food.nome, 'pt-BR');
    })
    .map((item) => item.food);
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
