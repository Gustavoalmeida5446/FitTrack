# Banco de Dados

O projeto usa Supabase para Auth, persistencia remota e Realtime. Os schemas documentados estao em `supabase/schema.sql`, `supabase/relational-schema-plan.sql` e `supabase/realtime-publication.sql`.

## Tabela Agregada Legada

### `public.user_app_states`

Definida em `supabase/schema.sql`.

Campos:

- `user_id`: `uuid`, chave primaria, referencia `auth.users(id)`.
- `profile`: `jsonb`, `UserProfile`.
- `workouts`: `jsonb`, formato atual `{ version, updatedAt, workouts }`, mas a leitura aceita formatos antigos.
- `water`: `jsonb`, `WaterData`.
- `weekly_diet`: `jsonb`, `WeeklyDiet`.
- `weight_history`: `jsonb`, `WeightLog[]`.
- `updated_at`: `timestamptz`.

Essa tabela ainda e gravada por `src/services/appStateService.ts` como fallback e compatibilidade.

## Tabelas Relacionais

Definidas em `supabase/relational-schema-plan.sql`.

### Controle de migracao

- `app_data_migrations`: registra migracoes por usuario. Usa `user_id`, `migration_name`, `status`, `error_message` e timestamps.

### Perfil, agua e peso

- `app_profiles`: perfil unico por usuario. Relaciona `user_id` com peso, altura, nascimento, idade, sexo, atividade, objetivo e tipo de dieta.
- `app_water_days`: consumo de agua por usuario e dia. Chave unica `(user_id, day)`.
- `app_weight_logs`: historico de peso por usuario, com `position`, `logged_at` em texto e `weight`.

### Treinos

- `app_workouts`: treino por usuario, com `legacy_id`, nome, posicao, grupos musculares em `jsonb` e `deleted_at`.
- `app_workouts.archived_at`: marca treinos arquivados. Arquivado nao e removido; apenas deixa de aparecer na Home.
- `app_workout_exercises`: exercicios de um treino. Relaciona `workout_id` com `app_workouts(id)`, guarda nome, traducao, grupo, midia, carga/reps/series resumidas, descanso, status e posicao.
- `app_workout_exercise_sets`: series de um exercicio. Relaciona `workout_id` e `exercise_id`, guarda posicao, carga, repeticoes e concluido. Tem chave unica `(exercise_id, position)`.

### Dieta

- `app_diets`: dieta semanal do usuario, com `legacy_id` e `progress_updated_at`.
- `app_diet_meals`: refeicoes da dieta. Relaciona `diet_id` com `app_diets(id)`, tem `legacy_id`, nome, posicao e `deleted_at`.
- `app_diet_foods`: alimentos de uma refeicao. Relaciona `meal_id`, guarda macros, quantidade, unidade e base nutricional.
- `app_diet_days`: dias da dieta. Relaciona `diet_id`, guarda label e posicao.
- `app_diet_day_meals`: vincula dias e refeicoes. Relaciona `day_id` e `meal_id`, com posicao.
- `app_diet_completed_meals`: progresso do dia. Relaciona `day_id` e `meal_id`.

## Relacoes

- Todas as tabelas relacionais possuem `user_id` e RLS por usuario.
- `app_workout_exercises.workout_id` referencia `app_workouts.id`.
- `app_workout_exercise_sets.exercise_id` referencia `app_workout_exercises.id`.
- `app_diet_meals.diet_id` referencia `app_diets.id`.
- `app_diet_foods.meal_id` referencia `app_diet_meals.id`.
- `app_diet_days.diet_id` referencia `app_diets.id`.
- `app_diet_day_meals.day_id` referencia `app_diet_days.id`.
- `app_diet_day_meals.meal_id` referencia `app_diet_meals.id`.
- `app_diet_completed_meals.day_id` referencia `app_diet_days.id`.
- `app_diet_completed_meals.meal_id` referencia `app_diet_meals.id`.

## RLS

`supabase/schema.sql` cria policies de select/insert/update em `user_app_states`.

`supabase/relational-schema-plan.sql` habilita RLS em todas as tabelas relacionais e cria policies `for all` usando:

- `using (auth.uid() = user_id)`
- `with check (auth.uid() = user_id)`

## Realtime

`supabase/realtime-publication.sql` adiciona as tabelas relacionais a publicacao `supabase_realtime` e define `replica identity full`.

`supabase/workout-archive.sql` adiciona `archived_at` em `app_workouts` de forma idempotente para ambientes ja existentes.

`src/hooks/useRemoteAppState.ts` assina eventos `postgres_changes` nas tabelas:

- `app_profiles`
- `app_water_days`
- `app_weight_logs`
- `app_workouts`
- `app_workout_exercises`
- `app_workout_exercise_sets`
- `app_diets`
- `app_diet_meals`
- `app_diet_foods`
- `app_diet_days`
- `app_diet_day_meals`
- `app_diet_completed_meals`

## Fluxo de Sincronizacao

Carregamento:

1. `loadRemoteAppState` le `user_app_states`.
2. O snapshot e normalizado por `mapRemoteRow`.
3. `loadRelationalAppStateSnapshot` tenta ler as tabelas relacionais.
4. Se `updatedAt` relacional for maior ou igual ao `updated_at` legado, o app usa o relacional.
5. Caso contrario, usa o snapshot agregado.

Salvamento:

1. Uma interacao altera o estado local em `src/App.tsx`.
2. O app chama uma escrita relacional especifica, como `saveRelationalProfile`, `replaceRelationalWorkouts` ou `replaceRelationalDiet`.
3. `markRemoteSavePending` aciona o fallback agregado.
4. `useRemoteAppState` grava `user_app_states` com debounce de 400 ms.
5. Em falha, o hook agenda nova tentativa.

## Dados Agregados Ainda Presentes

Mesmo com tabelas relacionais, `user_app_states` continua recebendo:

- perfil inteiro em `profile`;
- treinos serializados em `workouts`;
- agua em `water`;
- dieta semanal inteira em `weekly_diet`;
- historico de peso em `weight_history`.

Isso e intencional no estado atual do projeto para compatibilidade e fallback.

## Riscos de Inconsistencia

- Escrita dupla: uma alteracao pode ser salva no relacional e falhar no snapshot legado, ou o contrario.
- Resolucao por timestamp: `shouldUseRelationalState` compara timestamps e pode escolher dados agregados se `user_app_states.updated_at` estiver mais recente.
- Substituicoes completas: `replaceRelationalWorkouts`, `replaceRelationalDiet` e `replaceRelationalWeightHistory` fazem upsert dos registros atuais e removem/marcam ausentes. Erro no meio pode deixar parte da operacao gravada.
- `app_weight_logs` nao tem `updated_at` no schema, mas `getLatestUpdatedAt` considera timestamps quando existem; peso pode nao influenciar o timestamp relacional mais recente.
- `app_diet_day_meals` e `app_diet_completed_meals` nao possuem `updated_at` no schema, mas o service envia `updated_at` em alguns upserts. Se o schema real nao tiver essa coluna, essas escritas podem falhar.
- `user_app_states` aceita JSON amplo; validacao e normalizacao ficam na aplicacao, nao no banco.

Nenhuma migracao ou alteracao de schema foi criada nesta documentacao.
