import { Button, ProgressBar, Tile } from '@carbon/react';
import { PageContainer } from '../components/PageContainer';
import { WaterData, WeeklyDiet, Workout } from '../data/types';

interface Props {
  workouts: Workout[];
  water: WaterData;
  weeklyDiet: WeeklyDiet;
  onOpenWorkout: (workoutId: string) => void;
  onOpenDietDay: (dayId: string) => void;
  onAddWater: (amount: number) => void;
}

export function HomePage({ workouts, water, weeklyDiet, onOpenWorkout, onOpenDietDay, onAddWater }: Props) {
  const progress = Math.min(100, Math.round((water.consumedMl / water.goalMl) * 100));

  return (
    <PageContainer title="FitTrack" subtitle="Resumo diário">
      <h2>Treinos</h2>
      <div className="stack">
        {workouts.map((workout) => (
          <Tile key={workout.id} className="card-click" onClick={() => onOpenWorkout(workout.id)}>
            <h3>{workout.name}</h3>
            <p>Grupos: {workout.muscleGroups.join(', ')}</p>
            <p>Exercícios: {workout.exercises.length}</p>
          </Tile>
        ))}
      </div>

      <h2>Água</h2>
      <Tile className="card">
        <p>Meta diária: {water.goalMl} ml</p>
        <p>Consumo atual: {water.consumedMl} ml</p>
        <ProgressBar label="Progresso" helperText={`${progress}% concluído`} value={progress} max={100} />
        <div className="row-actions">
          <Button size="sm" onClick={() => onAddWater(250)}>+250 ml</Button>
          <Button size="sm" onClick={() => onAddWater(500)}>+500 ml</Button>
          <Button size="sm" kind="tertiary" onClick={() => {
            const custom = Number(prompt('Quanto deseja adicionar em ml?'));
            if (custom > 0) onAddWater(custom);
          }}>Personalizado</Button>
        </div>
      </Tile>

      <h2>Dieta semanal</h2>
      <div className="stack">
        {weeklyDiet.days.map((day) => (
          <Tile key={day.id} className="card-click" onClick={() => onOpenDietDay(day.id)}>
            <h3>{day.label}</h3>
            <p>Refeições: {day.meals.length}</p>
          </Tile>
        ))}
      </div>
    </PageContainer>
  );
}
