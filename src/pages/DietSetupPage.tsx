import { CalendarHeatMap, CheckmarkFilled, ChevronLeft, Search, TrashCan } from '@carbon/icons-react';
import { Button, NumberInput, TextInput, Tile } from '@carbon/react';
import { useEffect, useMemo, useState } from 'react';
import { DietDay, FoodItem, Meal, WeeklyDiet } from '../data/types';
import { searchFoods, type FoodItem as TacoFood } from '../services/foods';
import { PageContainer } from '../components/PageContainer';

interface Props {
  onBack: () => void;
  diet: WeeklyDiet;
  onSaveDiet: (diet: WeeklyDiet) => void;
}

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

function getSafeNumber(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

export function DietSetupPage({ onBack, diet, onSaveDiet }: Props) {
  const [draftDiet, setDraftDiet] = useState(diet);
  const [selectedDayId, setSelectedDayId] = useState(diet.days[0]?.id ?? 'd-1');
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [foodQuery, setFoodQuery] = useState('');
  const [foodOptions, setFoodOptions] = useState<TacoFood[]>([]);
  const [mealName, setMealName] = useState('');
  const [foodQuantityGrams, setFoodQuantityGrams] = useState(100);
  const [selectedFoods, setSelectedFoods] = useState<FoodItem[]>([]);
  const [selectedDayMealIds, setSelectedDayMealIds] = useState<string[]>([]);

  useEffect(() => {
    setDraftDiet(diet);
    setSelectedDayId((currentDayId) => diet.days.some((day) => day.id === currentDayId) ? currentDayId : (diet.days[0]?.id ?? 'd-1'));
  }, [diet]);

  const selectedDay = useMemo(() => draftDiet.days.find((day) => day.id === selectedDayId) ?? draftDiet.days[0], [draftDiet.days, selectedDayId]);

  useEffect(() => {
    if (!selectedDay) {
      setSelectedDayMealIds([]);
      return;
    }

    setSelectedDayMealIds(selectedDay.mealIds);
  }, [selectedDay]);

  const canSaveMeal = useMemo(() => mealName.trim() && selectedFoods.length > 0, [mealName, selectedFoods.length]);
  const selectedMealTotals = useMemo(() => selectedFoods.reduce((acc, food) => ({
    calories: acc.calories + food.calories,
    protein: acc.protein + food.protein,
    carbs: acc.carbs + food.carbs,
    fat: acc.fat + food.fat
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 }), [selectedFoods]);
  const selectedDayMeals = useMemo(() => draftDiet.meals.filter((meal) => selectedDayMealIds.includes(meal.id)), [draftDiet.meals, selectedDayMealIds]);

  if (!selectedDay) {
    return (
      <PageContainer title="Cadastro de dieta" subtitle="Crie refeições e monte os dias da semana" actions={<Button kind="ghost" size="sm" renderIcon={ChevronLeft} iconDescription="Voltar" onClick={onBack}>Voltar</Button>}>
        <Tile className="card metric-card empty-state-card">
          <h3>Não foi possível carregar a dieta</h3>
          <p>Tente voltar e abrir o cadastro novamente.</p>
        </Tile>
      </PageContainer>
    );
  }

  const commitDiet = (nextDiet: WeeklyDiet) => {
    setDraftDiet(nextDiet);
    onSaveDiet(nextDiet);
  };

  const resetMealForm = () => {
    setEditingMealId(null);
    setMealName('');
    setSelectedFoods([]);
    setFoodQuery('');
    setFoodOptions([]);
    setFoodQuantityGrams(100);
  };

  const handleFoodSearch = (value: string) => {
    setFoodQuery(value);
    setFoodOptions(searchFoods(value).slice(0, 10));
  };

  const handleSelectFood = (food: TacoFood) => {
    const quantity = Math.max(1, foodQuantityGrams || 100);
    setSelectedFoods((prev) => [...prev, scaleFood(food, quantity)]);
    setFoodQuery('');
    setFoodOptions([]);
    setFoodQuantityGrams(100);
  };

  const handleRemoveDraftFood = (foodId: string) => {
    setSelectedFoods((prev) => prev.filter((food) => food.id !== foodId));
  };

  const handleSaveMeal = () => {
    if (!canSaveMeal) return;

    const meal: Meal = {
      id: editingMealId ?? crypto.randomUUID(),
      name: mealName.trim(),
      foods: selectedFoods.map((food) => ({ ...food }))
    };

    const nextDiet: WeeklyDiet = {
      ...draftDiet,
      meals: editingMealId
        ? draftDiet.meals.map((item) => item.id === editingMealId ? meal : item)
        : [...draftDiet.meals, meal]
    };

    commitDiet(nextDiet);
    resetMealForm();
  };

  const handleEditMeal = (meal: Meal) => {
    setEditingMealId(meal.id);
    setMealName(meal.name);
    setSelectedFoods(meal.foods.map((food) => ({ ...food, id: crypto.randomUUID() })));
    setFoodQuery('');
    setFoodOptions([]);
  };

  const handleRemoveMeal = (mealId: string) => {
    const nextDiet: WeeklyDiet = {
      ...draftDiet,
      meals: draftDiet.meals.filter((meal) => meal.id !== mealId),
      days: draftDiet.days.map((day) => ({
        ...day,
        mealIds: day.mealIds.filter((id) => id !== mealId),
        completedMealIds: day.completedMealIds.filter((id) => id !== mealId)
      }))
    };

    commitDiet(nextDiet);

    if (editingMealId === mealId) {
      resetMealForm();
    }
  };

  const toggleMealInDay = (mealId: string) => {
    setSelectedDayMealIds((prev) => prev.includes(mealId) ? prev.filter((id) => id !== mealId) : [...prev, mealId]);
  };

  const handleSaveDay = () => {
    const nextDiet: WeeklyDiet = {
      ...draftDiet,
      days: draftDiet.days.map((day) => {
        if (day.id !== selectedDay.id) {
          return day;
        }

        return {
          ...day,
          mealIds: selectedDayMealIds,
          completedMealIds: day.completedMealIds.filter((mealId) => selectedDayMealIds.includes(mealId))
        };
      })
    };

    commitDiet(nextDiet);
  };

  const handleClearDay = () => {
    setSelectedDayMealIds([]);
    const nextDiet: WeeklyDiet = {
      ...draftDiet,
      days: draftDiet.days.map((day) => day.id === selectedDay.id ? { ...day, mealIds: [], completedMealIds: [] } : day)
    };

    commitDiet(nextDiet);
  };

  return (
    <PageContainer title="Cadastro de dieta" subtitle="Crie refeições com vários alimentos e monte os dias da semana" actions={<Button kind="ghost" size="sm" renderIcon={ChevronLeft} iconDescription="Voltar" onClick={onBack}>Voltar</Button>}>
      <div className="stack">
        <Tile className="card metric-card setup-card">
          <div className="card-head">
            <div className="card-head__group">
              <div className="icon-badge icon-badge--purple card-head__badge">
                <Search size={20} />
              </div>
              <div className="card-head__title">
                <h3>Criar refeição</h3>
                <p>Busque alimentos, adicione quantos quiser e salve a refeição</p>
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
            <NumberInput id="food-quantity" label="Quantidade (g)" min={1} value={foodQuantityGrams} onChange={(event) => setFoodQuantityGrams(getSafeNumber(Number((event.target as HTMLInputElement).value), 100))} />
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
            {selectedFoods.length > 0 ? <Button kind="ghost" size="sm" onClick={() => setSelectedFoods([])}>Limpar alimentos</Button> : null}
            {editingMealId ? <Button kind="ghost" size="sm" onClick={resetMealForm}>Cancelar edição</Button> : null}
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
                <p>Selecione quantos alimentos quiser para montar a refeição.</p>
              </div>
            )}
          </div>
          <div className="setup-card__footer">
            <Button disabled={!canSaveMeal} onClick={handleSaveMeal}>{editingMealId ? 'Atualizar refeição' : 'Salvar refeição'}</Button>
          </div>
        </Tile>

        <Tile className="card metric-card setup-card">
          <div className="card-head">
            <div className="card-head__group">
              <div className="icon-badge icon-badge--purple card-head__badge">
                <CheckmarkFilled size={20} />
              </div>
              <div className="card-head__title">
                <h3>Refeições cadastradas</h3>
                <p>Use essas refeições para montar os dias da dieta</p>
              </div>
            </div>
          </div>
          <div className="stack">
            {draftDiet.meals.length > 0 ? draftDiet.meals.map((meal) => (
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
                <span className="meta-label">Refeições</span>
                <p>Nenhuma refeição cadastrada ainda.</p>
              </div>
            )}
          </div>
        </Tile>

        <Tile className="card metric-card setup-card">
          <div className="card-head">
            <div className="card-head__group">
              <div className="icon-badge icon-badge--purple card-head__badge">
                <CalendarHeatMap size={20} />
              </div>
              <div className="card-head__title">
                <h3>Criar dia</h3>
                <p>Escolha o dia e selecione quais refeições fazem parte dele</p>
              </div>
            </div>
          </div>
          <div className="day-selector">
            {draftDiet.days.map((day) => (
              <button key={day.id} type="button" className={`day-selector__item ${selectedDayId === day.id ? 'day-selector__item--active' : ''}`} onClick={() => setSelectedDayId(day.id)}>
                {day.label}
              </button>
            ))}
          </div>
          <div className="stack">
            {draftDiet.meals.length > 0 ? draftDiet.meals.map((meal) => {
              const selected = selectedDayMealIds.includes(meal.id);

              return (
                <button key={meal.id} type="button" className={`selection-toggle-card ${selected ? 'selection-toggle-card--active' : ''}`} onClick={() => toggleMealInDay(meal.id)}>
                  <div>
                    <span className="meta-label">{meal.foods.length} alimento(s)</span>
                    <strong>{meal.name}</strong>
                  </div>
                  <span>{selected ? 'Selecionada' : 'Selecionar'}</span>
                </button>
              );
            }) : (
              <div className="info-block">
                <span className="meta-label">Refeições disponíveis</span>
                <p>Cadastre pelo menos uma refeição antes de montar o dia.</p>
              </div>
            )}
          </div>
          <div className="inline-actions">
            <Button kind="ghost" size="sm" disabled={selectedDayMealIds.length === 0} onClick={handleClearDay}>
              Limpar dia
            </Button>
            <Button disabled={draftDiet.meals.length === 0} onClick={handleSaveDay}>
              Salvar {selectedDay.label}
            </Button>
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
                <p>Reveja as refeições atribuídas ao dia selecionado</p>
              </div>
            </div>
          </div>
          <div className="stack">
            {selectedDayMeals.length > 0 ? selectedDayMeals.map((meal) => (
              <div key={meal.id} className="setup-selection-card">
                <div className="setup-selection-card__header">
                  <div>
                    <span className="meta-label">{meal.foods.length} alimento(s)</span>
                    <p>{meal.name}</p>
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
                <p>Nenhuma refeição selecionada para este dia ainda.</p>
              </div>
            )}
          </div>
        </Tile>
      </div>
    </PageContainer>
  );
}
