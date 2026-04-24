import { DietDay, NutritionTargets, UserProfile, WaterData, WeeklyDiet, WeightLog, Workout } from './types';

const exerciseMedia = 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800';

export const mockWorkouts: Workout[] = [
  {
    id: 'w1',
    name: 'Push A',
    muscleGroups: ['Peito', 'Ombros', 'Braços'],
    exercises: [
      { id: 'e1', name: 'Supino reto', muscleGroup: 'Peito', mediaType: 'image', mediaUrl: exerciseMedia, loadKg: 40, reps: 10, sets: 4, restSeconds: 90, done: false },
      { id: 'e2', name: 'Desenvolvimento', muscleGroup: 'Ombros', mediaType: 'image', mediaUrl: exerciseMedia, loadKg: 20, reps: 12, sets: 3, restSeconds: 60, done: false }
    ]
  },
  {
    id: 'w2',
    name: 'Pull B',
    muscleGroups: ['Costas', 'Braços'],
    exercises: [
      { id: 'e3', name: 'Remada baixa', muscleGroup: 'Costas', mediaType: 'image', mediaUrl: exerciseMedia, loadKg: 35, reps: 12, sets: 4, restSeconds: 90, done: false },
      { id: 'e4', name: 'Rosca direta', muscleGroup: 'Braços', mediaType: 'gif', mediaUrl: exerciseMedia, loadKg: 15, reps: 12, sets: 3, restSeconds: 60, done: false }
    ]
  }
];

export const mockWater: WaterData = {
  goalMl: 3000,
  consumedMl: 1250
};

const buildDay = (id: number): DietDay => ({
  id: `d${id}`,
  label: `Dia ${id}`,
  meals: [
    {
      id: `m${id}1`,
      name: 'Café da manhã',
      done: id === 1,
      foods: [
        { id: `f${id}1`, name: 'Ovos', calories: 140, protein: 12 },
        { id: `f${id}2`, name: 'Pão integral', calories: 120, protein: 5 }
      ]
    },
    {
      id: `m${id}2`,
      name: 'Almoço',
      done: false,
      foods: [
        { id: `f${id}3`, name: 'Frango', calories: 220, protein: 35 },
        { id: `f${id}4`, name: 'Arroz', calories: 180, protein: 4 }
      ]
    }
  ]
});

export const mockWeeklyDiet: WeeklyDiet = {
  id: 'diet-1',
  days: [1, 2, 3, 4, 5, 6, 7].map(buildDay)
};

export const mockUserProfile: UserProfile = {
  currentWeight: 78,
  heightCm: 175,
  age: 27,
  sex: 'Masculino',
  activityLevel: 'Moderado',
  goal: 'Ganho de massa'
};

export const mockNutritionTargets: NutritionTargets = {
  caloriesDaily: 2500,
  proteinDaily: 160,
  waterDailyMl: 3000
};

export const mockWeightHistory: WeightLog[] = [
  { date: '2026-04-01', weight: 79 },
  { date: '2026-04-08', weight: 78.7 },
  { date: '2026-04-15', weight: 78.2 },
  { date: '2026-04-22', weight: 78 }
];
