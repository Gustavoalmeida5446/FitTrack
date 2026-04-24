import { Button, Checkbox, NumberInput, Tile } from '@carbon/react';
import { PageContainer } from '../components/PageContainer';
import { Workout } from '../data/types';

interface Props {
  workout: Workout;
  onBack: () => void;
  onToggleExerciseDone: (exerciseId: string) => void;
  onUpdateLoad: (exerciseId: string, loadKg: number) => void;
}

export function WorkoutPage({ workout, onBack, onToggleExerciseDone, onUpdateLoad }: Props) {
  return (
    <PageContainer
      title={workout.name}
      subtitle="Treino"
      actions={<Button kind="ghost" size="sm" onClick={onBack}>Voltar</Button>}
    >
      <div className="stack">
        {workout.exercises.map((exercise) => (
          <Tile key={exercise.id} className="card">
            <h3>{exercise.name}</h3>
            <img src={exercise.mediaUrl} alt={exercise.name} className="exercise-media" />
            <p>Mídia: {exercise.mediaType}</p>
            <NumberInput
              id={`load-${exercise.id}`}
              label="Carga (kg)"
              min={0}
              value={exercise.loadKg}
              onChange={(event) => onUpdateLoad(exercise.id, Number((event.target as HTMLInputElement).value))}
            />
            <p>Repetições: {exercise.reps}</p>
            <p>Séries: {exercise.sets}</p>
            <p>Descanso: {exercise.restSeconds}s</p>
            <Checkbox
              id={`done-${exercise.id}`}
              labelText="Feito"
              checked={exercise.done}
              onChange={() => onToggleExerciseDone(exercise.id)}
            />
          </Tile>
        ))}
      </div>
    </PageContainer>
  );
}
