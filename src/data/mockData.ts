import { UserProfile, WaterData, WeeklyDiet, WeightLog, Workout } from './types';

const exerciseMedia = 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800';

export const mockWorkouts: Workout[] = [
  {
    id: 'w1',
    name: 'Push A',
    muscleGroups: ['Peito', 'Ombros', 'Braços'],
    exercises: [
      { id: 'e1', source: 'manual', name: 'Supino reto', muscleGroup: 'Peito', mediaType: 'image', mediaUrl: exerciseMedia, loadKg: 40, reps: 10, sets: 4, restSeconds: 90, done: false },
      { id: 'e2', source: 'manual', name: 'Desenvolvimento', muscleGroup: 'Ombros', mediaType: 'image', mediaUrl: exerciseMedia, loadKg: 20, reps: 12, sets: 3, restSeconds: 60, done: false }
    ]
  },
  {
    id: 'w2',
    name: 'Pull B',
    muscleGroups: ['Costas', 'Braços'],
    exercises: [
      { id: 'e3', source: 'manual', name: 'Remada baixa', muscleGroup: 'Costas', mediaType: 'image', mediaUrl: exerciseMedia, loadKg: 35, reps: 12, sets: 4, restSeconds: 90, done: false },
      { id: 'e4', source: 'manual', name: 'Rosca direta', muscleGroup: 'Braços', mediaType: 'gif', mediaUrl: exerciseMedia, loadKg: 15, reps: 12, sets: 3, restSeconds: 60, done: false }
    ]
  }
];

export const mockWater: WaterData = {
  goalMl: 3000,
  consumedMl: 1250,
  updatedAt: '2026-04-25'
};

export const mockWeeklyDiet: WeeklyDiet = {
  id: 'diet-1',
  meals: [
    {
      id: 'm11',
      name: 'Café da manhã',
      foods: [
        { id: 'f11', name: 'Ovos', calories: 140, protein: 12, carbs: 1, fat: 10, fiber: 0, quantityGrams: 100, baseQuantityGrams: 100 },
        { id: 'f12', name: 'Pão integral', calories: 120, protein: 5, carbs: 21, fat: 1.5, fiber: 3, quantityGrams: 50, baseQuantityGrams: 50 }
      ]
    },
    {
      id: 'm12',
      name: 'Almoço',
      foods: [
        { id: 'f13', name: 'Frango', calories: 220, protein: 35, carbs: 0, fat: 8, fiber: 0, quantityGrams: 130, baseQuantityGrams: 130 },
        { id: 'f14', name: 'Arroz', calories: 180, protein: 4, carbs: 39, fat: 0.4, fiber: 1, quantityGrams: 140, baseQuantityGrams: 140 }
      ]
    }
  ],
  days: Array.from({ length: 7 }, (_, index) => ({
    id: `d-${index + 1}`,
    label: `Dia ${index + 1}`,
    mealIds: index === 0 ? ['m11', 'm12'] : [],
    completedMealIds: index === 0 ? ['m11'] : []
  }))
};

export const mockUserProfile: UserProfile = {
  currentWeight: 78,
  heightCm: 175,
  age: 27,
  sex: 'Masculino',
  activityLevel: 'Moderado',
  goal: 'Ganho de massa'
};

export const mockWeightHistory: WeightLog[] = [
  { date: '2026-04-01', weight: 79 },
  { date: '2026-04-08', weight: 78.7 },
  { date: '2026-04-15', weight: 78.2 },
  { date: '2026-04-22', weight: 78 }
];
