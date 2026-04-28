import { ChartLine, CheckmarkFilled, ChevronLeft, Login, Logout, TrashCan, UserAvatar } from '@carbon/icons-react';
import { Button, DatePicker, DatePickerInput, NumberInput, Select, SelectItem, Tile } from '@carbon/react';
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Portuguese } from 'flatpickr/dist/l10n/pt.js';
import { ContextualTutorialCard, type TutorialStepContent } from '../components/ContextualTutorialCard';
import { ActivityLevel, DietType, GoalType, NutritionTargets, UserProfile, WeightLog } from '../data/types';
import { PageContainer } from '../components/PageContainer';
import { calculateAgeFromBirthDate } from '../lib/date';

interface Props {
  profile: UserProfile;
  targets: NutritionTargets;
  weightHistory: WeightLog[];
  tutorialStep: TutorialStepContent | null;
  tutorialStepIndex: number;
  tutorialStepsTotal: number;
  onTutorialBack: () => void;
  onTutorialNext: () => void;
  onTutorialSkip: () => void;
  onReplayTutorial: () => void;
  onBack: () => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onAddWeight: (weight: number) => void;
  onRemoveWeight: (index: number) => void;
  session: Session | null;
  onOpenLogin: () => void;
  onSignOut: () => Promise<void>;
}

const activityLevels: ActivityLevel[] = ['Sedentario', 'Leve', 'Moderado', 'Intenso', 'Atleta'];
const goals: GoalType[] = ['Perda de gordura', 'Manutenção', 'Ganho de massa'];
const dietTypes: DietType[] = ['Equilibrada', 'Baixo carboidrato', 'Alta em carboidrato'];

export function NutritionGoalsPage({
  profile,
  targets,
  weightHistory,
  tutorialStep,
  tutorialStepIndex,
  tutorialStepsTotal,
  onTutorialBack,
  onTutorialNext,
  onTutorialSkip,
  onReplayTutorial,
  onBack,
  onUpdateProfile,
  onAddWeight,
  onRemoveWeight,
  session,
  onOpenLogin,
  onSignOut
}: Props) {
  const [newWeight, setNewWeight] = useState(profile.currentWeight);
  useEffect(() => {
    setNewWeight(profile.currentWeight);
  }, [profile.currentWeight]);

  return (
    <PageContainer title="Metas nutricionais" subtitle="Defina suas metas do dia" actions={<Button kind="ghost" size="sm" renderIcon={ChevronLeft} iconDescription="Voltar" onClick={onBack}>Voltar</Button>}>
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
        <Tile className="card metric-card goals-card">
          <div className="card-head">
            <div className="card-head__group">
              <div className="icon-badge icon-badge--primary card-head__badge">
                <UserAvatar size={20} />
              </div>
              <div className="card-head__title">
                <h3>Status da conta</h3>
                <p>{session ? 'Você está logado como:' : 'Você ainda não fez login'}</p>
              </div>
            </div>
          </div>
          <div className="auth-status">
            <div className="info-block">
              <p>{session?.user.email ?? 'Nenhum usuário conectado'}</p>
            </div>
            <div className="row-actions">
              <Button kind="tertiary" onClick={onReplayTutorial}>
                Ver tutorial
              </Button>
              {session ? (
                <Button kind="ghost" renderIcon={Logout} onClick={() => void onSignOut()}>
                  Sair
                </Button>
              ) : (
                <Button renderIcon={Login} onClick={onOpenLogin}>
                  Fazer login
                </Button>
              )}
            </div>
          </div>
        </Tile>

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
            <DatePicker
              className="goals-form-grid__date-picker"
              datePickerType="single"
              dateFormat="d-m-Y"
              locale={{ ...Portuguese, locale: 'pt' }}
              maxDate={new Date()}
              onChange={(_, dateString) => {
                const birthDate = Array.isArray(dateString) ? dateString[0] ?? '' : dateString ?? '';
                onUpdateProfile({ ...profile, birthDate, age: calculateAgeFromBirthDate(birthDate) });
              }}
              value={profile.birthDate}
            >
              <DatePickerInput
                id="profile-birth-date"
                labelText="Data de nascimento"
                placeholder="dd-mm-aaaa"
              />
            </DatePicker>
            <Select id="profile-sex" labelText="Sexo" value={profile.sex} onChange={(event) => onUpdateProfile({ ...profile, sex: event.target.value as UserProfile['sex'] })}>
              <SelectItem value="Masculino" text="Masculino" />
              <SelectItem value="Feminino" text="Feminino" />
            </Select>
            <Select id="profile-activity" labelText="Nível de atividade" value={profile.activityLevel} onChange={(event) => onUpdateProfile({ ...profile, activityLevel: event.target.value as ActivityLevel })}>
              {activityLevels.map((level) => (
                <SelectItem key={level} value={level} text={level} />
              ))}
            </Select>
            <Select id="profile-goal" labelText="Objetivo" value={profile.goal} onChange={(event) => onUpdateProfile({ ...profile, goal: event.target.value as GoalType })}>
              {goals.map((goal) => (
                <SelectItem key={goal} value={goal} text={goal} />
              ))}
            </Select>
            <Select id="profile-diet-type" labelText="Tipo de dieta" value={profile.dietType} onChange={(event) => onUpdateProfile({ ...profile, dietType: event.target.value as DietType })}>
              {dietTypes.map((dietType) => (
                <SelectItem key={dietType} value={dietType} text={dietType} />
              ))}
            </Select>
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
              <span>Carboidrato</span>
              <strong>{targets.carbsDaily} g</strong>
            </div>
            <div className="stat-pill">
              <span>Gordura</span>
              <strong>{targets.fatDaily} g</strong>
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
