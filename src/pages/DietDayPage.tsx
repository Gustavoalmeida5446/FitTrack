import { CalendarHeatMap, ChevronLeft, CheckmarkFilled } from '@carbon/icons-react';
import { Button, Checkbox, Tile } from '@carbon/react';
import { PageContainer } from '../components/PageContainer';
import { DietDay, Meal } from '../data/types';

interface Props {
  day: DietDay;
  meals: Meal[];
  onBack: () => void;
  onToggleMealDone: (mealId: string) => void;
}

const sumMacros = (meals: Meal[], completedMealIds: string[]) => {
  let plannedCalories = 0;
  let plannedProtein = 0;
  let consumedCalories = 0;
  let consumedProtein = 0;

  meals.forEach((meal) => {
    meal.foods.forEach((food) => {
      plannedCalories += food.calories;
      plannedProtein += food.protein;
      if (completedMealIds.includes(meal.id)) {
        consumedCalories += food.calories;
        consumedProtein += food.protein;
      }
    });
  });

  return { plannedCalories, plannedProtein, consumedCalories, consumedProtein };
};

export function DietDayPage({ day, meals, onBack, onToggleMealDone }: Props) {
  const totals = sumMacros(meals, day.completedMealIds);
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
            <span className="meta-label">Calorias planejadas</span>
            <strong>{totals.plannedCalories}</strong>
          </div>
        </div>
      </Tile>

      <div className="stack">
        {meals.map((meal) => {
          const isDone = day.completedMealIds.includes(meal.id);

          return (
            <Tile key={meal.id} className={`card metric-card diet-meal-card ${isDone ? 'diet-meal-card--done' : ''}`}>
              <div className="card-head">
                <div className="card-head__group">
                  <div className="icon-badge icon-badge--purple card-head__badge">
                    <CalendarHeatMap size={20} />
                  </div>
                  <div className="card-head__title">
                    <h3>{meal.name}</h3>
                    <p>{meal.foods.length} itens</p>
                  </div>
                </div>
                {isDone ? <CheckmarkFilled size={20} className="diet-meal-card__status" /> : null}
              </div>

              <ul className="diet-food-list">
                {meal.foods.map((food) => (
                  <li key={food.id} className="diet-food-list__item">
                    <div>
                      <strong>{food.name}</strong>
                      <span>{food.quantityGrams} g</span>
                    </div>
                    <span>{food.calories} kcal • {food.protein}g proteína</span>
                  </li>
                ))}
              </ul>

              <div className="diet-meal-card__meta">
                <div className="stat-pill">
                  <span>Calorias</span>
                  <strong>{meal.foods.reduce((sum, food) => sum + food.calories, 0)}</strong>
                </div>
                <div className="stat-pill">
                  <span>Proteína</span>
                  <strong>{meal.foods.reduce((sum, food) => sum + food.protein, 0)}g</strong>
                </div>
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
            <div className="stat-pill">
              <span>Calorias planejadas</span>
              <strong>{totals.plannedCalories}</strong>
            </div>
            <div className="stat-pill">
              <span>Proteína planejada</span>
              <strong>{totals.plannedProtein}g</strong>
            </div>
            <div className="stat-pill">
              <span>Calorias consumidas</span>
              <strong>{totals.consumedCalories}</strong>
            </div>
            <div className="stat-pill">
              <span>Proteína consumida</span>
              <strong>{totals.consumedProtein}g</strong>
            </div>
          </div>
        </Tile>
      </div>
    </PageContainer>
  );
}
