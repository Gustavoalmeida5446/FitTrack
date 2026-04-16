const EXERCISE_API_HOST = 'exercisedb.p.rapidapi.com'

export async function searchExercises(query) {
  const key = import.meta.env.VITE_EXERCISEDB_KEY
  if (!key || !query) return []

  const response = await fetch(`https://${EXERCISE_API_HOST}/exercises/name/${encodeURIComponent(query)}?limit=20`, {
    headers: {
      'x-rapidapi-key': key,
      'x-rapidapi-host': EXERCISE_API_HOST
    }
  })

  if (!response.ok) throw new Error('Failed to load exercises')

  const data = await response.json()
  return data.map((item) => ({
    name: item.name,
    muscle: item.target,
    media: item.gifUrl
  }))
}
