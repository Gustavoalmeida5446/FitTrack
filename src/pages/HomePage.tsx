import { CalendarHeatMap, ChevronRight, TemperatureWater } from '@carbon/icons-react';
import { Button, ProgressBar, TextInput, Tile } from '@carbon/react';
import { useState } from 'react';
import { ContextualTutorialCard, type TutorialStepContent } from '../components/ContextualTutorialCard';
import { PageContainer } from '../components/PageContainer';
import { NutritionTargets, WaterData, WeeklyDiet, Workout } from '../data/types';
import { getDietDayIdForDate } from '../lib/date';
import { calculateClampedPercentage, formatRoundedInteger, parseDecimalNumber } from '../lib/number';
import { calculateDietProgress, getMealsForDietDay } from '../lib/nutrition';
import appLogo from '../../favicon/android-chrome-192x192.png';

interface Props {
  workouts: Workout[];
  water: WaterData;
  weeklyDiet: WeeklyDiet;
  waterGoalMl: number;
  targets: NutritionTargets;
  tutorialStep: TutorialStepContent | null;
  tutorialStepIndex: number;
  tutorialStepsTotal: number;
  onTutorialBack: () => void;
  onTutorialNext: () => void;
  onTutorialSkip: () => void;
  onOpenWorkout: (workoutId: string) => void;
  onOpenDietDay: (dayId: string) => void;
  onOpenWorkoutSetup: () => void;
  onOpenDietSetup: () => void;
  onOpenGoals: () => void;
  onAddWater: (amount: number) => void;
}

function DumbbellIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 9.5v5M5.5 7v10M8.5 8.5v7M15.5 8.5v7M18.5 7v10M21 9.5v5M8.5 12h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HomePage({
  workouts,
  water,
  weeklyDiet,
  waterGoalMl,
  targets,
  tutorialStep,
  tutorialStepIndex,
  tutorialStepsTotal,
  onTutorialBack,
  onTutorialNext,
  onTutorialSkip,
  onOpenWorkout,
  onOpenDietDay,
  onOpenWorkoutSetup,
  onOpenDietSetup,
  onOpenGoals,
  onAddWater
}: Props) {
  const [customWaterAmount, setCustomWaterAmount] = useState('');
  const progress = calculateClampedPercentage(water.consumedMl, waterGoalMl);
  const hasDiet = weeklyDiet.days.some((day) => day.mealIds.length > 0);
  const todayDietDay = weeklyDiet.days.find((day) => day.id === getDietDayIdForDate()) ?? weeklyDiet.days[0];
  const todayMeals = getMealsForDietDay(todayDietDay, weeklyDiet.meals);
  const todayDietProgress = calculateDietProgress(
    todayMeals,
    todayDietDay?.completedMealIds ?? [],
    todayDietDay?.completedMealQuantities
  );
  const completedMealsCount = todayDietDay?.completedMealIds.length ?? 0;
  const parsedCustomWaterAmount = parseDecimalNumber(customWaterAmount, 0);
  const canAddCustomWater = waterGoalMl > 0 && parsedCustomWaterAmount > 0;
  const onboardingActions = [
    waterGoalMl <= 0 ? { label: 'Completar perfil', action: onOpenGoals } : null,
    workouts.length === 0 ? { label: 'Criar treino', action: onOpenWorkoutSetup } : null,
    !hasDiet ? { label: 'Montar dieta', action: onOpenDietSetup } : null
  ].filter((item): item is { label: string; action: () => void } => Boolean(item));

  const handleAddCustomWater = () => {
    if (!canAddCustomWater) {
      return;
    }

    onAddWater(parsedCustomWaterAmount);
    setCustomWaterAmount('');
  };

  return (
    <PageContainer
      title={(
        <span className="app-title">
          <img src={appLogo} alt="" className="app-title__logo" />
          <span>FitTrack</span>
        </span>
      )}
    >
      {onboardingActions.length > 0 ? (
        <div className="inline-actions" aria-label="Atalhos de configuração inicial">
          {onboardingActions.map((item) => (
            <Button key={item.label} size="sm" kind="secondary" onClick={item.action}>{item.label}</Button>
          ))}
        </div>
      ) : null}
      {tutorialStep ? (
        <ContextualTutorialCard
          step={tutorialStep}
          currentStep={tutorialStepIndex}
          totalSteps={tutorialStepsTotal}
          isFirstStep={tutorialStepIndex === 0}
          isLastStep={tutorialStepIndex === tutorialStepsTotal - 1}
          onBack={onTutorialBack}
          onNext={onTutorialNext}
          onSkip={onTutorialSkip}
        />
      ) : null}
      <div className="section-title">
        <div className="section-title__group">
          <DumbbellIcon size={24} />
          <h2>Treinos</h2>
        </div>
      </div>
      <div className="stack">
        {workouts.length > 0 ? workouts.map((workout) => (
          <Tile key={workout.id} className="card-click list-card" onClick={() => onOpenWorkout(workout.id)}>
            <div className="list-card__badge list-card__badge--primary">
              <DumbbellIcon size={24} />
            </div>
            <div className="list-card__content">
              <h3>{workout.name}</h3>
              <p>{workout.muscleGroups.join(', ')}</p>
              <span>{workout.exercises.length} exercícios</span>
            </div>
            <ChevronRight size={24} className="list-card__chevron" />
          </Tile>
        )) : (
          <Tile className="card metric-card empty-state-card">
            <h3>Nenhum treino cadastrado</h3>
            <p>Cadastre seu primeiro treino na aba de treinos para ele aparecer aqui.</p>
            <Button size="sm" onClick={onOpenWorkoutSetup}>Criar treino</Button>
          </Tile>
        )}
      </div>

      <div className="section-title">
        <div className="section-title__group">
          <TemperatureWater size={24} />
          <h2>Água</h2>
        </div>
      </div>
      <Tile className="card metric-card water-card">
        <div className="metric-row water-card__summary">
          <strong>{water.consumedMl} ml / {waterGoalMl} ml</strong>
          <span>{waterGoalMl > 0 ? `Meta diária: ${waterGoalMl} ml` : 'Complete o perfil para calcular sua meta de água.'}</span>
        </div>
        <div className="water-card__progress">
          <ProgressBar label="" hideLabel helperText="" value={progress} max={100} />
          <span>{progress}%</span>
        </div>
        {waterGoalMl <= 0 ? (
          <Button size="sm" kind="secondary" onClick={onOpenGoals}>Completar perfil</Button>
        ) : null}
        <div className="actions-grid water-card__actions">
          <Button size="sm" disabled={waterGoalMl <= 0} onClick={() => onAddWater(250)}>+250 ml</Button>
          <Button size="sm" disabled={waterGoalMl <= 0} onClick={() => onAddWater(500)}>+500 ml</Button>
          <Button size="sm" disabled={waterGoalMl <= 0} onClick={() => onAddWater(750)}>+750 ml</Button>
        </div>
        <div className="water-card__custom-entry">
          <TextInput
            id="custom-water-amount"
            labelText="Adicionar outro valor"
            placeholder="Ex.: 300"
            inputMode="decimal"
            value={customWaterAmount}
            disabled={waterGoalMl <= 0}
            onChange={(event) => setCustomWaterAmount(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleAddCustomWater();
              }
            }}
          />
          <Button size="sm" kind="tertiary" disabled={!canAddCustomWater} onClick={handleAddCustomWater}>
            Adicionar ml
          </Button>
        </div>
      </Tile>

      <div className="section-title">
        <div className="section-title__group">
          <CalendarHeatMap size={24} />
          <h2>Dieta de hoje</h2>
        </div>
      </div>
      <div className="stack">
        {hasDiet && todayDietDay ? (
          <Tile key={todayDietDay.id} className="card-click diet-home-card" onClick={() => onOpenDietDay(todayDietDay.id)}>
            <div className="diet-home-card__header">
              <div className="list-card__badge list-card__badge--purple">
                <CalendarHeatMap size={20} />
              </div>
              <div className="diet-home-card__title">
                <h3>{todayDietDay.label}</h3>
                <span>{completedMealsCount}/{todayDietDay.mealIds.length} refeições feitas</span>
              </div>
              <ChevronRight size={24} className="list-card__chevron" />
            </div>
            <div className="diet-home-card__metrics">
              <div className="diet-home-card__metric">
                <span>Proteína consumida</span>
                <strong>{formatRoundedInteger(todayDietProgress.consumedProtein)}g / {targets.proteinDaily}g</strong>
              </div>
              <div className="diet-home-card__metric">
                <span>Calorias consumidas</span>
                <strong>{formatRoundedInteger(todayDietProgress.consumedCalories)} / {targets.caloriesDaily} kcal</strong>
              </div>
            </div>
          </Tile>
        ) : (
          <Tile className="card metric-card empty-state-card">
            <h3>Nenhuma dieta cadastrada</h3>
            <p>Monte sua dieta na aba de dieta para ver o planejamento semanal aqui.</p>
            <Button size="sm" onClick={onOpenDietSetup}>Montar dieta</Button>
          </Tile>
        )}
      </div>
    </PageContainer>
  );
}
