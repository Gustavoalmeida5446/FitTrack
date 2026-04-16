export async function searchFoods(query) {
  const apiKey = import.meta.env.VITE_USDA_API_KEY
  if (!query || !apiKey) return []

  const response = await fetch(
    `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, pageSize: 12 })
    }
  )

  if (!response.ok) throw new Error('Failed to load foods')

  const data = await response.json()

  return (data.foods || []).map((food) => {
    const nutrients = food.foodNutrients || []
    const byName = (name) => nutrients.find((n) => n.nutrientName === name)?.value || 0

    return {
      name: food.description,
      protein: byName('Protein'),
      calories: byName('Energy'),
      fat: byName('Total lipid (fat)'),
      carbs: byName('Carbohydrate, by difference')
    }
  })
}
