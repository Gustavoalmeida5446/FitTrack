import { useState } from 'react'
import AuthPanel from './components/AuthPanel'
import BackupScreen from './components/BackupScreen'
import BodyPlanScreen from './components/BodyPlanScreen'
import DietScreen from './components/DietScreen'
import HistoryScreen from './components/HistoryScreen'
import HomeScreen from './components/HomeScreen'
import TopNav from './components/TopNav'
import WorkoutsScreen from './components/WorkoutsScreen'
import { useAuth } from './hooks/useAuth'
import { useFitTrackState } from './hooks/useFitTrackState'
import { searchExercises } from './services/exerciseService'
import { searchFoods } from './services/foodService'

export default function App() {
  const auth = useAuth()
  const { state, setState, today, nextWorkout, todaysDiet, metrics } = useFitTrackState(auth.user)
  const [activeTab, setActiveTab] = useState('Home')
  const [loadingExercises, setLoadingExercises] = useState(false)
  const [loadingFoods, setLoadingFoods] = useState(false)
  const [foodResults, setFoodResults] = useState([])

  const latestWeight = state.bodyWeights[0]

  const completeWorkout = (workout = nextWorkout) => {
    if (!workout) return
    setState((prev) => ({
      ...prev,
      workoutSequenceIndex: (prev.workoutSequenceIndex + 1) % Math.max(1, prev.workouts.length),
      workoutHistory: [{
        id: crypto.randomUUID(),
        date: new Date().toISOString().slice(0, 10),
        workoutName: workout.name,
        exercises: workout.exercises,
        bodyWeight: prev.bodyWeights[0]?.weight || null
      }, ...prev.workoutHistory]
    }))
  }

  const markDietDone = () => {
    setState((prev) => ({
      ...prev,
      dietPlan: {
        ...prev.dietPlan,
        [today]: { ...prev.dietPlan[today], completed: true }
      },
      dietHistory: [{ day: today, date: new Date().toISOString().slice(0, 10) }, ...prev.dietHistory]
    }))
  }

  const handleExerciseSearch = async (query) => {
    try {
      setLoadingExercises(true)
      const results = await searchExercises(query)
      setState((prev) => ({ ...prev, favoritesExercises: results }))
    } catch {
      alert('Exercise API unavailable. Add exercises manually if needed.')
    } finally {
      setLoadingExercises(false)
    }
  }

  const handleFoodSearch = async (query) => {
    try {
      setLoadingFoods(true)
      const results = await searchFoods(query)
      setFoodResults(results)
    } catch {
      alert('Food API unavailable. Use manual fallback.')
    } finally {
      setLoadingFoods(false)
    }
  }

  const screens = {
    Home: <HomeScreen nextWorkout={nextWorkout} today={today} todaysDiet={todaysDiet} latestWeight={latestWeight} onStartWorkout={() => completeWorkout()} onMarkDiet={markDietDone} />,
    Workouts: <WorkoutsScreen state={state} setState={setState} onCompleteWorkout={completeWorkout} exerciseSearch={handleExerciseSearch} loadingExercises={loadingExercises} />,
    Diet: <DietScreen state={state} setState={setState} searchFood={handleFoodSearch} foodResults={foodResults} loadingFoods={loadingFoods} />,
    'Body & Plan': <BodyPlanScreen state={state} setState={setState} metrics={metrics} />,
    History: <HistoryScreen state={state} />,
    Backup: <BackupScreen state={state} setState={setState} />
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-4 md:p-6">
      <header className="mb-4">
        <h1 className="text-3xl font-bold">FitTrack</h1>
        <p className="text-slate-600">Simple personal fitness tracker for workout, diet, weight and routine.</p>
      </header>

      <AuthPanel auth={auth} />
      <TopNav active={activeTab} onChange={setActiveTab} />
      {screens[activeTab]}
    </main>
  )
}
