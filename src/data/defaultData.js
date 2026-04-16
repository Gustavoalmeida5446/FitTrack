export const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export const defaultState = {
  profile: {
    age: 30,
    height: 175,
    currentWeight: 80,
    activityFactor: 1.55,
    deficit: 300,
    macros: { proteinPerKg: 2, fatPerKg: 0.9 },
    schedule: { meal: '08:00 / 13:00 / 19:00', workout: '18:00', sleep: '23:00' }
  },
  workouts: [
    { id: crypto.randomUUID(), name: 'Treino A', exercises: [] },
    { id: crypto.randomUUID(), name: 'Treino B', exercises: [] },
    { id: crypto.randomUUID(), name: 'Treino C', exercises: [] }
  ],
  workoutSequenceIndex: 0,
  workoutHistory: [],
  bodyWeights: [],
  dietPlan: weekDays.reduce((acc, day) => ({ ...acc, [day]: { meals: [], completed: false } }), {}),
  foodLibrary: [],
  favoritesExercises: [],
  dietHistory: []
}
