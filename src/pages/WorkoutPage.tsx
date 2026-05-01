import { CheckmarkFilled, ChevronLeft, Timer } from '@carbon/icons-react';
import { Button, Checkbox, Tile } from '@carbon/react';
import { useEffect, useState } from 'react';
import { AppNumberInput } from '../components/AppNumberInput';
import { CardHeader } from '../components/CardHeader';
import { PageContainer } from '../components/PageContainer';
import { StatsGrid } from '../components/StatsGrid';
import { SummaryStatsCard } from '../components/SummaryStatsCard';
import { Workout, WorkoutExerciseSet } from '../data/types';
import { normalizeWorkoutExerciseSets } from '../lib/workoutSets';

interface Props {
  workout: Workout;
  onBack: () => void;
  onToggleExerciseDone: (exerciseId: string) => void;
  onUpdateSet: (exerciseId: string, setId: string, patch: Partial<Pick<WorkoutExerciseSet, 'loadKg' | 'reps' | 'done'>>) => void;
}

export function WorkoutPage({ workout, onBack, onToggleExerciseDone, onUpdateSet }: Props) {
  const completedExercises = workout.exercises.filter((exercise) => exercise.done).length;
  const [activeImageIndexes, setActiveImageIndexes] = useState<Record<string, number>>({});
  const [recentlyUpdatedSets, setRecentlyUpdatedSets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setActiveImageIndexes({});
  }, [workout.id]);

  useEffect(() => {
    const updatedSetIds = Object.keys(recentlyUpdatedSets).filter((setId) => recentlyUpdatedSets[setId]);

    if (updatedSetIds.length === 0) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setRecentlyUpdatedSets({});
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [recentlyUpdatedSets]);

  const handleToggleExerciseImage = (exerciseId: string, imageCount: number) => {
    if (imageCount < 2) return;

    setActiveImageIndexes((prev) => ({
      ...prev,
      [exerciseId]: prev[exerciseId] === 1 ? 0 : 1
    }));
  };

  const handleUpdateSet = (
    exerciseId: string,
    setId: string,
    patch: Partial<Pick<WorkoutExerciseSet, 'loadKg' | 'reps' | 'done'>>
  ) => {
    onUpdateSet(exerciseId, setId, patch);
    setRecentlyUpdatedSets((prev) => ({
      ...prev,
      [setId]: true
    }));
  };

  return (
    <PageContainer
      title={workout.name}
      subtitle={workout.muscleGroups.join(' • ')}
      actions={<Button kind="ghost" size="sm" renderIcon={ChevronLeft} iconDescription="Voltar" onClick={onBack}>Voltar</Button>}
    >
      <SummaryStatsCard
        className="workout-summary-card"
        items={[
          { label: 'Progresso', value: `${completedExercises}/${workout.exercises.length} exercícios` },
          { label: 'Grupos', value: workout.muscleGroups.length }
        ]}
      />

      <div className="stack">
        {workout.exercises.map((exercise) => {
          const displayName = exercise.ptName ?? exercise.name;
          const mediaUrls = Array.isArray(exercise.mediaUrls) && exercise.mediaUrls.length > 0
            ? exercise.mediaUrls
            : exercise.mediaUrl ? [exercise.mediaUrl] : [];
          const activeImageIndex = mediaUrls.length > 1 ? activeImageIndexes[exercise.id] ?? 0 : 0;
          const activeImageUrl = mediaUrls[activeImageIndex] ?? null;
          const exerciseSets = normalizeWorkoutExerciseSets(exercise);

          return (
            <Tile key={exercise.id} className={`card metric-card workout-exercise-card ${exercise.done ? 'workout-exercise-card--done' : ''}`}>
              <CardHeader
                icon={<CheckmarkFilled size={20} />}
                title={displayName}
                description={exercise.muscleGroup}
              />
              {activeImageUrl ? (
                <button
                  type="button"
                  className={`exercise-media-button${mediaUrls.length > 1 ? ' exercise-media-button--interactive' : ''}`}
                  onClick={() => handleToggleExerciseImage(exercise.id, mediaUrls.length)}
                  aria-label={mediaUrls.length > 1 ? `Alternar imagem do exercício ${displayName}` : `Imagem do exercício ${displayName}`}
                >
                  <img
                    src={activeImageUrl}
                    alt={`${displayName} - ${activeImageIndex === 0 ? 'posição inicial' : 'posição final'}`}
                    className="exercise-media"
                  />
                </button>
              ) : null}
              <StatsGrid
                className="workout-exercise-card__meta"
                items={[
                  { label: 'Repetições', value: exercise.reps },
                  { label: 'Séries', value: exercise.sets },
                  { label: <span className="stat-pill__icon"><Timer size={14} /></span>, value: `${exercise.restSeconds}s` }
                ]}
              />
              <div className="workout-set-list">
                {exerciseSets.map((set, setIndex) => {
                  const setWasUpdated = recentlyUpdatedSets[set.id] ?? false;

                  return (
                    <div key={set.id} className={`workout-set-row ${set.done ? 'workout-set-row--done' : ''}`}>
                      <div className="workout-set-row__info">
                        <span className="workout-set-row__label">Série {setIndex + 1}</span>
                        <span className={`workout-load-status${setWasUpdated ? ' workout-load-status--saved' : ''}`}>
                          {setWasUpdated ? 'Série atualizada' : `${set.loadKg} kg x ${set.reps}`}
                        </span>
                      </div>
                      <div className="workout-set-row__field">
                        <AppNumberInput
                          id={`load-${exercise.id}-${set.id}`}
                          label="Carga (kg)"
                          min={0}
                          value={set.loadKg}
                          onValueChange={(value) => handleUpdateSet(exercise.id, set.id, { loadKg: typeof value === 'number' ? value : set.loadKg })}
                        />
                      </div>
                      <div className="workout-set-row__field">
                        <AppNumberInput
                          id={`reps-${exercise.id}-${set.id}`}
                          label="Repetições"
                          min={1}
                          value={set.reps}
                          onValueChange={(value) => handleUpdateSet(exercise.id, set.id, { reps: typeof value === 'number' ? value : set.reps })}
                        />
                      </div>
                      <div className="workout-set-row__done">
                        <Checkbox
                          id={`done-${exercise.id}-${set.id}`}
                          labelText="Feita"
                          checked={set.done}
                          onChange={() => handleUpdateSet(exercise.id, set.id, { done: !set.done })}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="workout-exercise-card__footer">
                <span className="meta-label">
                  {mediaUrls.length > 1 ? `Imagem ${activeImageIndex + 1} de ${mediaUrls.length}` : `Mídia: ${exercise.mediaType}`}
                </span>
                <Checkbox id={`done-${exercise.id}`} labelText="Feito" checked={exercise.done} onChange={() => onToggleExerciseDone(exercise.id)} />
              </div>
            </Tile>
          );
        })}
      </div>
    </PageContainer>
  );
}
