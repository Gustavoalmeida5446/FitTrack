-- Align app_diet_completed_meals with the relational diet save payload.
-- The app upserts quantity for completed meals to preserve per-meal portions.
alter table if exists public.app_diet_completed_meals
add column if not exists quantity numeric not null default 1;
