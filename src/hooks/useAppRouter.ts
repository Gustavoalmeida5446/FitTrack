import { useCallback, useEffect, useState } from 'react';
import { AppRouteState, AppView, buildAppRoutePath, parseAppRoute } from '../lib/appRouter';

function getCurrentRouteState() {
  if (typeof window === 'undefined') {
    return parseAppRoute('/', import.meta.env.BASE_URL);
  }

  return parseAppRoute(window.location.pathname, import.meta.env.BASE_URL);
}

export function useAppRouter() {
  const [routeState, setRouteState] = useState<AppRouteState>(() => getCurrentRouteState());

  useEffect(() => {
    const handlePopState = () => {
      setRouteState(getCurrentRouteState());
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigate = useCallback((nextRouteState: AppRouteState) => {
    const nextPath = buildAppRoutePath(nextRouteState, import.meta.env.BASE_URL);

    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }

    setRouteState(nextRouteState);
  }, []);

  const setView = useCallback((view: AppView) => {
    if (view === 'workout') {
      navigate({ view: 'workout-setup', selectedWorkoutId: '', selectedDayId: '' });
      return;
    }

    if (view === 'diet-day') {
      navigate({ view: 'diet-setup', selectedWorkoutId: '', selectedDayId: '' });
      return;
    }

    navigate({ view, selectedWorkoutId: '', selectedDayId: '' });
  }, [navigate]);

  return {
    view: routeState.view,
    selectedWorkoutId: routeState.selectedWorkoutId,
    selectedDayId: routeState.selectedDayId,
    setView,
    openHome: () => navigate({ view: 'home', selectedWorkoutId: '', selectedDayId: '' }),
    openGoals: () => navigate({ view: 'goals', selectedWorkoutId: '', selectedDayId: '' }),
    openWorkoutSetup: () => navigate({ view: 'workout-setup', selectedWorkoutId: '', selectedDayId: '' }),
    openDietSetup: () => navigate({ view: 'diet-setup', selectedWorkoutId: '', selectedDayId: '' }),
    openWorkout: (workoutId: string) => {
      navigate({ view: 'workout', selectedWorkoutId: workoutId, selectedDayId: '' });
    },
    openDietDay: (dayId: string) => {
      navigate({ view: 'diet-day', selectedWorkoutId: '', selectedDayId: dayId });
    }
  };
}
