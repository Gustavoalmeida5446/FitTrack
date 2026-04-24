import { Button, Checkbox, Tile } from '@carbon/react';
import { PageContainer } from '../components/PageContainer';
import { DietDay } from '../data/types';

interface Props {
  day: DietDay;
  onBack: () => void;
  onToggleMealDone: (mealId: string) => void;
}

const sumMacros = (day: DietDay) => {
  let plannedCalories = 0;
  let plannedProtein = 0;
  let consumedCalories = 0;
  let consumedProtein = 0;

  day.meals.forEach((meal) => {
    meal.foods.forEach((food) => {
      plannedCalories += food.calories;
      plannedProtein += food.protein;
      if (meal.done) {
        consumedCalories += food.calories;
        consumedProtein += food.protein;
      }
    });
  });

  return { plannedCalories, plannedProtein, consumedCalories, consumedProtein };
};

export function DietDayPage({ day, onBack, onToggleMealDone }: Props) {
  const totals = sumMacros(day);

  return (
    <PageContainer
      title={day.label}
      subtitle="Dieta semanal"
      actions={<Button kind="ghost" size="sm" onClick={onBack}>Voltar</Button>}
    >
      <div className="stack">
        {day.meals.map((meal) => (
          <Tile key={meal.id} className="card">
            <h3>{meal.name}</h3>
            <ul>
              {meal.foods.map((food) => (
                <li key={food.id}>{food.name} — {food.calories} kcal / {food.protein}g proteína</li>
              ))}
            </ul>
            <p>Calorias: {meal.foods.reduce((sum, food) => sum + food.calories, 0)}</p>
            <p>Proteína: {meal.foods.reduce((sum, food) => sum + food.protein, 0)}g</p>
            <Checkbox id={`meal-${meal.id}`} labelText="Refeição feita" checked={meal.done} onChange={() => onToggleMealDone(meal.id)} />
          </Tile>
        ))}

        <Tile className="card">
          <h3>Resumo do dia</h3>
          <p>Calorias planejadas: {totals.plannedCalories}</p>
          <p>Proteína planejada: {totals.plannedProtein}g</p>
          <p>Calorias consumidas: {totals.consumedCalories}</p>
          <p>Proteína consumida: {totals.consumedProtein}g</p>
        </Tile>
      </div>
    </PageContainer>
  );
}
