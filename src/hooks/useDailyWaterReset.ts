import { useEffect } from 'react';
import { WaterData } from '../data/types';
import { normalizeWaterData } from '../lib/appState';

interface UseDailyWaterResetParams {
  isReady: boolean;
  water: WaterData;
  onReset: (nextWater: WaterData) => void;
}

export function useDailyWaterReset({
  isReady,
  water,
  onReset
}: UseDailyWaterResetParams) {
  useEffect(() => {
    if (!isReady) {
      return;
    }

    const syncWaterDate = () => {
      const normalizedWater = normalizeWaterData(water);

      if (normalizedWater.updatedAt === water.updatedAt) {
        return;
      }

      onReset(normalizedWater);
    };

    syncWaterDate();
    window.addEventListener('focus', syncWaterDate);
    document.addEventListener('visibilitychange', syncWaterDate);

    return () => {
      window.removeEventListener('focus', syncWaterDate);
      document.removeEventListener('visibilitychange', syncWaterDate);
    };
  }, [isReady, onReset, water]);
}
