import { Button, Checkbox, NumberInput, TextInput, Tile } from '@carbon/react';
import { useMemo, useState } from 'react';
import { MuscleGroup, Workout } from '../data/types';
import { searchExercises } from '../services/wgerService';
import { PageContainer } from '../components/PageContainer';

interface Props {
  onBack: () => void;
  onCreateWorkout: (workout: Workout) => void;
}

const groups: MuscleGroup[] = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Core'];

export function WorkoutSetupPage({ onBack, onCreateWorkout }: Props) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<{ id: string; name: string }[]>([]);
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

  const handleSearch = async (value: string) => {
    setQuery(value);
    const result = await searchExercises(value);
    setOptions(result);
  };

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
    setExerciseName('');
    setSelectedGroups([]);
  };

  return (
    <PageContainer title="Cadastro de treino" subtitle="Exercício > Grupo muscular > Treino" actions={<Button kind="ghost" size="sm" onClick={onBack}>Voltar</Button>}>
      <div className="stack">
        <Tile className="card">
          <h3>Exercício</h3>
          <TextInput id="exercise-search" labelText="Buscar exercício (wger)" value={query} onChange={(event) => void handleSearch(event.target.value)} />
          {options.length > 0 ? (
            <ul className="search-list">
              {options.map((option) => (
                <li key={option.id}>
                  <button type="button" onClick={() => setExerciseName(option.name)}>{option.name}</button>
                </li>
              ))}
            </ul>
          ) : null}
          <TextInput id="exercise-name" labelText="Nome" value={exerciseName} onChange={(event) => setExerciseName(event.target.value)} />
          <TextInput id="exercise-group" labelText="Grupo muscular" value={exerciseGroup} onChange={(event) => setExerciseGroup(event.target.value as MuscleGroup)} />
          <NumberInput id="exercise-load" label="Carga" min={0} value={loadKg} onChange={(event) => setLoadKg(Number((event.target as HTMLInputElement).value))} />
          <NumberInput id="exercise-reps" label="Repetições" min={1} value={reps} onChange={(event) => setReps(Number((event.target as HTMLInputElement).value))} />
          <NumberInput id="exercise-sets" label="Séries" min={1} value={sets} onChange={(event) => setSets(Number((event.target as HTMLInputElement).value))} />
          <NumberInput id="exercise-rest" label="Descanso (s)" min={0} value={restSeconds} onChange={(event) => setRestSeconds(Number((event.target as HTMLInputElement).value))} />
        </Tile>

        <Tile className="card">
          <h3>Treino</h3>
          <TextInput id="workout-name" labelText="Nome do treino" value={name} onChange={(event) => setName(event.target.value)} />
          <p>Selecionar grupos musculares:</p>
          <div className="check-grid">
            {groups.map((group) => (
              <Checkbox key={group} id={`group-${group}`} labelText={group} checked={selectedGroups.includes(group)} onChange={() => toggleGroup(group)} />
            ))}
          </div>
          <Button disabled={!canSave} onClick={handleSave}>Salvar treino</Button>
        </Tile>
      </div>
    </PageContainer>
  );
}
