import { Calendar, CalendarHeatMap, Home } from '@carbon/icons-react';
import { Button, Theme } from '@carbon/react';
import { Suspense, lazy, useCallback, useMemo, useState } from 'react';
import { type TutorialStepContent } from './components/ContextualTutorialCard';
import { WeeklyDiet, Workout } from './data/types';
import { useAuthSession } from './hooks/useAuthSession';
import { useDailyWaterReset } from './hooks/useDailyWaterReset';
import { useDailyWorkoutReset } from './hooks/useDailyWorkoutReset';
import { type AppView, useLocalNavigation } from './hooks/useLocalNavigation';
import { useRemoteAppState } from './hooks/useRemoteAppState';
import { useTutorial } from './hooks/useTutorial';
import { AppState, defaultAppState, normalizeWaterData } from './lib/appState';
import {
  addWaterAmount,
  createWeightHistoryEntry,
  getCurrentWeightFromHistory,
  toggleCompletedMealForDay,
  toggleWorkoutExerciseDone,
  updateWorkoutExerciseLoad
} from './lib/appUpdates';
import { getTodayDateString } from './lib/date';
import { calculateNutritionTargets } from './lib/nutrition';
import { signInWithEmail, signOut, signUpWithEmail } from './services/authService';

const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })));
const WorkoutPage = lazy(() => import('./pages/WorkoutPage').then((module) => ({ default: module.WorkoutPage })));
const DietDayPage = lazy(() => import('./pages/DietDayPage').then((module) => ({ default: module.DietDayPage })));
const DietSetupPage = lazy(() => import('./pages/DietSetupPage').then((module) => ({ default: module.DietSetupPage })));
const NutritionGoalsPage = lazy(() => import('./pages/NutritionGoalsPage').then((module) => ({ default: module.NutritionGoalsPage })));
const WorkoutSetupPage = lazy(() => import('./pages/WorkoutSetupPage').then((module) => ({ default: module.WorkoutSetupPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })));

const onboardingSteps: Array<TutorialStepContent & { view: AppView }> = [
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

function AppLoadingState() {
  return (
    <div className="page-container">
      <div className="loading-state">Carregando...</div>
    </div>
  );
}

export default function App() {
  const { session, setSession, isAuthReady } = useAuthSession();
  const {
    view,
    selectedWorkoutId,
    selectedDayId,
    setView,
    openHome,
    openGoals,
    openWorkoutSetup,
    openDietSetup,
    openWorkout,
    openDietDay
  } = useLocalNavigation();

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
  const handleHydrateRemoteState = useCallback((remoteState: AppState) => {
    setProfile(remoteState.profile);
    setWorkouts(remoteState.workouts);
    setWorkoutsUpdatedAt(remoteState.workoutsUpdatedAt);
    setWater(normalizeWaterData(remoteState.water));
    setWeeklyDiet(remoteState.weeklyDiet);
    setWeightHistory(remoteState.weightHistory);
  }, []);
  const handleResetLocalState = useCallback(() => {
    setProfile(defaultAppState.profile);
    setWorkouts(defaultAppState.workouts);
    setWorkoutsUpdatedAt(defaultAppState.workoutsUpdatedAt);
    setWater(normalizeWaterData(defaultAppState.water));
    setWeeklyDiet(defaultAppState.weeklyDiet);
    setWeightHistory(defaultAppState.weightHistory);
  }, []);
  const {
    isRemoteReady,
    remoteSyncError,
    markRemoteSavePending
  } = useRemoteAppState({
    session,
    appState,
    onHydrate: handleHydrateRemoteState,
    onReset: handleResetLocalState
  });
  const remoteSyncMessage = remoteSyncError === 'load'
    ? 'Não foi possível carregar seus dados salvos agora. O app segue aberto, mas pode estar usando dados locais.'
    : remoteSyncError === 'save'
      ? 'Não foi possível sincronizar suas alterações agora. Vamos tentar salvar novamente automaticamente.'
      : '';
  const handleResetWorkoutProgress = useCallback((nextState: { workouts: Workout[]; workoutsUpdatedAt: string }) => {
    setWorkouts(nextState.workouts);
    setWorkoutsUpdatedAt(nextState.workoutsUpdatedAt);
    markRemoteSavePending();
  }, [markRemoteSavePending]);
  const handleResetWater = useCallback((nextWater: AppState['water']) => {
    setWater(nextWater);
    markRemoteSavePending();
  }, [markRemoteSavePending]);
  const handleNavigateTutorial = useCallback((nextView: AppView) => {
    setView(nextView);
  }, [setView]);
  const {
    activeStep: activeTutorialStep,
    tutorialStepIndex,
    tutorialStepsTotal,
    finishTutorial,
    startTutorial,
    handleTutorialNext,
    handleTutorialBack
  } = useTutorial({
    steps: onboardingSteps,
    sessionUserId: session?.user.id,
    isReady: Boolean(session) && isRemoteReady,
    onNavigate: handleNavigateTutorial
  });

  useDailyWorkoutReset({
    isReady: Boolean(session) && isRemoteReady,
    workouts,
    workoutsUpdatedAt,
    onReset: handleResetWorkoutProgress
  });

  useDailyWaterReset({
    isReady: Boolean(session) && isRemoteReady,
    water,
    onReset: handleResetWater
  });

  const updateWorkout = (workoutId: string, updater: (workout: Workout) => Workout) => {
    markRemoteSavePending();
    setWorkoutsUpdatedAt(getTodayDateString());
    setWorkouts((prev) => prev.map((workout) => (workout.id === workoutId ? updater(workout) : workout)));
  };

  const updateDiet = (updater: (diet: WeeklyDiet) => WeeklyDiet) => {
    markRemoteSavePending();
    setWeeklyDiet((prev) => updater(prev));
  };

  const handleUpdateProfile = (nextProfile: AppState['profile']) => {
    markRemoteSavePending();
    setProfile(nextProfile);
  };

  const handleSaveWorkouts = (nextWorkouts: Workout[]) => {
    markRemoteSavePending();
    setWorkoutsUpdatedAt(getTodayDateString());
    setWorkouts(nextWorkouts);
  };

  const handleAddWeight = (weight: number) => {
    markRemoteSavePending();
    setWeightHistory((prev) => [createWeightHistoryEntry(weight), ...prev].slice(0, 10));
    setProfile((prev) => ({
      ...prev,
      currentWeight: weight
    }));
  };

  const handleRemoveWeight = (index: number) => {
    markRemoteSavePending();
    setWeightHistory((prev) => {
      const nextHistory = prev.filter((_, itemIndex) => itemIndex !== index);

      if (index === 0) {
        setProfile((currentProfile) => ({
          ...currentProfile,
          currentWeight: getCurrentWeightFromHistory(nextHistory)
        }));
      }

      return nextHistory;
    });
  };

  const handleAddWater = (amount: number) => {
    markRemoteSavePending();
    setWater((prev) => addWaterAmount(prev, amount, getTodayDateString()));
  };

  const handleSaveDiet = (nextDiet: WeeklyDiet) => {
    markRemoteSavePending();
    setWeeklyDiet(nextDiet);
  };

  const handleLogin = async (email: string, password: string) => {
    const nextSession = await signInWithEmail(email, password);

    if (!nextSession) {
      return false;
    }

    setSession(nextSession);
    openGoals();
    return true;
  };

  const handleSignUp = async (email: string, password: string) => signUpWithEmail(email, password);

  const handleSignOut = async () => {
    const success = await signOut();
    if (!success) return;

    setSession(null);
    openHome();
  };

  if (!isAuthReady) {
    return (
      <Theme theme="g100">
        <div className="app-shell">
          <AppLoadingState />
        </div>
      </Theme>
    );
  }

  if (!session) {
    return (
      <Theme theme="g100">
        <div className="app-shell">
          <Suspense fallback={<AppLoadingState />}>
            <LoginPage onLogin={handleLogin} onSignUp={handleSignUp} />
          </Suspense>
        </div>
      </Theme>
    );
  }

  return (
    <Theme theme="g100">
      <div className="app-shell">
        {remoteSyncMessage ? (
          <div className="sync-status sync-status--error" role="status" aria-live="polite">
            {remoteSyncMessage}
          </div>
        ) : null}
        <Suspense fallback={<AppLoadingState />}>
          {view === 'home' ? (
            <HomePage
              workouts={workouts}
              water={water}
              weeklyDiet={weeklyDiet}
              waterGoalMl={targets.waterDailyMl}
              targets={targets}
              tutorialStep={activeTutorialStep?.view === 'home' ? activeTutorialStep : null}
              tutorialStepIndex={tutorialStepIndex}
              tutorialStepsTotal={tutorialStepsTotal}
              onTutorialBack={handleTutorialBack}
              onTutorialNext={handleTutorialNext}
              onTutorialSkip={finishTutorial}
              onOpenWorkout={openWorkout}
              onOpenDietDay={openDietDay}
              onAddWater={handleAddWater}
            />
          ) : null}

          {view === 'workout' && selectedWorkout ? (
            <WorkoutPage
              workout={selectedWorkout}
              onBack={openHome}
              onToggleExerciseDone={(exerciseId) => updateWorkout(selectedWorkout.id, (workout) => toggleWorkoutExerciseDone(workout, exerciseId))}
              onUpdateLoad={(exerciseId, loadKg) => updateWorkout(selectedWorkout.id, (workout) => updateWorkoutExerciseLoad(workout, exerciseId, loadKg))}
            />
          ) : null}

          {view === 'diet-day' && selectedDay ? (
            <DietDayPage
              day={selectedDay}
              meals={selectedDayMeals}
              targets={targets}
              onBack={openHome}
              onToggleMealDone={(mealId) => updateDiet((diet) => ({
                ...diet,
                days: diet.days.map((day) => day.id !== selectedDay.id ? day : toggleCompletedMealForDay(day, mealId))
              }))}
            />
          ) : null}

          {view === 'workout-setup' ? (
            <WorkoutSetupPage
              onBack={openHome}
              workouts={workouts}
              onSaveWorkouts={handleSaveWorkouts}
              tutorialStep={activeTutorialStep?.view === 'workout-setup' ? activeTutorialStep : null}
              tutorialStepIndex={tutorialStepIndex}
              tutorialStepsTotal={tutorialStepsTotal}
              onTutorialBack={handleTutorialBack}
              onTutorialNext={handleTutorialNext}
              onTutorialSkip={finishTutorial}
            />
          ) : null}

          {view === 'diet-setup' ? (
            <DietSetupPage
              onBack={openHome}
              diet={weeklyDiet}
              onSaveDiet={handleSaveDiet}
              tutorialStep={activeTutorialStep?.view === 'diet-setup' ? activeTutorialStep : null}
              tutorialStepIndex={tutorialStepIndex}
              tutorialStepsTotal={tutorialStepsTotal}
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
              tutorialStepsTotal={tutorialStepsTotal}
              onTutorialBack={handleTutorialBack}
              onTutorialNext={handleTutorialNext}
              onTutorialSkip={finishTutorial}
              onReplayTutorial={startTutorial}
              onBack={openHome}
              onUpdateProfile={handleUpdateProfile}
              onAddWeight={handleAddWeight}
              onRemoveWeight={handleRemoveWeight}
              session={session}
              onSignOut={handleSignOut}
            />
          ) : null}
        </Suspense>

        <nav className="bottom-tabbar bottom-nav" aria-label="Navegação principal">
          <Button kind="ghost" size="sm" className={`bottom-tabbar__item bottom-nav__item ${view === 'home' ? 'bottom-tabbar__item--active bottom-nav__item--active' : ''}`} onClick={openHome}>
            <Home size={20} />
            <span>Início</span>
          </Button>
          <Button kind="ghost" size="sm" className={`bottom-tabbar__item bottom-nav__item ${view === 'workout-setup' ? 'bottom-tabbar__item--active bottom-nav__item--active' : ''}`} onClick={openWorkoutSetup}>
            <Calendar size={20} />
            <span>Treinos</span>
          </Button>
          <Button kind="ghost" size="sm" className={`bottom-tabbar__item bottom-nav__item ${view === 'diet-setup' ? 'bottom-tabbar__item--active bottom-nav__item--active' : ''}`} onClick={openDietSetup}>
            <CalendarHeatMap size={20} />
            <span>Dieta</span>
          </Button>
          <Button kind="ghost" size="sm" className={`bottom-tabbar__item bottom-nav__item ${view === 'goals' ? 'bottom-tabbar__item--active bottom-nav__item--active' : ''}`} onClick={openGoals}>
            <span className="profile-initial-badge" aria-hidden="true">{userInitial}</span>
            <span>Perfil</span>
          </Button>
        </nav>
      </div>
    </Theme>
  );
}
