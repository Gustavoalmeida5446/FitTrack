import { Button, NumberInput, Tile } from '@carbon/react';
import { useState } from 'react';
import { NutritionTargets, UserProfile, WeightLog } from '../data/types';
import { PageContainer } from '../components/PageContainer';

interface Props {
  profile: UserProfile;
  targets: NutritionTargets;
  weightHistory: WeightLog[];
  onBack: () => void;
  onAddWeight: (weight: number) => void;
}

export function NutritionGoalsPage({ profile, targets, weightHistory, onBack, onAddWeight }: Props) {
  const [newWeight, setNewWeight] = useState(profile.currentWeight);

  const maxWeight = Math.max(...weightHistory.map((item) => item.weight));

  return (
    <PageContainer title="Metas nutricionais" subtitle="Acompanhamento completo" actions={<Button kind="ghost" size="sm" onClick={onBack}>Voltar</Button>}>
      <div className="stack">
        <Tile className="card">
          <h3>Dados do usuário</h3>
          <p>Peso atual: {profile.currentWeight} kg</p>
          <p>Altura: {profile.heightCm} cm</p>
          <p>Idade: {profile.age}</p>
          <p>Sexo: {profile.sex}</p>
          <p>Nível de atividade: {profile.activityLevel}</p>
          <p>Objetivo: {profile.goal}</p>
        </Tile>

        <Tile className="card">
          <h3>Metas diárias</h3>
          <p>Calorias: {targets.caloriesDaily} kcal</p>
          <p>Proteína: {targets.proteinDaily} g</p>
          <p>Água: {targets.waterDailyMl} ml</p>
        </Tile>

        <Tile className="card">
          <h3>Acompanhamento de peso</h3>
          <NumberInput id="new-weight" label="Registrar peso" min={1} value={newWeight} onChange={(event) => setNewWeight(Number((event.target as HTMLInputElement).value))} />
          <Button size="sm" onClick={() => onAddWeight(newWeight)}>Salvar peso</Button>
          <ul>
            {weightHistory.map((item) => (
              <li key={item.date}>{item.date}: {item.weight} kg</li>
            ))}
          </ul>
          <div className="weight-chart">
            {weightHistory.map((item) => (
              <div key={item.date} className="weight-bar">
                <span>{item.weight}kg</span>
                <div style={{ width: `${(item.weight / maxWeight) * 100}%` }} />
              </div>
            ))}
          </div>
        </Tile>
      </div>
    </PageContainer>
  );
}
