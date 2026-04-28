import { useState } from 'react';

export type AppView = 'home' | 'workout' | 'diet-day' | 'workout-setup' | 'diet-setup' | 'goals';

export function useLocalNavigation() {
  const [view, setView] = useState<AppView>('home');
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>('');
  const [selectedDayId, setSelectedDayId] = useState<string>('');

  return {
    view,
    selectedWorkoutId,
    selectedDayId,
    setView,
    openHome: () => setView('home'),
    openGoals: () => setView('goals'),
    openWorkoutSetup: () => setView('workout-setup'),
    openDietSetup: () => setView('diet-setup'),
    openWorkout: (workoutId: string) => {
      setSelectedWorkoutId(workoutId);
      setView('workout');
    },
    openDietDay: (dayId: string) => {
      setSelectedDayId(dayId);
      setView('diet-day');
    }
  };
}
