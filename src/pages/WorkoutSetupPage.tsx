import { Archive, ArrowDown, ArrowUp, CheckmarkFilled, ChevronLeft, DocumentDownload, DocumentImport, TrashCan, Undo } from '@carbon/icons-react';
import { Button, TextArea, TextInput, Tile } from '@carbon/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppNumberInput } from '../components/AppNumberInput';
import { ContextualTutorialCard, type TutorialStepContent } from '../components/ContextualTutorialCard';
import { InfoBlock } from '../components/InfoBlock';
import { SelectionSummaryCard } from '../components/SelectionSummaryCard';
import { MuscleGroup, Workout, WorkoutExercise, WorkoutExerciseSet } from '../data/types';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { searchExercises, type ExerciseOption } from '../services/exercises';
import { PageContainer } from '../components/PageContainer';
import { getExerciseDisplayName } from '../lib/exerciseNames';
import { isValidWorkoutForSave, isValidWorkoutExerciseForSave } from '../lib/validation';
import { createWorkoutExerciseSets, normalizeWorkoutExerciseSets, summarizeWorkoutExerciseSets } from '../lib/workoutSets';
import { createWorkoutExportText, getWorkoutExportFileName, parseImportedWorkoutFile } from '../lib/workoutSharing';

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
  notes: '',
  loadKg: 10,
  reps: 10,
  sets: 3,
  restSeconds: 60
};

function resizeExerciseSets(
  currentSets: WorkoutExerciseSet[],
  exerciseId: string,
  count: number,
  loadKg: number,
  reps: number
): WorkoutExerciseSet[] {
  const setCount = Math.max(1, Math.floor(count));

  return Array.from({ length: setCount }, (_, index) => (
    currentSets[index] ?? {
      id: `${exerciseId}-set-${index + 1}`,
      loadKg,
      reps,
      done: false
    }
  ));
}

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
  const lastAutoSavedWorkoutKeyRef = useRef('');
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [setupSection, setSetupSection] = useState<'builder' | 'saved'>('builder');
  const [workoutListTab, setWorkoutListTab] = useState<'active' | 'archived'>('active');
  const [importMessage, setImportMessage] = useState('');
  const [activePreviewImageIndex, setActivePreviewImageIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<ExerciseOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [searchErrorMessage, setSearchErrorMessage] = useState('');
  const [name, setName] = useState('');
  const [draftExercises, setDraftExercises] = useState<WorkoutExercise[]>([]);
  const [exerciseName, setExerciseName] = useState(defaultExerciseValues.name);
  const [exercisePtName, setExercisePtName] = useState<string | undefined>(defaultExerciseValues.ptName);
  const [exerciseGroup, setExerciseGroup] = useState<MuscleGroup>(defaultExerciseValues.muscleGroup);
  const [exerciseMediaUrl, setExerciseMediaUrl] = useState<string | null>(defaultExerciseValues.mediaUrl);
  const [exerciseMediaUrls, setExerciseMediaUrls] = useState<string[]>(defaultExerciseValues.mediaUrls);
  const [exerciseMediaType, setExerciseMediaType] = useState<WorkoutExercise['mediaType']>(defaultExerciseValues.mediaType);
  const [exerciseSourceId, setExerciseSourceId] = useState<string | undefined>(defaultExerciseValues.sourceId);
  const [exerciseNotes, setExerciseNotes] = useState(defaultExerciseValues.notes);
  const [loadKg, setLoadKg] = useState(defaultExerciseValues.loadKg);
  const [reps, setReps] = useState(defaultExerciseValues.reps);
  const [sets, setSets] = useState(defaultExerciseValues.sets);
  const [exerciseSets, setExerciseSets] = useState<WorkoutExerciseSet[]>(() => (
    createWorkoutExerciseSets('draft-exercise', defaultExerciseValues.sets, defaultExerciseValues.loadKg, defaultExerciseValues.reps)
  ));
  const [restSeconds, setRestSeconds] = useState(defaultExerciseValues.restSeconds);
  const [hasTriedAddExercise, setHasTriedAddExercise] = useState(false);
  const [hasTriedSaveWorkout, setHasTriedSaveWorkout] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 200);
  const activeWorkouts = useMemo(() => workouts.filter((workout) => !workout.archivedAt), [workouts]);
  const archivedWorkouts = useMemo(() => workouts.filter((workout) => Boolean(workout.archivedAt)), [workouts]);
  const visibleWorkouts = workoutListTab === 'active' ? activeWorkouts : archivedWorkouts;

  const canAddExercise = useMemo(() => exerciseName.trim().length > 0 && Boolean(exerciseSourceId), [exerciseName, exerciseSourceId]);
  const derivedWorkoutGroups = useMemo(() => Array.from(new Set(draftExercises.map((exercise) => exercise.muscleGroup))), [draftExercises]);
  const canSaveWorkout = useMemo(() => name.trim().length > 0 && draftExercises.length > 0, [name, draftExercises.length]);
  const exerciseFormMessage = hasTriedAddExercise && !exerciseName.trim()
    ? 'Busque e selecione um exercício para adicionar.'
    : hasTriedAddExercise && !exerciseSourceId
      ? 'Escolha um exercício da lista para evitar salvar dados incompletos.'
      : hasTriedAddExercise && (reps <= 0 || sets <= 0)
        ? 'Repetições e séries precisam ser maiores que zero.'
        : '';
  const workoutFormMessage = hasTriedSaveWorkout && !name.trim()
    ? 'Dê um nome ao treino para salvar.'
    : hasTriedSaveWorkout && draftExercises.length === 0
      ? 'Adicione pelo menos um exercício para salvar o treino.'
      : '';
  const showNoExerciseResults = debouncedQuery.trim().length > 0
    && !exerciseSourceId
    && !isLoadingOptions
    && !searchErrorMessage
    && options.length === 0;

  useEffect(() => {
    let isActive = true;
    const trimmedQuery = debouncedQuery.trim();

    if (!trimmedQuery) {
      setIsLoadingOptions(false);
      setSearchErrorMessage('');
      setOptions([]);
      return undefined;
    }

    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      setIsLoadingOptions(false);
      setSearchErrorMessage('');
      setOptions([]);
      return undefined;
    }

    setIsLoadingOptions(true);
    setSearchErrorMessage('');

    void searchExercises(trimmedQuery, 20).then((nextOptions) => {
      if (!isActive) {
        return;
      }

      setIsLoadingOptions(false);
      setOptions(nextOptions);
    }).catch(() => {
      if (!isActive) {
        return;
      }

      setIsLoadingOptions(false);
      setOptions([]);
      setSearchErrorMessage('Não foi possível carregar os exercícios. Tente novamente.');
    });

    return () => {
      isActive = false;
    };
  }, [debouncedQuery]);

  const buildWorkoutForSave = (
    workoutId: string,
    workoutName: string,
    exercises: WorkoutExercise[]
  ): Workout | null => {
    const normalizedExercises = exercises.map((exercise) => {
      const nextSets = normalizeWorkoutExerciseSets(exercise).map((set) => ({ ...set, done: false }));
      const setSummary = summarizeWorkoutExerciseSets(nextSets);

      return {
        ...exercise,
        ...setSummary,
        setsDetail: nextSets
      };
    });
    const savedWorkout = workouts.find((workout) => workout.id === workoutId);
    const nextWorkout: Workout = {
      id: workoutId,
      name: workoutName.trim(),
      muscleGroups: Array.from(new Set(normalizedExercises.map((exercise) => exercise.muscleGroup))),
      exercises: normalizedExercises,
      archivedAt: savedWorkout?.archivedAt ?? null
    };

    return isValidWorkoutForSave(nextWorkout) ? nextWorkout : null;
  };

  const persistWorkout = (workout: Workout) => {
    onSaveWorkouts(workouts.some((item) => item.id === workout.id)
      ? workouts.map((item) => item.id === workout.id ? workout : item)
      : [...workouts, workout]);
    setEditingWorkoutId(workout.id);
  };

  useEffect(() => {
    if (!name.trim() || draftExercises.length === 0 || editingExerciseId) {
      return undefined;
    }

    const workoutId = editingWorkoutId ?? crypto.randomUUID();
    const nextWorkout = buildWorkoutForSave(workoutId, name, draftExercises);

    if (!nextWorkout) {
      return undefined;
    }

    const autoSaveKey = JSON.stringify(nextWorkout);

    if (autoSaveKey === lastAutoSavedWorkoutKeyRef.current) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      lastAutoSavedWorkoutKeyRef.current = autoSaveKey;
      persistWorkout(nextWorkout);
    }, 650);

    return () => window.clearTimeout(timeoutId);
  }, [draftExercises, editingExerciseId, editingWorkoutId, name, workouts, onSaveWorkouts]);

  const resetExerciseForm = () => {
    setHasTriedAddExercise(false);
    setEditingExerciseId(null);
    setQuery('');
    setExerciseName(defaultExerciseValues.name);
    setExercisePtName(defaultExerciseValues.ptName);
    setExerciseGroup(defaultExerciseValues.muscleGroup);
    setExerciseMediaUrl(defaultExerciseValues.mediaUrl);
    setExerciseMediaUrls(defaultExerciseValues.mediaUrls);
    setExerciseMediaType(defaultExerciseValues.mediaType);
    setExerciseSourceId(defaultExerciseValues.sourceId);
    setExerciseNotes(defaultExerciseValues.notes);
    setLoadKg(defaultExerciseValues.loadKg);
    setReps(defaultExerciseValues.reps);
    setSets(defaultExerciseValues.sets);
    setExerciseSets(createWorkoutExerciseSets('draft-exercise', defaultExerciseValues.sets, defaultExerciseValues.loadKg, defaultExerciseValues.reps));
    setRestSeconds(defaultExerciseValues.restSeconds);
    setActivePreviewImageIndex(0);
    setIsLoadingOptions(false);
    setSearchErrorMessage('');
    setOptions([]);
  };

  const handleSetCountChange = (value: number | string) => {
    const nextSetCount = typeof value === 'number' ? Math.max(1, Math.floor(value)) : sets;

    setSets(nextSetCount);
    setExerciseSets((prev) => resizeExerciseSets(prev, editingExerciseId ?? 'draft-exercise', nextSetCount, loadKg, reps));
  };

  const handleDefaultLoadChange = (value: number | string) => {
    const nextLoad = typeof value === 'number' ? value : loadKg;

    setLoadKg(nextLoad);
    setExerciseSets((prev) => prev.map((set) => ({ ...set, loadKg: nextLoad })));
  };

  const handleDefaultRepsChange = (value: number | string) => {
    const nextReps = typeof value === 'number' ? value : reps;

    setReps(nextReps);
    setExerciseSets((prev) => prev.map((set) => ({ ...set, reps: nextReps })));
  };

  const handleExerciseSetChange = (
    setId: string,
    patch: Partial<Pick<WorkoutExerciseSet, 'loadKg' | 'reps'>>
  ) => {
    setExerciseSets((prev) => prev.map((set) => set.id === setId ? { ...set, ...patch } : set));
  };

  const resetWorkoutForm = () => {
    lastAutoSavedWorkoutKeyRef.current = '';
    setHasTriedSaveWorkout(false);
    setEditingWorkoutId(null);
    setName('');
    setDraftExercises([]);
    resetExerciseForm();
  };

  const handleSelectExercise = (exercise: ExerciseOption) => {
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
    setHasTriedAddExercise(true);

    if (!canAddExercise) return;

    const exerciseId = editingExerciseId ?? crypto.randomUUID();
    const nextSets = exerciseSets.map((set, index) => ({
      ...set,
      id: `${exerciseId}-set-${index + 1}`,
      done: false
    }));
    const setSummary = summarizeWorkoutExerciseSets(nextSets);
    const nextExercise: WorkoutExercise = {
      id: exerciseId,
      source: 'local',
      sourceId: exerciseSourceId,
      name: exerciseName.trim(),
      ptName: exercisePtName,
      notes: exerciseNotes.trim() || undefined,
      muscleGroup: exerciseGroup,
      mediaType: exerciseMediaType,
      mediaUrl: exerciseMediaUrl,
      mediaUrls: exerciseMediaUrls,
      loadKg: setSummary.loadKg,
      reps: setSummary.reps,
      sets: setSummary.sets,
      setsDetail: nextSets,
      restSeconds,
      done: false
    };

    if (!isValidWorkoutExerciseForSave(nextExercise)) {
      return;
    }

    setDraftExercises((prev) => editingExerciseId
      ? prev.map((exercise) => exercise.id === editingExerciseId ? nextExercise : exercise)
      : [...prev, nextExercise]);

    setHasTriedAddExercise(false);
    resetExerciseForm();
  };

  const handleEditExercise = (exercise: WorkoutExercise) => {
    const displayName = getExerciseDisplayName(exercise.sourceId, exercise.name, exercise.ptName);

    skipNextSearchRef.current = true;
    setEditingExerciseId(exercise.id);
    setQuery(displayName);
    setExerciseName(exercise.name);
    setExercisePtName(displayName);
    setExerciseGroup(exercise.muscleGroup);
    setExerciseMediaUrl(exercise.mediaUrl);
    setExerciseMediaUrls(exercise.mediaUrls ?? (exercise.mediaUrl ? [exercise.mediaUrl] : []));
    setExerciseMediaType(exercise.mediaType);
    setExerciseSourceId(exercise.sourceId);
    setExerciseNotes(exercise.notes ?? '');
    setLoadKg(exercise.loadKg);
    setReps(exercise.reps);
    setSets(exercise.sets);
    setExerciseSets(normalizeWorkoutExerciseSets(exercise));
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

  const handleMoveExercise = (exerciseId: string, direction: -1 | 1) => {
    setDraftExercises((prev) => {
      const currentIndex = prev.findIndex((exercise) => exercise.id === exerciseId);
      const nextIndex = currentIndex + direction;

      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= prev.length) {
        return prev;
      }

      const nextExercises = [...prev];
      [nextExercises[currentIndex], nextExercises[nextIndex]] = [nextExercises[nextIndex], nextExercises[currentIndex]];
      return nextExercises;
    });
  };

  const handleSaveWorkout = () => {
    setHasTriedSaveWorkout(true);

    if (!canSaveWorkout) return;

    const nextWorkout = buildWorkoutForSave(editingWorkoutId ?? crypto.randomUUID(), name, draftExercises);

    if (!nextWorkout) {
      return;
    }

    lastAutoSavedWorkoutKeyRef.current = JSON.stringify(nextWorkout);
    persistWorkout(nextWorkout);
    setHasTriedSaveWorkout(false);
    resetWorkoutForm();
    setSetupSection('saved');
  };

  const handleEditWorkout = (workout: Workout) => {
    setSetupSection('builder');
    lastAutoSavedWorkoutKeyRef.current = JSON.stringify(workout);
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

  const handleArchiveWorkout = (workoutId: string) => {
    onSaveWorkouts(workouts.map((workout) => (
      workout.id === workoutId
        ? { ...workout, archivedAt: new Date().toISOString() }
        : workout
    )));

    if (editingWorkoutId === workoutId) {
      resetWorkoutForm();
    }
  };

  const handleRestoreWorkout = (workoutId: string) => {
    onSaveWorkouts(workouts.map((workout) => (
      workout.id === workoutId
        ? { ...workout, archivedAt: null }
        : workout
    )));
  };

  const handleExportWorkout = (workout: Workout) => {
    const fileText = createWorkoutExportText(workout);
    const file = new Blob([fileText], { type: 'application/json' });
    const fileUrl = URL.createObjectURL(file);
    const link = document.createElement('a');

    link.href = fileUrl;
    link.download = getWorkoutExportFileName(workout);
    link.click();
    URL.revokeObjectURL(fileUrl);
  };

  const handleImportWorkout = async (file: File | null) => {
    if (!file) {
      return;
    }

    const result = parseImportedWorkoutFile(await file.text());

    if (!result.success || !result.workout) {
      setImportMessage(result.message ?? 'Não foi possível importar este treino.');
      return;
    }

    onSaveWorkouts([...workouts, result.workout]);
    setWorkoutListTab('active');
    setImportMessage(`Treino "${result.workout.name}" importado.`);
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
        <Tile className="card metric-card ux-guide-card">
          <div>
            <span className="meta-label">Fluxo recomendado</span>
            <h3>Crie uma ficha antes de acompanhar o treino do dia</h3>
            <p>Dê um nome ao treino, selecione exercícios da busca e ajuste séries, cargas e descanso. Depois o treino aparece na tela inicial para marcar a execução.</p>
          </div>
          <div className="ux-guide-card__steps">
            <span className={setupSection === 'builder' ? 'ux-guide-card__step ux-guide-card__step--active' : 'ux-guide-card__step'}>1. Montar ficha</span>
            <span className={setupSection === 'saved' ? 'ux-guide-card__step ux-guide-card__step--active' : 'ux-guide-card__step'}>2. Gerenciar salvos</span>
          </div>
        </Tile>
        <div className="setup-section-nav" role="tablist" aria-label="Cadastro de treino">
          <Button
            kind={setupSection === 'builder' ? 'primary' : 'tertiary'}
            size="sm"
            role="tab"
            aria-selected={setupSection === 'builder'}
            onClick={() => setSetupSection('builder')}
          >
            1. Montar treino
          </Button>
          <Button
            kind={setupSection === 'saved' ? 'primary' : 'tertiary'}
            size="sm"
            role="tab"
            aria-selected={setupSection === 'saved'}
            onClick={() => setSetupSection('saved')}
          >
            2. Treinos salvos ({workouts.length})
          </Button>
        </div>
        {setupSection === 'builder' ? (
        <Tile className="card metric-card setup-card">
          <div className="setup-flow-steps" aria-label="Etapas para criar um treino">
            <span>1. Nome do treino</span>
            <span>2. Buscar exercício</span>
            <span>3. Ajustar séries</span>
            <span>4. Revisar e salvar</span>
          </div>
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
          <TextInput id="workout-name" labelText="1. Nome do treino" value={name} onChange={(event) => setName(event.target.value)} />
          <div className="setup-card__fields setup-card__fields--single">
            <TextInput
              id="exercise-search"
              labelText="2. Buscar exercício"
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
                setExerciseNotes(defaultExerciseValues.notes);
                setActivePreviewImageIndex(0);
                setSearchErrorMessage('');
              }}
              onBlur={() => window.setTimeout(() => setOptions([]), 150)}
            />
          </div>
          {isLoadingOptions ? <p className="form-message">Carregando exercícios...</p> : null}
          {searchErrorMessage ? <p className="form-message form-message--error">{searchErrorMessage}</p> : null}
          {showNoExerciseResults ? <p className="form-message">Nenhum exercício encontrado.</p> : null}
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
          <span className="setup-step-label">3. Ajustar séries e descanso</span>
          <div className="setup-card__metrics">
            <AppNumberInput id="exercise-load" label="Carga padrão (kg)" min={0} value={loadKg} onValueChange={handleDefaultLoadChange} />
            <AppNumberInput id="exercise-reps" label="Repetições padrão" min={1} value={reps} onValueChange={handleDefaultRepsChange} />
            <AppNumberInput id="exercise-sets" label="Séries" min={1} value={sets} onValueChange={handleSetCountChange} />
            <AppNumberInput id="exercise-rest" label="Descanso (s)" min={0} value={restSeconds} onValueChange={setRestSeconds} />
          </div>
          <div className="workout-set-list workout-set-list--setup">
            {exerciseSets.map((set, setIndex) => (
              <div key={set.id} className="workout-set-row">
                <div className="workout-set-row__info">
                  <span className="workout-set-row__label">Série {setIndex + 1}</span>
                </div>
                <div className="workout-set-row__field">
                  <AppNumberInput
                    id={`setup-load-${set.id}`}
                    label="Carga (kg)"
                    min={0}
                    value={set.loadKg}
                    onValueChange={(value) => handleExerciseSetChange(set.id, { loadKg: typeof value === 'number' ? value : set.loadKg })}
                  />
                </div>
                <div className="workout-set-row__field">
                  <AppNumberInput
                    id={`setup-reps-${set.id}`}
                    label="Repetições"
                    min={1}
                    value={set.reps}
                    onValueChange={(value) => handleExerciseSetChange(set.id, { reps: typeof value === 'number' ? value : set.reps })}
                  />
                </div>
              </div>
            ))}
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
          <TextArea
            id="exercise-notes"
            labelText="Observação do exercício"
            rows={3}
            value={exerciseNotes}
            onChange={(event) => setExerciseNotes(event.target.value)}
          />
          <div className="inline-actions">
            <Button onClick={handleAddExercise}>{editingExerciseId ? 'Atualizar exercício' : 'Adicionar exercício'}</Button>
            {editingExerciseId ? <Button kind="ghost" onClick={resetExerciseForm}>Cancelar edição</Button> : null}
          </div>
          {exerciseFormMessage ? <p className="form-message form-message--error">{exerciseFormMessage}</p> : null}
         

          <span className="setup-step-label">4. Revisar exercícios adicionados</span>
          <div className="stack">
            {draftExercises.length > 0 ? draftExercises.map((exercise, index) => (
              <SelectionSummaryCard
                key={exercise.id}
                label={`Exercício ${index + 1}`}
                title={getExerciseDisplayName(exercise.sourceId, exercise.name, exercise.ptName)}
                labelActions={(
                  <>
                    <Button
                      kind="ghost"
                      size="sm"
                      hasIconOnly
                      renderIcon={ArrowUp}
                      iconDescription="Mover exercício para cima"
                      disabled={index === 0}
                      onClick={() => handleMoveExercise(exercise.id, -1)}
                    />
                    <Button
                      kind="ghost"
                      size="sm"
                      hasIconOnly
                      renderIcon={ArrowDown}
                      iconDescription="Mover exercício para baixo"
                      disabled={index === draftExercises.length - 1}
                      onClick={() => handleMoveExercise(exercise.id, 1)}
                    />
                  </>
                )}
                actions={(
                  <>
                    <Button kind="ghost" size="sm" onClick={() => handleEditExercise(exercise)}>Editar</Button>
                    <Button kind="ghost" size="sm" renderIcon={TrashCan} iconDescription="Remover exercício" onClick={() => handleRemoveExercise(exercise.id)}>Remover</Button>
                  </>
                )}
                meta={[
                  exercise.muscleGroup,
                  exercise.notes?.trim() ? `Obs: ${exercise.notes.trim()}` : '',
                  normalizeWorkoutExerciseSets(exercise).map((set, setIndex) => `S${setIndex + 1}: ${set.loadKg} kg x ${set.reps}`).join(' • '),
                  `${exercise.restSeconds}s`
                ].filter(Boolean)}
              />
            )) : (
              <InfoBlock label="Exercícios do treino">
                Busque um exercício acima, selecione uma opção da lista e toque em “Adicionar exercício”.
              </InfoBlock>
            )}
          </div>
          <div className="setup-card__footer">
            <div className="inline-actions">
              <Button onClick={handleSaveWorkout}>{editingWorkoutId ? 'Atualizar treino' : 'Salvar treino'}</Button>
              {editingWorkoutId ? <Button kind="ghost" onClick={resetWorkoutForm}>Cancelar edição</Button> : null}
            </div>
            {canSaveWorkout ? <p className="form-message form-message--success">Tudo pronto para salvar. O botão conclui e limpa o formulário para o próximo cadastro.</p> : null}
            {workoutFormMessage ? <p className="form-message form-message--error">{workoutFormMessage}</p> : null}
          </div>
        </Tile>
        ) : null}

        {setupSection === 'saved' ? (
        <Tile className="card metric-card setup-card">
          <div className="card-head">
            <div className="card-head__group">
              <div className="icon-badge icon-badge--primary card-head__badge">
                <CheckmarkFilled size={20} />
              </div>
              <div className="card-head__title">
                <h3>Treinos salvos</h3>
                <p>Arquive fichas antigas, restaure quando quiser ou compartilhe por arquivo</p>
              </div>
            </div>
          </div>
          <div className="workout-list-tools">
            <div className="workout-tabs" role="tablist" aria-label="Lista de treinos">
              <Button
                kind={workoutListTab === 'active' ? 'primary' : 'tertiary'}
                size="sm"
                role="tab"
                aria-selected={workoutListTab === 'active'}
                onClick={() => setWorkoutListTab('active')}
              >
                Ativos ({activeWorkouts.length})
              </Button>
              <Button
                kind={workoutListTab === 'archived' ? 'primary' : 'tertiary'}
                size="sm"
                role="tab"
                aria-selected={workoutListTab === 'archived'}
                onClick={() => setWorkoutListTab('archived')}
              >
                Arquivados ({archivedWorkouts.length})
              </Button>
            </div>
            <input
              ref={importInputRef}
              className="visually-hidden"
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                void handleImportWorkout(event.target.files?.[0] ?? null);
                event.target.value = '';
              }}
            />
            <Button
              kind="tertiary"
              size="sm"
              renderIcon={DocumentImport}
              iconDescription="Importar treino"
              onClick={() => importInputRef.current?.click()}
            >
              Importar
            </Button>
          </div>
          {importMessage ? <p className="form-message">{importMessage}</p> : null}
          <div className="stack">
            {visibleWorkouts.length > 0 ? visibleWorkouts.map((workout) => (
              <SelectionSummaryCard
                key={workout.id}
                label={`${workout.exercises.length} exercício(s)`}
                title={workout.name}
                actions={(
                  <>
                    <Button kind="ghost" size="sm" onClick={() => handleEditWorkout(workout)}>Editar</Button>
                    <Button kind="ghost" size="sm" renderIcon={DocumentDownload} iconDescription="Exportar treino" onClick={() => handleExportWorkout(workout)}>Exportar</Button>
                    {workout.archivedAt ? (
                      <Button kind="ghost" size="sm" renderIcon={Undo} iconDescription="Restaurar treino" onClick={() => handleRestoreWorkout(workout.id)}>Restaurar</Button>
                    ) : (
                      <Button kind="ghost" size="sm" renderIcon={Archive} iconDescription="Arquivar treino" onClick={() => handleArchiveWorkout(workout.id)}>Arquivar</Button>
                    )}
                    <Button kind="ghost" size="sm" renderIcon={TrashCan} iconDescription="Remover treino" onClick={() => handleRemoveWorkout(workout.id)}>Remover</Button>
                  </>
                )}
                meta={workout.archivedAt ? [...workout.muscleGroups, 'Arquivado'] : workout.muscleGroups}
              />
            )) : (
              <InfoBlock label={workoutListTab === 'active' ? 'Treinos ativos' : 'Treinos arquivados'}>
                {workoutListTab === 'active'
                  ? 'Nenhum treino ativo salvo ainda.'
                  : 'Nenhum treino arquivado ainda.'}
              </InfoBlock>
            )}
          </div>
        </Tile>
        ) : null}
      </div>
    </PageContainer>
  );
}
