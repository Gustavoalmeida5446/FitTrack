# TODO

Backlog técnico consolidado a partir da revisão do projeto.

Status:
- `[ ]` pendente
- `[-]` parcial
- `[x]` concluído

## Prioridade 1

### [x] 1. Remover a heurística de "mock state"
- Objetivo: impedir perda de dados reais por coincidência com valores usados no estado antigo de demonstração.
- Risco atual: alto.
- Arquivos:
- [src/services/appStateService.ts](/home/gustavo/projects/FitTrack/src/services/appStateService.ts)
- [src/lib/appState.ts](/home/gustavo/projects/FitTrack/src/lib/appState.ts)
- Tarefas:
- remover `isLegacyMockState`
- parar de sobrescrever estado remoto automaticamente
- se necessário, criar uma migração explícita e temporária

### [x] 2. Blindar a persistência remota contra corrupção silenciosa
- Objetivo: garantir que falhas de save ou estados degradados não sejam enviados sem controle.
- Risco atual: alto.
- Arquivos:
- [src/App.tsx](/home/gustavo/projects/FitTrack/src/App.tsx)
- [src/services/appStateService.ts](/home/gustavo/projects/FitTrack/src/services/appStateService.ts)
- [src/lib/appState.ts](/home/gustavo/projects/FitTrack/src/lib/appState.ts)
- [src/hooks/useRemoteAppState.ts](/home/gustavo/projects/FitTrack/src/hooks/useRemoteAppState.ts)
- [src/styles/app.css](/home/gustavo/projects/FitTrack/src/styles/app.css)
- Tarefas:
- [x] adicionar retry ou fila simples de reenvio
- [x] exibir estado de erro de sincronização
- [x] validar payload antes de salvar

### [x] 3. Corrigir consistência entre `weightHistory` e `profile.currentWeight`
- Objetivo: manter o peso atual coerente com o histórico.
- Risco atual: médio/alto.
- Arquivos:
- [src/App.tsx](/home/gustavo/projects/FitTrack/src/App.tsx)
- [src/pages/NutritionGoalsPage.tsx](/home/gustavo/projects/FitTrack/src/pages/NutritionGoalsPage.tsx)
- Tarefas:
- [x] ao remover um peso, recalcular `currentWeight`
- [x] definir regra única: último peso válido do histórico representa o peso atual

## Prioridade 2

### [x] 4. Refatorar `App.tsx`
- Objetivo: reduzir acoplamento e risco de regressão.
- Risco atual: médio.
- Arquivos:
- [src/App.tsx](/home/gustavo/projects/FitTrack/src/App.tsx)
- [src/hooks/useAuthSession.ts](/home/gustavo/projects/FitTrack/src/hooks/useAuthSession.ts)
- [src/hooks/useRemoteAppState.ts](/home/gustavo/projects/FitTrack/src/hooks/useRemoteAppState.ts)
- [src/hooks/useTutorial.ts](/home/gustavo/projects/FitTrack/src/hooks/useTutorial.ts)
- [src/hooks/useDailyWorkoutReset.ts](/home/gustavo/projects/FitTrack/src/hooks/useDailyWorkoutReset.ts)
- [src/hooks/useLocalNavigation.ts](/home/gustavo/projects/FitTrack/src/hooks/useLocalNavigation.ts)
- Tarefas:
- [x] extrair `useAuthSession`
- [x] extrair `useRemoteAppState`
- [x] extrair `useTutorial`
- [x] extrair `useDailyWorkoutReset`
- [x] extrair navegação local

### [x] 5. Separar compatibilidade legada da lógica principal de estado
- Objetivo: simplificar leitura e manutenção de persistência.
- Risco atual: médio.
- Arquivos:
- [src/lib/appState.ts](/home/gustavo/projects/FitTrack/src/lib/appState.ts)
- [src/services/appStateService.ts](/home/gustavo/projects/FitTrack/src/services/appStateService.ts)
- Tarefas:
- [x] mover tipos `Legacy*` para módulo próprio
- [x] deixar o formato atual de persistência com caminho principal único
- [x] isolar parsing/migração de formatos antigos

### [x] 6. Padronizar todos os `NumberInput`
- Objetivo: evitar bugs de formulário e `NaN`.
- Risco atual: médio.
- Arquivos:
- [src/pages/NutritionGoalsPage.tsx](/home/gustavo/projects/FitTrack/src/pages/NutritionGoalsPage.tsx)
- [src/pages/WorkoutSetupPage.tsx](/home/gustavo/projects/FitTrack/src/pages/WorkoutSetupPage.tsx)
- [src/pages/WorkoutPage.tsx](/home/gustavo/projects/FitTrack/src/pages/WorkoutPage.tsx)
- [src/pages/DietSetupPage.tsx](/home/gustavo/projects/FitTrack/src/pages/DietSetupPage.tsx)
- Tarefas:
- [x] escolher um padrão único de leitura
- [x] preferir sempre `state.value` do Carbon
- [x] centralizar sanitização num helper

### [x] 7. Decidir se exercício manual existe ou não
- Objetivo: alinhar modelo de dados com a UI real.
- Risco atual: médio.
- Arquivos:
- [src/data/types.ts](/home/gustavo/projects/FitTrack/src/data/types.ts)
- [src/pages/WorkoutSetupPage.tsx](/home/gustavo/projects/FitTrack/src/pages/WorkoutSetupPage.tsx)
- [src/lib/appState.ts](/home/gustavo/projects/FitTrack/src/lib/appState.ts)
- Tarefas:
- [x] parar de produzir exercícios manuais no fluxo atual da UI
- [x] remover `source: 'manual'` do modelo atual e simplificar o código de ponta a ponta
- [x] manter compatibilidade de leitura no fluxo legado

## Prioridade 3

### [x] 8. Extrair operações de domínio repetidas
- Objetivo: deixar o código mais didático e previsível.
- Risco atual: médio.
- Arquivos:
- [src/App.tsx](/home/gustavo/projects/FitTrack/src/App.tsx)
- [src/lib/nutrition.ts](/home/gustavo/projects/FitTrack/src/lib/nutrition.ts)
- [src/lib/date.ts](/home/gustavo/projects/FitTrack/src/lib/date.ts)
- [src/lib/appUpdates.ts](/home/gustavo/projects/FitTrack/src/lib/appUpdates.ts)
- Tarefas:
- [x] helper para toggle de exercício concluído
- [x] helper para toggle de refeição concluída
- [x] helper para atualizar água
- [x] helper para atualizar peso
- [x] helper para totais de refeição/dia

### [x] 9. Melhorar busca de alimentos
- Objetivo: reduzir custo por tecla e melhorar UX.
- Risco atual: médio.
- Arquivos:
- [src/pages/DietSetupPage.tsx](/home/gustavo/projects/FitTrack/src/pages/DietSetupPage.tsx)
- [src/services/foods.ts](/home/gustavo/projects/FitTrack/src/services/foods.ts)
- Tarefas:
- [x] adicionar debounce
- [x] evitar sort completo da base a cada tecla
- [x] avaliar índice simples em memória

### [x] 10. Melhorar busca de exercícios
- Objetivo: manter consistência com a busca de alimentos e simplificar o fluxo.
- Risco atual: baixo/médio.
- Arquivos:
- [src/pages/WorkoutSetupPage.tsx](/home/gustavo/projects/FitTrack/src/pages/WorkoutSetupPage.tsx)
- [src/services/exercises.ts](/home/gustavo/projects/FitTrack/src/services/exercises.ts)
- [src/hooks/useDebouncedValue.ts](/home/gustavo/projects/FitTrack/src/hooks/useDebouncedValue.ts)
- Tarefas:
- [x] revisar score de busca
- [x] avaliar debounce compartilhado
- [x] centralizar normalização de texto
- [x] criar índice simples em memória para reduzir trabalho repetido

### [x] 11. Limpar caminhos mortos de autenticação
- Objetivo: remover ramos que hoje não acontecem no app.
- Risco atual: baixo.
- Arquivos:
- [src/App.tsx](/home/gustavo/projects/FitTrack/src/App.tsx)
- [src/pages/NutritionGoalsPage.tsx](/home/gustavo/projects/FitTrack/src/pages/NutritionGoalsPage.tsx)
- [src/pages/LoginPage.tsx](/home/gustavo/projects/FitTrack/src/pages/LoginPage.tsx)
- [src/hooks/useTutorial.ts](/home/gustavo/projects/FitTrack/src/hooks/useTutorial.ts)
- Tarefas:
- [x] remover ou suportar de verdade o caso "perfil sem sessão"
- [x] revisar fluxo de login/signup/onboarding

## Prioridade 4

### [x] 12. Consolidar utilitários pequenos
- Objetivo: reduzir duplicação e facilitar onboarding no código.
- Risco atual: baixo.
- Arquivos:
- [src/pages/WorkoutSetupPage.tsx](/home/gustavo/projects/FitTrack/src/pages/WorkoutSetupPage.tsx)
- [src/pages/WorkoutPage.tsx](/home/gustavo/projects/FitTrack/src/pages/WorkoutPage.tsx)
- [src/pages/DietSetupPage.tsx](/home/gustavo/projects/FitTrack/src/pages/DietSetupPage.tsx)
- [src/services/exercises.ts](/home/gustavo/projects/FitTrack/src/services/exercises.ts)
- [src/services/foods.ts](/home/gustavo/projects/FitTrack/src/services/foods.ts)
- [src/lib/food.ts](/home/gustavo/projects/FitTrack/src/lib/food.ts)
- [src/lib/search.ts](/home/gustavo/projects/FitTrack/src/lib/search.ts)
- [src/lib/number.ts](/home/gustavo/projects/FitTrack/src/lib/number.ts)
- [src/pages/HomePage.tsx](/home/gustavo/projects/FitTrack/src/pages/HomePage.tsx)
- Tarefas:
- [x] unificar `getSafeNumber`
- [x] unificar normalização de busca
- [x] unificar parse e arredondamento de alimento
- [x] avançar na unificação de parsing numérico simples
- [x] extrair helpers pequenos de formatação numérica para telas de dieta
- [x] unificar parse de datas e números

### [x] 13. Extrair componentes de UI repetidos
- Objetivo: simplificar páginas longas.
- Risco atual: baixo.
- Arquivos:
- [src/pages/HomePage.tsx](/home/gustavo/projects/FitTrack/src/pages/HomePage.tsx)
- [src/pages/WorkoutPage.tsx](/home/gustavo/projects/FitTrack/src/pages/WorkoutPage.tsx)
- [src/pages/DietDayPage.tsx](/home/gustavo/projects/FitTrack/src/pages/DietDayPage.tsx)
- [src/pages/DietSetupPage.tsx](/home/gustavo/projects/FitTrack/src/pages/DietSetupPage.tsx)
- [src/pages/NutritionGoalsPage.tsx](/home/gustavo/projects/FitTrack/src/pages/NutritionGoalsPage.tsx)
- [src/pages/LoginPage.tsx](/home/gustavo/projects/FitTrack/src/pages/LoginPage.tsx)
- [src/components/CardHeader.tsx](/home/gustavo/projects/FitTrack/src/components/CardHeader.tsx)
- [src/components/InfoBlock.tsx](/home/gustavo/projects/FitTrack/src/components/InfoBlock.tsx)
- [src/components/SelectionSummaryCard.tsx](/home/gustavo/projects/FitTrack/src/components/SelectionSummaryCard.tsx)
- [src/components/StatPill.tsx](/home/gustavo/projects/FitTrack/src/components/StatPill.tsx)
- [src/components/StatsGrid.tsx](/home/gustavo/projects/FitTrack/src/components/StatsGrid.tsx)
- [src/components/SummaryStatsCard.tsx](/home/gustavo/projects/FitTrack/src/components/SummaryStatsCard.tsx)
- [src/styles/app.css](/home/gustavo/projects/FitTrack/src/styles/app.css)
- Tarefas:
- [x] extrair bloco `stat-pill`
- [x] extrair cabeçalho de card
- [x] extrair cards de resumo
- [x] extrair bloco `info-block`
- [x] extrair blocos de métricas
- [x] extrair listas reutilizáveis

### [x] 14. Revisar schema e modelo persistido
- Objetivo: alinhar melhor o shape salvo com o shape usado na UI.
- Risco atual: baixo/médio.
- Arquivos:
- [supabase/schema.sql](/home/gustavo/projects/FitTrack/supabase/schema.sql)
- [src/services/appStateService.ts](/home/gustavo/projects/FitTrack/src/services/appStateService.ts)
- [src/lib/appState.ts](/home/gustavo/projects/FitTrack/src/lib/appState.ts)
- Tarefas:
- [x] avaliar versionamento de payload
- [x] documentar formatos persistidos
- [x] preparar migrações futuras com menos heurística

### [x] 15. Adicionar testes mínimos
- Objetivo: reduzir regressões em persistência e cálculos.
- Risco atual: estrutural.
- Arquivos candidatos:
- [src/lib/appState.ts](/home/gustavo/projects/FitTrack/src/lib/appState.ts)
- [src/lib/date.ts](/home/gustavo/projects/FitTrack/src/lib/date.ts)
- [src/lib/nutrition.ts](/home/gustavo/projects/FitTrack/src/lib/nutrition.ts)
- [src/services/appStateService.ts](/home/gustavo/projects/FitTrack/src/services/appStateService.ts)
- Tarefas:
- [x] testar normalização de workouts
- [x] testar reset diário
- [x] testar cálculo de idade
- [x] testar cálculo de metas

### [x] 16. Corrigir persistência visual da data de nascimento
- Objetivo: fazer o campo de data de nascimento exibir novamente o valor salvo pelo usuário, no mesmo padrão visual dos outros inputs.
- Risco atual: médio.
- Arquivos candidatos:
- [src/pages/NutritionGoalsPage.tsx](/home/gustavo/projects/FitTrack/src/pages/NutritionGoalsPage.tsx)
- [src/lib/date.ts](/home/gustavo/projects/FitTrack/src/lib/date.ts)
- [src/lib/appState.ts](/home/gustavo/projects/FitTrack/src/lib/appState.ts)
- [src/services/appStateService.ts](/home/gustavo/projects/FitTrack/src/services/appStateService.ts)
- [supabase/schema.sql](/home/gustavo/projects/FitTrack/supabase/schema.sql)
- Tarefas:
- [x] verificar se a data de nascimento está sendo salva no banco
- [x] se estiver salva, fazer o valor reaparecer corretamente no seletor/input
- [x] se não estiver salva, corrigir a persistência
- [x] manter o mesmo padrão visual dos demais campos preenchidos

## Próximas tarefas

### [x] 17. Corrigir UX estranha dos `NumberInput`
- Objetivo: fazer os campos numéricos reagirem como inputs normais enquanto o usuário digita, sem ficar presos no `0`.
- Risco atual: médio.
- Arquivos candidatos:
- [src/pages/NutritionGoalsPage.tsx](/home/gustavo/projects/FitTrack/src/pages/NutritionGoalsPage.tsx)
- [src/pages/WorkoutSetupPage.tsx](/home/gustavo/projects/FitTrack/src/pages/WorkoutSetupPage.tsx)
- [src/pages/WorkoutPage.tsx](/home/gustavo/projects/FitTrack/src/pages/WorkoutPage.tsx)
- [src/pages/DietSetupPage.tsx](/home/gustavo/projects/FitTrack/src/pages/DietSetupPage.tsx)
- [src/lib/number.ts](/home/gustavo/projects/FitTrack/src/lib/number.ts)
- Tarefas:
- [x] mapear quais campos estão com comportamento ruim durante digitação
- [x] remover o efeito visual de `0` travado nos inputs
- [x] definir um padrão simples para valor vazio, foco e blur
- [x] aplicar o mesmo comportamento aos formulários principais

### [x] 18. Adicionar validação com `zod` nos dados principais
- Objetivo: validar os dados do app com regras explícitas, sem introduzir `react-hook-form`.
- Risco atual: médio.
- Arquivos candidatos:
- [package.json](/home/gustavo/projects/FitTrack/package.json)
- [src/lib/appState.ts](/home/gustavo/projects/FitTrack/src/lib/appState.ts)
- [src/services/appStateService.ts](/home/gustavo/projects/FitTrack/src/services/appStateService.ts)
- [src/pages/NutritionGoalsPage.tsx](/home/gustavo/projects/FitTrack/src/pages/NutritionGoalsPage.tsx)
- [src/pages/WorkoutSetupPage.tsx](/home/gustavo/projects/FitTrack/src/pages/WorkoutSetupPage.tsx)
- [src/pages/DietSetupPage.tsx](/home/gustavo/projects/FitTrack/src/pages/DietSetupPage.tsx)
- Tarefas:
- [x] instalar `zod`
- [x] criar schemas simples para perfil, treino, refeição e itens persistidos
- [x] validar dados antes de salvar no estado remoto
- [x] validar entradas principais antes de concluir ações de salvar
- [x] cobrir os schemas com testes mínimos

### [x] 19. Revisar mensagens de erro e feedback de formulário
- Objetivo: deixar claro para o usuário quando um valor é inválido ou incompleto.
- Risco atual: baixo/médio.
- Arquivos candidatos:
- [src/pages/NutritionGoalsPage.tsx](/home/gustavo/projects/FitTrack/src/pages/NutritionGoalsPage.tsx)
- [src/pages/WorkoutSetupPage.tsx](/home/gustavo/projects/FitTrack/src/pages/WorkoutSetupPage.tsx)
- [src/pages/DietSetupPage.tsx](/home/gustavo/projects/FitTrack/src/pages/DietSetupPage.tsx)
- [src/styles/app.css](/home/gustavo/projects/FitTrack/src/styles/app.css)
- Tarefas:
- [x] definir onde mostrar erro inline e onde bloquear save
- [x] adicionar mensagens curtas e fáceis de entender
- [x] manter o visual consistente entre campos válidos e inválidos

### [x] 20. Parar de mostrar erros de formulário antes da interação do usuário
- Objetivo: exibir erro só depois de tentativa de salvar, blur relevante ou interação real com o campo.
- Risco atual: médio/alto.
- Arquivos candidatos:
- [src/pages/NutritionGoalsPage.tsx](/home/gustavo/projects/FitTrack/src/pages/NutritionGoalsPage.tsx)
- [src/pages/WorkoutSetupPage.tsx](/home/gustavo/projects/FitTrack/src/pages/WorkoutSetupPage.tsx)
- [src/pages/DietSetupPage.tsx](/home/gustavo/projects/FitTrack/src/pages/DietSetupPage.tsx)
- [src/components/AppNumberInput.tsx](/home/gustavo/projects/FitTrack/src/components/AppNumberInput.tsx)
- [src/styles/app.css](/home/gustavo/projects/FitTrack/src/styles/app.css)
- Tarefas:
- [x] definir uma regra simples de exibição: touched, blur ou tentativa de save
- [x] impedir mensagens de erro na tela inicial vazia
- [x] manter bloqueio de botão quando necessário, mas sem “gritar erro” cedo demais
- [x] aplicar o mesmo padrão entre perfil, treino e dieta

### [x] 21. Alinhar schemas do `zod` com as regras reais da UI
- Objetivo: fazer a validação refletir o que o app realmente exige e permitir mensagens coerentes.
- Risco atual: médio.
- Arquivos candidatos:
- [src/lib/validation.ts](/home/gustavo/projects/FitTrack/src/lib/validation.ts)
- [src/pages/NutritionGoalsPage.tsx](/home/gustavo/projects/FitTrack/src/pages/NutritionGoalsPage.tsx)
- [src/pages/WorkoutSetupPage.tsx](/home/gustavo/projects/FitTrack/src/pages/WorkoutSetupPage.tsx)
- [src/pages/DietSetupPage.tsx](/home/gustavo/projects/FitTrack/src/pages/DietSetupPage.tsx)
- [tests/validation.test.ts](/home/gustavo/projects/FitTrack/tests/validation.test.ts)
- Tarefas:
- [x] decidir quais campos podem começar vazios sem erro imediato
- [x] exigir nos schemas o que a UI exige de verdade na hora de salvar
- [x] revisar perfil: peso, altura e data de nascimento
- [x] revisar treino: garantir consistência mínima de exercício e treino
- [x] revisar dieta: garantir consistência mínima de refeição e alimento

### [x] 22. Evitar perda silenciosa de dados ao sanitizar estado inválido
- Objetivo: nunca zerar blocos inteiros do estado salvo só porque um item veio inválido.
- Risco atual: alto.
- Arquivos candidatos:
- [src/lib/appState.ts](/home/gustavo/projects/FitTrack/src/lib/appState.ts)
- [src/lib/validation.ts](/home/gustavo/projects/FitTrack/src/lib/validation.ts)
- [src/services/appStateService.ts](/home/gustavo/projects/FitTrack/src/services/appStateService.ts)
- [tests/appState.test.ts](/home/gustavo/projects/FitTrack/tests/appState.test.ts)
- [tests/validation.test.ts](/home/gustavo/projects/FitTrack/tests/validation.test.ts)
- Tarefas:
- [x] revisar fallback atual que pode voltar para `defaultAppState`
- [x] sanitizar listas item a item sempre que possível
- [x] evitar apagar dieta inteira por causa de uma refeição inválida
- [x] validar relações da dieta, como `completedMealIds` pertencendo a `mealIds`
- [x] cobrir esses cenários com testes

### [x] 23. Revisão final de simplicidade e excesso de abstração
- Objetivo: garantir que a solução final continue fácil de entender e com o mínimo de camadas necessário.
- Risco atual: médio.
- Arquivos candidatos:
- [src/lib/validation.ts](/home/gustavo/projects/FitTrack/src/lib/validation.ts)
- [src/components/AppNumberInput.tsx](/home/gustavo/projects/FitTrack/src/components/AppNumberInput.tsx)
- [src/pages/NutritionGoalsPage.tsx](/home/gustavo/projects/FitTrack/src/pages/NutritionGoalsPage.tsx)
- [src/pages/WorkoutSetupPage.tsx](/home/gustavo/projects/FitTrack/src/pages/WorkoutSetupPage.tsx)
- [src/pages/DietSetupPage.tsx](/home/gustavo/projects/FitTrack/src/pages/DietSetupPage.tsx)
- Tarefas:
- [x] remover validação duplicada ou mensagem duplicada
- [x] simplificar helpers que tenham ficado sofisticados demais
- [x] confirmar que cada regra importante aparece num lugar fácil de achar
- [x] fazer uma última passada de leitura como código de estudante caprichoso

### [x] 24. Priorizar validação do login com `zod`
- Objetivo: aplicar o mesmo padrão de validação do resto do app na autenticação.
- Prioridade: alta.
- Risco atual: médio.
- Arquivos candidatos:
- [src/pages/LoginPage.tsx](/home/gustavo/projects/FitTrack/src/pages/LoginPage.tsx)
- [src/lib/validation.ts](/home/gustavo/projects/FitTrack/src/lib/validation.ts)
- [tests/validation.test.ts](/home/gustavo/projects/FitTrack/tests/validation.test.ts)
- Tarefas:
- [x] criar schema simples para login e cadastro
- [x] validar e-mail com formato real e senha com regra mínima clara
- [x] mostrar erros só depois de interação ou tentativa de envio
- [x] evitar regra duplicada espalhada dentro do componente
- [x] cobrir os casos principais com teste

### [x] 25. Endurecer validação do histórico de peso
- Objetivo: evitar salvar ou aceitar registros com data malformada.
- Prioridade: média.
- Risco atual: baixo.
- Arquivos candidatos:
- [src/lib/validation.ts](/home/gustavo/projects/FitTrack/src/lib/validation.ts)
- [src/lib/appUpdates.ts](/home/gustavo/projects/FitTrack/src/lib/appUpdates.ts)
- [tests/validation.test.ts](/home/gustavo/projects/FitTrack/tests/validation.test.ts)
- Tarefas:
- [x] alinhar `weightLogSchema` com o formato de data realmente usado
- [x] revisar se o formato salvo é o melhor para exibição e consistência
- [x] adicionar teste de aceitação e rejeição

### [x] 26. Revisão final de performance e build
- Objetivo: decidir se o aviso de bundle grande precisa de ação ou só registro.
- Prioridade: baixa.
- Risco atual: baixo.
- Arquivos candidatos:
- [package.json](/home/gustavo/projects/FitTrack/package.json)
- [src/App.tsx](/home/gustavo/projects/FitTrack/src/App.tsx)
- Tarefas:
- [x] medir se vale separar telas com `lazy` ou manter como está
- [x] evitar otimização desnecessária se não houver ganho real para a entrega
- [x] registrar a decisão final no projeto

### [x] 28. Reduzir chunk sizes do build
- Objetivo: remover ou reduzir o aviso de chunks grandes no `vite build`.
- Prioridade: média.
- Risco atual: baixo/médio.
- Arquivos candidatos:
- [package.json](/home/gustavo/projects/FitTrack/package.json)
- [src/App.tsx](/home/gustavo/projects/FitTrack/src/App.tsx)
- `vite.config.*`
- Tarefas:
- [x] medir o que mais pesa no bundle atual
- [x] avaliar separar telas com `lazy` e `dynamic import`
- [x] aplicar só a menor mudança que já reduza o aviso
- [x] validar novamente com `vite build`

### [x] 29. Colocar o build dentro do fluxo de deploy
- Objetivo: permitir deploy com um comando só.
- Prioridade: alta.
- Risco atual: baixo.
- Arquivos candidatos:
- [package.json](/home/gustavo/projects/FitTrack/package.json)
- [scripts/deploy-gh-pages.sh](/home/gustavo/projects/FitTrack/scripts/deploy-gh-pages.sh)
- Tarefas:
- [x] deixar `npm run deploy` executando o build antes da publicação
- [x] remover duplicação do build no script de deploy

### [x] 27. Resetar água na virada do dia
- Objetivo: zerar o consumo de água quando o app voltar em um novo dia.
- Prioridade: alta.
- Risco atual: médio.
- Arquivos candidatos:
- [src/App.tsx](/home/gustavo/projects/FitTrack/src/App.tsx)
- [src/hooks/useDailyWaterReset.ts](/home/gustavo/projects/FitTrack/src/hooks/useDailyWaterReset.ts)
- [src/lib/appState.ts](/home/gustavo/projects/FitTrack/src/lib/appState.ts)
- [tests/appState.test.ts](/home/gustavo/projects/FitTrack/tests/appState.test.ts)
- Tarefas:
- [x] confirmar a causa do não reset
- [x] aplicar reset diário da água com a mesma lógica simples usada em treinos
- [x] garantir que o novo valor também seja marcado para sincronização remota
- [x] cobrir a normalização com teste

## Ordem sugerida de execução

1. Itens 1, 2 e 3
2. Itens 4 e 5
3. Itens 6 e 7
4. Itens 8, 9 e 10
5. Itens 11, 12 e 13
6. Itens 14 e 15
7. Item 16
8. Item 17
9. Item 18
10. Item 19
11. Item 20
12. Item 21
13. Item 22
14. Item 23
15. Item 24
16. Item 25
17. Item 26
18. Item 27
19. Item 28
20. Item 29
