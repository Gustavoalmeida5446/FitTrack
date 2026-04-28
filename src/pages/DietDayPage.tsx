import { CalendarHeatMap, ChevronLeft, CheckmarkFilled } from '@carbon/icons-react';
import { Button, Checkbox, Tile } from '@carbon/react';
import { CardHeader } from '../components/CardHeader';
import { PageContainer } from '../components/PageContainer';
import { StatPill } from '../components/StatPill';
import { DietDay, Meal, NutritionTargets } from '../data/types';
import { calculateDietProgress, calculateMealTotals } from '../lib/nutrition';

interface Props {
  day: DietDay;
  meals: Meal[];
  targets: NutritionTargets;
  onBack: () => void;
  onToggleMealDone: (mealId: string) => void;
}

export function DietDayPage({ day, meals, targets, onBack, onToggleMealDone }: Props) {
  const totals = calculateDietProgress(meals, day.completedMealIds);
  const completedMeals = day.completedMealIds.length;

  return (
    <PageContainer
      title={day.label}
      subtitle="Dieta semanal"
      actions={<Button kind="ghost" size="sm" renderIcon={ChevronLeft} iconDescription="Voltar" onClick={onBack}>Voltar</Button>}
    >
      <Tile className="card metric-card diet-summary-card">
        <div className="metric-row diet-summary-card__row">
          <div>
            <span className="meta-label">Refeições feitas</span>
            <strong>{completedMeals}/{meals.length}</strong>
          </div>
          <div>
            <span className="meta-label">Consumido hoje</span>
            <strong>{Math.round(totals.consumedCalories)} kcal</strong>
          </div>
        </div>
      </Tile>

      <Tile className="card metric-card diet-targets-card">
        <CardHeader
          icon={<CheckmarkFilled size={20} />}
          title="Meta Diária"
          description="O que você precisa consumir e o que já consumiu hoje"
          accent="purple"
        />
        <div className="diet-totals-card__grid">
          <StatPill label="Meta de calorias" value={`${targets.caloriesDaily} kcal`} />
          <StatPill label="Meta de proteína" value={`${targets.proteinDaily} g`} />
          <StatPill label="Calorias consumidas" value={`${Math.round(totals.consumedCalories)} kcal`} />
          <StatPill label="Proteína consumida" value={`${Math.round(totals.consumedProtein)} g`} />
        </div>
      </Tile>

      <div className="stack">
        {meals.map((meal) => {
          const isDone = day.completedMealIds.includes(meal.id);
          const mealTotals = calculateMealTotals(meal);

          return (
            <Tile key={meal.id} className={`card metric-card diet-meal-card ${isDone ? 'diet-meal-card--done' : ''}`}>
              <CardHeader
                icon={<CalendarHeatMap size={20} />}
                title={meal.name}
                description={`${meal.foods.length} itens`}
                accent="purple"
                trailing={isDone ? <CheckmarkFilled size={20} className="diet-meal-card__status" /> : null}
              />

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

              <div className="diet-meal-card__meta">
                <StatPill label="Calorias" value={mealTotals.calories} />
                <StatPill label="Proteína" value={`${mealTotals.protein}g`} />
              </div>

              <div className="diet-meal-card__footer">
                <Checkbox id={`meal-${meal.id}`} labelText="Refeição feita" checked={isDone} onChange={() => onToggleMealDone(meal.id)} />
              </div>
            </Tile>
          );
        })}

        <Tile className="card metric-card diet-totals-card">
          <h3>Resumo do dia</h3>
          <div className="diet-totals-card__grid">
            <StatPill label="Meta de calorias" value={`${targets.caloriesDaily} kcal`} />
            <StatPill label="Meta de proteína" value={`${targets.proteinDaily}g`} />
            <StatPill label="Calorias consumidas" value={`${Math.round(totals.consumedCalories)} kcal`} />
            <StatPill label="Proteína consumida" value={`${Math.round(totals.consumedProtein)}g`} />
          </div>
        </Tile>
      </div>
    </PageContainer>
  );
}
