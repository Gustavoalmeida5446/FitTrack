# Funcionalidades Existentes

Esta lista descreve apenas funcionalidades implementadas no codigo atual.

## Treino

- Cadastro de treinos em `src/pages/WorkoutSetupPage.tsx`.
- Edicao e remocao de treinos cadastrados.
- Arquivamento de treinos para esconder fichas antigas da Home sem apagar.
- Aba de treinos ativos e aba de treinos arquivados.
- Exportacao e importacao de treinos por arquivo JSON do FitTrack.
- Busca de exercicios baseada em `exercises.json`, aliases de `src/services/exercises.ts` e traducoes de `src/data/exercise-name-pt.json`.
- Adicao de exercicios com grupo muscular, carga, repeticoes, series e descanso.
- Series individuais por exercicio via `setsDetail`.
- Autosave de treino quando ha nome e pelo menos um exercicio valido.
- Tela de execucao do treino em `src/pages/WorkoutPage.tsx`.
- Marcacao de exercicio como feito.
- Marcacao de serie como feita.
- Edicao de carga e repeticoes por serie durante o treino.
- Reset diario do progresso de treino em `src/hooks/useDailyWorkoutReset.ts`.

## Dieta

- Cadastro de refeicoes em `src/pages/DietSetupPage.tsx`.
- Busca de alimentos na base local TACO (`src/data/taco-foods.json`).
- Ajuste de quantidade por alimento.
- Calculo de calorias, proteina, carboidratos e gordura da refeicao.
- Edicao e remocao de refeicoes.
- Associacao de refeicoes aos dias da semana.
- Limpeza das refeicoes de um dia.
- Autosave de refeicao valida.
- Persistencia imediata ao selecionar/remover refeicoes de um dia.
- Tela de dieta do dia em `src/pages/DietDayPage.tsx`.
- Marcacao de refeicao como feita.
- Reset diario de refeicoes concluidas em `src/hooks/useDailyDietReset.ts`.

## Agua

- Exibicao de consumo do dia em `src/pages/HomePage.tsx`.
- Meta diaria calculada pelo perfil.
- Adicao rapida de `250 ml` e `500 ml`.
- Adicao personalizada por prompt.
- Reset diario do consumo em `src/hooks/useDailyWaterReset.ts`.

## Perfil

- Edicao de peso, altura, data de nascimento, sexo, nivel de atividade, objetivo e tipo de dieta em `src/pages/NutritionGoalsPage.tsx`.
- Calculo automatico de idade a partir da data de nascimento.
- Calculo de metas diarias de calorias, proteina, carboidratos, gordura e agua.
- Registro de historico de peso.
- Remocao de registros de peso.
- Alternancia entre tema claro e escuro.
- Reexecucao do tutorial inicial.

## Autenticacao

- Login com e-mail e senha via Supabase Auth.
- Cadastro com e-mail e senha.
- Mensagem para confirmacao de e-mail quando o Supabase exige confirmacao.
- Recuperacao de senha por e-mail.
- Redefinicao de senha a partir de redirect de recovery.
- Logout.
- Mensagens de erro traduzidas em `src/lib/authErrors.ts`.

## Sincronizacao

- Carregamento de dados remotos por `src/hooks/useRemoteAppState.ts`.
- Persistencia agregada em `user_app_states` por `src/services/appStateService.ts`.
- Persistencia relacional por `src/services/relationalAppStateService.ts`.
- Fallback para criar estado remoto quando nao existe linha em `user_app_states`.
- Normalizacao de formatos legados em `src/lib/legacyState.ts`.
- Realtime em tabelas relacionais para atualizar estado entre dispositivos.
- Mensagens de status: salvando, salvo e erro.
- Retry automatico do save agregado apos falha.

## PWA

- Manifest em `public/manifest.webmanifest`.
- Service worker em `public/sw.js`.
- Registro do service worker em producao por `src/main.tsx`.
- Cache basico do app shell.
- Fallback offline para navegacao usando `index.html` em cache.
- Suporte a instalacao como app standalone.

## Router

- Rotas reais sem dependencia externa.
- Suporte a voltar/avancar do navegador.
- Suporte ao base path `/FitTrack/` no GitHub Pages.
- Fallback para inicio em rota desconhecida.

## Testes

`tests/` cobre regras importantes de:

- roteamento;
- normalizacao de estado;
- datas;
- calculo nutricional;
- validacao;
- busca e nomes de exercicios;
- auth redirect e mensagens de erro;
- conversao relacional.
