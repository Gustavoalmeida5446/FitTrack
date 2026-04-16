import { useEffect, useState } from 'react'

export default function WorkoutsScreen({
  state,
  setState,
  onCompleteWorkout,
  onExerciseAutocomplete,
  exerciseSuggestions,
  loadingExercises
}) {
  const [selectedWorkoutId, setSelectedWorkoutId] = useState(state.workouts[0]?.id)
  const [newWorkoutName, setNewWorkoutName] = useState('')
  const [exerciseQuery, setExerciseQuery] = useState('')

  const workout = state.workouts.find((w) => w.id === selectedWorkoutId) || state.workouts[0]

  useEffect(() => {
    const timer = setTimeout(() => {
      onExerciseAutocomplete(exerciseQuery)
    }, 350)

    return () => clearTimeout(timer)
  }, [exerciseQuery, onExerciseAutocomplete])

  const patchWorkout = (updater) => {
    setState((prev) => ({
      ...prev,
      workouts: prev.workouts.map((w) => (w.id === workout.id ? updater(w) : w))
    }))
  }

  const addWorkout = () => {
    if (!newWorkoutName.trim()) return
    const newWorkout = { id: crypto.randomUUID(), name: newWorkoutName.trim(), exercises: [] }
    setState((prev) => ({ ...prev, workouts: [...prev.workouts, newWorkout] }))
    setSelectedWorkoutId(newWorkout.id)
    setNewWorkoutName('')
  }

  const deleteWorkout = () => {
    setState((prev) => ({ ...prev, workouts: prev.workouts.filter((w) => w.id !== workout.id) }))
    setSelectedWorkoutId(state.workouts[0]?.id)
  }

  const addExercise = (exercise) => {
    patchWorkout((w) => ({
      ...w,
      exercises: [...w.exercises, { id: crypto.randomUUID(), ...exercise, sets: 3, reps: 12, done: false, usedWeight: '' }]
    }))
  }

  const moveExercise = (index, direction) => {
    patchWorkout((w) => {
      const next = [...w.exercises]
      const target = index + direction
      if (target < 0 || target >= next.length) return w
      ;[next[index], next[target]] = [next[target], next[index]]
      return { ...w, exercises: next }
    })
  }

  if (!workout) return <div className="card">Crie seu primeiro treino.</div>

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="card lg:col-span-1">
        <h2 className="mb-3 text-lg font-semibold">Treinos</h2>
        <div className="mb-2 flex gap-2">
          <input value={newWorkoutName} onChange={(e) => setNewWorkoutName(e.target.value)} placeholder="Novo treino" />
          <button onClick={addWorkout}>Adicionar</button>
        </div>
        <div className="grid gap-2">
          {state.workouts.map((w) => (
            <button key={w.id} className={w.id === workout.id ? '' : 'secondary'} onClick={() => setSelectedWorkoutId(w.id)}>{w.name}</button>
          ))}
        </div>
      </section>

      <section className="card lg:col-span-2">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{workout.name}</h2>
          <div className="flex gap-2">
            <button className="secondary" onClick={() => {
              const name = prompt('Renomear treino', workout.name)
              if (name) patchWorkout((w) => ({ ...w, name }))
            }}>Renomear</button>
            <button className="secondary" onClick={deleteWorkout}>Excluir</button>
            <button onClick={() => onCompleteWorkout(workout)}>Concluir treino</button>
          </div>
        </div>

        <div className="mb-3">
          <input value={exerciseQuery} onChange={(e) => setExerciseQuery(e.target.value)} placeholder="Buscar exercício (autocomplete)" />
          {loadingExercises && <p className="mt-1 text-xs text-slate-500">Buscando...</p>}
        </div>

        <div className="mb-4 grid gap-2 md:grid-cols-2">
          {exerciseSuggestions.map((ex, i) => (
            <button key={`${ex.name}-${i}`} className="secondary text-left" onClick={() => addExercise(ex)}>
              <p className="font-medium capitalize">{ex.name}</p>
              <p className="text-xs">{ex.muscle}</p>
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {workout.exercises.map((ex, index) => (
            <div key={ex.id} className="rounded-lg border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-medium capitalize">{ex.name} <span className="text-xs text-slate-500">({ex.muscle})</span></p>
                <div className="flex gap-1">
                  <button className="secondary" onClick={() => moveExercise(index, -1)}>↑</button>
                  <button className="secondary" onClick={() => moveExercise(index, 1)}>↓</button>
                  <button className="secondary" onClick={() => patchWorkout((w) => ({ ...w, exercises: w.exercises.filter((item) => item.id !== ex.id) }))}>Excluir</button>
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-4">
                <input type="number" value={ex.sets} onChange={(e) => patchWorkout((w) => ({ ...w, exercises: w.exercises.map((item) => item.id === ex.id ? { ...item, sets: Number(e.target.value) } : item) }))} placeholder="Séries" />
                <input type="number" value={ex.reps} onChange={(e) => patchWorkout((w) => ({ ...w, exercises: w.exercises.map((item) => item.id === ex.id ? { ...item, reps: Number(e.target.value) } : item) }))} placeholder="Repetições" />
                <input value={ex.usedWeight} onChange={(e) => patchWorkout((w) => ({ ...w, exercises: w.exercises.map((item) => item.id === ex.id ? { ...item, usedWeight: e.target.value } : item) }))} placeholder="Peso usado" />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={ex.done} onChange={(e) => patchWorkout((w) => ({ ...w, exercises: w.exercises.map((item) => item.id === ex.id ? { ...item, done: e.target.checked } : item) }))} /> Feito
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
