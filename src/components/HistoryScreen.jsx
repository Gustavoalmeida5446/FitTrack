export default function HistoryScreen({ state }) {
  return (
    <div className="card">
      <h2 className="mb-3 text-lg font-semibold">Workout history</h2>
      <div className="space-y-3">
        {state.workoutHistory.map((item) => (
          <div key={item.id} className="rounded-lg border border-slate-200 p-3 text-sm">
            <p className="font-semibold">{item.date} - {item.workoutName}</p>
            <p>Body weight: {item.bodyWeight ? `${item.bodyWeight} kg` : 'n/a'}</p>
            <ul className="ml-4 list-disc">
              {item.exercises.map((ex) => (
                <li key={ex.id}>{ex.name} | {ex.sets}x{ex.reps} | used {ex.usedWeight || '-'} | {ex.done ? 'done' : 'not done'}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
