import { Button, Tile } from '@carbon/react';

export interface TutorialStepContent {
  section: string;
  title: string;
  description: string;
  body: string;
}

interface Props {
  step: TutorialStepContent;
  currentStep: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

export function ContextualTutorialCard({
  step,
  currentStep,
  totalSteps,
  isFirstStep,
  isLastStep,
  onBack,
  onNext,
  onSkip
}: Props) {
  return (
    <Tile className="card metric-card tutorial-inline-card">
      <div className="tutorial-inline-card__header">
        <div>
          <span className="tutorial-inline-card__section">{step.section}</span>
          <h3>{step.title}</h3>
          <p>{step.description}</p>
        </div>
        <Button kind="ghost" size="sm" onClick={onSkip}>
          Pular
        </Button>
      </div>

      <div className="tutorial-inline-card__progress" aria-hidden="true">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <span key={index} className={`tutorial-inline-card__dot ${index === currentStep ? 'tutorial-inline-card__dot--active' : ''}`} />
        ))}
      </div>

      <div className="tutorial-inline-card__hint">
        <span>Role a tela para seguir</span>
      </div>

      <p className="tutorial-inline-card__body">{step.body}</p>

      <div className="tutorial-inline-card__footer">
        <Button kind="ghost" disabled={isFirstStep} onClick={onBack}>
          Voltar
        </Button>
        <Button size="sm" onClick={onNext}>
          {isLastStep ? 'Concluir' : 'Próximo'}
        </Button>
      </div>
    </Tile>
  );
}
