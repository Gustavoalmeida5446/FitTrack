alter table public.app_workouts
add column if not exists archived_at timestamptz;
