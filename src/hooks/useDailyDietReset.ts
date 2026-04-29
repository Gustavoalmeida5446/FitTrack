import { useEffect } from 'react';
import { WeeklyDiet } from '../data/types';
import { normalizeWeeklyDietProgressForToday } from '../lib/appState';

interface UseDailyDietResetParams {
  isReady: boolean;
  weeklyDiet: WeeklyDiet;
  onReset: (nextDiet: WeeklyDiet) => void;
}

export function useDailyDietReset({
  isReady,
  weeklyDiet,
  onReset
}: UseDailyDietResetParams) {
  useEffect(() => {
    if (!isReady) {
      return;
    }

    const syncDietProgressDate = () => {
      const normalizedDiet = normalizeWeeklyDietProgressForToday(weeklyDiet);

      if (normalizedDiet.progressUpdatedAt === weeklyDiet.progressUpdatedAt) {
        return;
      }

      onReset(normalizedDiet);
    };

    syncDietProgressDate();
    window.addEventListener('focus', syncDietProgressDate);
    document.addEventListener('visibilitychange', syncDietProgressDate);

    return () => {
      window.removeEventListener('focus', syncDietProgressDate);
      document.removeEventListener('visibilitychange', syncDietProgressDate);
    };
  }, [isReady, onReset, weeklyDiet]);
}
