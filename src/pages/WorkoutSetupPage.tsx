import { CheckmarkFilled, ChevronLeft, Search, TrashCan } from '@carbon/icons-react';
import { Button, NumberInput, Select, SelectItem, TextInput, Tile } from '@carbon/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MuscleGroup, Workout, type Exercise } from '../data/types';
import { searchExercises } from '../services/wgerService';
import { PageContainer } from '../components/PageContainer';

interface Props {
  onBack: () => void;
  onCreateWorkout: (workout: Workout) => void;
}

type DraftExercise = Omit<Exercise, 'done'>;

const groups: MuscleGroup[] = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Core'];

const defaultExerciseValues = {
  name: '',
  muscleGroup: 'Peito' as MuscleGroup,
  loadKg: 10,
  reps: 10,
  sets: 3,
  restSeconds: 60
};

export function WorkoutSetupPage({ onBack, onCreateWorkout }: Props) {
  const skipNextSearchRef = useRef(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<{ id: string; name: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [name, setName] = useState('');
  const [draftExercises, setDraftExercises] = useState<DraftExercise[]>([]);
  const [exerciseName, setExerciseName] = useState(defaultExerciseValues.name);
  const [exerciseGroup, setExerciseGroup] = useState<MuscleGroup>(defaultExerciseValues.muscleGroup);
  const [loadKg, setLoadKg] = useState(defaultExerciseValues.loadKg);
  const [reps, setReps] = useState(defaultExerciseValues.reps);
  const [sets, setSets] = useState(defaultExerciseValues.sets);
  const [restSeconds, setRestSeconds] = useState(defaultExerciseValues.restSeconds);

  const workoutGroups = useMemo(() => [...new Set(draftExercises.map((exercise) => exercise.muscleGroup))], [draftExercises]);
  const canAddExercise = useMemo(() => exerciseName.trim(), [exerciseName]);
  const canSave = useMemo(() => name.trim() && draftExercises.length > 0, [name, draftExercises.length]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setOptions([]);
      setIsSearching(false);
      return;
    }

    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      setOptions([]);
      setIsSearching(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setIsSearching(true);
      const result = await searchExercises(trimmedQuery);
      setOptions(result);
      setIsSearching(false);
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  const resetExerciseForm = () => {
    setQuery('');
    setExerciseName(defaultExerciseValues.name);
    setExerciseGroup(defaultExerciseValues.muscleGroup);
    setLoadKg(defaultExerciseValues.loadKg);
    setReps(defaultExerciseValues.reps);
    setSets(defaultExerciseValues.sets);
    setRestSeconds(defaultExerciseValues.restSeconds);
    setOptions([]);
    setIsSearching(false);
  };

  const handleSelectExercise = (exercise: { id: string; name: string }) => {
    skipNextSearchRef.current = true;
    setQuery(exercise.name);
    setExerciseName(exercise.name);
    setOptions([]);
    setIsSearching(false);
  };

  const handleAddExercise = () => {
    if (!canAddExercise) return;

    setDraftExercises((prev) => [...prev, {
      id: crypto.randomUUID(),
      name: exerciseName.trim(),
      muscleGroup: exerciseGroup,
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
      loadKg,
      reps,
      sets,
      restSeconds
    }]);

    resetExerciseForm();
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setDraftExercises((prev) => prev.filter((exercise) => exercise.id !== exerciseId));
  };

  const handleSave = () => {
    if (!canSave) return;

    onCreateWorkout({
      id: crypto.randomUUID(),
      name: name.trim(),
      muscleGroups: workoutGroups,
      exercises: draftExercises.map((exercise) => ({
        ...exercise,
        done: false
      }))
    });

    setName('');
    setDraftExercises([]);
    resetExerciseForm();
  };

  return (
    <PageContainer title="Cadastro de treino" subtitle="Monte o treino exercicio por exercicio" actions={<Button kind="ghost" size="sm" renderIcon={ChevronLeft} iconDescription="Voltar" onClick={onBack}>Voltar</Button>}>
      <div className="stack">
        <Tile className="card metric-card setup-card">
          <div className="card-head">
            <div className="card-head__group">
              <div className="icon-badge icon-badge--primary card-head__badge">
                <Search size={20} />
              </div>
              <div className="card-head__title">
                <h3>Exercício</h3>
                <p>Busque, ajuste os parâmetros e adicione ao treino</p>
              </div>
            </div>
          </div>
          <TextInput
            id="exercise-search"
            labelText="Buscar exercício"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onBlur={() => window.setTimeout(() => setOptions([]), 150)}
          />
          {isSearching ? <p className="meta-label">Buscando exercícios...</p> : null}
          {options.length > 0 ? (
            <ul className="search-list">
              {options.map((option) => (
                <li key={option.id}>
                  <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => handleSelectExercise(option)}>{option.name}</button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="setup-card__fields">
            <TextInput id="exercise-name" labelText="Nome do exercício" value={exerciseName} onChange={(event) => setExerciseName(event.target.value)} />
            <Select id="exercise-group" labelText="Grupo muscular" value={exerciseGroup} onChange={(event) => setExerciseGroup(event.target.value as MuscleGroup)}>
              {groups.map((group) => (
                <SelectItem key={group} value={group} text={group} />
              ))}
            </Select>
          </div>
          <div className="setup-card__metrics">
            <NumberInput id="exercise-load" label="Carga (kg)" min={0} value={loadKg} onChange={(event) => setLoadKg(Number((event.target as HTMLInputElement).value))} />
            <NumberInput id="exercise-reps" label="Repetições" min={1} value={reps} onChange={(event) => setReps(Number((event.target as HTMLInputElement).value))} />
            <NumberInput id="exercise-sets" label="Séries" min={1} value={sets} onChange={(event) => setSets(Number((event.target as HTMLInputElement).value))} />
            <NumberInput id="exercise-rest" label="Descanso (s)" min={0} value={restSeconds} onChange={(event) => setRestSeconds(Number((event.target as HTMLInputElement).value))} />
          </div>
          <div className="setup-card__footer">
            <Button disabled={!canAddExercise} onClick={handleAddExercise}>Adicionar exercício</Button>
          </div>
        </Tile>

        <Tile className="card metric-card setup-card">
          <div className="card-head">
            <div className="card-head__group">
              <div className="icon-badge icon-badge--primary card-head__badge">
                <CheckmarkFilled size={20} />
              </div>
              <div className="card-head__title">
                <h3>Treino</h3>
                <p>Defina o nome e revise os exercícios adicionados</p>
              </div>
            </div>
          </div>
          <TextInput id="workout-name" labelText="Nome do treino" value={name} onChange={(event) => setName(event.target.value)} />
          <div className="info-block">
            <span className="meta-label">Grupos do treino</span>
            <p>{workoutGroups.join(', ') || 'Adicione exercícios para gerar os grupos automaticamente.'}</p>
          </div>
          <div className="stack">
            {draftExercises.length > 0 ? draftExercises.map((exercise, index) => (
              <div key={exercise.id} className="setup-selection-card">
                <div className="setup-selection-card__header">
                  <div>
                    <span className="meta-label">Exercício {index + 1}</span>
                    <p>{exercise.name}</p>
                  </div>
                  <Button kind="ghost" size="sm" renderIcon={TrashCan} iconDescription="Remover exercício" onClick={() => handleRemoveExercise(exercise.id)}>
                    Remover
                  </Button>
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
                <span className="meta-label">Exercícios</span>
                <p>Adicione pelo menos um exercício para salvar o treino.</p>
              </div>
            )}
          </div>
          <div className="setup-card__footer">
            <Button disabled={!canSave} onClick={handleSave}>Salvar treino</Button>
          </div>
        </Tile>
      </div>
    </PageContainer>
  );
}
