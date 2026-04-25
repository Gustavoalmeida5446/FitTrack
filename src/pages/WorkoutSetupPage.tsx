import { CheckmarkFilled, ChevronLeft, Search } from '@carbon/icons-react';
import { Button, Checkbox, NumberInput, TextInput, Tile } from '@carbon/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MuscleGroup, Workout } from '../data/types';
import { searchExercises } from '../services/wgerService';
import { PageContainer } from '../components/PageContainer';

interface Props {
  onBack: () => void;
  onCreateWorkout: (workout: Workout) => void;
}

const groups: MuscleGroup[] = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Core'];

export function WorkoutSetupPage({ onBack, onCreateWorkout }: Props) {
  const skipNextSearchRef = useRef(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<{ id: string; name: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [name, setName] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<MuscleGroup[]>([]);

  const [exerciseName, setExerciseName] = useState('');
  const [exerciseGroup, setExerciseGroup] = useState<MuscleGroup>('Peito');
  const [loadKg, setLoadKg] = useState(10);
  const [reps, setReps] = useState(10);
  const [sets, setSets] = useState(3);
  const [restSeconds, setRestSeconds] = useState(60);

  const canSave = useMemo(() => name.trim() && selectedGroups.length > 0 && exerciseName.trim(), [name, selectedGroups, exerciseName]);

  const toggleGroup = (group: MuscleGroup) => {
    setSelectedGroups((prev) => (prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]));
  };

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

  const handleSave = () => {
    if (!canSave) return;

    onCreateWorkout({
      id: crypto.randomUUID(),
      name,
      muscleGroups: selectedGroups,
      exercises: [
        {
          id: crypto.randomUUID(),
          name: exerciseName,
          muscleGroup: exerciseGroup,
          mediaType: 'image',
          mediaUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
          loadKg,
          reps,
          sets,
          restSeconds,
          done: false
        }
      ]
    });

    setName('');
    setQuery('');
    setExerciseName('');
    setSelectedGroups([]);
    setOptions([]);
  };

  const handleSelectExercise = (exercise: { id: string; name: string }) => {
    skipNextSearchRef.current = true;
    setQuery(exercise.name);
    setExerciseName(exercise.name);
    setOptions([]);
    setIsSearching(false);
  };

  return (
    <PageContainer title="Cadastro de treino" subtitle="Exercício > Grupo muscular > Treino" actions={<Button kind="ghost" size="sm" renderIcon={ChevronLeft} iconDescription="Voltar" onClick={onBack}>Voltar</Button>}>
      <div className="stack">
        <Tile className="card metric-card setup-card">
          <div className="card-head">
            <div className="card-head__group">
              <div className="icon-badge icon-badge--primary card-head__badge">
                <Search size={20} />
              </div>
              <div className="card-head__title">
                <h3>Exercício</h3>
                <p>Busque e configure o exercício do treino</p>
              </div>
            </div>
          </div>
          <TextInput
            id="exercise-search"
            labelText="Buscar exercício (wger)"
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
            <TextInput id="exercise-name" labelText="Nome" value={exerciseName} onChange={(event) => setExerciseName(event.target.value)} />
            <TextInput id="exercise-group" labelText="Grupo muscular" value={exerciseGroup} onChange={(event) => setExerciseGroup(event.target.value as MuscleGroup)} />
          </div>
          <div className="setup-card__metrics">
            <NumberInput id="exercise-load" label="Carga" min={0} value={loadKg} onChange={(event) => setLoadKg(Number((event.target as HTMLInputElement).value))} />
            <NumberInput id="exercise-reps" label="Repetições" min={1} value={reps} onChange={(event) => setReps(Number((event.target as HTMLInputElement).value))} />
            <NumberInput id="exercise-sets" label="Séries" min={1} value={sets} onChange={(event) => setSets(Number((event.target as HTMLInputElement).value))} />
            <NumberInput id="exercise-rest" label="Descanso (s)" min={0} value={restSeconds} onChange={(event) => setRestSeconds(Number((event.target as HTMLInputElement).value))} />
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
                <p>Defina o nome e os grupos musculares</p>
              </div>
            </div>
          </div>
          <TextInput id="workout-name" labelText="Nome do treino" value={name} onChange={(event) => setName(event.target.value)} />
          <p className="meta-label">Selecionar grupos musculares</p>
          <div className="check-grid">
            {groups.map((group) => (
              <Checkbox key={group} id={`group-${group}`} labelText={group} checked={selectedGroups.includes(group)} onChange={() => toggleGroup(group)} />
            ))}
          </div>
          <div className="setup-card__footer">
            <Button disabled={!canSave} onClick={handleSave}>Salvar treino</Button>
          </div>
        </Tile>
      </div>
    </PageContainer>
  );
}
