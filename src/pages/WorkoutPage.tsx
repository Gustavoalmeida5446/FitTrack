import { CheckmarkFilled, ChevronLeft, Timer } from '@carbon/icons-react';
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
  const completedExercises = workout.exercises.filter((exercise) => exercise.done).length;

  return (
    <PageContainer
      title={workout.name}
      subtitle={workout.muscleGroups.join(' • ')}
      actions={<Button kind="ghost" size="sm" renderIcon={ChevronLeft} iconDescription="Voltar" onClick={onBack}>Voltar</Button>}
    >
      <Tile className="card metric-card workout-summary-card">
        <div className="metric-row workout-summary-card__row">
          <div>
            <span className="meta-label">Progresso</span>
            <strong>{completedExercises}/{workout.exercises.length} exercícios</strong>
          </div>
          <div>
            <span className="meta-label">Grupos</span>
            <strong>{workout.muscleGroups.length}</strong>
          </div>
        </div>
      </Tile>

      <div className="stack">
        {workout.exercises.map((exercise) => (
          <Tile key={exercise.id} className={`card metric-card workout-exercise-card ${exercise.done ? 'workout-exercise-card--done' : ''}`}>
            <div className="card-head">
              <div className="card-head__group">
                <div className="icon-badge icon-badge--primary card-head__badge">
                  <CheckmarkFilled size={20} />
                </div>
                <div className="card-head__title">
                  <h3>{exercise.name}</h3>
                  <p>{exercise.muscleGroup}</p>
                </div>
              </div>
            </div>
            <img src={exercise.mediaUrl} alt={exercise.name} className="exercise-media" />
            <div className="workout-exercise-card__meta">
              <div className="stat-pill">
                <span>Repetições</span>
                <strong>{exercise.reps}</strong>
              </div>
              <div className="stat-pill">
                <span>Séries</span>
                <strong>{exercise.sets}</strong>
              </div>
              <div className="stat-pill">
                <span className="stat-pill__icon"><Timer size={14} /></span>
                <strong>{exercise.restSeconds}s</strong>
              </div>
            </div>
            <NumberInput
              id={`load-${exercise.id}`}
              label="Carga (kg)"
              min={0}
              value={exercise.loadKg}
              onChange={(event) => onUpdateLoad(exercise.id, Number((event.target as HTMLInputElement).value))}
            />
            <div className="workout-exercise-card__footer">
              <span className="meta-label">Mídia: {exercise.mediaType}</span>
              <Checkbox
                id={`done-${exercise.id}`}
                labelText="Feito"
                checked={exercise.done}
                onChange={() => onToggleExerciseDone(exercise.id)}
              />
            </div>
          </Tile>
        ))}
      </div>
    </PageContainer>
  );
}
