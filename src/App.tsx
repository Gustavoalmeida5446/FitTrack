import { Button, Theme } from '@carbon/react';
import { useMemo, useState } from 'react';
import { HomePage } from './pages/HomePage';
import { WorkoutPage } from './pages/WorkoutPage';
import { DietDayPage } from './pages/DietDayPage';
import { DietSetupPage } from './pages/DietSetupPage';
import { NutritionGoalsPage } from './pages/NutritionGoalsPage';
import { WorkoutSetupPage } from './pages/WorkoutSetupPage';
import { mockNutritionTargets, mockUserProfile, mockWater, mockWeeklyDiet, mockWeightHistory, mockWorkouts } from './data/mockData';
import { WeeklyDiet, Workout } from './data/types';

export default function App() {
  const [view, setView] = useState<'home' | 'workout' | 'diet-day' | 'workout-setup' | 'diet-setup' | 'goals'>('home');
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>('');
  const [selectedDayId, setSelectedDayId] = useState<string>('');

  const [workouts, setWorkouts] = useState(mockWorkouts);
  const [water, setWater] = useState(mockWater);
  const [weeklyDiet, setWeeklyDiet] = useState(mockWeeklyDiet);
  const [weightHistory, setWeightHistory] = useState(mockWeightHistory);

  const selectedWorkout = useMemo(() => workouts.find((item) => item.id === selectedWorkoutId), [workouts, selectedWorkoutId]);
  const selectedDay = useMemo(() => weeklyDiet.days.find((item) => item.id === selectedDayId), [weeklyDiet.days, selectedDayId]);

  const updateWorkout = (workoutId: string, updater: (workout: Workout) => Workout) => {
    setWorkouts((prev) => prev.map((workout) => (workout.id === workoutId ? updater(workout) : workout)));
  };

  const updateDiet = (updater: (diet: WeeklyDiet) => WeeklyDiet) => {
    setWeeklyDiet((prev) => updater(prev));
  };

  return (
    <Theme theme="g100">
      <div className="app-shell">
        <nav className="top-actions">
          <Button kind="ghost" size="sm" onClick={() => setView('home')}>Início</Button>
          <Button kind="ghost" size="sm" onClick={() => setView('workout-setup')}>Cadastro treino</Button>
          <Button kind="ghost" size="sm" onClick={() => setView('diet-setup')}>Cadastro dieta</Button>
          <Button kind="ghost" size="sm" onClick={() => setView('goals')}>Metas</Button>
        </nav>

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
            profile={mockUserProfile}
            targets={mockNutritionTargets}
            weightHistory={weightHistory}
            onBack={() => setView('home')}
            onAddWeight={(weight) => setWeightHistory((prev) => [...prev, { date: new Date().toISOString().slice(0, 10), weight }])}
          />
        ) : null}
      </div>
    </Theme>
  );
}
