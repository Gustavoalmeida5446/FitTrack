# FitTrack - plano tecnico de correcao

Branch atual para o proximo PR: `feature/exercise-search-relevance`

Observacao: o PR anterior do branch `technical-fix-plan` ja foi mergeado. Todo novo ajuste deve sair de um PR novo para evitar confusao com o historico anterior.

## Direcao do plano

O plano e migrar o app para uma base mais segura sem perder dados existentes.

A tabela atual `user_app_states` guarda JSON com dados reais dos usuarios. Ela deve continuar intacta como fonte legado/backward compatibility. Antes de qualquer mudanca real no banco, deve existir backup verificavel dessa tabela.

O novo modelo deve usar tabelas relacionais. Os dados atuais do JSON devem ser lidos e convertidos para o novo modelo, sem alterar, truncar, sobrescrever ou apagar o JSON antigo.

Tambem e necessario trocar a navegacao atual baseada em `useState` por router, para evitar retornos inesperados de tela.

## Diagnostico resumido

- O app e React + Vite + TypeScript.
- A navegacao atual usa `src/hooks/useAppRouter.ts` com rotas reais.
- `src/App.tsx` controla as telas renderizadas e chama `openGoals()` apos login.
- O onboarding tambem pode navegar para Perfil, porque a primeira etapa e `goals`.
- O estado remoto atual e salvo em `user_app_states` via `src/services/appStateService.ts`.
- A tabela atual salva JSONs de `profile`, `workouts`, `water`, `weekly_diet` e `weight_history`.
- Treinos sao editados em `src/pages/WorkoutSetupPage.tsx`.
- A tela de treino usa `draftExercises`; exercicios adicionados existem primeiro em estado local e so entram no estado global quando o usuario salva/atualiza o treino.
- `src/hooks/useRemoteAppState.ts` salva o estado com debounce e `upsert`.
- O modelo atual de exercicio tem `loadKg`, `reps` e `sets` no nivel do exercicio, nao por serie.
- A busca de exercicios esta em `src/services/exercises.ts`, usando `exercises.json` e `src/data/exercise-name-pt.json`.
- `Thigh_Abductor` existe em `exercises.json`, mas nao ha traducao/alias suficiente para "abducao de quadril".
- O fluxo de senha esta em `src/services/authService.ts`, `src/hooks/useAuthSession.ts` e `src/pages/LoginPage.tsx`.

## Arquivos relevantes

- `src/App.tsx`
- `src/hooks/useAppRouter.ts`
- `src/hooks/useRemoteAppState.ts`
- `src/services/appStateService.ts`
- `src/lib/appState.ts`
- `src/lib/legacyState.ts`
- `src/lib/validation.ts`
- `src/lib/appUpdates.ts`
- `src/pages/WorkoutSetupPage.tsx`
- `src/pages/WorkoutPage.tsx`
- `src/pages/HomePage.tsx`
- `src/pages/LoginPage.tsx`
- `src/services/authService.ts`
- `src/services/exercises.ts`
- `src/data/types.ts`
- `src/data/exercise-name-pt.json`
- `exercises.json`
- `supabase/schema.sql`
- `tests/appState.test.ts`

## Hipoteses principais dos problemas

- Exercicios somem porque a tela de treino depende de `draftExercises`, que e estado local temporario.
- Se o usuario troca de aba, recarrega ou a tela remonta antes do save, os dados locais podem ser perdidos.
- Mesmo apos clicar em `Atualizar treino`, o save remoto e assíncrono e pode falhar ou ainda nao ter terminado.
- O app salva snapshots grandes de estado em JSON; em dois dispositivos, um snapshot antigo pode sobrescrever dado mais novo.
- A tela atual tambem e estado local; remount/login/tutorial podem mandar o usuario para Perfil sem ser a intencao.

## Fase 1 - Backup e seguranca dos dados atuais

- [x] Definir procedimento de backup da tabela `user_app_states`.
- [x] Executar backup real da tabela `user_app_states`.
- [x] Conferir o backup com contagem de linhas, amostra de usuarios e presenca dos JSONs principais.
- [x] Documentar rollback antes de qualquer migration.
- [x] Garantir que nenhuma etapa altere, apague, trunque ou reescreva `user_app_states`.

Status atual:

- Procedimento documentado.
- Backup real executado em 2026-05-01.
- Tabela backup criada no Supabase: `public.user_app_states_backup_20260501_003542`.
- Arquivo local criado: `backups/user_app_states_20260501_003542.jsonl`.
- A pasta `backups/` esta no `.gitignore`, porque contem dados reais.
- `pg_dump` nao foi usado porque a versao local era 16 e o servidor Supabase esta em Postgres 17.6. Foi usado export via `psql` em JSONL.
- Conferencia feita: original `4` linhas, backup `4` linhas, arquivo local `4` linhas.
- Colunas principais presentes no backup: `profile`, `workouts`, `water`, `weekly_diet`, `weight_history`.

Procedimento proposto:

1. Criar um dump somente da tabela atual antes de qualquer migration:

```bash
pg_dump "$SUPABASE_DB_URL" \
  --table=public.user_app_states \
  --data-only \
  --column-inserts \
  --file=backups/user_app_states_YYYYMMDD_HHMMSS.sql
```

2. Criar tambem um backup em tabela separada, no proprio banco, com nome datado:

```sql
create table public.user_app_states_backup_YYYYMMDD_HHMMSS
as
select *
from public.user_app_states;
```

3. Conferir o backup antes de prosseguir:

```sql
select count(*) from public.user_app_states;
select count(*) from public.user_app_states_backup_YYYYMMDD_HHMMSS;

select
  user_id,
  profile is not null as has_profile,
  workouts is not null as has_workouts,
  water is not null as has_water,
  weekly_diet is not null as has_weekly_diet,
  weight_history is not null as has_weight_history,
  updated_at
from public.user_app_states_backup_YYYYMMDD_HHMMSS
order by updated_at desc
limit 10;
```

4. Conferir se ha dados de treino no JSON legado:

```sql
select
  count(*) as users_with_workouts
from public.user_app_states
where jsonb_typeof(workouts) is not null
  and workouts::text <> '[]';
```

5. Somente depois dessas conferencias criar migrations novas. A primeira migration deve criar apenas novas tabelas relacionais. Ela nao deve conter `drop`, `truncate`, `delete`, `update public.user_app_states` nem `alter table public.user_app_states`.

Rollback:

- Se a migration nova falhar antes de receber dados, remover somente as tabelas novas criadas por ela.
- Se a conversao JSON -> relacional falhar, apagar somente os registros/tabelas novas da tentativa e repetir a conversao a partir de `user_app_states` ou do backup.
- Nunca restaurar por cima de `user_app_states` sem decisao manual, porque a tabela original deve permanecer intacta.
- O rollback nao deve depender de alterar o JSON legado.

Critério de aceite:

- Existe backup verificavel.
- Existe plano de rollback.
- `user_app_states` permanece intacta.

## Fase 2 - Novo modelo relacional

- [x] Criar plano de tabelas novas para dados do app.
- [x] Comecar por treinos: `workouts`, `workout_exercises` e `workout_exercise_sets`.
- [x] Planejar tabelas novas tambem para demais dados que hoje ficam no JSON: perfil, agua, dieta, refeicoes, alimentos e historico de peso.
- [x] Definir `user_id`, chaves, timestamps, ordenacao, soft delete quando fizer sentido e RLS por usuario.
- [x] Nao remover nem alterar a tabela JSON antiga.

Status:

- Tipos relacionais em memoria criados em `src/lib/relationalAppState.ts`.
- O modelo cobre perfil, agua, historico de peso, treinos, exercicios, series, dieta, refeicoes, alimentos, dias, vinculos dia/refeicao e refeicoes concluidas.
- Rascunho SQL criado em `supabase/relational-schema-plan.sql`.
- SQL executado em 2026-05-01 depois do backup.
- Novas tabelas criadas vazias no Supabase.
- RLS habilitado nas novas tabelas.
- A tabela `public.user_app_states` nao foi alterada e continuou com `4` linhas.

Critério de aceite:

- O novo modelo cobre todos os dados importantes do app.
- Treinos/exercicios/series ficam normalizados.
- Dados antigos continuam preservados no JSON legado.

## Fase 3 - Conversao dos dados antigos

- [x] Ler `user_app_states` e converter os JSONs existentes para o novo modelo relacional.
- [x] Nao modificar o JSON antigo durante a conversao.
- [x] Criar migracao idempotente: rodar duas vezes nao pode duplicar dados.
- [x] Registrar status de conversao em tabela nova, nao dentro de `user_app_states`.
- [x] Manter fallback de leitura do JSON para usuarios ainda nao convertidos.

Status:

- Conversao pura criada em `convertAppStateToRelationalRecords`.
- IDs relacionais sao deterministicos a partir de `userId` e IDs legados, preparando conversao idempotente.
- `sets`, `loadKg` e `reps` legados sao expandidos para `workoutExerciseSets`.
- Conversao de volta para `AppState` criada em `convertRelationalRecordsToAppState`, para a UI conseguir ler dados relacionais no mesmo formato atual.
- Testes adicionados em `tests/relationalAppState.test.ts`.
- Dry-run local criado em `scripts/dry-run-relational-migration.mjs`.
- Dry-run executado contra `backups/user_app_states_20260501_003542.jsonl`, sem gravar no banco.
- Resultado do dry-run: `4` usuarios, `4` perfis, `4` registros de agua, `2` pesos, `2` treinos, `2` exercicios, `6` series, `4` dietas, `2` refeicoes, `2` alimentos, `28` dias de dieta, `5` vinculos dia/refeicao e `0` refeicoes concluidas.
- Script real criado em `scripts/migrate-relational-from-backup.mjs`.
- Primeira tentativa abortou antes do commit por dieta sem `progressUpdatedAt`; nenhuma linha parcial ficou nas tabelas novas.
- Script corrigido com fallback de data.
- Migracao real executada em 2026-05-01 com `COMMIT`.
- Resultado no banco: `4` perfis, `4` registros de agua, `2` pesos, `2` treinos, `2` exercicios, `6` series, `4` dietas, `2` refeicoes, `2` alimentos, `28` dias de dieta, `5` vinculos dia/refeicao e `0` refeicoes concluidas.
- `app_data_migrations` ficou com `4` registros `done`.
- `user_app_states` continuou intacta com `4` linhas.

Critério de aceite:

- Usuario antigo continua vendo seus dados.
- Usuario convertido passa a usar dados relacionais.
- Nenhum dado legado e apagado.
- Conversao repetida nao duplica registros.

## Fase 4 - Salvar qualquer dado direto no banco

- [x] Criar camada nova de persistencia relacional, separada de `appStateService.ts`.
- [x] Salvar diretamente no banco toda alteracao importante do app: perfil, agua, dieta, refeicoes, alimentos, peso, treinos, exercicios e series.
- [x] Estado local deve servir apenas para UI temporaria, nao como fonte unica de verdade.
- [x] Remover dependencia de botao manual como unica forma de persistir dados.
- [x] Exibir estados de salvamento, sucesso e erro.
- [x] Evitar salvar snapshots antigos do app inteiro quando a alteracao e pequena.

Status:

- Leitura relacional criada em `src/services/relationalAppStateService.ts`.
- `loadRemoteAppState` agora tenta ler tabelas relacionais e cai para `user_app_states` se nao houver dados relacionais.
- Escrita ainda continua no fluxo antigo; isso evita mudar tudo de uma vez.
- Escrita relacional direta adicionada para perfil, agua e historico de peso.
- Escrita relacional direta adicionada para treinos, exercicios e series.
- Escrita relacional direta adicionada para dieta, refeicoes, alimentos, dias e progresso de refeicoes.
- Escrita relacional ajustada para salvar primeiro e remover/marcar dados antigos depois, evitando apagar tabelas antes de inserir.
- Reset diario de progresso de treino tambem grava nas tabelas relacionais.
- Corrigido erro `409` ao salvar series relacionais: o app agora usa o mesmo ID deterministico da migracao e faz upsert por `exercise_id,position`.
- O fluxo antigo de save continua ativo como fallback enquanto as outras areas ainda nao migraram.
- Erros de save relacional agora aparecem na UI.
- A UI tambem mostra estado de "Salvando alterações..." e confirmacao curta de "Alterações salvas.".
- Cadastro de treino agora faz autosave com debounce quando o treino ja esta valido: nome preenchido e pelo menos um exercicio adicionado.
- Cadastro de dieta agora faz autosave com debounce quando a refeicao ja esta valida: nome preenchido e pelo menos um alimento adicionado.
- Selecionar/remover refeicoes de um dia da dieta agora persiste imediatamente; o botao de salvar dia deixa de ser a unica forma de gravar.
- Estados locais restantes sao formularios incompletos/temporarios de UI, como busca, alimento selecionado ou exercicio ainda nao adicionado.

Critério de aceite:

- Nenhuma alteracao importante existe apenas em estado local.
- Recarregar ou trocar de tela nao perde dados ja confirmados pelo banco.
- Outro dispositivo ve os dados apos carregar do banco.
- Falha de save fica visivel para o usuario.

## Fase 5 - Router para navegacao

- [x] Introduzir router com rotas reais para Inicio, Treinos, Dieta e Perfil.
- [x] Criar rotas de detalhe para treino aberto e dia de dieta.
- [x] Substituir gradualmente `useLocalNavigation`.
- [x] Evitar redirecionamento implicito para Perfil em remount, refresh ou token refresh.
- [x] Revisar onboarding para navegar via router sem reabrir indevidamente.

Status:

- Router interno criado sem instalar dependencia nova.
- Rotas atuais: `/`, `/treinos`, `/treinos/:workoutId`, `/dieta`, `/dieta/:dayId`, `/perfil`.
- O router respeita `BASE_URL`, incluindo deploy em `/FitTrack/`.
- Tabs e telas de detalhe agora navegam com `history.pushState`.
- `popstate` atualiza a tela ao usar voltar/avancar do navegador.
- Testes de parse/build de rotas adicionados em `tests/appRouter.test.ts`.
- Hook antigo `src/hooks/useLocalNavigation.ts` removido depois da troca completa para `useAppRouter`.

Critério de aceite:

- Recarregar preserva rota valida ou cai em fallback previsivel.
- Trocar aba/minimizar/remontar nao joga o usuario para Perfil sem causa explicita.
- Login e onboarding continuam funcionando.

## Fase 6 - Series com peso e repeticoes independentes

- [x] Usar `workout_exercise_sets` para peso/repeticoes por serie.
- [x] Converter campos antigos `sets`, `loadKg` e `reps` em series iniciais.
- [x] Manter fallback para treinos ainda vindos do JSON legado.
- [x] Atualizar UI de cadastro e execucao de treino para editar cada serie.

Status:

- Modelo em memoria ganhou `setsDetail` em `WorkoutExercise`, preservando `sets`, `loadKg` e `reps` como resumo/fallback legado.
- Helper `src/lib/workoutSets.ts` centraliza criacao, normalizacao e resumo das series.
- Leitura relacional agora reconstrói `setsDetail` a partir de `app_workout_exercise_sets`.
- Escrita relacional de treino agora grava cada serie com `loadKg`, `reps` e `done` independentes.
- Treinos vindos do JSON legado continuam abrindo: se nao houver `setsDetail`, o app expande `sets/loadKg/reps` em series iniciais.
- Cadastro de treino permite ajustar carga e repeticoes por serie antes de salvar.
- Tela de execucao permite editar carga, repeticoes e status de cada serie.
- Teste adicionado para garantir round-trip relacional com series independentes.

Critério de aceite:

- Cada serie pode ter peso e repeticoes proprios.
- Treinos antigos continuam abrindo.
- Conversao nao perde `sets`, `loadKg` ou `reps`.

## Fase 7 - Busca de exercicios

- [x] Adicionar traducao para `Thigh_Abductor`.
- [x] Adicionar aliases: `abducao de quadril`, `abdução de quadril`, `abdutor`, `cadeira abdutora`.
- [x] Testar busca com e sem acento.

Status:

- Traducao adicionada em `src/data/exercise-name-pt.json`.
- Aliases adicionados em `src/services/exercises.ts`.
- `normalizeSearchValue` ja remove acentos, entao as buscas com e sem acento usam a mesma normalizacao.
- Verificado JSON valido e suite atual de testes passando.

Critério de aceite:

- Buscar "abducao de quadril" retorna o exercicio esperado.
- Busca existente continua funcionando.

## Fase 7.1 - Relevancia na busca de exercicios

- [x] Criar branch `feature/exercise-search-relevance`.
- [x] Planejar ranking tokenizado/fuzzy proprio, sem dependencia nova.
- [x] Buscar por nome em portugues, nome original em ingles, aliases/sinonimos, grupo muscular e equipamento.
- [x] Preparar suporte a `aliases` em `src/data/exercise-name-pt.json`.
- [x] Adicionar aliases iniciais para triceps overhead extension, extensao triceps halter, triceps frances, agachamento halter e dumbbell squat.
- [x] Mostrar mensagem de nenhum exercicio encontrado quando nenhum item passa no corte de relevancia.
- [x] Adicionar testes unitarios do score de busca.

Status:

- Busca movida para ranking ponderado em `src/lib/exerciseSearch.ts`.
- `src/services/exercises.ts` monta campos de busca com pesos por nome PT, nome EN, aliases, musculos, grupo muscular, equipamento e categoria.
- A interface continua exibindo o nome em portugues quando existir.
- Termos longos como "Seated One-Arm Dumbbell Overhead Triceps Extension" precisam casar multiplos termos relevantes antes de aparecer.
- Exercicios sem relacao ficam abaixo do threshold e nao sao exibidos.

Traducao da base:

- Total de exercicios em `exercises.json`: `873`.
- Exercicios com `ptName` em `src/data/exercise-name-pt.json`: `296`.
- Exercicios faltando traducao: `577`.
- Faltam `12` lotes de `50` traducoes, ou `6` lotes de `100`.

Critério de aceite:

- Buscar por termos em portugues e ingles retorna os exercicios relacionados primeiro.
- Buscar "triceps overhead extension" ou "extensao triceps halter" nao mostra abdominal ou agachamento.
- Buscar "agachamento halter" ou "dumbbell squat" retorna agachamentos com halteres.
- Termo sem resultado relevante mostra mensagem de nenhum exercicio encontrado.

## Fase 8 - Recuperacao de senha

- [x] Revisar URL de redirect do Supabase Auth.
- [x] Garantir que `type=recovery` seja detectado corretamente.
- [x] Garantir que limpar hash/query nao quebre o deploy.
- [x] Testar solicitar reset, abrir link, trocar senha, cancelar e link expirado.

Status:

- Reset de senha agora usa redirect com `type=recovery` explicito.
- Limpeza de URL preserva o path atual, incluindo base `/FitTrack/`.
- Helpers puros cobertos em `tests/authRedirect.test.ts`.
- Teste manual real com Supabase validado pelo usuario em 2026-05-01.

Critério de aceite:

- Link abre a tela de nova senha.
- Atualizar senha encerra o fluxo corretamente.
- Cancelar recuperacao nao deixa estado confuso.

## Fase 9 - Realtime depois

- [x] Avaliar Supabase Realtime apenas depois da persistencia direta estar correta.
- [x] Usar Realtime para sincronizacao/atualizacao de tela, nao para compensar falta de save.
- [x] Revisar o fluxo para nao perder eventos recebidos enquanto existe save local pendente.
- [x] Evitar recriar o canal Realtime a cada refresh remoto.
- [x] Validar comportamento de eventos DELETE com filtro por `user_id`.
- [x] Garantir que o SQL de publicacao Realtime seja seguro/idempotente no ambiente alvo.
- [x] Corrigir fallback do service worker para rotas diretas do app, como `/perfil`.
- [x] Evitar abrir WebSocket Realtime quando o efeito desmonta rapido, como no `React.StrictMode`.

Status:

- Realtime foi adicionado depois da persistencia relacional direta e do autosave.
- `useRemoteAppState` assina as tabelas relacionais `app_*` do usuario logado.
- Eventos de INSERT/UPDATE/DELETE disparam recarregamento remoto com debounce.
- Enquanto ha save local pendente, eventos realtime agora ficam marcados para refresh posterior em vez de serem perdidos.
- O canal Realtime nao depende mais de `hasPendingRemoteSave`, evitando recriacao a cada mudanca de save.
- O canal Realtime tambem passou a depender do `userId`, evitando reconexao quando o objeto de sessao muda para o mesmo usuario.
- A inscricao Realtime agora espera um curto intervalo antes de abrir o WebSocket; se o efeito desmontar antes disso, a inscricao e cancelada sem iniciar conexao.
- SQL idempotente criado em `supabase/realtime-publication.sql` para criar/usar a publicacao `supabase_realtime`, configurar `REPLICA IDENTITY FULL` e adicionar as tabelas relacionais.
- Service worker atualizado para devolver `index.html` quando uma rota SPA direta retorna 404, evitando erro de navegacao em `/perfil`.
- Realtime nao substitui save: ele apenas atualiza a tela quando outra sessao/dispositivo altera dados ja persistidos.
- Revisao pre-PR encontrou riscos no Realtime inicial e eles foram corrigidos no branch novo.
- Branch novo criado para o proximo PR: `realtime-sync-review-fixes`.

Critério de aceite:

- Persistencia funciona sem depender de Realtime.
- Realtime entra apenas como melhoria incremental, sem substituir save.
- Alteracoes feitas em outro dispositivo/aba aparecem sem recarregar a pagina.
- Eventos recebidos durante save local nao ficam perdidos.
- Canal Realtime permanece estavel durante refreshes.

## Revisao antes do proximo PR

- [x] Criar branch novo depois do merge do PR anterior.
- [x] Comparar o branch novo contra `origin/master`.
- [x] Revisar app em busca de bugs, inconsistencias e complexidade desnecessaria.
- [x] Rodar testes sem build/deploy.
- [x] Corrigir pontos encontrados na revisao.
- [ ] Abrir PR novo apenas depois das correcoes.

Achados principais:

- `src/hooks/useRemoteAppState.ts`: eventos Realtime recebidos durante save local agora disparam refresh depois que o save termina.
- `src/hooks/useRemoteAppState.ts`: refresh Realtime nao derruba mais `isRemoteReady`, mantendo o canal estavel.
- `supabase/realtime-publication.sql`: publicacao agora e criada se faltar e as tabelas usam `REPLICA IDENTITY FULL` para DELETE.
- `public/sw.js`: rotas diretas do app agora usam fallback para `index.html` quando o GitHub Pages retorna 404.
- `src/hooks/useLocalNavigation.ts`: hook antigo removido.
- `src/pages/DietSetupPage.tsx`: `canAddSelectedFood` removido por nao ser usado.
- Autosaves de treino/dieta funcionam, mas estao mais dificeis de entender do que o ideal para manter o codigo simples.

Verificacao:

- `npm test` falhou nesta shell porque o shim do `npm` depende de `asdf`, que nao estava disponivel.
- Suite executada pelo comando direto com `/usr/bin/node`: `7/7` testes passando.
- Build nao foi executado nesta revisao.

## Ordem recomendada

1. Backup e seguranca dos dados atuais.
2. Novo modelo relacional.
3. Conversao dos dados antigos sem alterar JSON.
4. Persistencia direta no banco para qualquer dado do app.
5. Router para navegacao.
6. Series por exercicio.
7. Busca de exercicios.
8. Recuperacao de senha.
9. Realtime, se ainda fizer sentido.

## Nao fazer agora

- Nao alterar `user_app_states`.
- Nao apagar dados.
- Nao rodar migrations sem backup.
- Nao migrar dados reais sem rollback.
- Nao depender de Realtime como solucao principal.
- Nao fazer uma refatoracao grande em um unico passo.
- Nao remover compatibilidade com JSON legado.
