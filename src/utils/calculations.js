export function getMetrics(profile) {
  const weight = Number(profile.currentWeight || 0)
  const height = Number(profile.height || 0)
  const age = Number(profile.age || 0)
  const bmr = 10 * weight + 6.25 * height - 5 * age + 5
  const tdee = bmr * Number(profile.activityFactor || 1.2)
  const targetCalories = Math.max(1200, tdee - Number(profile.deficit || 0))

  const protein = (Number(profile.macros?.proteinPerKg || 2) * weight)
  const fat = (Number(profile.macros?.fatPerKg || 0.9) * weight)
  const proteinCalories = protein * 4
  const fatCalories = fat * 9
  const carbs = Math.max(0, (targetCalories - proteinCalories - fatCalories) / 4)

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories: Math.round(targetCalories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat)
  }
}

export function sumDietDay(dayPlan) {
  const totals = { protein: 0, calories: 0, fat: 0, carbs: 0 }
  dayPlan.meals.forEach((meal) => {
    meal.items.forEach((item) => {
      totals.protein += Number(item.protein || 0)
      totals.calories += Number(item.calories || 0)
      totals.fat += Number(item.fat || 0)
      totals.carbs += Number(item.carbs || 0)
    })
  })
  return Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, Math.round(v)]))
}
