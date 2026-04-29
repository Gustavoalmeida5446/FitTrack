import { CheckmarkFilled, ChevronLeft, Search, TrashCan } from '@carbon/icons-react';
import { Button, TextInput, Tile } from '@carbon/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppNumberInput } from '../components/AppNumberInput';
import { ContextualTutorialCard, type TutorialStepContent } from '../components/ContextualTutorialCard';
import { InfoBlock } from '../components/InfoBlock';
import { SelectionSummaryCard } from '../components/SelectionSummaryCard';
import { MuscleGroup, Workout, WorkoutExercise } from '../data/types';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { searchExercises } from '../services/exercises';
import { PageContainer } from '../components/PageContainer';
import { isValidWorkout, isValidWorkoutExercise } from '../lib/validation';

interface Props {
  onBack: () => void;
  workouts: Workout[];
  onSaveWorkouts: (workouts: Workout[]) => void;
  tutorialStep: TutorialStepContent | null;
  tutorialStepIndex: number;
  tutorialStepsTotal: number;
  onTutorialBack: () => void;
  onTutorialNext: () => void;
  onTutorialSkip: () => void;
}

const defaultExerciseValues = {
  name: '',
  ptName: undefined as string | undefined,
  muscleGroup: 'Peito' as MuscleGroup,
  mediaUrl: null as string | null,
  mediaUrls: [] as string[],
  mediaType: 'none' as WorkoutExercise['mediaType'],
  sourceId: undefined as string | undefined,
  loadKg: 10,
  reps: 10,
  sets: 3,
  restSeconds: 60
};

export function WorkoutSetupPage({
  onBack,
  workouts,
  onSaveWorkouts,
  tutorialStep,
  tutorialStepIndex,
  tutorialStepsTotal,
  onTutorialBack,
  onTutorialNext,
  onTutorialSkip
}: Props) {
  const skipNextSearchRef = useRef(false);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [activePreviewImageIndex, setActivePreviewImageIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<ReturnType<typeof searchExercises>>([]);
  const [name, setName] = useState('');
  const [draftExercises, setDraftExercises] = useState<WorkoutExercise[]>([]);
  const [exerciseName, setExerciseName] = useState(defaultExerciseValues.name);
  const [exercisePtName, setExercisePtName] = useState<string | undefined>(defaultExerciseValues.ptName);
  const [exerciseGroup, setExerciseGroup] = useState<MuscleGroup>(defaultExerciseValues.muscleGroup);
  const [exerciseMediaUrl, setExerciseMediaUrl] = useState<string | null>(defaultExerciseValues.mediaUrl);
  const [exerciseMediaUrls, setExerciseMediaUrls] = useState<string[]>(defaultExerciseValues.mediaUrls);
  const [exerciseMediaType, setExerciseMediaType] = useState<WorkoutExercise['mediaType']>(defaultExerciseValues.mediaType);
  const [exerciseSourceId, setExerciseSourceId] = useState<string | undefined>(defaultExerciseValues.sourceId);
  const [loadKg, setLoadKg] = useState(defaultExerciseValues.loadKg);
  const [reps, setReps] = useState(defaultExerciseValues.reps);
  const [sets, setSets] = useState(defaultExerciseValues.sets);
  const [restSeconds, setRestSeconds] = useState(defaultExerciseValues.restSeconds);
  const debouncedQuery = useDebouncedValue(query, 200);

  const canAddExercise = useMemo(() => exerciseName.trim().length > 0 && Boolean(exerciseSourceId), [exerciseName, exerciseSourceId]);
  const derivedWorkoutGroups = useMemo(() => Array.from(new Set(draftExercises.map((exercise) => exercise.muscleGroup))), [draftExercises]);
  const canSaveWorkout = useMemo(() => name.trim().length > 0 && draftExercises.length > 0, [name, draftExercises.length]);
  const exerciseFormMessage = !exerciseName.trim()
    ? 'Busque e selecione um exercício para adicionar.'
    : !exerciseSourceId
      ? 'Escolha um exercício da lista para evitar salvar dados incompletos.'
      : reps <= 0 || sets <= 0
        ? 'Repetições e séries precisam ser maiores que zero.'
        : '';
  const workoutFormMessage = !name.trim()
    ? 'Dê um nome ao treino para salvar.'
    : draftExercises.length === 0
      ? 'Adicione pelo menos um exercício para salvar o treino.'
      : '';

  useEffect(() => {
    const trimmedQuery = debouncedQuery.trim();

    if (!trimmedQuery) {
      setOptions([]);
      return;
    }

    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      setOptions([]);
      return;
    }

    setOptions(searchExercises(trimmedQuery, 20));
  }, [debouncedQuery]);

  const resetExerciseForm = () => {
    setEditingExerciseId(null);
    setQuery('');
    setExerciseName(defaultExerciseValues.name);
    setExercisePtName(defaultExerciseValues.ptName);
    setExerciseGroup(defaultExerciseValues.muscleGroup);
    setExerciseMediaUrl(defaultExerciseValues.mediaUrl);
    setExerciseMediaUrls(defaultExerciseValues.mediaUrls);
    setExerciseMediaType(defaultExerciseValues.mediaType);
    setExerciseSourceId(defaultExerciseValues.sourceId);
    setLoadKg(defaultExerciseValues.loadKg);
    setReps(defaultExerciseValues.reps);
    setSets(defaultExerciseValues.sets);
    setRestSeconds(defaultExerciseValues.restSeconds);
    setActivePreviewImageIndex(0);
    setOptions([]);
  };

  const resetWorkoutForm = () => {
    setEditingWorkoutId(null);
    setName('');
    setDraftExercises([]);
    resetExerciseForm();
  };

  const handleSelectExercise = (exercise: ReturnType<typeof searchExercises>[number]) => {
    skipNextSearchRef.current = true;
    setQuery(exercise.ptName ?? exercise.name);
    setExerciseName(exercise.name);
    setExercisePtName(exercise.ptName);
    setExerciseGroup(exercise.muscleGroup);
    setExerciseMediaUrl(exercise.mediaUrl);
    setExerciseMediaUrls(exercise.mediaUrls);
    setExerciseMediaType(exercise.mediaType);
    setExerciseSourceId(exercise.sourceId);
    setActivePreviewImageIndex(0);
    setOptions([]);
  };

  const handleAddExercise = () => {
    if (!canAddExercise) return;

    const nextExercise: WorkoutExercise = {
      id: editingExerciseId ?? crypto.randomUUID(),
      source: 'local',
      sourceId: exerciseSourceId,
      name: exerciseName.trim(),
      ptName: exercisePtName,
      muscleGroup: exerciseGroup,
      mediaType: exerciseMediaType,
      mediaUrl: exerciseMediaUrl,
      mediaUrls: exerciseMediaUrls,
      loadKg,
      reps,
      sets,
      restSeconds,
      done: false
    };

    if (!isValidWorkoutExercise(nextExercise)) {
      return;
    }

    setDraftExercises((prev) => editingExerciseId
      ? prev.map((exercise) => exercise.id === editingExerciseId ? nextExercise : exercise)
      : [...prev, nextExercise]);

    resetExerciseForm();
  };

  const handleEditExercise = (exercise: WorkoutExercise) => {
    skipNextSearchRef.current = true;
    setEditingExerciseId(exercise.id);
    setQuery(exercise.ptName ?? exercise.name);
    setExerciseName(exercise.name);
    setExercisePtName(exercise.ptName);
    setExerciseGroup(exercise.muscleGroup);
    setExerciseMediaUrl(exercise.mediaUrl);
    setExerciseMediaUrls(exercise.mediaUrls ?? (exercise.mediaUrl ? [exercise.mediaUrl] : []));
    setExerciseMediaType(exercise.mediaType);
    setExerciseSourceId(exercise.sourceId);
    setLoadKg(exercise.loadKg);
    setReps(exercise.reps);
    setSets(exercise.sets);
    setRestSeconds(exercise.restSeconds);
    setActivePreviewImageIndex(0);
    setOptions([]);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setDraftExercises((prev) => prev.filter((exercise) => exercise.id !== exerciseId));
    if (editingExerciseId === exerciseId) {
      resetExerciseForm();
    }
  };

  const handleSaveWorkout = () => {
    if (!canSaveWorkout) return;

    const nextWorkout: Workout = {
      id: editingWorkoutId ?? crypto.randomUUID(),
      name: name.trim(),
      muscleGroups: derivedWorkoutGroups,
      exercises: draftExercises.map((exercise) => ({
        ...exercise,
        done: false
      }))
    };

    if (!isValidWorkout(nextWorkout)) {
      return;
    }

    onSaveWorkouts(editingWorkoutId ? workouts.map((workout) => workout.id === editingWorkoutId ? nextWorkout : workout) : [...workouts, nextWorkout]);
    resetWorkoutForm();
  };

  const handleEditWorkout = (workout: Workout) => {
    setEditingWorkoutId(workout.id);
    setName(workout.name);
    setDraftExercises(workout.exercises.map((exercise) => ({ ...exercise })));
    resetExerciseForm();
  };

  const handleRemoveWorkout = (workoutId: string) => {
    onSaveWorkouts(workouts.filter((workout) => workout.id !== workoutId));

    if (editingWorkoutId === workoutId) {
      resetWorkoutForm();
    }
  };

  const previewImageUrl = exerciseMediaUrls[activePreviewImageIndex] ?? exerciseMediaUrl;
  const canTogglePreviewImage = exerciseMediaUrls.length > 1;

  return (
    <PageContainer title="Cadastro de treino" subtitle="Crie um treino, adicione exercícios e edite os treinos salvos" actions={<Button kind="ghost" size="sm" renderIcon={ChevronLeft} iconDescription="Voltar" onClick={onBack}>Voltar</Button>}>
      <div className="stack">
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
        <Tile className="card metric-card setup-card">
          <div className="card-head">
            <div className="card-head__group">
              <div className="icon-badge icon-badge--primary card-head__badge">
                <CheckmarkFilled size={20} />
              </div>
              <div className="card-head__title">
                <h3>{editingWorkoutId ? 'Editar treino' : 'Criar treino'}</h3>
                <p>Defina o treino e adicione os exercícios que fazem parte dele</p>
              </div>
            </div>
          </div>
          <TextInput id="workout-name" labelText="Nome do treino" value={name} onChange={(event) => setName(event.target.value)} />
          <div className="setup-card__fields setup-card__fields--single">
            <TextInput
              id="exercise-search"
              labelText="Buscar exercício"
              value={query}
              onChange={(event) => {
                const value = event.target.value;
                setQuery(value);
                setExerciseName(value);
                setExercisePtName(undefined);
                setExerciseGroup(defaultExerciseValues.muscleGroup);
                setExerciseMediaUrl(null);
                setExerciseMediaUrls([]);
                setExerciseMediaType('none');
                setExerciseSourceId(undefined);
                setActivePreviewImageIndex(0);
              }}
              onBlur={() => window.setTimeout(() => setOptions([]), 150)}
            />
          </div>
          {options.length > 0 ? (
            <ul className="search-list">
              {options.map((option) => (
                <li key={option.id}>
                  <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => handleSelectExercise(option)}>
                    <strong>{option.ptName ?? option.name}</strong>
                    {option.ptName && option.ptName !== option.name ? <span>{option.name}</span> : null}
                    <span>{option.muscleGroup}{option.equipment ? ` • ${option.equipment}` : ''}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="setup-card__metrics">
            <AppNumberInput id="exercise-load" label="Carga (kg)" min={0} value={loadKg} onValueChange={setLoadKg} />
            <AppNumberInput id="exercise-reps" label="Repetições" min={1} value={reps} onValueChange={setReps} />
            <AppNumberInput id="exercise-sets" label="Séries" min={1} value={sets} onValueChange={setSets} />
            <AppNumberInput id="exercise-rest" label="Descanso (s)" min={0} value={restSeconds} onValueChange={setRestSeconds} />
          </div>
          {previewImageUrl ? (
            <button
              type="button"
              className={`exercise-media-button exercise-media-button--preview${canTogglePreviewImage ? ' exercise-media-button--interactive' : ''}`}
              onClick={() => {
                if (!canTogglePreviewImage) return;
                setActivePreviewImageIndex((current) => current === 0 ? 1 : 0);
              }}
              aria-label={canTogglePreviewImage ? `Alternar imagem do exercício ${exerciseName || 'selecionado'}` : `Imagem do exercício ${exerciseName || 'selecionado'}`}
            >
              <img
                src={previewImageUrl}
                  alt={`${exercisePtName || exerciseName || 'Exercício'} - ${activePreviewImageIndex === 0 ? 'posição inicial' : 'posição final'}`}
                  className="exercise-media exercise-media--preview"
                />
              </button>
          ) : null}
          <div className="inline-actions">
            <Button disabled={!canAddExercise} onClick={handleAddExercise}>{editingExerciseId ? 'Atualizar exercício' : 'Adicionar exercício'}</Button>
            {editingExerciseId ? <Button kind="ghost" onClick={resetExerciseForm}>Cancelar edição</Button> : null}
          </div>
          {exerciseFormMessage ? <p className="form-message form-message--error">{exerciseFormMessage}</p> : null}
         

          <div className="stack">
            {draftExercises.length > 0 ? draftExercises.map((exercise, index) => (
              <SelectionSummaryCard
                key={exercise.id}
                label={`Exercício ${index + 1}`}
                title={exercise.ptName ?? exercise.name}
                actions={(
                  <>
                    <Button kind="ghost" size="sm" onClick={() => handleEditExercise(exercise)}>Editar</Button>
                    <Button kind="ghost" size="sm" renderIcon={TrashCan} iconDescription="Remover exercício" onClick={() => handleRemoveExercise(exercise.id)}>Remover</Button>
                  </>
                )}
                meta={[
                  exercise.muscleGroup,
                  `${exercise.loadKg} kg`,
                  `${exercise.sets}x${exercise.reps}`,
                  `${exercise.restSeconds}s`
                ]}
              />
            )) : (
              <InfoBlock label="Exercícios do treino">
                Adicione pelo menos um exercício para salvar o treino.
              </InfoBlock>
            )}
          </div>
          <div className="setup-card__footer">
            <div className="inline-actions">
              <Button disabled={!canSaveWorkout} onClick={handleSaveWorkout}>{editingWorkoutId ? 'Atualizar treino' : 'Salvar treino'}</Button>
              {editingWorkoutId ? <Button kind="ghost" onClick={resetWorkoutForm}>Cancelar edição</Button> : null}
            </div>
            {workoutFormMessage ? <p className="form-message form-message--error">{workoutFormMessage}</p> : null}
          </div>
        </Tile>

        <Tile className="card metric-card setup-card">
          <div className="card-head">
            <div className="card-head__group">
              <div className="icon-badge icon-badge--primary card-head__badge">
                <CheckmarkFilled size={20} />
              </div>
              <div className="card-head__title">
                <h3>Treinos salvos</h3>
                <p>Edite ou remova os treinos que já foram cadastrados</p>
              </div>
            </div>
          </div>
          <div className="stack">
            {workouts.length > 0 ? workouts.map((workout) => (
              <SelectionSummaryCard
                key={workout.id}
                label={`${workout.exercises.length} exercício(s)`}
                title={workout.name}
                actions={(
                  <>
                    <Button kind="ghost" size="sm" onClick={() => handleEditWorkout(workout)}>Editar</Button>
                    <Button kind="ghost" size="sm" renderIcon={TrashCan} iconDescription="Remover treino" onClick={() => handleRemoveWorkout(workout.id)}>Remover</Button>
                  </>
                )}
                meta={workout.muscleGroups}
              />
            )) : (
              <InfoBlock label="Treinos">
                Nenhum treino salvo ainda.
              </InfoBlock>
            )}
          </div>
        </Tile>
      </div>
    </PageContainer>
  );
}
