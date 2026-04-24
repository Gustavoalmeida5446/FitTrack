const WGER_BASE_URL = 'https://wger.de/api/v2/exerciseinfo/';

export interface ExerciseOption {
  id: string;
  name: string;
}

export async function searchExercises(query: string): Promise<ExerciseOption[]> {
  if (!query.trim()) return [];

  try {
    const response = await fetch(`${WGER_BASE_URL}?limit=10&language=2&term=${encodeURIComponent(query)}`);
    if (!response.ok) return [];

    const data = await response.json();
    const results = data.results ?? [];
    return results.map((item: { id: number; name: string }) => ({ id: String(item.id), name: item.name }));
  } catch {
    return [];
  }
}
