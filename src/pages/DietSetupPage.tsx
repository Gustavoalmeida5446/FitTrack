import { CalendarHeatMap, CheckmarkFilled, ChevronLeft, Search } from '@carbon/icons-react';
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
    <PageContainer title="Cadastro de dieta" subtitle="Dieta semanal > Dia > Refeição > Alimento" actions={<Button kind="ghost" size="sm" renderIcon={ChevronLeft} iconDescription="Voltar" onClick={onBack}>Voltar</Button>}>
      <div className="stack">
        <Tile className="card metric-card setup-card">
          <div className="card-head">
            <div className="card-head__group">
              <div className="icon-badge icon-badge--purple card-head__badge">
                <Search size={20} />
              </div>
              <div className="card-head__title">
                <h3>Alimento (API TACO)</h3>
                <p>Busque alimentos e monte a base da refeição</p>
              </div>
            </div>
          </div>
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
          <div className="info-block">
            <span className="meta-label">Selecionados</span>
            <p>{selectedFoods.map((food) => food.name).join(', ') || 'Nenhum'}</p>
          </div>
        </Tile>

        <Tile className="card metric-card setup-card">
          <div className="card-head">
            <div className="card-head__group">
              <div className="icon-badge icon-badge--purple card-head__badge">
                <CheckmarkFilled size={20} />
              </div>
              <div className="card-head__title">
                <h3>Refeição</h3>
                <p>Defina o nome e salve a refeição montada</p>
              </div>
            </div>
          </div>
          <TextInput id="meal-name" labelText="Nome da refeição" value={mealName} onChange={(event) => setMealName(event.target.value)} />
          <div className="info-block">
            <span className="meta-label">Total de refeições</span>
            <p>{meals.length}</p>
          </div>
          <div className="setup-card__footer">
            <Button disabled={!canSaveMeal} onClick={addMeal}>Salvar refeição</Button>
          </div>
        </Tile>

        <Tile className="card metric-card setup-card">
          <div className="card-head">
            <div className="card-head__group">
              <div className="icon-badge icon-badge--purple card-head__badge">
                <CalendarHeatMap size={20} />
              </div>
              <div className="card-head__title">
                <h3>Montagem da dieta semanal</h3>
                <p>Replica as refeições criadas do Dia 1 ao Dia 7</p>
              </div>
            </div>
          </div>
          <div className="info-block">
            <span className="meta-label">Aplicação semanal</span>
            <p>Dia 1 até Dia 7 recebem as refeições criadas.</p>
          </div>
          <div className="setup-card__footer">
            <Button disabled={meals.length === 0} onClick={saveWeeklyDiet}>Salvar dieta semanal</Button>
          </div>
        </Tile>
      </div>
    </PageContainer>
  );
}
