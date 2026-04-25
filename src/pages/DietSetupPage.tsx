import { CalendarHeatMap, CheckmarkFilled, ChevronLeft, Search, TrashCan } from '@carbon/icons-react';
import { Button, NumberInput, TextInput, Tile } from '@carbon/react';
import { useMemo, useState } from 'react';
import { DietDay, FoodItem, Meal, WeeklyDiet } from '../data/types';
import { searchFoods, type FoodItem as TacoFood } from '../services/foods';
import { PageContainer } from '../components/PageContainer';

interface Props {
  onBack: () => void;
  onSaveDiet: (diet: WeeklyDiet) => void;
}

const initialDays: DietDay[] = Array.from({ length: 7 }, (_, index) => ({
  id: `d-${index + 1}`,
  label: `Dia ${index + 1}`,
  meals: []
}));

function scaleFood(food: TacoFood, quantityGrams: number): FoodItem {
  const factor = quantityGrams / 100;

  return {
    id: crypto.randomUUID(),
    foodId: food.id,
    name: food.nome,
    calories: Number(((food.kcal ?? 0) * factor).toFixed(1)),
    protein: Number(((food.proteina ?? 0) * factor).toFixed(1)),
    carbs: Number(((food.carboidrato ?? 0) * factor).toFixed(1)),
    fat: Number(((food.gordura ?? 0) * factor).toFixed(1)),
    fiber: Number(((food.fibra ?? 0) * factor).toFixed(1)),
    quantityGrams,
    baseQuantityGrams: 100
  };
}

export function DietSetupPage({ onBack, onSaveDiet }: Props) {
  const [selectedDayId, setSelectedDayId] = useState(initialDays[0].id);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [foodQuery, setFoodQuery] = useState('');
  const [foodOptions, setFoodOptions] = useState<TacoFood[]>([]);
  const [mealName, setMealName] = useState('');
  const [foodQuantityGrams, setFoodQuantityGrams] = useState(100);
  const [selectedFoods, setSelectedFoods] = useState<FoodItem[]>([]);
  const [days, setDays] = useState<DietDay[]>(initialDays);

  const selectedDay = useMemo(() => days.find((day) => day.id === selectedDayId) ?? days[0], [days, selectedDayId]);
  const canSaveMeal = useMemo(() => mealName.trim() && selectedFoods.length > 0, [mealName, selectedFoods.length]);
  const canSaveDiet = useMemo(() => days.some((day) => day.meals.length > 0), [days]);

  const selectedMealTotals = useMemo(() => selectedFoods.reduce((acc, food) => ({
    calories: acc.calories + food.calories,
    protein: acc.protein + food.protein,
    carbs: acc.carbs + food.carbs,
    fat: acc.fat + food.fat
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 }), [selectedFoods]);

  const handleFoodSearch = (value: string) => {
    setFoodQuery(value);
    setFoodOptions(searchFoods(value).slice(0, 10));
  };

  const handleSelectFood = (food: TacoFood) => {
    const quantity = Math.max(1, foodQuantityGrams || 100);
    setSelectedFoods((prev) => [...prev, scaleFood(food, quantity)]);
    setFoodQuery(food.nome);
    setFoodOptions([]);
  };

  const handleRemoveDraftFood = (foodId: string) => {
    setSelectedFoods((prev) => prev.filter((food) => food.id !== foodId));
  };

  const handleAddMeal = () => {
    if (!canSaveMeal) return;

    const meal: Meal = {
      id: editingMealId ?? crypto.randomUUID(),
      name: mealName.trim(),
      foods: selectedFoods,
      done: false
    };

    setDays((prev) => prev.map((day) => {
      if (day.id !== selectedDayId) {
        return day;
      }

      if (editingMealId) {
        return {
          ...day,
          meals: day.meals.map((item) => item.id === editingMealId ? meal : item)
        };
      }

      return {
        ...day,
        meals: [...day.meals, meal]
      };
    }));

    setEditingMealId(null);
    setMealName('');
    setSelectedFoods([]);
    setFoodQuery('');
    setFoodOptions([]);
    setFoodQuantityGrams(100);
  };

  const handleEditMeal = (meal: Meal) => {
    setEditingMealId(meal.id);
    setMealName(meal.name);
    setSelectedFoods(meal.foods);
    setFoodQuery('');
    setFoodOptions([]);
  };

  const handleRemoveMeal = (mealId: string) => {
    setDays((prev) => prev.map((day) => day.id === selectedDayId ? { ...day, meals: day.meals.filter((meal) => meal.id !== mealId) } : day));
    if (editingMealId === mealId) {
      setEditingMealId(null);
      setMealName('');
      setSelectedFoods([]);
      setFoodQuery('');
      setFoodOptions([]);
      setFoodQuantityGrams(100);
    }
  };

  const handleClearSelectedFoods = () => {
    setSelectedFoods([]);
    setFoodQuery('');
    setFoodOptions([]);
  };

  const handleCopyPreviousDay = () => {
    const currentIndex = days.findIndex((day) => day.id === selectedDayId);
    if (currentIndex <= 0) return;

    const previousDay = days[currentIndex - 1];
    setDays((prev) => prev.map((day, index) => index === currentIndex ? {
      ...day,
      meals: previousDay.meals.map((meal) => ({
        ...meal,
        id: crypto.randomUUID(),
        foods: meal.foods.map((food) => ({ ...food, id: crypto.randomUUID() }))
      }))
    } : day));
  };

  const handleClearSelectedDay = () => {
    setDays((prev) => prev.map((day) => day.id === selectedDayId ? { ...day, meals: [] } : day));
  };

  const saveWeeklyDiet = () => {
    if (!canSaveDiet) return;
    onSaveDiet({
      id: crypto.randomUUID(),
      days
    });
  };

  return (
    <PageContainer title="Cadastro de dieta" subtitle="Monte a dieta por dia, refeição e quantidade" actions={<Button kind="ghost" size="sm" renderIcon={ChevronLeft} iconDescription="Voltar" onClick={onBack}>Voltar</Button>}>
      <div className="stack">
        <Tile className="card metric-card setup-card">
          <div className="card-head">
            <div className="card-head__group">
              <div className="icon-badge icon-badge--purple card-head__badge">
                <CalendarHeatMap size={20} />
              </div>
              <div className="card-head__title">
                <h3>Dia da dieta</h3>
                <p>Escolha o dia que você quer montar</p>
              </div>
            </div>
          </div>
          <div className="day-selector">
            {days.map((day) => (
              <button key={day.id} type="button" className={`day-selector__item ${selectedDayId === day.id ? 'day-selector__item--active' : ''}`} onClick={() => setSelectedDayId(day.id)}>
                {day.label}
              </button>
            ))}
          </div>
        </Tile>

        <Tile className="card metric-card setup-card">
          <div className="card-head">
            <div className="card-head__group">
              <div className="icon-badge icon-badge--purple card-head__badge">
                <Search size={20} />
              </div>
              <div className="card-head__title">
                <h3>Alimentos</h3>
                <p>Busque na base TACO, defina a quantidade e monte a refeição</p>
              </div>
            </div>
          </div>
          <div className="setup-card__fields">
            <TextInput
              id="food-search"
              labelText="Buscar alimento"
              value={foodQuery}
              onChange={(event) => handleFoodSearch(event.target.value)}
              onBlur={() => window.setTimeout(() => setFoodOptions([]), 150)}
            />
            <NumberInput id="food-quantity" label="Quantidade (g)" min={1} value={foodQuantityGrams} onChange={(event) => setFoodQuantityGrams(Number((event.target as HTMLInputElement).value))} />
          </div>
          {foodOptions.length > 0 ? (
            <ul className="search-list">
              {foodOptions.map((food) => (
                <li key={food.id}>
                  <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => handleSelectFood(food)}>
                    {food.nome} ({food.kcal ?? 0} kcal / 100g)
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <TextInput id="meal-name" labelText="Nome da refeição" value={mealName} onChange={(event) => setMealName(event.target.value)} />
          <div className="info-block">
            <span className="meta-label">Resumo da refeição atual</span>
            <p>{selectedFoods.length} alimento(s) • {selectedMealTotals.calories.toFixed(1)} kcal • {selectedMealTotals.protein.toFixed(1)}g proteína</p>
          </div>
          <div className="inline-actions">
            {selectedFoods.length > 0 ? <Button kind="ghost" size="sm" onClick={handleClearSelectedFoods}>Limpar alimentos</Button> : null}
            {editingMealId ? <Button kind="ghost" size="sm" onClick={() => {
              setEditingMealId(null);
              setMealName('');
              setSelectedFoods([]);
              setFoodQuery('');
              setFoodOptions([]);
            }}>Cancelar edição</Button> : null}
          </div>
          <div className="stack">
            {selectedFoods.length > 0 ? selectedFoods.map((food) => (
              <div key={food.id} className="setup-selection-card">
                <div className="setup-selection-card__header">
                  <div>
                    <span className="meta-label">{food.quantityGrams} g</span>
                    <p>{food.name}</p>
                  </div>
                  <Button kind="ghost" size="sm" renderIcon={TrashCan} iconDescription="Remover alimento" onClick={() => handleRemoveDraftFood(food.id)}>
                    Remover
                  </Button>
                </div>
                <div className="setup-selection-card__meta">
                  <span>{food.calories} kcal</span>
                  <span>{food.protein}g proteína</span>
                  <span>{food.carbs}g carb</span>
                  <span>{food.fat}g gordura</span>
                </div>
              </div>
            )) : (
              <div className="info-block">
                <span className="meta-label">Alimentos da refeição</span>
                <p>Selecione alimentos e quantidade para montar a refeição.</p>
              </div>
            )}
          </div>
          <div className="setup-card__footer">
            <Button disabled={!canSaveMeal} onClick={handleAddMeal}>{editingMealId ? `Atualizar refeição do ${selectedDay.label}` : `Adicionar refeição ao ${selectedDay.label}`}</Button>
          </div>
        </Tile>

        <Tile className="card metric-card setup-card">
          <div className="card-head">
            <div className="card-head__group">
              <div className="icon-badge icon-badge--purple card-head__badge">
                <CheckmarkFilled size={20} />
              </div>
              <div className="card-head__title">
                <h3>{selectedDay.label}</h3>
                <p>Reveja as refeições cadastradas para o dia selecionado</p>
              </div>
            </div>
          </div>
          <div className="inline-actions">
            <Button kind="ghost" size="sm" disabled={days.findIndex((day) => day.id === selectedDayId) <= 0} onClick={handleCopyPreviousDay}>
              Copiar dia anterior
            </Button>
            <Button kind="ghost" size="sm" disabled={selectedDay.meals.length === 0} onClick={handleClearSelectedDay}>
              Limpar dia
            </Button>
          </div>
          <div className="stack">
            {selectedDay.meals.length > 0 ? selectedDay.meals.map((meal) => (
              <div key={meal.id} className="setup-selection-card">
                <div className="setup-selection-card__header">
                  <div>
                    <span className="meta-label">{meal.foods.length} alimento(s)</span>
                    <p>{meal.name}</p>
                  </div>
                  <div className="inline-actions">
                    <Button kind="ghost" size="sm" onClick={() => handleEditMeal(meal)}>
                      Editar
                    </Button>
                    <Button kind="ghost" size="sm" renderIcon={TrashCan} iconDescription="Remover refeição" onClick={() => handleRemoveMeal(meal.id)}>
                      Remover
                    </Button>
                  </div>
                </div>
                <div className="setup-selection-card__meta">
                  <span>{meal.foods.reduce((sum, food) => sum + food.calories, 0).toFixed(1)} kcal</span>
                  <span>{meal.foods.reduce((sum, food) => sum + food.protein, 0).toFixed(1)}g proteína</span>
                </div>
              </div>
            )) : (
              <div className="info-block">
                <span className="meta-label">Refeições do dia</span>
                <p>Nenhuma refeição cadastrada para este dia ainda.</p>
              </div>
            )}
          </div>
          <div className="setup-card__footer">
            <Button disabled={!canSaveDiet} onClick={saveWeeklyDiet}>Salvar dieta semanal</Button>
          </div>
        </Tile>
      </div>
    </PageContainer>
  );
}
