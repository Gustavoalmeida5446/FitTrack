import { CalendarHeatMap, CheckmarkFilled, ChevronLeft, Search, TrashCan } from '@carbon/icons-react';
import { Button, TextInput, Tile } from '@carbon/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppNumberInput } from '../components/AppNumberInput';
import { ContextualTutorialCard, type TutorialStepContent } from '../components/ContextualTutorialCard';
import { InfoBlock } from '../components/InfoBlock';
import { SelectionSummaryCard } from '../components/SelectionSummaryCard';
import { StatsGrid } from '../components/StatsGrid';
import { FoodItem, Meal, WeeklyDiet } from '../data/types';
import { clearDietDayMeals, syncCompletedMealsWithSelection } from '../lib/appUpdates';
import { parsePortionBase, roundFoodMacro } from '../lib/food';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { calculateFoodTotals, calculateMealTotals, calculateMealsTotals } from '../lib/nutrition';
import { convertFoodQuantityToGrams, getFoodDefaultQuantity, getFoodMeasurementUnit, searchFoods, type FoodItem as TacoFood } from '../services/foods';
import { PageContainer } from '../components/PageContainer';
import { formatFixedDecimal } from '../lib/number';
import { isValidDayMealSelection, isValidFoodItem, isValidMeal } from '../lib/validation';

interface Props {
  onBack: () => void;
  diet: WeeklyDiet;
  onSaveDiet: (diet: WeeklyDiet) => void;
  tutorialStep: TutorialStepContent | null;
  tutorialStepIndex: number;
  tutorialStepsTotal: number;
  onTutorialBack: () => void;
  onTutorialNext: () => void;
  onTutorialSkip: () => void;
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
    calories: roundFoodMacro((food.kcal ?? 0) * factor),
    protein: roundFoodMacro((food.proteina ?? 0) * factor),
    carbs: roundFoodMacro((food.carboidrato ?? 0) * factor),
    fat: roundFoodMacro((food.gordura ?? 0) * factor),
    fiber: roundFoodMacro((food.fibra ?? 0) * factor),
    quantity,
    unit: measurementUnit,
    baseQuantity: portionBase.amount,
    baseUnit: portionBase.unit
  };
}

export function DietSetupPage({
  onBack,
  diet,
  onSaveDiet,
  tutorialStep,
  tutorialStepIndex,
  tutorialStepsTotal,
  onTutorialBack,
  onTutorialNext,
  onTutorialSkip
}: Props) {
  const lastAutoSavedMealKeyRef = useRef('');
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
  const [hasTriedAddFood, setHasTriedAddFood] = useState(false);
  const [hasTriedSaveMeal, setHasTriedSaveMeal] = useState(false);
  const [hasTriedSaveDay, setHasTriedSaveDay] = useState(false);
  const debouncedFoodQuery = useDebouncedValue(foodQuery, 200);

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

  useEffect(() => {
    const trimmedQuery = debouncedFoodQuery.trim();

    if (!trimmedQuery) {
      setFoodOptions([]);
      return;
    }

    setFoodOptions(searchFoods(trimmedQuery, 10));
  }, [debouncedFoodQuery]);

  const canSaveMeal = useMemo(() => mealName.trim() && selectedFoods.length > 0, [mealName, selectedFoods.length]);
  const selectedMealTotals = useMemo(() => calculateFoodTotals(selectedFoods), [selectedFoods]);
  const selectedDayMeals = useMemo(() => draftDiet.meals.filter((meal) => selectedDayMealIds.includes(meal.id)), [draftDiet.meals, selectedDayMealIds]);
  const selectedDayTotals = useMemo(() => calculateMealsTotals(selectedDayMeals), [selectedDayMeals]);
  const selectedFoodPortionBase = useMemo(() => parsePortionBase(selectedFood?.porcaoBase), [selectedFood]);
  const selectedFoodUnit = useMemo(() => selectedFood ? getFoodMeasurementUnit(selectedFood) : 'g', [selectedFood]);
  const selectedFoodDefaultQuantity = useMemo(() => selectedFood ? getFoodDefaultQuantity(selectedFood) : 100, [selectedFood]);
  const foodSelectionMessage = hasTriedAddFood && selectedFood && foodQuantity <= 0
    ? 'Informe uma quantidade maior que zero.'
    : '';
  const mealFormMessage = hasTriedSaveMeal && !mealName.trim()
    ? 'Dê um nome à refeição para salvar.'
    : hasTriedSaveMeal && selectedFoods.length === 0
      ? 'Adicione pelo menos um alimento antes de salvar a refeição.'
      : '';
  const canSaveDay = isValidDayMealSelection(selectedDayMealIds, draftDiet.meals);
  const dayFormMessage = hasTriedSaveDay && draftDiet.meals.length === 0
    ? 'Cadastre pelo menos uma refeição antes de salvar o dia.'
    : hasTriedSaveDay && selectedDayMealIds.length === 0
      ? 'Selecione pelo menos uma refeição para este dia.'
      : '';

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

  const buildDietWithMeal = (meal: Meal): WeeklyDiet => ({
    ...draftDiet,
    meals: draftDiet.meals.some((item) => item.id === meal.id)
      ? draftDiet.meals.map((item) => item.id === meal.id ? meal : item)
      : [...draftDiet.meals, meal]
  });

  const persistMeal = (meal: Meal) => {
    commitDiet(buildDietWithMeal(meal));
    setEditingMealId(meal.id);
  };

  useEffect(() => {
    if (!mealName.trim() || selectedFoods.length === 0) {
      return undefined;
    }

    const meal: Meal = {
      id: editingMealId ?? crypto.randomUUID(),
      name: mealName.trim(),
      foods: selectedFoods.map((food) => ({ ...food }))
    };

    if (!isValidMeal(meal)) {
      return undefined;
    }

    const autoSaveKey = JSON.stringify(meal);

    if (autoSaveKey === lastAutoSavedMealKeyRef.current) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      lastAutoSavedMealKeyRef.current = autoSaveKey;
      persistMeal(meal);
    }, 650);

    return () => window.clearTimeout(timeoutId);
  }, [draftDiet, editingMealId, mealName, onSaveDiet, selectedFoods]);

  const resetMealForm = () => {
    lastAutoSavedMealKeyRef.current = '';
    setHasTriedAddFood(false);
    setHasTriedSaveMeal(false);
    setEditingMealId(null);
    setMealName('');
    setSelectedFoods([]);
    setFoodQuery('');
    setFoodOptions([]);
    setSelectedFood(null);
    setFoodQuantity(100);
  };

  const handleSelectFood = (food: TacoFood) => {
    setSelectedFood(food);
    setFoodQuantity(getFoodDefaultQuantity(food));
    setFoodOptions([]);
  };

  const handleAddSelectedFood = () => {
    setHasTriedAddFood(true);

    if (!selectedFood) {
      return;
    }

    const quantity = Math.max(0.1, foodQuantity || selectedFoodPortionBase.amount);
    const nextFood = scaleFood(selectedFood, quantity);

    if (!isValidFoodItem(nextFood)) {
      return;
    }

    setSelectedFoods((prev) => [...prev, nextFood]);
    setHasTriedAddFood(false);
    setSelectedFood(null);
    setFoodQuery('');
    setFoodOptions([]);
    setFoodQuantity(selectedFoodDefaultQuantity);
  };

  const handleRemoveDraftFood = (foodId: string) => {
    setSelectedFoods((prev) => prev.filter((food) => food.id !== foodId));
  };

  const handleSaveMeal = () => {
    setHasTriedSaveMeal(true);

    if (!canSaveMeal) return;

    const meal: Meal = {
      id: editingMealId ?? crypto.randomUUID(),
      name: mealName.trim(),
      foods: selectedFoods.map((food) => ({ ...food }))
    };

    if (!isValidMeal(meal)) {
      return;
    }

    lastAutoSavedMealKeyRef.current = JSON.stringify(meal);
    persistMeal(meal);
    setHasTriedSaveMeal(false);
    resetMealForm();
  };

  const handleEditMeal = (meal: Meal) => {
    lastAutoSavedMealKeyRef.current = JSON.stringify(meal);
    setEditingMealId(meal.id);
    setMealName(meal.name);
    setSelectedFoods(meal.foods.map((food) => ({ ...food })));
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
    const nextMealIds = selectedDayMealIds.includes(mealId)
      ? selectedDayMealIds.filter((id) => id !== mealId)
      : [...selectedDayMealIds, mealId];

    setSelectedDayMealIds(nextMealIds);
    setHasTriedSaveDay(false);

    const nextDiet: WeeklyDiet = {
      ...draftDiet,
      days: draftDiet.days.map((day) => {
        if (day.id !== selectedDay.id) {
          return day;
        }

        return {
          ...syncCompletedMealsWithSelection(day, nextMealIds)
        };
      })
    };

    commitDiet(nextDiet);
  };

  const handleSaveDay = () => {
    setHasTriedSaveDay(true);

    if (!canSaveDay) {
      return;
    }

    const nextDiet: WeeklyDiet = {
      ...draftDiet,
      days: draftDiet.days.map((day) => {
        if (day.id !== selectedDay.id) {
          return day;
        }

        return {
          ...syncCompletedMealsWithSelection(day, selectedDayMealIds)
        };
      })
    };

    commitDiet(nextDiet);
    setHasTriedSaveDay(false);
  };

  const handleClearDay = () => {
    setHasTriedSaveDay(false);
    setSelectedDayMealIds([]);
    const nextDiet: WeeklyDiet = {
      ...draftDiet,
      days: draftDiet.days.map((day) => day.id === selectedDay.id ? clearDietDayMeals(day) : day)
    };

    commitDiet(nextDiet);
  };

  return (
    <PageContainer title="Cadastro de dieta" subtitle="Crie refeições com vários alimentos e monte os dias da semana" actions={<Button kind="ghost" size="sm" renderIcon={ChevronLeft} iconDescription="Voltar" onClick={onBack}>Voltar</Button>}>
      <div className="stack">
        {tutorialStep ? (
          <ContextualTutorialCard
            step={tutorialStep}
            currentStep={tutorialStepIndex}
            totalSteps={tutorialStepsTotal}
            isFirstStep={tutorialStepIndex === 0}
            isLastStep={tutorialStepIndex === tutorialStepsTotal - 1}
            onBack={onTutorialBack}
            onNext={onTutorialNext}
            onSkip={onTutorialSkip}
          />
        ) : null}
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
              onChange={(event) => setFoodQuery(event.target.value)}
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
                <AppNumberInput
                  id="food-quantity"
                  label={`Quantidade (${selectedFoodUnit})`}
                  min={0.1}
                  step={selectedFoodUnit === 'un' ? 1 : 1}
                  value={foodQuantity}
                  onValueChange={setFoodQuantity}
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
                <Button size="sm" onClick={handleAddSelectedFood}>
                  Adicionar alimento
                </Button>
              </div>
              {foodSelectionMessage ? <p className="form-message form-message--error">{foodSelectionMessage}</p> : null}
            </div>
          ) : null}
          <TextInput id="meal-name" labelText="Nome da refeição" value={mealName} onChange={(event) => setMealName(event.target.value)} />
          <InfoBlock label="Resumo da refeição atual">
            {selectedFoods.length} alimento(s) • {formatFixedDecimal(selectedMealTotals.calories)} kcal • {formatFixedDecimal(selectedMealTotals.protein)}g proteína
          </InfoBlock>
          <div className="inline-actions">
            {selectedFoods.length > 0 ? <Button kind="ghost" size="sm" onClick={() => setSelectedFoods([])}>Limpar alimentos</Button> : null}
            {editingMealId ? <Button kind="ghost" size="sm" onClick={resetMealForm}>Cancelar edição</Button> : null}
          </div>
          <div className="stack">
            {selectedFoods.length > 0 ? selectedFoods.map((food) => (
              <SelectionSummaryCard
                key={food.id}
                label={`${food.quantity} ${food.unit}`}
                title={food.name}
                actions={(
                  <Button kind="ghost" size="sm" renderIcon={TrashCan} iconDescription="Remover alimento" onClick={() => handleRemoveDraftFood(food.id)}>
                    Remover
                  </Button>
                )}
                meta={[
                  `${food.calories} kcal`,
                  `${food.protein}g proteína`,
                  `${food.carbs}g carb`,
                  `${food.fat}g gordura`
                ]}
              />
            )) : (
              <InfoBlock label="Alimentos da refeição">
                Selecione quantos alimentos quiser para montar a refeição.
              </InfoBlock>
            )}
          </div>
          <div className="setup-card__footer">
            <Button onClick={handleSaveMeal}>{editingMealId ? 'Atualizar refeição' : 'Salvar refeição'}</Button>
            {mealFormMessage ? <p className="form-message form-message--error">{mealFormMessage}</p> : null}
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
            {draftDiet.meals.length > 0 ? draftDiet.meals.map((meal) => {
              const mealTotals = calculateMealTotals(meal);

              return (
                <SelectionSummaryCard
                  key={meal.id}
                  label={`${meal.foods.length} alimento(s)`}
                  title={meal.name}
                  actions={(
                    <>
                      <Button kind="ghost" size="sm" onClick={() => handleEditMeal(meal)}>
                        Editar
                      </Button>
                      <Button kind="ghost" size="sm" renderIcon={TrashCan} iconDescription="Remover refeição" onClick={() => handleRemoveMeal(meal.id)}>
                        Remover
                      </Button>
                    </>
                  )}
                  meta={[
                    `${formatFixedDecimal(mealTotals.calories)} kcal`,
                    `${formatFixedDecimal(mealTotals.protein)}g proteína`
                  ]}
                />
              );
            }) : (
              <InfoBlock label="Refeições">
                Nenhuma refeição cadastrada ainda.
              </InfoBlock>
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
            <StatsGrid
              className="diet-totals-card__grid"
              items={[
                { label: 'Calorias', value: `${formatFixedDecimal(selectedDayTotals.calories)} kcal` },
                { label: 'Proteína', value: `${formatFixedDecimal(selectedDayTotals.protein)} g` }
              ]}
            />
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
              <InfoBlock label="Refeições disponíveis">
                Cadastre pelo menos uma refeição antes de montar o dia.
              </InfoBlock>
            )}
          </div>
          <div className="inline-actions">
            <Button kind="ghost" size="sm" disabled={selectedDayMealIds.length === 0} onClick={handleClearDay}>
              Limpar dia
            </Button>
            <Button onClick={handleSaveDay}>
              Salvar {selectedDay.label}
            </Button>
          </div>
          {dayFormMessage ? <p className="form-message form-message--error">{dayFormMessage}</p> : null}
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
            {selectedDayMeals.length > 0 ? selectedDayMeals.map((meal) => {
              const mealTotals = calculateMealTotals(meal);

              return (
                <SelectionSummaryCard
                  key={meal.id}
                  label={`${meal.foods.length} alimento(s)`}
                  title={meal.name}
                  meta={[
                    `${formatFixedDecimal(mealTotals.calories)} kcal`,
                    `${formatFixedDecimal(mealTotals.protein)}g proteína`
                  ]}
                />
              );
            }) : (
              <InfoBlock label="Refeições do dia">
                Nenhuma refeição selecionada para este dia ainda.
              </InfoBlock>
            )}
          </div>
        </Tile>
      </div>
    </PageContainer>
  );
}
