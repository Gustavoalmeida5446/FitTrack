import { useCallback, useEffect, useMemo, useState } from 'react';

interface TutorialStep<View extends string> {
  view: View;
}

interface UseTutorialParams<View extends string, Step extends TutorialStep<View>> {
  steps: Step[];
  sessionUserId?: string;
  isReady: boolean;
  onNavigate: (view: View) => void;
}

interface UseTutorialResult<Step> {
  activeStep: Step | null;
  tutorialStepIndex: number;
  tutorialStepsTotal: number;
  finishTutorial: () => void;
  startTutorial: () => void;
  handleTutorialNext: () => void;
  handleTutorialBack: () => void;
}

export function useTutorial<View extends string, Step extends TutorialStep<View>>({
  steps,
  sessionUserId,
  isReady,
  onNavigate
}: UseTutorialParams<View, Step>): UseTutorialResult<Step> {
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const tutorialStorageKey = sessionUserId ? `fittrack:onboarding:${sessionUserId}` : '';
  const hasSteps = steps.length > 0;

  const resetTutorialState = useCallback(() => {
    setIsTutorialOpen(false);
    setTutorialStepIndex(0);
  }, []);

  useEffect(() => {
    if (sessionUserId) {
      return;
    }

    resetTutorialState();
  }, [resetTutorialState, sessionUserId]);

  useEffect(() => {
    if (!isReady || !tutorialStorageKey || !hasSteps) {
      return;
    }

    if (window.localStorage.getItem(tutorialStorageKey) === 'done') {
      return;
    }

    setTutorialStepIndex(0);
    setIsTutorialOpen(true);
  }, [hasSteps, isReady, tutorialStorageKey]);

  useEffect(() => {
    if (!isTutorialOpen || !hasSteps) {
      return;
    }

    onNavigate(steps[tutorialStepIndex].view);
  }, [hasSteps, isTutorialOpen, onNavigate, steps, tutorialStepIndex]);

  const finishTutorial = () => {
    if (tutorialStorageKey) {
      window.localStorage.setItem(tutorialStorageKey, 'done');
    }

    resetTutorialState();
  };

  const startTutorial = () => {
    if (!hasSteps) {
      return;
    }

    setTutorialStepIndex(0);
    setIsTutorialOpen(true);
    onNavigate(steps[0].view);
  };

  const handleTutorialNext = () => {
    if (!hasSteps) {
      return;
    }

    if (tutorialStepIndex >= steps.length - 1) {
      finishTutorial();
      return;
    }

    const nextStepIndex = tutorialStepIndex + 1;
    setTutorialStepIndex(nextStepIndex);
    onNavigate(steps[nextStepIndex].view);
  };

  const handleTutorialBack = () => {
    if (!hasSteps) {
      return;
    }

    const previousStepIndex = Math.max(0, tutorialStepIndex - 1);
    setTutorialStepIndex(previousStepIndex);
    onNavigate(steps[previousStepIndex].view);
  };

  const activeStep = useMemo(() => (isTutorialOpen && hasSteps ? steps[tutorialStepIndex] : null), [hasSteps, isTutorialOpen, steps, tutorialStepIndex]);

  return {
    activeStep,
    tutorialStepIndex,
    tutorialStepsTotal: steps.length,
    finishTutorial,
    startTutorial,
    handleTutorialNext,
    handleTutorialBack
  };
}
