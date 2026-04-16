export default function BodyPlanScreen({ state, setState, metrics }) {
  const addWeight = () => {
    const weight = prompt('Weight (kg)')
    if (!weight) return
    setState((prev) => ({
      ...prev,
      profile: { ...prev.profile, currentWeight: Number(weight) },
      bodyWeights: [{ date: new Date().toISOString().slice(0, 10), weight: Number(weight) }, ...prev.bodyWeights]
    }))
  }

  const setField = (field, value) => {
    setState((prev) => ({ ...prev, profile: { ...prev.profile, [field]: value } }))
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="card">
        <h2 className="mb-3 text-lg font-semibold">Body weight</h2>
        <button onClick={addWeight}>Add weight</button>
        <div className="mt-3 space-y-2 text-sm">
          {state.bodyWeights.map((w, i) => <p key={i}>{w.date}: {w.weight} kg</p>)}
        </div>
      </section>

      <section className="card">
        <h2 className="mb-3 text-lg font-semibold">Parameters</h2>
        <div className="grid gap-2 md:grid-cols-2">
          <input type="number" value={state.profile.age} onChange={(e) => setField('age', Number(e.target.value))} placeholder="Age" />
          <input type="number" value={state.profile.height} onChange={(e) => setField('height', Number(e.target.value))} placeholder="Height" />
          <input type="number" value={state.profile.activityFactor} step="0.05" onChange={(e) => setField('activityFactor', Number(e.target.value))} placeholder="Activity" />
          <input type="number" value={state.profile.deficit} onChange={(e) => setField('deficit', Number(e.target.value))} placeholder="Deficit" />
          <input value={state.profile.schedule.meal} onChange={(e) => setState((p) => ({ ...p, profile: { ...p.profile, schedule: { ...p.profile.schedule, meal: e.target.value } } }))} placeholder="Meal schedule" />
          <input value={state.profile.schedule.workout} onChange={(e) => setState((p) => ({ ...p, profile: { ...p.profile, schedule: { ...p.profile.schedule, workout: e.target.value } } }))} placeholder="Workout schedule" />
        </div>
        <div className="mt-3 rounded-lg bg-slate-100 p-3 text-sm">
          <p>BMR: {metrics.bmr}</p>
          <p>TDEE: {metrics.tdee}</p>
          <p>Target calories: {metrics.targetCalories}</p>
          <p>Macros: P {metrics.protein}g / C {metrics.carbs}g / F {metrics.fat}g</p>
        </div>
      </section>
    </div>
  )
}
