export interface FoodOption {
  id: string;
  name: string;
  calories: number;
  protein: number;
}

const tacoFallback: FoodOption[] = [
  { id: 't1', name: 'Arroz branco', calories: 130, protein: 2.5 },
  { id: 't2', name: 'Frango grelhado', calories: 165, protein: 31 },
  { id: 't3', name: 'Batata-doce', calories: 86, protein: 1.6 }
];

export async function searchFoods(query: string): Promise<FoodOption[]> {
  if (!query.trim()) return [];

  // Estrutura preparada para integração real da API TACO.
  // Enquanto isso, mantém autocomplete funcional com mock local.
  return tacoFallback.filter((food) => food.name.toLowerCase().includes(query.toLowerCase()));
}
