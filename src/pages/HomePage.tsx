import { CalendarHeatMap, ChevronRight, TemperatureWater } from '@carbon/icons-react';
import { Button, ProgressBar, Tile } from '@carbon/react';
import { PageContainer } from '../components/PageContainer';
import { WaterData, WeeklyDiet, Workout } from '../data/types';
import { getDietDayIdForDate } from '../lib/date';

interface Props {
  workouts: Workout[];
  water: WaterData;
  weeklyDiet: WeeklyDiet;
  waterGoalMl: number;
  onOpenWorkout: (workoutId: string) => void;
  onOpenDietDay: (dayId: string) => void;
  onAddWater: (amount: number) => void;
}

function DumbbellIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 9.5v5M5.5 7v10M8.5 8.5v7M15.5 8.5v7M18.5 7v10M21 9.5v5M8.5 12h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HomePage({ workouts, water, weeklyDiet, waterGoalMl, onOpenWorkout, onOpenDietDay, onAddWater }: Props) {
  const progress = waterGoalMl > 0 ? Math.min(100, Math.round((water.consumedMl / waterGoalMl) * 100)) : 0;
  const hasDiet = weeklyDiet.days.some((day) => day.mealIds.length > 0);
  const todayDietDay = weeklyDiet.days.find((day) => day.id === getDietDayIdForDate()) ?? weeklyDiet.days[0];

  return (
    <PageContainer title="FitTrack">
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
          <span>{waterGoalMl > 0 ? `Meta diária: ${waterGoalMl} ml` : 'Preencha seu perfil para calcular a meta.'}</span>
        </div>
        <div className="water-card__progress">
          <ProgressBar label="" hideLabel helperText="" value={progress} max={100} />
          <span>{progress}%</span>
        </div>
        <div className="actions-grid water-card__actions">
          <Button size="sm" disabled={waterGoalMl <= 0} onClick={() => onAddWater(250)}>+250 ml</Button>
          <Button size="sm" disabled={waterGoalMl <= 0} onClick={() => onAddWater(500)}>+500 ml</Button>
          <Button size="sm" kind="tertiary" onClick={() => {
            const custom = Number(prompt('Quanto deseja adicionar em ml?'));
            if (custom > 0) onAddWater(custom);
          }} disabled={waterGoalMl <= 0}>Personalizado</Button>
        </div>
      </Tile>

      <div className="section-title">
        <div className="section-title__group">
          <CalendarHeatMap size={24} />
          <h2>Dieta semanal</h2>
        </div>
      </div>
      <div className="stack">
        {hasDiet && todayDietDay ? (
          <Tile key={todayDietDay.id} className="card-click list-card list-card--compact" onClick={() => onOpenDietDay(todayDietDay.id)}>
            <div className="list-card__badge list-card__badge--purple">
              <CalendarHeatMap size={20} />
            </div>
            <div className="list-card__content">
              <h3>{todayDietDay.label}</h3>
              <span>{todayDietDay.mealIds.length} refeições</span>
            </div>
            <ChevronRight size={24} className="list-card__chevron" />
          </Tile>
        ) : (
          <Tile className="card metric-card empty-state-card">
            <h3>Nenhuma dieta cadastrada</h3>
            <p>Monte sua dieta na aba de dieta para ver o planejamento semanal aqui.</p>
          </Tile>
        )}
      </div>
    </PageContainer>
  );
}
