import { ChartLine, CheckmarkFilled, ChevronLeft, Logout, TrashCan, UserAvatar } from '@carbon/icons-react';
import { Button, DatePicker, DatePickerInput, Select, SelectItem, Tile } from '@carbon/react';
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AppNumberInput } from '../components/AppNumberInput';
import { Portuguese } from 'flatpickr/dist/l10n/pt.js';
import { CardHeader } from '../components/CardHeader';
import { ContextualTutorialCard, type TutorialStepContent } from '../components/ContextualTutorialCard';
import { InfoBlock } from '../components/InfoBlock';
import { StatsGrid } from '../components/StatsGrid';
import { ActivityLevel, DietType, GoalType, NutritionTargets, UserProfile, WeightLog } from '../data/types';
import { PageContainer } from '../components/PageContainer';
import {
  calculateAgeFromBirthDate,
  formatBirthDateForDatePicker,
  getSingleDatePickerValue,
  normalizeBirthDateForStorage,
  parseBirthDateForDatePicker
} from '../lib/date';
import { isProfileReady } from '../lib/validation';

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
  session: Session;
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
  onSignOut
}: Props) {
  const [newWeight, setNewWeight] = useState(profile.currentWeight);
  const [hasTouchedProfile, setHasTouchedProfile] = useState(false);
  const [hasTriedSaveWeight, setHasTriedSaveWeight] = useState(false);

  useEffect(() => {
    setNewWeight(profile.currentWeight);
  }, [profile.currentWeight]);

  const profileFormMessage = hasTouchedProfile && !isProfileReady(profile)
    ? 'Preencha peso, altura e data de nascimento para liberar as metas.'
    : '';
  const newWeightMessage = hasTriedSaveWeight && newWeight <= 0
    ? 'Informe um peso maior que zero para salvar.'
    : '';

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
          <CardHeader
            icon={<UserAvatar size={20} />}
            title="Status da conta"
            description="Você está logado como:"
          />
          <div className="auth-status">
            <InfoBlock>{session.user.email ?? 'Nenhum usuário conectado'}</InfoBlock>
            <div className="row-actions">
              <Button kind="ghost" onClick={onReplayTutorial}>
                Rever tutorial
              </Button>
              <Button kind="ghost" renderIcon={Logout} onClick={() => void onSignOut()}>
                Sair
              </Button>
            </div>
          </div>
        </Tile>

        <Tile className="card metric-card goals-card">
          <CardHeader
            icon={<UserAvatar size={20} />}
            title="Dados do usuário"
            description="Informações-base para as metas"
          />
          <div className="goals-form-grid">
            <AppNumberInput id="profile-weight" label="Peso (kg)" min={1} value={profile.currentWeight} onValueChange={(currentWeight) => {
              setHasTouchedProfile(true);
              onUpdateProfile({ ...profile, currentWeight });
            }} />
            <AppNumberInput id="profile-height" label="Altura (cm)" min={1} value={profile.heightCm} onValueChange={(heightCm) => {
              setHasTouchedProfile(true);
              onUpdateProfile({ ...profile, heightCm });
            }} />
            <DatePicker
              className="goals-form-grid__date-picker"
              datePickerType="single"
              dateFormat="d-m-Y"
              locale={{ ...Portuguese, locale: 'pt' }}
              maxDate={new Date()}
              parseDate={parseBirthDateForDatePicker}
              onChange={(_, dateString) => {
                const birthDate = normalizeBirthDateForStorage(getSingleDatePickerValue(dateString));
                setHasTouchedProfile(true);
                onUpdateProfile({ ...profile, birthDate, age: calculateAgeFromBirthDate(birthDate) });
              }}
              value={formatBirthDateForDatePicker(profile.birthDate)}
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
          {profileFormMessage ? <p className="form-message form-message--error">{profileFormMessage}</p> : null}
        </Tile>

        <Tile className="card metric-card goals-card">
          <CardHeader
            icon={<CheckmarkFilled size={20} />}
            title="Metas diárias"
            description="Alvos de ingestão e hidratação"
          />
          <StatsGrid
            className="goals-grid goals-grid--compact"
            items={[
              { label: 'Calorias', value: `${targets.caloriesDaily} kcal` },
              { label: 'Proteína', value: `${targets.proteinDaily} g` },
              { label: 'Carboidrato', value: `${targets.carbsDaily} g` },
              { label: 'Gordura', value: `${targets.fatDaily} g` },
              { label: 'Água', value: `${targets.waterDailyMl} ml` }
            ]}
          />
        </Tile>

        <Tile className="card metric-card goals-card">
          <CardHeader
            icon={<ChartLine size={20} />}
            title="Acompanhamento de peso"
            description="Registro e histórico recente"
          />
          <div className="goals-weight-form">
            <AppNumberInput id="new-weight" label="Registrar peso" min={1} value={newWeight} onValueChange={setNewWeight} />
            <div className="setup-card__footer">
              <Button size="sm" onClick={() => {
                setHasTriedSaveWeight(true);
                if (newWeight <= 0) {
                  return;
                }

                onAddWeight(newWeight);
                setHasTriedSaveWeight(false);
              }}>Salvar peso</Button>
            </div>
            {newWeightMessage ? <p className="form-message form-message--error">{newWeightMessage}</p> : null}
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
