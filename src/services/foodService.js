export async function searchFoods(query) {
  if (!query || query.trim().length < 2) return []

  const encoded = encodeURIComponent(query.trim())
  const response = await fetch(
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encoded}&search_simple=1&action=process&json=1&page_size=12&fields=product_name,nutriments,image_front_small_url`
  )

  if (!response.ok) throw new Error('Falha ao buscar alimentos')

  const data = await response.json()
  const foods = data.products || []

  return foods
    .filter((food) => food.product_name)
    .map((food) => ({
      name: food.product_name,
      protein: Number(food.nutriments?.proteins_100g || 0),
      calories: Number(food.nutriments?.['energy-kcal_100g'] || 0),
      fat: Number(food.nutriments?.fat_100g || 0),
      carbs: Number(food.nutriments?.carbohydrates_100g || 0),
      image: food.image_front_small_url || ''
    }))
    .slice(0, 12)
}
