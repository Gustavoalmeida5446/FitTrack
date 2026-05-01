export type AppView = 'home' | 'workout' | 'diet-day' | 'workout-setup' | 'diet-setup' | 'goals';

export interface AppRouteState {
  view: AppView;
  selectedWorkoutId: string;
  selectedDayId: string;
}

const defaultRouteState: AppRouteState = {
  view: 'home',
  selectedWorkoutId: '',
  selectedDayId: ''
};

function normalizeBasePath(basePath: string) {
  if (!basePath || basePath === '/') {
    return '/';
  }

  return `/${basePath.replace(/^\/+|\/+$/g, '')}/`;
}

function stripBasePath(pathname: string, basePath: string) {
  const normalizedBasePath = normalizeBasePath(basePath);

  if (normalizedBasePath === '/') {
    return pathname;
  }

  return pathname.startsWith(normalizedBasePath)
    ? `/${pathname.slice(normalizedBasePath.length)}`
    : pathname;
}

function joinBasePath(basePath: string, routePath: string) {
  const normalizedBasePath = normalizeBasePath(basePath);
  const normalizedRoutePath = routePath.replace(/^\/+/, '');

  if (normalizedBasePath === '/') {
    return `/${normalizedRoutePath}`;
  }

  return `${normalizedBasePath}${normalizedRoutePath}`;
}

export function parseAppRoute(pathname: string, basePath: string): AppRouteState {
  const appPath = stripBasePath(pathname, basePath);
  const segments = appPath
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment));

  if (segments.length === 0) {
    return defaultRouteState;
  }

  const [section, id] = segments;

  if (section === 'treinos') {
    return id
      ? { view: 'workout', selectedWorkoutId: id, selectedDayId: '' }
      : { view: 'workout-setup', selectedWorkoutId: '', selectedDayId: '' };
  }

  if (section === 'dieta') {
    return id
      ? { view: 'diet-day', selectedWorkoutId: '', selectedDayId: id }
      : { view: 'diet-setup', selectedWorkoutId: '', selectedDayId: '' };
  }

  if (section === 'perfil') {
    return { view: 'goals', selectedWorkoutId: '', selectedDayId: '' };
  }

  return defaultRouteState;
}

export function buildAppRoutePath(routeState: AppRouteState, basePath: string) {
  if (routeState.view === 'workout') {
    return joinBasePath(basePath, `/treinos/${encodeURIComponent(routeState.selectedWorkoutId)}`);
  }

  if (routeState.view === 'diet-day') {
    return joinBasePath(basePath, `/dieta/${encodeURIComponent(routeState.selectedDayId)}`);
  }

  const viewPath: Record<Exclude<AppView, 'workout' | 'diet-day'>, string> = {
    home: '/',
    'workout-setup': '/treinos',
    'diet-setup': '/dieta',
    goals: '/perfil'
  };

  return joinBasePath(basePath, viewPath[routeState.view]);
}
