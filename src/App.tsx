import { Calendar, CalendarHeatMap, Home } from '@carbon/icons-react';
import { Button, Theme } from '@carbon/react';
import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { HomePage } from './pages/HomePage';
import { WorkoutPage } from './pages/WorkoutPage';
import { DietDayPage } from './pages/DietDayPage';
import { DietSetupPage } from './pages/DietSetupPage';
import { NutritionGoalsPage } from './pages/NutritionGoalsPage';
import { WorkoutSetupPage } from './pages/WorkoutSetupPage';
import { LoginPage } from './pages/LoginPage';
import { WeeklyDiet, Workout } from './data/types';
import { AppState, defaultAppState, normalizeWaterData } from './lib/appState';
import { getTodayDateString } from './lib/date';
import { calculateNutritionTargets } from './lib/nutrition';
import { getCurrentSession, onAuthStateChange, signInWithEmail, signOut, signUpWithEmail } from './services/authService';
import { loadRemoteAppState, saveRemoteAppState } from './services/appStateService';

type View = 'home' | 'workout' | 'diet-day' | 'workout-setup' | 'diet-setup' | 'goals';

export default function App() {
  const [view, setView] = useState<View>('home');
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>('');
  const [selectedDayId, setSelectedDayId] = useState<string>('');
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isRemoteReady, setIsRemoteReady] = useState(false);

  const [profile, setProfile] = useState(defaultAppState.profile);
  const [workouts, setWorkouts] = useState(defaultAppState.workouts);
  const [water, setWater] = useState(normalizeWaterData(defaultAppState.water));
  const [weeklyDiet, setWeeklyDiet] = useState(defaultAppState.weeklyDiet);
  const [weightHistory, setWeightHistory] = useState(defaultAppState.weightHistory);

  const appState = useMemo<AppState>(() => ({
    profile,
    workouts,
    water,
    weeklyDiet,
    weightHistory
  }), [profile, workouts, water, weeklyDiet, weightHistory]);

  const targets = useMemo(() => calculateNutritionTargets(profile), [profile]);
  const selectedWorkout = useMemo(() => workouts.find((item) => item.id === selectedWorkoutId), [workouts, selectedWorkoutId]);
  const selectedDay = useMemo(() => weeklyDiet.days.find((item) => item.id === selectedDayId), [weeklyDiet.days, selectedDayId]);
  const selectedDayMeals = useMemo(() => {
    if (!selectedDay) {
      return [];
    }

    return weeklyDiet.meals.filter((meal) => selectedDay.mealIds.includes(meal.id));
  }, [selectedDay, weeklyDiet.meals]);
  const userInitial = session?.user.email?.trim().charAt(0).toUpperCase() ?? 'U';

  useEffect(() => {
    void getCurrentSession().then((currentSession) => {
      setSession(currentSession);
      setIsRemoteReady(false);
      setIsAuthReady(true);
    });

    const { data } = onAuthStateChange((nextSession) => {
      setSession(nextSession);
      setIsRemoteReady(false);
      setIsAuthReady(true);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(defaultAppState.profile);
      setWorkouts(defaultAppState.workouts);
      setWater(normalizeWaterData(defaultAppState.water));
      setWeeklyDiet(defaultAppState.weeklyDiet);
      setWeightHistory(defaultAppState.weightHistory);
      setIsRemoteReady(true);
      return;
    }

    let isActive = true;
    setIsRemoteReady(false);

    void loadRemoteAppState(session).then((remoteState) => {
      if (!isActive || !remoteState) return;

      setProfile(remoteState.profile);
      setWorkouts(remoteState.workouts);
      setWater(normalizeWaterData(remoteState.water));
      setWeeklyDiet(remoteState.weeklyDiet);
      setWeightHistory(remoteState.weightHistory);
      setIsRemoteReady(true);
    });

    return () => {
      isActive = false;
    };
  }, [session]);

  useEffect(() => {
    if (!session || !isRemoteReady) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void saveRemoteAppState(session, appState);
    }, 400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [appState, isRemoteReady, session]);

  const updateWorkout = (workoutId: string, updater: (workout: Workout) => Workout) => {
    setWorkouts((prev) => prev.map((workout) => (workout.id === workoutId ? updater(workout) : workout)));
  };

  const updateDiet = (updater: (diet: WeeklyDiet) => WeeklyDiet) => {
    setWeeklyDiet((prev) => updater(prev));
  };

  const handleLogin = async (email: string, password: string) => {
    const nextSession = await signInWithEmail(email, password);

    if (!nextSession) {
      return false;
    }

    setSession(nextSession);
    setView('goals');
    return true;
  };

  const handleSignUp = async (email: string, password: string) => signUpWithEmail(email, password);

  const handleSignOut = async () => {
    const success = await signOut();
    if (!success) return;

    setSession(null);
    setView('home');
  };

  if (!isAuthReady) {
    return (
      <Theme theme="g100">
        <div className="app-shell">
          <div className="page-container">
            <div className="loading-state">Carregando...</div>
          </div>
        </div>
      </Theme>
    );
  }

  if (!session) {
    return (
      <Theme theme="g100">
        <div className="app-shell">
          <LoginPage onLogin={handleLogin} onSignUp={handleSignUp} />
        </div>
      </Theme>
    );
  }

  return (
    <Theme theme="g100">
      <div className="app-shell">
        {view === 'home' ? (
          <HomePage
            workouts={workouts}
            water={water}
            weeklyDiet={weeklyDiet}
            waterGoalMl={targets.waterDailyMl}
            targets={targets}
            onOpenWorkout={(workoutId) => {
              setSelectedWorkoutId(workoutId);
              setView('workout');
            }}
            onOpenDietDay={(dayId) => {
              setSelectedDayId(dayId);
              setView('diet-day');
            }}
            onAddWater={(amount) => setWater((prev) => ({
              ...prev,
              consumedMl: prev.consumedMl + amount,
              updatedAt: getTodayDateString()
            }))}
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
            meals={selectedDayMeals}
            targets={targets}
            onBack={() => setView('home')}
            onToggleMealDone={(mealId) => updateDiet((diet) => ({
              ...diet,
              days: diet.days.map((day) => day.id !== selectedDay.id ? day : {
                ...day,
                completedMealIds: day.completedMealIds.includes(mealId)
                  ? day.completedMealIds.filter((item) => item !== mealId)
                  : [...day.completedMealIds, mealId]
              })
            }))}
          />
        ) : null}

        {view === 'workout-setup' ? (
          <WorkoutSetupPage onBack={() => setView('home')} workouts={workouts} onSaveWorkouts={setWorkouts} />
        ) : null}

        {view === 'diet-setup' ? (
          <DietSetupPage onBack={() => setView('home')} diet={weeklyDiet} onSaveDiet={setWeeklyDiet} />
        ) : null}

        {view === 'goals' ? (
          <NutritionGoalsPage
            profile={profile}
            targets={targets}
            weightHistory={weightHistory}
            onBack={() => setView('home')}
            onUpdateProfile={setProfile}
            onAddWeight={(weight) => setWeightHistory((prev) => [...prev, { date: getTodayDateString(), weight }])}
            onRemoveWeight={(index) => setWeightHistory((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
            session={session}
            onOpenLogin={() => undefined}
            onSignOut={handleSignOut}
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
            <span className="profile-initial-badge" aria-hidden="true">{userInitial}</span>
            <span>Perfil</span>
          </Button>
        </nav>
      </div>
    </Theme>
  );
}
