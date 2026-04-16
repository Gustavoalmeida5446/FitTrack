# FitTrack

Personal fitness app built with React + Vite + Tailwind + Supabase.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env file:

```bash
cp .env.example .env
```

3. Run local development:

```bash
npm run dev
```

## Supabase configured

The app now includes your public Supabase project URL and publishable key as defaults in code and in `.env.example`.

- URL: `https://vzduymscsnuwbolucnag.supabase.co`
- Publishable key: `sb_publishable_ghU7U0ZmZ95f7PhjMvuZLw_Io4N_BMZ`

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

## GitHub Pages

This project is configured for publication under `/<repo-name>/` with repo name `FitTrack`.

### Deploy command

```bash
npm run deploy
```

It runs:

1. `npm run build`
2. publishes `dist/` to the `gh-pages` branch

> Important: in GitHub repository settings, enable Pages from branch `gh-pages` (root).

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
