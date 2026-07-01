alter table public.app_diet_completed_meals
add column if not exists quantity numeric not null default 1;
