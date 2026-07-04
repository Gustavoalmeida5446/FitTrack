import { CalendarHeatMap, ChevronDown, ChevronLeft, CheckmarkFilled } from '@carbon/icons-react';
import { Button, Checkbox, Tile } from '@carbon/react';
import { AppNumberInput } from '../components/AppNumberInput';
import { CardHeader } from '../components/CardHeader';
import { PageContainer } from '../components/PageContainer';
import { StatsGrid } from '../components/StatsGrid';
import { SummaryStatsCard } from '../components/SummaryStatsCard';
import { DietDay, Meal, NutritionTargets } from '../data/types';
import { formatRoundedInteger } from '../lib/number';
import { calculateDietProgress, calculateMealTotals, getMealCompletionQuantity } from '../lib/nutrition';

interface Props {
  day: DietDay;
  meals: Meal[];
  targets: NutritionTargets;
  onBack: () => void;
  onToggleMealDone: (mealId: string) => void;
  onUpdateMealQuantity: (mealId: string, quantity: number) => void;
}

export function DietDayPage({ day, meals, targets, onBack, onToggleMealDone, onUpdateMealQuantity }: Props) {
  const totals = calculateDietProgress(meals, day.completedMealIds, day.completedMealQuantities);
  const completedMeals = day.completedMealIds.length;

  return (
    <PageContainer
      title={day.label}
      subtitle="Dieta semanal"
      actions={<Button kind="ghost" size="sm" renderIcon={ChevronLeft} iconDescription="Voltar" onClick={onBack}>Voltar</Button>}
    >
      <SummaryStatsCard
        className="diet-summary-card"
        items={[
          { label: 'Refeições feitas', value: `${completedMeals}/${meals.length}` },
          { label: 'Calorias', value: `${formatRoundedInteger(totals.consumedCalories)} / ${targets.caloriesDaily} kcal` },
          { label: 'Proteína', value: `${formatRoundedInteger(totals.consumedProtein)} / ${targets.proteinDaily} g` }
        ]}
      />

      <div className="stack">
        {meals.map((meal) => {
          const isDone = day.completedMealIds.includes(meal.id);
          const mealQuantity = getMealCompletionQuantity(meal.id, day.completedMealQuantities);
          const baseMealTotals = calculateMealTotals(meal);
          const consumedMealTotals = calculateMealTotals(meal, isDone ? mealQuantity : 1);

          return (
            <Tile key={meal.id} className={`card metric-card diet-meal-card ${isDone ? 'diet-meal-card--done' : ''}`}>
              <details className="workout-exercise-accordion diet-meal-accordion">
                <summary className="workout-exercise-accordion__summary">
                  <CardHeader
                    icon={<CalendarHeatMap size={20} />}
                    title={meal.name}
                    description={`${meal.foods.length} itens`}
                    accent="purple"
                    trailing={isDone ? <CheckmarkFilled size={20} className="diet-meal-card__status" /> : null}
                  />
                  <div className="workout-exercise-accordion__summary-meta">
                    <span>{isDone ? `${mealQuantity}x feita` : `${formatRoundedInteger(baseMealTotals.calories)} kcal`}</span>
                    <ChevronDown className="workout-exercise-accordion__chevron" size={20} aria-hidden="true" />
                  </div>
                </summary>
                <div className="workout-exercise-accordion__content">
                  <ul className="diet-food-list">
                    {meal.foods.map((food) => (
                      <li key={food.id} className="diet-food-list__item">
                        <div>
                          <strong>{food.name}</strong>
                          <span>{food.quantity} {food.unit}</span>
                        </div>
                        <span>{food.calories} kcal • {food.protein}g proteína</span>
                      </li>
                    ))}
                  </ul>

                  <StatsGrid
                    className="diet-meal-card__meta"
                    items={[
                      { label: isDone ? 'Calorias consumidas' : 'Calorias', value: formatRoundedInteger(consumedMealTotals.calories) },
                      { label: isDone ? 'Proteína consumida' : 'Proteína', value: `${formatRoundedInteger(consumedMealTotals.protein)}g` }
                    ]}
                  />

                  <div className="diet-meal-card__footer">
                    {isDone ? (
                      <div className="diet-meal-card__quantity-field">
                        <AppNumberInput
                          id={`meal-quantity-${meal.id}`}
                          label="Quantidade da refeição"
                          min={1}
                          step={0.5}
                          value={mealQuantity}
                          onValueChange={(value) => onUpdateMealQuantity(meal.id, value)}
                        />
                      </div>
                    ) : null}
                    <Checkbox id={`meal-${meal.id}`} labelText="Refeição feita" checked={isDone} onChange={() => onToggleMealDone(meal.id)} />
                  </div>
                </div>
              </details>
            </Tile>
          );
        })}

      </div>
    </PageContainer>
  );
}
