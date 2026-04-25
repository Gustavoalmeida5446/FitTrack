import { Calendar, CalendarHeatMap, Home, UserAvatar } from '@carbon/icons-react';
import { Button, Theme } from '@carbon/react';
import { useEffect, useMemo, useState } from 'react';
import { HomePage } from './pages/HomePage';
import { WorkoutPage } from './pages/WorkoutPage';
import { DietDayPage } from './pages/DietDayPage';
import { DietSetupPage } from './pages/DietSetupPage';
import { NutritionGoalsPage } from './pages/NutritionGoalsPage';
import { WorkoutSetupPage } from './pages/WorkoutSetupPage';
import { mockNutritionTargets } from './data/mockData';
import { WeeklyDiet, Workout } from './data/types';
import { loadAppState, saveAppState } from './lib/appState';

export default function App() {
  const initialState = useMemo(() => loadAppState(), []);
  const [view, setView] = useState<'home' | 'workout' | 'diet-day' | 'workout-setup' | 'diet-setup' | 'goals'>('home');
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>('');
  const [selectedDayId, setSelectedDayId] = useState<string>('');

  const [workouts, setWorkouts] = useState(initialState.workouts);
  const [water, setWater] = useState(initialState.water);
  const [weeklyDiet, setWeeklyDiet] = useState(initialState.weeklyDiet);
  const [weightHistory, setWeightHistory] = useState(initialState.weightHistory);
  const [profile, setProfile] = useState(initialState.profile);

  const selectedWorkout = useMemo(() => workouts.find((item) => item.id === selectedWorkoutId), [workouts, selectedWorkoutId]);
  const selectedDay = useMemo(() => weeklyDiet.days.find((item) => item.id === selectedDayId), [weeklyDiet.days, selectedDayId]);

  useEffect(() => {
    saveAppState({ profile, workouts, water, weeklyDiet, weightHistory });
  }, [profile, workouts, water, weeklyDiet, weightHistory]);

  const updateWorkout = (workoutId: string, updater: (workout: Workout) => Workout) => {
    setWorkouts((prev) => prev.map((workout) => (workout.id === workoutId ? updater(workout) : workout)));
  };

  const updateDiet = (updater: (diet: WeeklyDiet) => WeeklyDiet) => {
    setWeeklyDiet((prev) => updater(prev));
  };

  return (
    <Theme theme="g100">
      <div className="app-shell">
        {view === 'home' ? (
          <HomePage
            workouts={workouts}
            water={water}
            weeklyDiet={weeklyDiet}
            onOpenWorkout={(workoutId) => {
              setSelectedWorkoutId(workoutId);
              setView('workout');
            }}
            onOpenDietDay={(dayId) => {
              setSelectedDayId(dayId);
              setView('diet-day');
            }}
            onAddWater={(amount) => setWater((prev) => ({ ...prev, consumedMl: prev.consumedMl + amount }))}
          />
        ) : null}

        {view === 'workout' && selectedWorkout ? (
          <WorkoutPage
            workout={selectedWorkout}
            onBack={() => setView('home')}
            onToggleExerciseDone={(exerciseId) => updateWorkout(selectedWorkout.id, (workout) => ({
              ...workout,
              exercises: workout.exercises.map((exercise) => exercise.id === exerciseId ? { ...exercise, done: !exercise.done } : exercise)
            }))}
            onUpdateLoad={(exerciseId, loadKg) => updateWorkout(selectedWorkout.id, (workout) => ({
              ...workout,
              exercises: workout.exercises.map((exercise) => exercise.id === exerciseId ? { ...exercise, loadKg } : exercise)
            }))}
          />
        ) : null}

        {view === 'diet-day' && selectedDay ? (
          <DietDayPage
            day={selectedDay}
            onBack={() => setView('home')}
            onToggleMealDone={(mealId) => updateDiet((diet) => ({
              ...diet,
              days: diet.days.map((day) => day.id !== selectedDay.id ? day : {
                ...day,
                meals: day.meals.map((meal) => meal.id === mealId ? { ...meal, done: !meal.done } : meal)
              })
            }))}
          />
        ) : null}

        {view === 'workout-setup' ? (
          <WorkoutSetupPage onBack={() => setView('home')} onCreateWorkout={(workout) => setWorkouts((prev) => [...prev, workout])} />
        ) : null}

        {view === 'diet-setup' ? (
          <DietSetupPage onBack={() => setView('home')} onSaveDiet={(diet) => setWeeklyDiet(diet)} />
        ) : null}

        {view === 'goals' ? (
          <NutritionGoalsPage
            profile={profile}
            targets={mockNutritionTargets}
            weightHistory={weightHistory}
            onBack={() => setView('home')}
            onUpdateProfile={setProfile}
            onAddWeight={(weight) => setWeightHistory((prev) => [...prev, { date: new Date().toISOString().slice(0, 10), weight }])}
            onRemoveWeight={(index) => setWeightHistory((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
          />
        ) : null}

        <nav className="bottom-tabbar bottom-nav" aria-label="Navegação principal">
          <Button kind="ghost" size="sm" className={`bottom-tabbar__item bottom-nav__item ${view === 'home' ? 'bottom-tabbar__item--active bottom-nav__item--active' : ''}`} onClick={() => setView('home')}>
            <Home size={20} />
            <span>Início</span>
          </Button>
          <Button kind="ghost" size="sm" className={`bottom-tabbar__item bottom-nav__item ${view === 'workout-setup' ? 'bottom-tabbar__item--active bottom-nav__item--active' : ''}`} onClick={() => setView('workout-setup')}>
            <Calendar size={20} />
            <span>Treinos</span>
          </Button>
          <Button kind="ghost" size="sm" className={`bottom-tabbar__item bottom-nav__item ${view === 'diet-setup' ? 'bottom-tabbar__item--active bottom-nav__item--active' : ''}`} onClick={() => setView('diet-setup')}>
            <CalendarHeatMap size={20} />
            <span>Dieta</span>
          </Button>
          <Button kind="ghost" size="sm" className={`bottom-tabbar__item bottom-nav__item ${view === 'goals' ? 'bottom-tabbar__item--active bottom-nav__item--active' : ''}`} onClick={() => setView('goals')}>
            <UserAvatar size={20} />
            <span>Perfil</span>
          </Button>
        </nav>
      </div>
    </Theme>
  );
}
