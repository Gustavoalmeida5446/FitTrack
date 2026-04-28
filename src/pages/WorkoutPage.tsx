import { CheckmarkFilled, ChevronLeft, Timer } from '@carbon/icons-react';
import { Button, Checkbox, NumberInput, Tile } from '@carbon/react';
import { useEffect, useState } from 'react';
import { CardHeader } from '../components/CardHeader';
import { PageContainer } from '../components/PageContainer';
import { StatPill } from '../components/StatPill';
import { Workout } from '../data/types';
import { getSafeNumber } from '../lib/number';

interface Props {
  workout: Workout;
  onBack: () => void;
  onToggleExerciseDone: (exerciseId: string) => void;
  onUpdateLoad: (exerciseId: string, loadKg: number) => void;
}

export function WorkoutPage({ workout, onBack, onToggleExerciseDone, onUpdateLoad }: Props) {
  const completedExercises = workout.exercises.filter((exercise) => exercise.done).length;
  const [activeImageIndexes, setActiveImageIndexes] = useState<Record<string, number>>({});
  const [loadValues, setLoadValues] = useState<Record<string, number>>({});
  const [recentlyUpdatedLoads, setRecentlyUpdatedLoads] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setActiveImageIndexes({});
  }, [workout.id]);

  useEffect(() => {
    setLoadValues(Object.fromEntries(workout.exercises.map((exercise) => [exercise.id, exercise.loadKg])));
  }, [workout.exercises]);

  useEffect(() => {
    const updatedExerciseIds = Object.keys(recentlyUpdatedLoads).filter((exerciseId) => recentlyUpdatedLoads[exerciseId]);

    if (updatedExerciseIds.length === 0) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setRecentlyUpdatedLoads({});
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [recentlyUpdatedLoads]);

  const handleToggleExerciseImage = (exerciseId: string, imageCount: number) => {
    if (imageCount < 2) return;

    setActiveImageIndexes((prev) => ({
      ...prev,
      [exerciseId]: prev[exerciseId] === 1 ? 0 : 1
    }));
  };

  const handleUpdateLoad = (exerciseId: string, value: number | string, fallback: number) => {
    const nextLoad = getSafeNumber(Number(value), fallback);

    setLoadValues((prev) => ({
      ...prev,
      [exerciseId]: nextLoad
    }));

    if (nextLoad === fallback) {
      return;
    }

    onUpdateLoad(exerciseId, nextLoad);
    setRecentlyUpdatedLoads((prev) => ({
      ...prev,
      [exerciseId]: true
    }));
  };

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
        {workout.exercises.map((exercise) => {
          const displayName = exercise.ptName ?? exercise.name;
          const mediaUrls = Array.isArray(exercise.mediaUrls) && exercise.mediaUrls.length > 0
            ? exercise.mediaUrls
            : exercise.mediaUrl ? [exercise.mediaUrl] : [];
          const activeImageIndex = mediaUrls.length > 1 ? activeImageIndexes[exercise.id] ?? 0 : 0;
          const activeImageUrl = mediaUrls[activeImageIndex] ?? null;
          const currentLoad = loadValues[exercise.id] ?? exercise.loadKg;
          const loadWasUpdated = recentlyUpdatedLoads[exercise.id] ?? false;

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
              <div className="workout-exercise-card__meta">
                <StatPill label="Repetições" value={exercise.reps} />
                <StatPill label="Séries" value={exercise.sets} />
                <StatPill label={<span className="stat-pill__icon"><Timer size={14} /></span>} value={`${exercise.restSeconds}s`} />
              </div>
              <NumberInput
                id={`load-${exercise.id}`}
                label="Carga (kg)"
                min={0}
                value={currentLoad}
                onChange={(_, state) => handleUpdateLoad(exercise.id, state.value, exercise.loadKg)}
              />
              <div className={`workout-load-status${loadWasUpdated ? ' workout-load-status--saved' : ''}`}>
                {loadWasUpdated ? `Carga atualizada para ${currentLoad} kg` : `Carga atual: ${currentLoad} kg`}
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
