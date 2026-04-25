import { CheckmarkFilled, ChevronLeft, Search, TrashCan } from '@carbon/icons-react';
import { Button, Checkbox, NumberInput, Select, SelectItem, TextInput, Tile } from '@carbon/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MuscleGroup, Workout, WorkoutExercise } from '../data/types';
import { searchExercises } from '../services/exercises';
import { PageContainer } from '../components/PageContainer';

interface Props {
  onBack: () => void;
  workouts: Workout[];
  onSaveWorkouts: (workouts: Workout[]) => void;
}

const groups: MuscleGroup[] = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Core'];

const defaultExerciseValues = {
  name: '',
  muscleGroup: 'Peito' as MuscleGroup,
  mediaUrl: null as string | null,
  mediaType: 'none' as WorkoutExercise['mediaType'],
  source: 'manual' as WorkoutExercise['source'],
  sourceId: undefined as string | undefined,
  loadKg: 10,
  reps: 10,
  sets: 3,
  restSeconds: 60
};

function getSafeNumber(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

export function WorkoutSetupPage({ onBack, workouts, onSaveWorkouts }: Props) {
  const skipNextSearchRef = useRef(false);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<ReturnType<typeof searchExercises>>([]);
  const [name, setName] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<MuscleGroup[]>([]);
  const [draftExercises, setDraftExercises] = useState<WorkoutExercise[]>([]);
  const [exerciseName, setExerciseName] = useState(defaultExerciseValues.name);
  const [exerciseGroup, setExerciseGroup] = useState<MuscleGroup>(defaultExerciseValues.muscleGroup);
  const [exerciseMediaUrl, setExerciseMediaUrl] = useState<string | null>(defaultExerciseValues.mediaUrl);
  const [exerciseMediaType, setExerciseMediaType] = useState<WorkoutExercise['mediaType']>(defaultExerciseValues.mediaType);
  const [exerciseSource, setExerciseSource] = useState<WorkoutExercise['source']>(defaultExerciseValues.source);
  const [exerciseSourceId, setExerciseSourceId] = useState<string | undefined>(defaultExerciseValues.sourceId);
  const [loadKg, setLoadKg] = useState(defaultExerciseValues.loadKg);
  const [reps, setReps] = useState(defaultExerciseValues.reps);
  const [sets, setSets] = useState(defaultExerciseValues.sets);
  const [restSeconds, setRestSeconds] = useState(defaultExerciseValues.restSeconds);

  const canAddExercise = useMemo(() => exerciseName.trim().length > 0, [exerciseName]);
  const canSaveWorkout = useMemo(() => name.trim().length > 0 && selectedGroups.length > 0 && draftExercises.length > 0, [name, selectedGroups.length, draftExercises.length]);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setOptions([]);
      return;
    }

    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      setOptions([]);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setOptions(searchExercises(trimmedQuery).slice(0, 10));
    }, 200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  const resetExerciseForm = () => {
    setEditingExerciseId(null);
    setQuery('');
    setExerciseName(defaultExerciseValues.name);
    setExerciseGroup(defaultExerciseValues.muscleGroup);
    setExerciseMediaUrl(defaultExerciseValues.mediaUrl);
    setExerciseMediaType(defaultExerciseValues.mediaType);
    setExerciseSource(defaultExerciseValues.source);
    setExerciseSourceId(defaultExerciseValues.sourceId);
    setLoadKg(defaultExerciseValues.loadKg);
    setReps(defaultExerciseValues.reps);
    setSets(defaultExerciseValues.sets);
    setRestSeconds(defaultExerciseValues.restSeconds);
    setOptions([]);
  };

  const resetWorkoutForm = () => {
    setEditingWorkoutId(null);
    setName('');
    setSelectedGroups([]);
    setDraftExercises([]);
    resetExerciseForm();
  };

  const handleToggleGroup = (group: MuscleGroup) => {
    setSelectedGroups((prev) => prev.includes(group) ? prev.filter((item) => item !== group) : [...prev, group]);
  };

  const handleSelectExercise = (exercise: ReturnType<typeof searchExercises>[number]) => {
    skipNextSearchRef.current = true;
    setQuery(exercise.name);
    setExerciseName(exercise.name);
    setExerciseMediaUrl(exercise.mediaUrl);
    setExerciseMediaType(exercise.mediaType);
    setExerciseSource('local');
    setExerciseSourceId(exercise.sourceId);
    setOptions([]);
  };

  const handleAddExercise = () => {
    if (!canAddExercise) return;

    const nextExercise: WorkoutExercise = {
      id: editingExerciseId ?? crypto.randomUUID(),
      source: exerciseSource,
      sourceId: exerciseSourceId,
      name: exerciseName.trim(),
      muscleGroup: exerciseGroup,
      mediaType: exerciseMediaType,
      mediaUrl: exerciseMediaUrl,
      loadKg,
      reps,
      sets,
      restSeconds,
      done: false
    };

    setDraftExercises((prev) => editingExerciseId
      ? prev.map((exercise) => exercise.id === editingExerciseId ? nextExercise : exercise)
      : [...prev, nextExercise]);

    resetExerciseForm();
  };

  const handleEditExercise = (exercise: WorkoutExercise) => {
    skipNextSearchRef.current = true;
    setEditingExerciseId(exercise.id);
    setQuery(exercise.name);
    setExerciseName(exercise.name);
    setExerciseGroup(exercise.muscleGroup);
    setExerciseMediaUrl(exercise.mediaUrl);
    setExerciseMediaType(exercise.mediaType);
    setExerciseSource(exercise.source);
    setExerciseSourceId(exercise.sourceId);
    setLoadKg(exercise.loadKg);
    setReps(exercise.reps);
    setSets(exercise.sets);
    setRestSeconds(exercise.restSeconds);
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
      muscleGroups: selectedGroups,
      exercises: draftExercises.map((exercise) => ({
        ...exercise,
        done: false
      }))
    };

    onSaveWorkouts(editingWorkoutId ? workouts.map((workout) => workout.id === editingWorkoutId ? nextWorkout : workout) : [...workouts, nextWorkout]);
    resetWorkoutForm();
  };

  const handleEditWorkout = (workout: Workout) => {
    setEditingWorkoutId(workout.id);
    setName(workout.name);
    setSelectedGroups(workout.muscleGroups);
    setDraftExercises(workout.exercises.map((exercise) => ({ ...exercise })));
    resetExerciseForm();
  };

  const handleRemoveWorkout = (workoutId: string) => {
    onSaveWorkouts(workouts.filter((workout) => workout.id !== workoutId));

    if (editingWorkoutId === workoutId) {
      resetWorkoutForm();
    }
  };

  return (
    <PageContainer title="Cadastro de treino" subtitle="Crie um treino, adicione exercícios e edite os treinos salvos" actions={<Button kind="ghost" size="sm" renderIcon={ChevronLeft} iconDescription="Voltar" onClick={onBack}>Voltar</Button>}>
      <div className="stack">
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
          <div className="stack">
            <span className="meta-label">Grupos do treino</span>
            <div className="checkbox-grid">
              {groups.map((group) => (
                <Checkbox key={group} id={`workout-group-${group}`} labelText={group} checked={selectedGroups.includes(group)} onChange={() => handleToggleGroup(group)} />
              ))}
            </div>
          </div>

          <div className="setup-card__fields">
            <TextInput
              id="exercise-search"
              labelText="Buscar exercício"
              value={query}
              onChange={(event) => {
                const value = event.target.value;
                setQuery(value);
                setExerciseName(value);
                setExerciseMediaUrl(null);
                setExerciseMediaType('none');
                setExerciseSource('manual');
                setExerciseSourceId(undefined);
              }}
              onBlur={() => window.setTimeout(() => setOptions([]), 150)}
            />
            <Select id="exercise-group" labelText="Grupo muscular do exercício" value={exerciseGroup} onChange={(event) => setExerciseGroup(event.target.value as MuscleGroup)}>
              {groups.map((group) => (
                <SelectItem key={group} value={group} text={group} />
              ))}
            </Select>
          </div>
          {options.length > 0 ? (
            <ul className="search-list">
              {options.map((option) => (
                <li key={option.id}>
                  <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => handleSelectExercise(option)}>{option.name}</button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="setup-card__metrics">
            <NumberInput id="exercise-load" label="Carga (kg)" min={0} value={loadKg} onChange={(event) => setLoadKg(getSafeNumber(Number((event.target as HTMLInputElement).value), defaultExerciseValues.loadKg))} />
            <NumberInput id="exercise-reps" label="Repetições" min={1} value={reps} onChange={(event) => setReps(getSafeNumber(Number((event.target as HTMLInputElement).value), defaultExerciseValues.reps))} />
            <NumberInput id="exercise-sets" label="Séries" min={1} value={sets} onChange={(event) => setSets(getSafeNumber(Number((event.target as HTMLInputElement).value), defaultExerciseValues.sets))} />
            <NumberInput id="exercise-rest" label="Descanso (s)" min={0} value={restSeconds} onChange={(event) => setRestSeconds(getSafeNumber(Number((event.target as HTMLInputElement).value), defaultExerciseValues.restSeconds))} />
          </div>
          <div className="info-block">
            <span className="meta-label">Imagem</span>
            <p>{exerciseMediaUrl ? 'Este exercício vai usar a imagem certa da base local.' : 'Se não houver imagem na base, o exercício será salvo sem imagem.'}</p>
          </div>
          <div className="inline-actions">
            <Button disabled={!canAddExercise} onClick={handleAddExercise}>{editingExerciseId ? 'Atualizar exercício' : 'Adicionar exercício'}</Button>
            {editingExerciseId ? <Button kind="ghost" onClick={resetExerciseForm}>Cancelar edição</Button> : null}
          </div>

          <div className="stack">
            {draftExercises.length > 0 ? draftExercises.map((exercise, index) => (
              <div key={exercise.id} className="setup-selection-card">
                <div className="setup-selection-card__header">
                  <div>
                    <span className="meta-label">Exercício {index + 1}</span>
                    <p>{exercise.name}</p>
                  </div>
                  <div className="inline-actions">
                    <Button kind="ghost" size="sm" onClick={() => handleEditExercise(exercise)}>Editar</Button>
                    <Button kind="ghost" size="sm" renderIcon={TrashCan} iconDescription="Remover exercício" onClick={() => handleRemoveExercise(exercise.id)}>Remover</Button>
                  </div>
                </div>
                <div className="setup-selection-card__meta">
                  <span>{exercise.muscleGroup}</span>
                  <span>{exercise.loadKg} kg</span>
                  <span>{exercise.sets}x{exercise.reps}</span>
                  <span>{exercise.restSeconds}s</span>
                </div>
              </div>
            )) : (
              <div className="info-block">
                <span className="meta-label">Exercícios do treino</span>
                <p>Adicione pelo menos um exercício para salvar o treino.</p>
              </div>
            )}
          </div>
          <div className="setup-card__footer">
            <div className="inline-actions">
              <Button disabled={!canSaveWorkout} onClick={handleSaveWorkout}>{editingWorkoutId ? 'Atualizar treino' : 'Salvar treino'}</Button>
              {editingWorkoutId ? <Button kind="ghost" onClick={resetWorkoutForm}>Cancelar edição</Button> : null}
            </div>
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
              <div key={workout.id} className="setup-selection-card">
                <div className="setup-selection-card__header">
                  <div>
                    <span className="meta-label">{workout.exercises.length} exercício(s)</span>
                    <p>{workout.name}</p>
                  </div>
                  <div className="inline-actions">
                    <Button kind="ghost" size="sm" onClick={() => handleEditWorkout(workout)}>Editar</Button>
                    <Button kind="ghost" size="sm" renderIcon={TrashCan} iconDescription="Remover treino" onClick={() => handleRemoveWorkout(workout.id)}>Remover</Button>
                  </div>
                </div>
                <div className="setup-selection-card__meta">
                  {workout.muscleGroups.map((group) => <span key={group}>{group}</span>)}
                </div>
              </div>
            )) : (
              <div className="info-block">
                <span className="meta-label">Treinos</span>
                <p>Nenhum treino salvo ainda.</p>
              </div>
            )}
          </div>
        </Tile>
      </div>
    </PageContainer>
  );
}
