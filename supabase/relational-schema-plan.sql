-- Plano do novo modelo relacional do FitTrack.
--
-- IMPORTANTE:
-- - Executado em 2026-05-01 depois do backup real de public.user_app_states.
-- - A tabela public.user_app_states nao deve ser alterada aqui.
-- - A conversao dos dados antigos deve ler o JSON legado e inserir nas tabelas novas.
-- - Se precisar rodar de novo, revisar antes: as policies nao usam "if not exists".

create table if not exists public.app_data_migrations (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  migration_name text not null,
  status text not null check (status in ('pending', 'done', 'failed')),
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, migration_name)
);

create table if not exists public.app_profiles (
  id text primary key,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  current_weight numeric not null default 0,
  height_cm integer not null default 0,
  birth_date date,
  age integer not null default 0,
  sex text not null,
  activity_level text not null,
  goal text not null,
  diet_type text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.app_water_days (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  goal_ml integer not null default 0,
  consumed_ml integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, day)
);

create table if not exists public.app_weight_logs (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  legacy_id text,
  position integer not null default 0,
  logged_at text not null,
  weight numeric not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.app_workouts (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  legacy_id text,
  name text not null,
  position integer not null default 0,
  muscle_groups jsonb not null default '[]'::jsonb,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, legacy_id)
);

create table if not exists public.app_workout_exercises (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_id text not null references public.app_workouts(id) on delete cascade,
  legacy_id text,
  source text not null default 'local',
  source_id text,
  name text not null,
  pt_name text,
  muscle_group text not null,
  media_type text not null default 'none',
  media_url text,
  media_urls jsonb not null default '[]'::jsonb,
  load_kg numeric not null default 0,
  reps integer not null default 1,
  sets integer not null default 1,
  rest_seconds integer not null default 0,
  done boolean not null default false,
  position integer not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, workout_id, legacy_id)
);

create table if not exists public.app_workout_exercise_sets (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_id text not null references public.app_workouts(id) on delete cascade,
  exercise_id text not null references public.app_workout_exercises(id) on delete cascade,
  position integer not null default 0,
  load_kg numeric not null default 0,
  reps integer not null default 1,
  done boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (exercise_id, position)
);

create table if not exists public.app_diets (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  legacy_id text,
  progress_updated_at date not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, legacy_id)
);

create table if not exists public.app_diet_meals (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  diet_id text not null references public.app_diets(id) on delete cascade,
  legacy_id text,
  name text not null,
  position integer not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, diet_id, legacy_id)
);

create table if not exists public.app_diet_foods (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_id text not null references public.app_diet_meals(id) on delete cascade,
  legacy_id text,
  food_id integer,
  name text not null,
  calories numeric not null default 0,
  protein numeric not null default 0,
  carbs numeric not null default 0,
  fat numeric not null default 0,
  fiber numeric not null default 0,
  quantity numeric not null default 0,
  unit text not null,
  base_quantity numeric not null default 0,
  base_unit text not null,
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, meal_id, legacy_id)
);

create table if not exists public.app_diet_days (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  diet_id text not null references public.app_diets(id) on delete cascade,
  legacy_id text,
  label text not null,
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, diet_id, legacy_id)
);

create table if not exists public.app_diet_day_meals (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  day_id text not null references public.app_diet_days(id) on delete cascade,
  meal_id text not null references public.app_diet_meals(id) on delete cascade,
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique (day_id, meal_id)
);

create table if not exists public.app_diet_completed_meals (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  day_id text not null references public.app_diet_days(id) on delete cascade,
  meal_id text not null references public.app_diet_meals(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (day_id, meal_id)
);

alter table public.app_data_migrations enable row level security;
alter table public.app_profiles enable row level security;
alter table public.app_water_days enable row level security;
alter table public.app_weight_logs enable row level security;
alter table public.app_workouts enable row level security;
alter table public.app_workout_exercises enable row level security;
alter table public.app_workout_exercise_sets enable row level security;
alter table public.app_diets enable row level security;
alter table public.app_diet_meals enable row level security;
alter table public.app_diet_foods enable row level security;
alter table public.app_diet_days enable row level security;
alter table public.app_diet_day_meals enable row level security;
alter table public.app_diet_completed_meals enable row level security;

-- Politicas simples: cada usuario so acessa suas proprias linhas.
-- Antes de executar, revisar se o projeto quer nomes de policies mais especificos.

create policy "Users can manage own app_data_migrations"
on public.app_data_migrations
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own app_profiles"
on public.app_profiles
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own app_water_days"
on public.app_water_days
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own app_weight_logs"
on public.app_weight_logs
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own app_workouts"
on public.app_workouts
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own app_workout_exercises"
on public.app_workout_exercises
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own app_workout_exercise_sets"
on public.app_workout_exercise_sets
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own app_diets"
on public.app_diets
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own app_diet_meals"
on public.app_diet_meals
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own app_diet_foods"
on public.app_diet_foods
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own app_diet_days"
on public.app_diet_days
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own app_diet_day_meals"
on public.app_diet_day_meals
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own app_diet_completed_meals"
on public.app_diet_completed_meals
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
