-- Habilita Realtime para as tabelas relacionais do app.
--
-- Seguro para rodar mais de uma vez:
-- - cria a publicacao se ela nao existir;
-- - garante dados completos em DELETE;
-- - adiciona apenas tabelas que ainda nao estao na publicacao.

do $$
declare
  publication_name text := 'supabase_realtime';
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
  if not exists (
    select 1
    from pg_publication
    where pubname = publication_name
  ) then
    execute format('create publication %I', publication_name);
  end if;

  foreach table_name in array table_names loop
    execute format('alter table public.%I replica identity full', table_name);

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = publication_name
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication %I add table public.%I', publication_name, table_name);
    end if;
  end loop;
end $$;
