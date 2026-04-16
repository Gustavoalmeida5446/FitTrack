import { useEffect, useMemo, useState } from 'react'
import { defaultState, weekDays } from '../data/defaultData'
import { getMetrics } from '../utils/calculations'
import { loadCloudState, loadLocalState, saveCloudState, saveLocalState } from '../services/persistence'

export function useFitTrackState(user) {
  const [state, setState] = useState(defaultState)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function hydrate() {
      const local = loadLocalState()
      if (local) setState(local)

      if (user?.id) {
        const cloud = await loadCloudState(user.id)
        if (cloud) setState(cloud)
      }

      setReady(true)
    }

    hydrate()
  }, [user?.id])

  useEffect(() => {
    if (!ready) return
    saveLocalState(state)
    if (user?.id) saveCloudState(user.id, state)
  }, [state, ready, user?.id])

  const today = weekDays[(new Date().getDay() + 6) % 7]
  const nextWorkout = state.workouts[state.workoutSequenceIndex % Math.max(1, state.workouts.length)]
  const todaysDiet = state.dietPlan[today]
  const metrics = useMemo(() => getMetrics(state.profile), [state.profile])

  return {
    state,
    setState,
    today,
    nextWorkout,
    todaysDiet,
    metrics
  }
}
