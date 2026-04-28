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
    if (!sessionUserId || !isReady || !tutorialStorageKey) {
      return;
    }

    const hasSeenTutorial = window.localStorage.getItem(tutorialStorageKey) === 'done';

    if (!hasSeenTutorial) {
      setTutorialStepIndex(0);
      setIsTutorialOpen(true);
    }
  }, [isReady, sessionUserId, tutorialStorageKey]);

  useEffect(() => {
    if (!isTutorialOpen) {
      return;
    }

    onNavigate(steps[tutorialStepIndex].view);
  }, [isTutorialOpen, onNavigate, steps, tutorialStepIndex]);

  const finishTutorial = () => {
    if (tutorialStorageKey) {
      window.localStorage.setItem(tutorialStorageKey, 'done');
    }

    resetTutorialState();
  };

  const startTutorial = () => {
    setTutorialStepIndex(0);
    setIsTutorialOpen(true);
    onNavigate(steps[0].view);
  };

  const handleTutorialNext = () => {
    if (tutorialStepIndex >= steps.length - 1) {
      finishTutorial();
      return;
    }

    const nextStepIndex = tutorialStepIndex + 1;
    setTutorialStepIndex(nextStepIndex);
    onNavigate(steps[nextStepIndex].view);
  };

  const handleTutorialBack = () => {
    const previousStepIndex = Math.max(0, tutorialStepIndex - 1);
    setTutorialStepIndex(previousStepIndex);
    onNavigate(steps[previousStepIndex].view);
  };

  const activeStep = useMemo(() => (isTutorialOpen ? steps[tutorialStepIndex] : null), [isTutorialOpen, steps, tutorialStepIndex]);

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
