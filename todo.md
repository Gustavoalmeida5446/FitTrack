# TODO - FitTrack

Lista baseada no estado atual do codigo em 2026-05-09.

## Prioridade Alta

- Verificar no Supabase real se `app_diet_day_meals` e `app_diet_completed_meals` possuem coluna `updated_at`. O schema em `supabase/relational-schema-plan.sql` nao define essa coluna, mas `src/services/relationalAppStateService.ts` envia `updated_at` nos upserts dessas tabelas.
- Revisar a resolucao de conflito entre `user_app_states.updated_at` e timestamps relacionais em `src/services/appStateService.ts`, porque o app ainda escolhe entre snapshot legado e relacional por data.
- Validar o fluxo de escrita dupla entre `src/services/appStateService.ts` e `src/services/relationalAppStateService.ts`, principalmente falhas parciais em `replaceRelationalWorkouts`, `replaceRelationalDiet` e `replaceRelationalWeightHistory`.
- Conferir se os valores fallback de Supabase em `src/lib/supabaseClient.ts` devem permanecer no codigo ou ficar somente em variaveis de ambiente.

## Prioridade Media

- Atualizar `README.md` para apontar o PWA para `public/manifest.webmanifest`, pois o texto atual menciona `favicon/site.webmanifest`.
- Revisar `.env.example`: as variaveis WGER, ExerciseDB e USDA aparecem no exemplo, mas a implementacao atual usa base local de exercicios e TACO.
- Decidir o papel de `todo.md` minúsculo, que contem plano tecnico antigo semelhante ao antigo `TODO.md`.
- Avaliar se `app_weight_logs` precisa de `updated_at`, ja que o carregamento relacional calcula o timestamp mais recente a partir de linhas que podem ou nao ter essa coluna.
- Documentar procedimento operacional de backup antes de qualquer nova migration Supabase.
- Revisar se `dist/`, `.test-dist/` e arquivos `*.tsbuildinfo` devem permanecer no diretorio local ou ser limpos/ignorados conforme politica do repositorio.

## Prioridade Baixa

- Ampliar testes para `src/services/relationalAppStateService.ts` com mocks do Supabase, cobrindo deletes, soft deletes e falhas parciais.
- Adicionar testes para `src/services/foods.ts`, especialmente busca, unidades `g`, `ml`, `un` e conversao por `gramasPorUnidade`.
- Revisar textos de documentacao do tutorial em `src/App.tsx` quando novas funcionalidades forem adicionadas.
- Avaliar estrategia de versionamento do cache PWA em `public/sw.js` para cada release publicada.
- Manter `docs/` sincronizado quando mudar router, persistencia, schema, PWA ou deploy.
