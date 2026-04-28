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
import { type TutorialStepContent } from './components/ContextualTutorialCard';
import { WeeklyDiet, Workout } from './data/types';
import { AppState, defaultAppState, normalizeWaterData, normalizeWorkoutProgressForToday } from './lib/appState';
import { getTodayDateString } from './lib/date';
import { calculateNutritionTargets } from './lib/nutrition';
import { getCurrentSession, onAuthStateChange, signInWithEmail, signOut, signUpWithEmail } from './services/authService';
import { loadRemoteAppState, saveRemoteAppState } from './services/appStateService';

type View = 'home' | 'workout' | 'diet-day' | 'workout-setup' | 'diet-setup' | 'goals';

const onboardingSteps: Array<TutorialStepContent & { view: View }> = [
  {
    section: 'Etapa 1: Perfil',
    title: 'Comece pelo perfil',
    description: 'Preencha seus dados para liberar as metas.',
    body: 'Nesta tela, preencha peso, altura, data de nascimento e sexo. Depois escolha atividade, objetivo e tipo de dieta. Assim que esses campos forem preenchidos, as metas aparecem logo abaixo automaticamente. Aqui também é onde você registra e acompanha seu peso ao longo do tempo.',
    view: 'goals'
  },
  {
    section: 'Etapa 2: Treinos',
    title: 'Cadastre seu treino',
    description: 'Monte um treino para usar no dia a dia.',
    body: 'Digite um nome para o treino. Depois busque um exercício, escolha uma opção da lista e ajuste carga, repetições, séries e descanso. Quando adicionar os exercícios e salvar, o treino passa a aparecer na tela inicial.',
    view: 'workout-setup'
  },
  {
    section: 'Etapa 3: Dieta',
    title: 'Monte sua dieta',
    description: 'Cadastre uma refeição e ligue ela a um dia.',
    body: 'Para montar a dieta, comece buscando um alimento e ajustando a quantidade. Adicione quantos alimentos quiser para formar uma refeição. Quando terminar, dê um nome para essa refeição e salve. Depois, na parte dos dias da semana, escolha o dia e marque quais refeições devem aparecer nele. Fazendo isso, sua dieta do dia passa a ficar organizada e fácil de acompanhar.',
    view: 'diet-setup'
  },
  {
    section: 'Etapa 4: Início',
    title: 'Acompanhe seu dia',
    description: 'Aqui você registra água e acompanha o dia.',
    body: 'Na tela inicial, você abre seu treino para marcar os exercícios conforme for fazendo. Os botões de água servem para registrar quanto você bebeu no dia. Também é por aqui que você abre a dieta do dia e marca as refeições feitas para acompanhar calorias e proteína consumidas.',
    view: 'home'
  }
];

export default function App() {
  const [view, setView] = useState<View>('home');
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>('');
  const [selectedDayId, setSelectedDayId] = useState<string>('');
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isRemoteReady, setIsRemoteReady] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);

  const [profile, setProfile] = useState(defaultAppState.profile);
  const [workouts, setWorkouts] = useState(defaultAppState.workouts);
  const [workoutsUpdatedAt, setWorkoutsUpdatedAt] = useState(defaultAppState.workoutsUpdatedAt);
  const [water, setWater] = useState(normalizeWaterData(defaultAppState.water));
  const [weeklyDiet, setWeeklyDiet] = useState(defaultAppState.weeklyDiet);
  const [weightHistory, setWeightHistory] = useState(defaultAppState.weightHistory);

  const appState = useMemo<AppState>(() => ({
    profile,
    workouts,
    workoutsUpdatedAt,
    water,
    weeklyDiet,
    weightHistory
  }), [profile, workouts, workoutsUpdatedAt, water, weeklyDiet, weightHistory]);

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
  const tutorialStorageKey = session ? `fittrack:onboarding:${session.user.id}` : '';
  const activeTutorialStep = isTutorialOpen ? onboardingSteps[tutorialStepIndex] : null;

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
      setWorkoutsUpdatedAt(defaultAppState.workoutsUpdatedAt);
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
      setWorkoutsUpdatedAt(remoteState.workoutsUpdatedAt);
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

  useEffect(() => {
    if (!session || !isRemoteReady || !tutorialStorageKey) {
      return;
    }

    const hasSeenTutorial = window.localStorage.getItem(tutorialStorageKey) === 'done';

    if (!hasSeenTutorial) {
      setTutorialStepIndex(0);
      setIsTutorialOpen(true);
    }
  }, [isRemoteReady, session, tutorialStorageKey]);

  useEffect(() => {
    if (!isTutorialOpen) {
      return;
    }

    setView(onboardingSteps[tutorialStepIndex].view);
  }, [isTutorialOpen, tutorialStepIndex]);

  useEffect(() => {
    if (!session || !isRemoteReady) {
      return;
    }

    const syncWorkoutProgressDate = () => {
      const normalizedState = normalizeWorkoutProgressForToday(workouts, workoutsUpdatedAt);

      if (normalizedState.workoutsUpdatedAt === workoutsUpdatedAt) {
        return;
      }

      setWorkouts(normalizedState.workouts);
      setWorkoutsUpdatedAt(normalizedState.workoutsUpdatedAt);
    };

    syncWorkoutProgressDate();
    window.addEventListener('focus', syncWorkoutProgressDate);
    document.addEventListener('visibilitychange', syncWorkoutProgressDate);

    return () => {
      window.removeEventListener('focus', syncWorkoutProgressDate);
      document.removeEventListener('visibilitychange', syncWorkoutProgressDate);
    };
  }, [isRemoteReady, session, workouts, workoutsUpdatedAt]);

  const updateWorkout = (workoutId: string, updater: (workout: Workout) => Workout) => {
    setWorkoutsUpdatedAt(getTodayDateString());
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

  const finishTutorial = () => {
    if (tutorialStorageKey) {
      window.localStorage.setItem(tutorialStorageKey, 'done');
    }

    setIsTutorialOpen(false);
    setTutorialStepIndex(0);
  };

  const startTutorial = () => {
    setTutorialStepIndex(0);
    setIsTutorialOpen(true);
    setView(onboardingSteps[0].view);
  };

  const handleTutorialNext = () => {
    if (tutorialStepIndex >= onboardingSteps.length - 1) {
      finishTutorial();
      return;
    }

    const nextStepIndex = tutorialStepIndex + 1;
    setTutorialStepIndex(nextStepIndex);
    setView(onboardingSteps[nextStepIndex].view);
  };

  const handleTutorialBack = () => {
    const previousStepIndex = Math.max(0, tutorialStepIndex - 1);
    setTutorialStepIndex(previousStepIndex);
    setView(onboardingSteps[previousStepIndex].view);
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
            tutorialStep={activeTutorialStep?.view === 'home' ? activeTutorialStep : null}
            tutorialStepIndex={tutorialStepIndex}
            tutorialStepsTotal={onboardingSteps.length}
            onTutorialBack={handleTutorialBack}
            onTutorialNext={handleTutorialNext}
            onTutorialSkip={finishTutorial}
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
          <WorkoutSetupPage
            onBack={() => setView('home')}
            workouts={workouts}
            onSaveWorkouts={setWorkouts}
            tutorialStep={activeTutorialStep?.view === 'workout-setup' ? activeTutorialStep : null}
            tutorialStepIndex={tutorialStepIndex}
            tutorialStepsTotal={onboardingSteps.length}
            onTutorialBack={handleTutorialBack}
            onTutorialNext={handleTutorialNext}
            onTutorialSkip={finishTutorial}
          />
        ) : null}

        {view === 'diet-setup' ? (
          <DietSetupPage
            onBack={() => setView('home')}
            diet={weeklyDiet}
            onSaveDiet={setWeeklyDiet}
            tutorialStep={activeTutorialStep?.view === 'diet-setup' ? activeTutorialStep : null}
            tutorialStepIndex={tutorialStepIndex}
            tutorialStepsTotal={onboardingSteps.length}
            onTutorialBack={handleTutorialBack}
            onTutorialNext={handleTutorialNext}
            onTutorialSkip={finishTutorial}
          />
        ) : null}

        {view === 'goals' ? (
          <NutritionGoalsPage
            profile={profile}
            targets={targets}
            weightHistory={weightHistory}
            tutorialStep={activeTutorialStep?.view === 'goals' ? activeTutorialStep : null}
            tutorialStepIndex={tutorialStepIndex}
            tutorialStepsTotal={onboardingSteps.length}
            onTutorialBack={handleTutorialBack}
            onTutorialNext={handleTutorialNext}
            onTutorialSkip={finishTutorial}
            onReplayTutorial={startTutorial}
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
