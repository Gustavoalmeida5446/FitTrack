import { useMemo, useState } from 'react'
import { sumDietDay } from '../utils/calculations'
import { weekDays } from '../data/defaultData'

export default function DietScreen({ state, setState, foodResults, searchFood, loadingFoods }) {
  const [selectedDay, setSelectedDay] = useState(weekDays[0])
  const [query, setQuery] = useState('')
  const [mealName, setMealName] = useState('Meal')

  const dayPlan = state.dietPlan[selectedDay]
  const totals = useMemo(() => sumDietDay(dayPlan), [dayPlan])

  const updateDay = (updater) => {
    setState((prev) => ({
      ...prev,
      dietPlan: { ...prev.dietPlan, [selectedDay]: updater(prev.dietPlan[selectedDay]) }
    }))
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="card lg:col-span-1">
        <h2 className="mb-2 text-lg font-semibold">Week planner</h2>
        <div className="grid gap-2">
          {weekDays.map((day) => (
            <button key={day} className={selectedDay === day ? '' : 'secondary'} onClick={() => setSelectedDay(day)}>
              {day}
            </button>
          ))}
        </div>
      </section>

      <section className="card lg:col-span-2">
        <div className="mb-3 flex flex-wrap gap-2">
          <input value={mealName} onChange={(e) => setMealName(e.target.value)} placeholder="Meal name" />
          <button className="secondary" onClick={() => updateDay((day) => ({ ...day, meals: [...day.meals, { id: crypto.randomUUID(), name: mealName, items: [] }] }))}>Add meal</button>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search USDA foods" />
          <button onClick={() => searchFood(query)}>Search food</button>
        </div>

        {loadingFoods && <p className="mb-2 text-sm">Loading foods...</p>}

        <div className="mb-4 grid gap-2 md:grid-cols-2">
          {foodResults.map((food, index) => (
            <button
              key={`${food.name}-${index}`}
              className="secondary text-left"
              onClick={() => {
                if (!dayPlan.meals.length) return
                updateDay((day) => ({
                  ...day,
                  meals: day.meals.map((meal, i) => i === 0 ? { ...meal, items: [...meal.items, { ...food, qty: 100 }] } : meal)
                }))
                setState((prev) => ({ ...prev, foodLibrary: [...prev.foodLibrary, food] }))
              }}
            >
              <p className="font-medium">{food.name}</p>
              <p className="text-xs">P {Math.round(food.protein)} | Cals {Math.round(food.calories)}</p>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {dayPlan.meals.map((meal) => (
            <div key={meal.id} className="rounded-lg border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold">{meal.name}</h3>
                <button className="secondary" onClick={() => updateDay((day) => ({ ...day, meals: day.meals.filter((m) => m.id !== meal.id) }))}>Delete meal</button>
              </div>
              {meal.items.map((item, idx) => (
                <div key={`${item.name}-${idx}`} className="mb-1 grid grid-cols-6 gap-2 text-sm">
                  <span className="col-span-2">{item.name}</span>
                  <span>{Math.round(item.calories)} kcal</span>
                  <span>P {Math.round(item.protein)}</span>
                  <span>C {Math.round(item.carbs)}</span>
                  <button className="secondary" onClick={() => updateDay((day) => ({ ...day, meals: day.meals.map((m) => m.id === meal.id ? { ...m, items: m.items.filter((_, i) => i !== idx) } : m) }))}>x</button>
                </div>
              ))}
              <button className="secondary mt-2" onClick={() => {
                const name = prompt('Manual food name')
                if (!name) return
                updateDay((day) => ({ ...day, meals: day.meals.map((m) => m.id === meal.id ? { ...m, items: [...m.items, { name, protein: 0, calories: 0, fat: 0, carbs: 0, qty: 100 }] } : m) }))
              }}>Manual food fallback</button>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg bg-slate-100 p-3 text-sm">
          Daily totals: {totals.calories} kcal | P {totals.protein} | C {totals.carbs} | F {totals.fat}
        </div>
      </section>
    </div>
  )
}
