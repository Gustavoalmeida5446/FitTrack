-- Habilita Realtime para as tabelas relacionais do app.
--
-- Seguro para rodar mais de uma vez: so adiciona tabelas que ainda nao estao
-- na publicacao `supabase_realtime`.

do $$
declare
  table_name text;
  table_names text[] := array[
    'app_profiles',
    'app_water_days',
    'app_weight_logs',
    'app_workouts',
    'app_workout_exercises',
    'app_workout_exercise_sets',
    'app_diets',
    'app_diet_meals',
    'app_diet_foods',
    'app_diet_days',
    'app_diet_day_meals',
    'app_diet_completed_meals'
  ];
begin
  foreach table_name in array table_names loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;
