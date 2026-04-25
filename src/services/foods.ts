import tacoFoods from '../data/taco-foods.json';

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
}

const foods = tacoFoods as FoodItem[];

export function getAllFoods(): FoodItem[] {
  return foods;
}

export function searchFoods(query: string): FoodItem[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  return foods.filter((food) => food.nome.toLowerCase().includes(normalizedQuery));
}

export function getFoodById(id: number): FoodItem | undefined {
  return foods.find((food) => food.id === id);
}
