# Arquitetura Atual

FitTrack e um app React + Vite + TypeScript. A UI usa Carbon (`@carbon/react`, `@carbon/icons-react`) e estilos globais em `src/styles/app.css`. O ponto de entrada e `src/main.tsx`, que renderiza `src/App.tsx` e registra o service worker em producao.

## Fluxo Principal

`src/App.tsx` concentra o estado principal da aplicacao:

- `profile`
- `workouts`
- `workoutsUpdatedAt`
- `water`
- `weeklyDiet`
- `weightHistory`

Esses campos formam o `AppState`, definido em `src/lib/appState.ts`, com tipos base em `src/data/types.ts`.

O app primeiro resolve a sessao Supabase com `src/hooks/useAuthSession.ts`. Sem sessao, mostra `src/pages/LoginPage.tsx`. Com sessao, carrega dados remotos por `src/hooks/useRemoteAppState.ts`, renderiza a rota atual e exibe a navegacao inferior.

## Pages

- `src/pages/LoginPage.tsx`: login, cadastro, recuperacao e redefinicao de senha.
- `src/pages/HomePage.tsx`: resumo diario de treinos, agua e dieta do dia.
- `src/pages/WorkoutSetupPage.tsx`: cadastro, edicao e remocao de treinos e exercicios.
- `src/pages/WorkoutPage.tsx`: execucao de treino, series, carga, repeticoes e concluido.
- `src/pages/DietSetupPage.tsx`: cadastro de refeicoes, alimentos e montagem dos dias da semana.
- `src/pages/DietDayPage.tsx`: acompanhamento das refeicoes do dia.
- `src/pages/NutritionGoalsPage.tsx`: perfil, metas nutricionais, historico de peso, tema e logout.

As pages recebem dados e callbacks de `src/App.tsx`. Elas nao acessam Supabase diretamente.

## Components

`src/components/` contem componentes reutilizaveis de apresentacao e entrada:

- `PageContainer.tsx`: container padrao das telas.
- `CardHeader.tsx`, `InfoBlock.tsx`, `SelectionSummaryCard.tsx`, `SummaryStatsCard.tsx`, `StatsGrid.tsx`, `StatPill.tsx`: blocos visuais reutilizaveis.
- `AppNumberInput.tsx` e `AppDigitScaledInput.tsx`: entradas numericas padronizadas.
- `ContextualTutorialCard.tsx`: card usado no tutorial inicial.

Eles nao definem regras de negocio centrais.

## Hooks

- `useAuthSession`: carrega sessao atual, escuta mudancas de auth e detecta recuperacao de senha.
- `useAppRouter`: cria um router interno com History API.
- `useRemoteAppState`: carrega, salva e atualiza estado remoto; tambem assina Realtime das tabelas relacionais.
- `useDailyWaterReset`: reseta agua quando o dia muda.
- `useDailyWorkoutReset`: reseta progresso de treino quando o dia muda.
- `useDailyDietReset`: reseta refeicoes concluidas quando o dia muda.
- `useTutorial`: controla tutorial por usuario usando `localStorage`.
- `useDebouncedValue`: debounce para buscas e autosave.

## Services

- `src/services/authService.ts`: encapsula Supabase Auth.
- `src/services/appStateService.ts`: persistencia agregada/legada em `user_app_states`.
- `src/services/relationalAppStateService.ts`: leitura e escrita das tabelas relacionais novas.
- `src/services/exercises.ts`: busca exercicios em `exercises.json`, com aliases, traducao e imagens externas.
- `src/services/foods.ts`: busca alimentos na base local `src/data/taco-foods.json`.

## Lib

- `src/lib/appState.ts`: estado padrao, normalizacao, serializacao e sanitizacao.
- `src/lib/legacyState.ts`: leitura de formatos antigos de treino, dieta e perfil.
- `src/lib/relationalAppState.ts`: conversao entre `AppState` e registros relacionais.
- `src/lib/appUpdates.ts`: atualizacoes puras de agua, peso, treino e dieta.
- `src/lib/nutrition.ts`: calculo de BMR, TDEE, macros, agua e progresso da dieta.
- `src/lib/validation.ts`: schemas Zod e validadores de formularios/dados.
- `src/lib/appRouter.ts`: parse/build das rotas.
- `src/lib/date.ts`: datas, idade e mapeamento do dia da dieta.
- `src/lib/workoutSets.ts`: normalizacao de series por exercicio.
- `src/lib/food.ts`: parse de porcao e arredondamento nutricional.
- `src/lib/exerciseSearch.ts`, `src/lib/exerciseNames.ts`, `src/lib/search.ts`: busca e exibicao de exercicios.
- `src/lib/supabaseClient.ts`: cliente Supabase.

## Data

- `src/data/types.ts`: tipos principais da aplicacao.
- `src/data/taco-foods.json`: base local de alimentos convertida de `alimentos.csv`.
- `src/data/exercise-name-pt.json`: nomes e aliases de exercicios em portugues.
- `exercises.json`: catalogo principal de exercicios.

## Router

O router e interno, sem dependencia externa. `src/lib/appRouter.ts` reconhece:

- `/`: inicio.
- `/treinos`: cadastro de treinos.
- `/treinos/:workoutId`: treino aberto.
- `/dieta`: cadastro de dieta.
- `/dieta/:dayId`: dieta de um dia.
- `/perfil`: metas/perfil.

`src/hooks/useAppRouter.ts` usa `window.history.pushState` e `popstate`. O `base` do Vite e respeitado, incluindo producao em `/FitTrack/`.

## Fluxo de Dados

1. `App.tsx` cria o estado em memoria com `defaultAppState`.
2. `useAuthSession` resolve a sessao.
3. `useRemoteAppState` chama `loadRemoteAppState`.
4. `loadRemoteAppState` le `user_app_states` e normaliza o snapshot legado.
5. O mesmo carregamento tenta `loadRelationalAppStateSnapshot`.
6. Se o snapshot relacional existir e for mais recente, ele substitui o agregado.
7. Pages alteram dados por callbacks recebidos de `App.tsx`.
8. `App.tsx` atualiza estado local, marca save remoto pendente e dispara escrita relacional quando ha sessao.
9. `useRemoteAppState` salva o snapshot agregado com debounce.
10. Realtime nas tabelas relacionais pode disparar novo carregamento em outros dispositivos.

## Persistencia Local e Remota

Persistencia local real no navegador:

- Tema em `localStorage` com chave `fittrack-theme`.
- Tutorial por usuario em `localStorage`, chave `fittrack:onboarding:{userId}`.
- Sessao Supabase e gerenciada pela biblioteca `@supabase/supabase-js`.

Persistencia remota:

- Legada/agregada: `src/services/appStateService.ts` grava `user_app_states`.
- Relacional: `src/services/relationalAppStateService.ts` grava tabelas por dominio.

O estado em memoria ainda e a fonte imediata da UI. O banco e atualizado por chamadas assíncronas e o app mostra mensagens de salvamento/erro em `App.tsx`.

## Supabase

`src/lib/supabaseClient.ts` usa:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_ANON_KEY`

Ha valores fallback no codigo para URL e publishable key. Auth, leitura, escrita e Realtime usam o mesmo cliente.

## PWA

`index.html` referencia `public/manifest.webmanifest`. Em producao, `src/main.tsx` registra `sw.js` usando `import.meta.env.BASE_URL`.

`public/sw.js` usa cache `fittrack-v5`, pre-cacheia shell basico e cacheia assets same-origin em runtime. Para navegacao, tenta rede primeiro e cai para `./index.html` em cache.

## Legado e Migrado

Ja migrado ou parcialmente migrado:

- Tabelas relacionais para perfil, agua, peso, treinos, series, dieta, alimentos e progresso.
- Leitura relacional com fallback para JSON legado.
- Escritas relacionais diretas para perfil, agua, peso, treinos e dieta.
- Router interno com rotas reais.

Ainda legado ou de compatibilidade:

- `user_app_states` continua sendo salvo em toda alteracao relevante como snapshot agregado.
- `src/lib/legacyState.ts` ainda aceita formatos antigos de treino e dieta.
- `src/services/appStateService.ts` ainda e necessario como fallback.
- `TODO.md` contem a lista atual de tarefas de manutencao.

## Pontos de Atencao

- O app grava no modelo relacional e tambem no snapshot legado; divergencias entre timestamps podem fazer um caminho prevalecer sobre o outro no carregamento.
- `src/lib/supabaseClient.ts` contem valores fallback de Supabase no codigo.
- `README.md` menciona manifest em `favicon/site.webmanifest`, mas o arquivo real usado e `public/manifest.webmanifest`.
- `.env.example` lista variaveis WGER/ExerciseDB/USDA, mas o codigo atual de busca usa `exercises.json` e TACO local.
