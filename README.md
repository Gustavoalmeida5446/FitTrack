# FitTrack

Personal fitness app built with React + Vite + Tailwind + Supabase.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env`:

```bash
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_EXERCISEDB_KEY=your_rapidapi_key
VITE_USDA_API_KEY=your_usda_key
```

3. Run:

```bash
npm run dev
```

## Supabase SQL

```sql
create table if not exists user_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table user_state enable row level security;

create policy "Users can manage own state"
  on user_state
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

## Phases implemented

1. Project structure + navigation
2. Workouts module
3. Workout sequence logic (Home)
4. Body weight + parameters
5. Diet module
6. API integrations (ExerciseDB + USDA)
7. Supabase persistence (auth + state)
8. History
9. Backup
10. UI polish (cards, spacing, mobile-friendly)
