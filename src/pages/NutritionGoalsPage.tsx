import { ChartLine, CheckmarkFilled, ChevronLeft, TrashCan, UserAvatar } from '@carbon/icons-react';
import { Button, NumberInput, Select, SelectItem, TextInput, Tile } from '@carbon/react';
import { useEffect, useState } from 'react';
import { NutritionTargets, UserProfile, WeightLog } from '../data/types';
import { PageContainer } from '../components/PageContainer';

interface Props {
  profile: UserProfile;
  targets: NutritionTargets;
  weightHistory: WeightLog[];
  onBack: () => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onAddWeight: (weight: number) => void;
  onRemoveWeight: (index: number) => void;
}

export function NutritionGoalsPage({ profile, targets, weightHistory, onBack, onUpdateProfile, onAddWeight, onRemoveWeight }: Props) {
  const [newWeight, setNewWeight] = useState(profile.currentWeight);
  useEffect(() => {
    setNewWeight(profile.currentWeight);
  }, [profile.currentWeight]);

  return (
    <PageContainer title="Metas nutricionais" subtitle="Acompanhamento completo" actions={<Button kind="ghost" size="sm" renderIcon={ChevronLeft} iconDescription="Voltar" onClick={onBack}>Voltar</Button>}>
      <div className="stack">
        <Tile className="card metric-card goals-card">
          <div className="card-head">
            <div className="card-head__group">
              <div className="icon-badge icon-badge--primary card-head__badge">
                <UserAvatar size={20} />
              </div>
              <div className="card-head__title">
                <h3>Dados do usuário</h3>
                <p>Informações-base para as metas</p>
              </div>
            </div>
          </div>
          <div className="goals-form-grid">
            <NumberInput id="profile-weight" label="Peso (kg)" min={1} value={profile.currentWeight} onChange={(event) => onUpdateProfile({ ...profile, currentWeight: Number((event.target as HTMLInputElement).value) })} />
            <NumberInput id="profile-height" label="Altura (cm)" min={1} value={profile.heightCm} onChange={(event) => onUpdateProfile({ ...profile, heightCm: Number((event.target as HTMLInputElement).value) })} />
            <NumberInput id="profile-age" label="Idade" min={1} value={profile.age} onChange={(event) => onUpdateProfile({ ...profile, age: Number((event.target as HTMLInputElement).value) })} />
            <Select id="profile-sex" labelText="Sexo" value={profile.sex} onChange={(event) => onUpdateProfile({ ...profile, sex: event.target.value as UserProfile['sex'] })}>
              <SelectItem value="Masculino" text="Masculino" />
              <SelectItem value="Feminino" text="Feminino" />
            </Select>
            <TextInput id="profile-activity" labelText="Nível de atividade" value={profile.activityLevel} onChange={(event) => onUpdateProfile({ ...profile, activityLevel: event.target.value })} />
            <TextInput id="profile-goal" labelText="Objetivo" value={profile.goal} onChange={(event) => onUpdateProfile({ ...profile, goal: event.target.value })} />
          </div>
        </Tile>

        <Tile className="card metric-card goals-card">
          <div className="card-head">
            <div className="card-head__group">
              <div className="icon-badge icon-badge--primary card-head__badge">
                <CheckmarkFilled size={20} />
              </div>
              <div className="card-head__title">
                <h3>Metas diárias</h3>
                <p>Alvos de ingestão e hidratação</p>
              </div>
            </div>
          </div>
          <div className="goals-grid goals-grid--compact">
            <div className="stat-pill">
              <span>Calorias</span>
              <strong>{targets.caloriesDaily} kcal</strong>
            </div>
            <div className="stat-pill">
              <span>Proteína</span>
              <strong>{targets.proteinDaily} g</strong>
            </div>
            <div className="stat-pill">
              <span>Água</span>
              <strong>{targets.waterDailyMl} ml</strong>
            </div>
          </div>
        </Tile>

        <Tile className="card metric-card goals-card">
          <div className="card-head">
            <div className="card-head__group">
              <div className="icon-badge icon-badge--primary card-head__badge">
                <ChartLine size={20} />
              </div>
              <div className="card-head__title">
                <h3>Acompanhamento de peso</h3>
                <p>Registro e histórico recente</p>
              </div>
            </div>
          </div>
          <div className="goals-weight-form">
            <NumberInput id="new-weight" label="Registrar peso" min={1} value={newWeight} onChange={(event) => setNewWeight(Number((event.target as HTMLInputElement).value))} />
            <div className="setup-card__footer">
              <Button size="sm" onClick={() => onAddWeight(newWeight)}>Salvar peso</Button>
            </div>
          </div>
          <ul className="goals-weight-log">
            {weightHistory.map((item, index) => (
              <li key={`${item.date}-${index}`}>
                <div className="goals-weight-log__main">
                  <span>{item.date}</span>
                  <strong>{item.weight} kg</strong>
                </div>
                <Button kind="ghost" size="sm" renderIcon={TrashCan} iconDescription="Remover registro" onClick={() => onRemoveWeight(index)}>
                  Remover
                </Button>
              </li>
            ))}
          </ul>
        </Tile>
      </div>
    </PageContainer>
  );
}
