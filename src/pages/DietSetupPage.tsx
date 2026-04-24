import { Button, TextInput, Tile } from '@carbon/react';
import { useMemo, useState } from 'react';
import { DietDay, Meal, WeeklyDiet } from '../data/types';
import { searchFoods } from '../services/tacoService';
import { PageContainer } from '../components/PageContainer';

interface Props {
  onBack: () => void;
  onSaveDiet: (diet: WeeklyDiet) => void;
}

export function DietSetupPage({ onBack, onSaveDiet }: Props) {
  const [foodQuery, setFoodQuery] = useState('');
  const [foodOptions, setFoodOptions] = useState<{ id: string; name: string; calories: number; protein: number }[]>([]);
  const [mealName, setMealName] = useState('');
  const [selectedFoods, setSelectedFoods] = useState<{ id: string; name: string; calories: number; protein: number }[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);

  const canSaveMeal = useMemo(() => mealName.trim() && selectedFoods.length > 0, [mealName, selectedFoods]);

  const handleFoodSearch = async (value: string) => {
    setFoodQuery(value);
    setFoodOptions(await searchFoods(value));
  };

  const addMeal = () => {
    if (!canSaveMeal) return;
    setMeals((prev) => [...prev, { id: crypto.randomUUID(), name: mealName, foods: selectedFoods, done: false }]);
    setMealName('');
    setSelectedFoods([]);
  };

  const saveWeeklyDiet = () => {
    const days: DietDay[] = Array.from({ length: 7 }, (_, index) => ({
      id: `d-${index + 1}`,
      label: `Dia ${index + 1}`,
      meals
    }));

    onSaveDiet({ id: crypto.randomUUID(), days });
  };

  return (
    <PageContainer title="Cadastro de dieta" subtitle="Dieta semanal > Dia > Refeição > Alimento" actions={<Button kind="ghost" size="sm" onClick={onBack}>Voltar</Button>}>
      <div className="stack">
        <Tile className="card">
          <h3>Alimento (API TACO)</h3>
          <TextInput id="food-search" labelText="Buscar alimento" value={foodQuery} onChange={(event) => void handleFoodSearch(event.target.value)} />
          {foodOptions.length > 0 ? (
            <ul className="search-list">
              {foodOptions.map((food) => (
                <li key={food.id}>
                  <button type="button" onClick={() => setSelectedFoods((prev) => [...prev, food])}>{food.name} ({food.calories} kcal)</button>
                </li>
              ))}
            </ul>
          ) : null}
          <p>Selecionados: {selectedFoods.map((food) => food.name).join(', ') || 'Nenhum'}</p>
        </Tile>

        <Tile className="card">
          <h3>Refeição</h3>
          <TextInput id="meal-name" labelText="Nome da refeição" value={mealName} onChange={(event) => setMealName(event.target.value)} />
          <Button disabled={!canSaveMeal} onClick={addMeal}>Salvar refeição</Button>
          <p>Total de refeições: {meals.length}</p>
        </Tile>

        <Tile className="card">
          <h3>Montagem da dieta semanal</h3>
          <p>Dia 1 até Dia 7 recebem as refeições criadas.</p>
          <Button disabled={meals.length === 0} onClick={saveWeeklyDiet}>Salvar dieta semanal</Button>
        </Tile>
      </div>
    </PageContainer>
  );
}
