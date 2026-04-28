import { useEffect } from 'react';
import { Workout } from '../data/types';
import { normalizeWorkoutProgressForToday } from '../lib/appState';

interface UseDailyWorkoutResetParams {
  isReady: boolean;
  workouts: Workout[];
  workoutsUpdatedAt: string;
  onReset: (nextState: { workouts: Workout[]; workoutsUpdatedAt: string }) => void;
}

export function useDailyWorkoutReset({
  isReady,
  workouts,
  workoutsUpdatedAt,
  onReset
}: UseDailyWorkoutResetParams) {
  useEffect(() => {
    if (!isReady) {
      return;
    }

    const syncWorkoutProgressDate = () => {
      const normalizedState = normalizeWorkoutProgressForToday(workouts, workoutsUpdatedAt);

      if (normalizedState.workoutsUpdatedAt === workoutsUpdatedAt) {
        return;
      }

      onReset(normalizedState);
    };

    syncWorkoutProgressDate();
    window.addEventListener('focus', syncWorkoutProgressDate);
    document.addEventListener('visibilitychange', syncWorkoutProgressDate);

    return () => {
      window.removeEventListener('focus', syncWorkoutProgressDate);
      document.removeEventListener('visibilitychange', syncWorkoutProgressDate);
    };
  }, [isReady, onReset, workouts, workoutsUpdatedAt]);
}
