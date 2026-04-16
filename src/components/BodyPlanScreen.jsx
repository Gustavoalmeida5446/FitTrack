const activityOptions = [
  { value: 1.2, label: 'Sedentário', help: 'Pouco ou nenhum exercício na semana.' },
  { value: 1.375, label: 'Levemente ativo', help: 'Treino leve 1-3x por semana.' },
  { value: 1.55, label: 'Moderadamente ativo', help: 'Treino moderado 3-5x por semana.' },
  { value: 1.725, label: 'Muito ativo', help: 'Treino intenso 6-7x por semana.' },
  { value: 1.9, label: 'Extremamente ativo', help: 'Treino pesado diário / trabalho físico.' }
]

export default function BodyPlanScreen({ state, setState, metrics }) {
  const addWeight = () => {
    const weight = prompt('Peso atual (kg)')
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

  const currentActivity = activityOptions.find((item) => Number(item.value) === Number(state.profile.activityFactor))

  return (
    <div className="grid gap-4">
      <section className="card">
        <h2 className="mb-2 text-lg font-semibold">Body & Plan</h2>
        <p className="mb-4 text-sm text-slate-600">
          Preencha seus dados para o app calcular automaticamente gasto calórico e metas de macronutrientes.
        </p>

        <div className="grid gap-2 md:grid-cols-2">
          <input type="number" value={state.profile.currentWeight} onChange={(e) => setField('currentWeight', Number(e.target.value))} placeholder="Peso atual (kg)" />
          <input type="number" value={state.profile.age} onChange={(e) => setField('age', Number(e.target.value))} placeholder="Idade" />
          <input type="number" value={state.profile.height} onChange={(e) => setField('height', Number(e.target.value))} placeholder="Altura (cm)" />
          <input type="number" value={state.profile.deficit} onChange={(e) => setField('deficit', Number(e.target.value))} placeholder="Déficit calórico (kcal)" />

          <select value={state.profile.activityFactor} onChange={(e) => setField('activityFactor', Number(e.target.value))}>
            {activityOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label} ({option.value})</option>
            ))}
          </select>

          <button onClick={addWeight}>Salvar peso no histórico</button>

          <input value={state.profile.schedule.meal} onChange={(e) => setState((p) => ({ ...p, profile: { ...p.profile, schedule: { ...p.profile.schedule, meal: e.target.value } } }))} placeholder="Horário das refeições" />
          <input value={state.profile.schedule.workout} onChange={(e) => setState((p) => ({ ...p, profile: { ...p.profile, schedule: { ...p.profile.schedule, workout: e.target.value } } }))} placeholder="Horário do treino" />
        </div>

        <p className="mt-2 text-xs text-slate-500">
          Fator de atividade atual: <strong>{state.profile.activityFactor}</strong> — {currentActivity?.help}
        </p>
      </section>

      <section className="card">
        <h3 className="mb-2 font-semibold">Explicação dos cálculos</h3>
        <div className="space-y-2 text-sm">
          <p><strong>BMR:</strong> calorias mínimas que seu corpo gasta em repouso.</p>
          <p><strong>TDEE:</strong> BMR multiplicado pelo fator de atividade (gasto total diário).</p>
          <p><strong>Calorias alvo:</strong> TDEE menos o déficit escolhido para perda de gordura.</p>
          <p><strong>Macros:</strong> divisão diária sugerida de proteína, carboidrato e gordura.</p>
        </div>

        <div className="mt-3 rounded-lg bg-slate-100 p-3 text-sm">
          <p>BMR: {metrics.bmr} kcal</p>
          <p>TDEE: {metrics.tdee} kcal</p>
          <p>Calorias alvo: {metrics.targetCalories} kcal</p>
          <p>Macros alvo: P {metrics.protein}g / C {metrics.carbs}g / F {metrics.fat}g</p>
        </div>
      </section>

      <section className="card">
        <h3 className="mb-2 font-semibold">Histórico de peso</h3>
        <div className="space-y-1 text-sm">
          {state.bodyWeights.length === 0 && <p>Nenhum peso salvo ainda.</p>}
          {state.bodyWeights.map((entry, i) => <p key={i}>{entry.date}: {entry.weight} kg</p>)}
        </div>
      </section>
    </div>
  )
}
