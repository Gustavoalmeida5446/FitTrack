create table if not exists public.user_app_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  workouts jsonb not null default '[]'::jsonb,
  water jsonb not null default '{}'::jsonb,
  weekly_diet jsonb not null default '{}'::jsonb,
  weight_history jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.user_app_states enable row level security;

create policy "Users can read own app state"
on public.user_app_states
for select
using (auth.uid() = user_id);

create policy "Users can insert own app state"
on public.user_app_states
for insert
with check (auth.uid() = user_id);

create policy "Users can update own app state"
on public.user_app_states
for update
using (auth.uid() = user_id);
