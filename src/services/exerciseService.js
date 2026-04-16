function normalizeWgerExercise(item) {
  const translation = item.translations?.find((t) => t.language === 12 || t.language === 2) || item.translations?.[0]
  const category = item.category?.name || 'Geral'
  const image = item.images?.[0]?.image || ''

  return {
    name: (translation?.name || item.name || 'Exercício').toLowerCase(),
    muscle: category,
    media: image
  }
}

export async function searchExercises(query) {
  if (!query || query.trim().length < 2) return []

  const encoded = encodeURIComponent(query.trim())
  const urls = [
    `https://wger.de/api/v2/exercisebaseinfo/?limit=20&offset=0&search=${encoded}`,
    `https://wger.de/api/v2/exercise/?limit=20&offset=0&search=${encoded}`
  ]

  for (const url of urls) {
    const response = await fetch(url)
    if (!response.ok) continue

    const data = await response.json()
    const items = data.results || []

    if (!items.length) continue

    return items
      .map(normalizeWgerExercise)
      .filter((item) => item.name)
      .slice(0, 12)
  }

  return []
}
