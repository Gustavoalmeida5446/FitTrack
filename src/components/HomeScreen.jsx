import { sumDietDay } from '../utils/calculations'

export default function HomeScreen({ nextWorkout, today, todaysDiet, latestWeight, onStartWorkout, onMarkDiet }) {
  const totals = sumDietDay(todaysDiet || { meals: [] })

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <section className="card">
        <h2 className="mb-2 text-lg font-semibold">Next workout</h2>
        <p className="text-xl font-bold">{nextWorkout?.name || 'No workouts'}</p>
        <p className="mt-2 text-sm text-slate-500">Sequence: Treino A → Treino B → Treino C</p>
        <button className="mt-4" onClick={onStartWorkout}>Start / Complete workout</button>
      </section>

      <section className="card">
        <h2 className="mb-2 text-lg font-semibold">Today's diet ({today})</h2>
        <p className="text-sm">Meals: {todaysDiet?.meals?.length || 0}</p>
        <p className="text-sm">Calories: {totals.calories}</p>
        <p className="text-sm">Protein: {totals.protein}g</p>
        <button className="mt-4" onClick={onMarkDiet}>Mark diet completed</button>
      </section>

      <section className="card">
        <h2 className="mb-2 text-lg font-semibold">Latest weight</h2>
        <p className="text-2xl font-bold">{latestWeight ? `${latestWeight.weight} kg` : '--'}</p>
        <p className="text-sm text-slate-500">{latestWeight?.date || 'No records yet'}</p>
      </section>
    </div>
  )
}
