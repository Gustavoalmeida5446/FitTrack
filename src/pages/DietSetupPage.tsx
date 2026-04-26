import { CalendarHeatMap, CheckmarkFilled, ChevronLeft, Search, TrashCan } from '@carbon/icons-react';
import { Button, NumberInput, TextInput, Tile } from '@carbon/react';
import { useEffect, useMemo, useState } from 'react';
import { DietDay, FoodItem, Meal, WeeklyDiet } from '../data/types';
import { convertFoodQuantityToGrams, getFoodDefaultQuantity, getFoodMeasurementUnit, searchFoods, type FoodItem as TacoFood } from '../services/foods';
import { PageContainer } from '../components/PageContainer';

interface Props {
  onBack: () => void;
  diet: WeeklyDiet;
  onSaveDiet: (diet: WeeklyDiet) => void;
}

function parsePortionBase(portionBase: string | null | undefined) {
  const rawValue = portionBase?.trim() ?? '';
  const match = rawValue.match(/^(\d+(?:[.,]\d+)?)\s*(.+)$/);

  if (!match) {
    return {
      amount: 100,
      unit: 'g'
    };
  }

  return {
    amount: Number(match[1].replace(',', '.')),
    unit: match[2].trim()
  };
}

function scaleFood(food: TacoFood, quantity: number): FoodItem {
  const portionBase = parsePortionBase(food.porcaoBase);
  const quantityInGrams = convertFoodQuantityToGrams(food, quantity);
  const factor = quantityInGrams / portionBase.amount;
  const measurementUnit = getFoodMeasurementUnit(food);

  return {
    id: crypto.randomUUID(),
    foodId: food.id,
    name: food.nome,
    calories: Number(((food.kcal ?? 0) * factor).toFixed(1)),
    protein: Number(((food.proteina ?? 0) * factor).toFixed(1)),
    carbs: Number(((food.carboidrato ?? 0) * factor).toFixed(1)),
    fat: Number(((food.gordura ?? 0) * factor).toFixed(1)),
    fiber: Number(((food.fibra ?? 0) * factor).toFixed(1)),
    quantity,
    unit: measurementUnit,
    baseQuantity: portionBase.amount,
    baseUnit: portionBase.unit
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
  const [selectedFood, setSelectedFood] = useState<TacoFood | null>(null);
  const [foodQuantity, setFoodQuantity] = useState(100);
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
  const selectedDayTotals = useMemo(() => selectedDayMeals.reduce((acc, meal) => ({
    calories: acc.calories + meal.foods.reduce((sum, food) => sum + food.calories, 0),
    protein: acc.protein + meal.foods.reduce((sum, food) => sum + food.protein, 0)
  }), { calories: 0, protein: 0 }), [selectedDayMeals]);
  const selectedFoodPortionBase = useMemo(() => parsePortionBase(selectedFood?.porcaoBase), [selectedFood]);
  const selectedFoodUnit = useMemo(() => selectedFood ? getFoodMeasurementUnit(selectedFood) : 'g', [selectedFood]);
  const selectedFoodDefaultQuantity = useMemo(() => selectedFood ? getFoodDefaultQuantity(selectedFood) : 100, [selectedFood]);
  const canAddSelectedFood = useMemo(() => Boolean(selectedFood) && foodQuantity > 0, [selectedFood, foodQuantity]);

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
    setSelectedFood(null);
    setFoodQuantity(100);
  };

  const handleFoodSearch = (value: string) => {
    setFoodQuery(value);
    setFoodOptions(searchFoods(value).slice(0, 10));
  };

  const handleSelectFood = (food: TacoFood) => {
    setSelectedFood(food);
    setFoodQuantity(getFoodDefaultQuantity(food));
    setFoodOptions([]);
  };

  const handleAddSelectedFood = () => {
    if (!selectedFood) {
      return;
    }

    const quantity = Math.max(0.1, foodQuantity || selectedFoodPortionBase.amount);
    setSelectedFoods((prev) => [...prev, scaleFood(selectedFood, quantity)]);
    setSelectedFood(null);
    setFoodQuery('');
    setFoodOptions([]);
    setFoodQuantity(selectedFoodDefaultQuantity);
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
    setSelectedFood(null);
    setFoodQuantity(100);
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
          </div>
          {foodOptions.length > 0 ? (
            <ul className="search-list">
              {foodOptions.map((food) => (
                <li key={food.id}>
                  <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => handleSelectFood(food)}>
                    {food.nome} ({food.kcal ?? 0} kcal / {food.porcaoBase ?? '100 g'})
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {selectedFood ? (
            <div className="setup-selection-card">
              <div className="setup-selection-card__header">
                <div>
                  <span className="meta-label">Alimento selecionado</span>
                  <p>{selectedFood.nome}</p>
                </div>
              </div>
              <div className="setup-card__fields">
                <NumberInput
                  id="food-quantity"
                  label={`Quantidade (${selectedFoodUnit})`}
                  min={0.1}
                  step={selectedFoodUnit === 'un' ? 1 : 1}
                  value={foodQuantity}
                  onChange={(_, state) => setFoodQuantity(getSafeNumber(Number(state.value), selectedFoodDefaultQuantity))}
                />
              </div>
              <div className="setup-selection-card__meta">
                <span>Base nutricional: {selectedFoodPortionBase.amount} {selectedFoodPortionBase.unit}</span>
                <span>{selectedFoodUnit === 'ml' ? 'Medida usada: ml' : selectedFoodUnit === 'un' ? 'Medida usada: unidade' : 'Medida usada: g'}</span>
                <span>{selectedFood.kcal ?? 0} kcal por base</span>
              </div>
              <div className="inline-actions">
                <Button kind="ghost" size="sm" onClick={() => setSelectedFood(null)}>
                  Cancelar
                </Button>
                <Button size="sm" disabled={!canAddSelectedFood} onClick={handleAddSelectedFood}>
                  Adicionar alimento
                </Button>
              </div>
            </div>
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
                    <span className="meta-label">{food.quantity} {food.unit}</span>
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
          <div className="diet-day-build-summary">
            <span className="meta-label">Total do dia selecionado</span>
            <div className="diet-totals-card__grid">
              <div className="stat-pill">
                <span>Calorias</span>
                <strong>{selectedDayTotals.calories.toFixed(1)} kcal</strong>
              </div>
              <div className="stat-pill">
                <span>Proteína</span>
                <strong>{selectedDayTotals.protein.toFixed(1)} g</strong>
              </div>
            </div>
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
