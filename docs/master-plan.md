# Master Plan do FitTrack

## 1. Objetivo do documento

Este documento define o plano mestre para a evolução do FitTrack. Ele deve guiar futuras alterações de UX, UI, arquitetura, organização de código, persistência, refatorações e novas funcionalidades.

O objetivo deste PR é exclusivamente criar o plano. Nenhuma melhoria funcional, visual, arquitetural ou de banco de dados deve ser implementada junto com este documento.

## 2. Base da análise

O plano foi elaborado a partir da análise do código e da documentação existentes no projeto, incluindo:

- `README.md`, com a descrição funcional do aplicativo, stack, scripts, Supabase, GitHub Pages e PWA.
- `docs/architecture.md`, com o desenho atual da arquitetura, fluxo de dados, router, persistência local/remota e pontos de atenção.
- `docs/database.md`, com o modelo legado agregado, tabelas relacionais, RLS, Realtime, fluxo de sincronização e riscos de inconsistência.
- `docs/features.md`, com as funcionalidades atualmente implementadas.
- `src/App.tsx`, que centraliza estado principal, sessão, sincronização, tema, tutorial, handlers de domínio e composição das páginas.
- `src/pages/`, que contém as telas de autenticação, início, treino, dieta, metas e cálculo.
- `src/components/`, que contém componentes reutilizáveis de apresentação e entrada.
- `src/hooks/`, que contém autenticação, roteamento, sincronização, tutorial e resets diários.
- `src/lib/`, que contém regras puras, normalização, validação, cálculos, roteamento, conversões e compatibilidade legada.
- `src/services/`, que contém autenticação, alimentos, exercícios e persistência remota.
- `supabase/`, que contém schemas, scripts relacionais, Realtime e migrações.
- `tests/`, que cobre regras de roteamento, estado, datas, nutrição, validação, busca, autenticação, compartilhamento de treino e conversão relacional.

## 3. Estado atual do projeto

O FitTrack é uma aplicação React, Vite e TypeScript com Carbon Design System, Supabase Auth, Supabase Database, Supabase Realtime e suporte básico a PWA.

As funcionalidades existentes incluem:

- autenticação por e-mail e senha;
- cadastro, edição e uso de perfil;
- cálculo de metas nutricionais;
- histórico recente de peso;
- criação, edição, remoção, arquivamento, importação e exportação de treinos;
- execução de treinos com marcação de exercícios e séries;
- criação de refeições e dieta semanal;
- acompanhamento diário de dieta;
- registro de água;
- tema claro e escuro;
- tutorial inicial por usuário;
- sincronização remota com fallback legado;
- PWA básico.

A arquitetura atual usa `src/App.tsx` como centro de composição e estado. As páginas recebem dados e callbacks por props. A persistência é híbrida: o app ainda salva o snapshot agregado legado em `user_app_states` e também grava tabelas relacionais novas.

## 4. Princípios obrigatórios para evolução

Como já existem usuários utilizando o aplicativo, toda evolução futura deve seguir estes princípios:

1. **Não causar perda de dados.** Nenhuma alteração pode apagar, sobrescrever ou invalidar dados existentes.
2. **Preservar compatibilidade com dados atuais.** Dados legados, snapshots agregados e tabelas relacionais devem continuar carregando corretamente.
3. **Separar refatoração de mudança funcional.** PRs de refatoração não devem alterar UX, UI, banco de dados ou regras de negócio.
4. **Separar UI de comportamento.** Redesign visual não deve alterar cálculos, persistência ou fluxo de dados.
5. **Migrar de forma progressiva.** Qualquer mudança de banco deve ser idempotente, segura e acompanhada de plano de rollback ou mitigação.
6. **Testar antes de alterar áreas sensíveis.** Persistência, normalização, conversão relacional, reset diário e autenticação precisam de cobertura antes de mudanças.
7. **Preservar fallback legado até plano específico de remoção.** `user_app_states`, normalizadores e compatibilidade legada não devem ser removidos sem fase própria.
8. **Entregar em fases pequenas.** Cada fase deve poder ser revisada, testada e revertida de forma independente.

## 5. Áreas principais identificadas

### 5.1 Composição centralizada em `src/App.tsx`

`src/App.tsx` concentra sessão, roteamento, tema, estado principal, sincronização remota, handlers de domínio, resets diários, tutorial, status de sincronização e renderização das páginas. Esse arquivo é um ponto crítico para evolução e deve ser decomposto gradualmente.

### 5.2 Páginas extensas com múltiplas responsabilidades

`WorkoutSetupPage`, `DietSetupPage`, `LoginPage` e `NutritionGoalsPage` concentram lógica de formulário, estados locais, mensagens, renderização, listas e ações. As páginas de treino e dieta são especialmente sensíveis por combinarem criação, edição, seleção, autosave e persistência indireta.

### 5.3 Persistência híbrida e compatibilidade legada

O app usa persistência agregada legada e persistência relacional. Isso protege usuários existentes, mas cria riscos de divergência por timestamp, falha parcial de escrita e conflitos entre fontes. Essa área precisa ser tratada com prioridade antes de grandes mudanças funcionais.

### 5.4 UI global extensa

`src/styles/app.css` contém tokens, tema, layout, cards, listas, navegação, formulários, estados, autenticação e estilos específicos de treino/dieta. A UI tem uma base consolidada, mas precisa de inventário antes de redesign para evitar inconsistências.

### 5.5 Componentização parcial

O projeto já possui componentes reutilizáveis, mas ainda há muitos padrões renderizados diretamente nas páginas. Antes de um redesign profundo, é recomendável consolidar componentes para cabeçalhos, cards, listas, mensagens, estados vazios, ações e métricas.

### 5.6 Novas funcionalidades solicitadas

Além da revisão geral, o plano passa a incluir duas novas funcionalidades futuras:

- cronômetro de descanso entre exercícios ou séries;
- acompanhamento de jejum.

Essas funcionalidades devem ser planejadas depois da estabilização das áreas de dados, UX e arquitetura, porque introduzem novos estados temporais, possíveis persistências e novos fluxos diários.

## 6. Mapa de riscos de dados

As áreas abaixo exigem cuidado especial em qualquer alteração futura:

| Área | Dados envolvidos | Risco principal |
| --- | --- | --- |
| Perfil | peso, altura, nascimento, sexo, atividade, objetivo, dieta | cálculo incorreto ou sobrescrita de perfil |
| Histórico de peso | registros recentes de peso | perda ou reordenação indevida |
| Treinos | fichas, exercícios, séries, carga, reps, descanso, notas, mídia, arquivamento | perda de treino ou progresso |
| Dieta | refeições, alimentos, macros, dias, refeições concluídas | perda de refeições ou associação incorreta |
| Água | consumo diário e data | reset incorreto ou duplicidade |
| Sincronização | snapshot legado e tabelas relacionais | conflito, divergência ou escolha errada da fonte |
| Auth | sessão, recovery redirect, confirmação | bloqueio de acesso |
| PWA/cache | service worker e assets | app preso em versão antiga |
| Cronômetro de descanso | tempo atual, duração, início, pausa, conclusão | estado inconsistente entre telas/dispositivos |
| Jejum | janela de jejum, início, fim, histórico, status atual | perda de histórico ou conflito com resets diários |

## 7. Fases de execução

### Fase 0 — Baseline técnico e funcional

**Objetivo:** consolidar o entendimento do estado atual antes de qualquer mudança.

**Escopo:** documentar arquitetura, fluxos, persistência, dados, formatos legados, telas, hooks e serviços.

**Partes afetadas:** documentação e análise sobre `src/App.tsx`, `src/pages/`, `src/hooks/`, `src/lib/`, `src/services/`, `supabase/` e `tests/`.

**Dependências:** nenhuma.

**Riscos:** documentar comportamento desejado em vez do comportamento real.

**Critérios de conclusão:** arquitetura atual, fluxos e riscos documentados; nenhuma alteração funcional realizada.

### Fase 1 — Fortalecimento de testes de compatibilidade

**Objetivo:** proteger dados existentes antes de refatorações ou mudanças de UX/UI.

**Escopo:** ampliar testes para normalização, formatos legados, conversão relacional, fallback, reset diário, roteamento, autenticação, treino, dieta, água e peso.

**Partes afetadas:** `tests/`, `src/lib/appState.ts`, `src/lib/legacyState.ts`, `src/lib/relationalAppState.ts`, `src/lib/appUpdates.ts`, `src/lib/workoutSharing.ts`, `src/lib/appRouter.ts` e `src/lib/authRedirect.ts`.

**Dependências:** Fase 0.

**Riscos:** criar testes que fixem bugs acidentais sem revisão.

**Critérios de conclusão:** áreas sensíveis cobertas por testes antes de mudanças estruturais.

### Fase 2 — Auditoria de UX

**Objetivo:** revisar profundamente a experiência atual do usuário.

**Escopo:** auditar login, cadastro, recovery, onboarding, home, perfil, metas, treino, execução de treino, dieta, dieta do dia, água, peso e status de sincronização.

**Partes afetadas:** análise sobre todas as páginas, `src/App.tsx`, `useTutorial`, `useAppRouter` e componentes de navegação/status.

**Dependências:** Fase 0; pode ocorrer em paralelo com Fase 1.

**Riscos:** propor fluxos que simplifiquem demais e removam casos usados por usuários existentes.

**Critérios de conclusão:** jornada atual documentada, problemas de usabilidade classificados e oportunidades priorizadas.

### Fase 3 — Auditoria de UI e Design System

**Objetivo:** revisar consistência visual, padrões, tokens e componentes.

**Escopo:** inventariar `src/styles/app.css`, componentes reutilizáveis, uso do Carbon, temas claro/escuro, cards, botões, formulários, listas, mensagens, estados vazios e responsividade.

**Partes afetadas:** `src/styles/app.css`, `src/components/` e `src/pages/`.

**Dependências:** Fases 0 e 2.

**Riscos:** iniciar redesign antes de estabilizar padrões.

**Critérios de conclusão:** inventário visual concluído e inconsistências priorizadas.

### Fase 4 — Organização arquitetural sem alterar comportamento

**Objetivo:** reduzir acoplamento e facilitar manutenção.

**Escopo:** extrair responsabilidades de `src/App.tsx`, organizar handlers por domínio, decompor páginas grandes e consolidar componentes repetidos.

**Partes afetadas:** `src/App.tsx`, `src/hooks/`, `src/lib/`, `src/pages/` e `src/components/`.

**Dependências:** Fases 1, 2 e 3.

**Riscos:** alterar ordem de salvamento, efeitos, estados intermediários ou renderização.

**Critérios de conclusão:** código mais modular, testes passando e comportamento equivalente.

### Fase 5 — Revisão da sincronização e persistência

**Objetivo:** tornar carregamento, salvamento e resolução de conflitos mais seguros.

**Escopo:** revisar snapshot agregado, tabelas relacionais, fallback, timestamps, fila de saves, Realtime, falhas parciais e mensagens de sincronização.

**Partes afetadas:** `src/App.tsx`, `useRemoteAppState`, `appStateService`, `relationalAppStateService`, `relationalAppState`, `appState`, `legacyState` e `supabase/`.

**Dependências:** Fases 1 e 4.

**Riscos:** perda de dados, sobrescrita, divergência entre fontes ou bloqueio por RLS.

**Critérios de conclusão:** estratégia de sincronização documentada, testada e preservando compatibilidade.

### Fase 6 — Revisão de banco e migrações

**Objetivo:** preparar evolução de schema de forma segura.

**Escopo:** revisar schemas, migrations, RLS, Realtime, `updated_at`, soft delete, scripts de migração e dry-run.

**Partes afetadas:** `supabase/` e `scripts/`.

**Dependências:** Fases 1 e 5.

**Riscos:** migration destrutiva ou incompatível com ambientes existentes.

**Critérios de conclusão:** migrations futuras idempotentes, sem perda de dados e com validação documentada.

### Fase 7 — Revisão de onboarding e navegação

**Objetivo:** melhorar orientação inicial e fluxo entre áreas.

**Escopo:** revisar tutorial, tela inicial após login, rotas, navegação inferior, estados vazios e próximos passos.

**Partes afetadas:** `src/App.tsx`, `useTutorial`, `useAppRouter`, `appRouter`, `HomePage`, `NutritionGoalsPage` e `ContextualTutorialCard`.

**Dependências:** Fases 2 e 4.

**Riscos:** prejudicar recovery redirect, usuários existentes ou rotas em GitHub Pages.

**Critérios de conclusão:** navegação clara, tutorial reexecutável e rotas compatíveis.

### Fase 8 — Revisão da Home

**Objetivo:** transformar a Home em um painel diário mais claro.

**Escopo:** revisar treinos ativos, água, dieta do dia, metas, progresso, estados vazios e ações rápidas.

**Partes afetadas:** `HomePage`, componentes de métricas/cards e estilos relacionados.

**Dependências:** Fases 2, 3 e 4.

**Riscos:** ocultar ações frequentes ou confundir prioridades diárias.

**Critérios de conclusão:** Home orienta claramente o que fazer no dia sem alterar dados.

### Fase 9 — Revisão do fluxo de treino

**Objetivo:** melhorar cadastro, edição, gerenciamento e execução de treinos.

**Escopo:** revisar busca, montagem da ficha, séries, descanso, notas, mídia, arquivamento, remoção, importação/exportação e execução.

**Partes afetadas:** `WorkoutSetupPage`, `WorkoutPage`, `exercises`, `exerciseSearch`, `exerciseNames`, `workoutSets`, `workoutSharing`, `appUpdates` e tipos de treino.

**Dependências:** Fases 1, 2, 3 e 4.

**Riscos:** perder treinos, quebrar importação/exportação ou reset diário.

**Critérios de conclusão:** treino existente preservado, fluxo mais claro e comportamento compatível.

### Fase 10 — Cronômetro de descanso

**Objetivo:** adicionar, em fase futura, um cronômetro de descanso entre séries ou exercícios sem comprometer dados existentes.

**Escopo inicial:** especificar UX, regras, persistência e integração com execução de treino antes de implementar.

**Decisões necessárias antes da implementação:**

- O cronômetro será por série, por exercício ou ambos?
- A duração padrão virá de `restSeconds` existente no exercício?
- O cronômetro deve iniciar automaticamente ao marcar uma série como concluída?
- O usuário poderá pausar, reiniciar, pular ou ajustar o tempo?
- O estado do cronômetro deve persistir ao trocar de tela?
- O cronômetro deve sincronizar entre dispositivos ou ser apenas local?
- O cronômetro deve emitir som, vibração ou notificação?
- Como funcionará em PWA/offline?

**Partes afetadas prováveis:** `WorkoutPage`, `WorkoutSetupPage`, `appUpdates`, tipos de treino, possíveis hooks novos e estilos/componentes de timer.

**Dependências:** Fases 1, 4 e 9.

**Riscos:** criar estado temporal difícil de sincronizar, tocar áudio/notificação sem permissão, afetar execução do treino ou salvar dados transitórios desnecessários.

**Critérios de conclusão da fase de planejamento:** regras documentadas, UX definida, decisão de persistência tomada, testes planejados e compatibilidade com `restSeconds` atual preservada.

### Fase 11 — Revisão do fluxo de dieta

**Objetivo:** melhorar criação, edição e acompanhamento da dieta semanal.

**Escopo:** revisar busca de alimentos, porções, refeições, associação a dias, macros, progresso diário e estados vazios.

**Partes afetadas:** `DietSetupPage`, `DietDayPage`, `foods`, `food`, `nutrition`, `appUpdates` e tipos de dieta.

**Dependências:** Fases 1, 2, 3 e 4.

**Riscos:** perder refeições, quebrar associações de dias ou alterar cálculos sem intenção.

**Critérios de conclusão:** dieta existente preservada, cálculos compatíveis e fluxo mais claro.

### Fase 12 — Acompanhamento de jejum

**Objetivo:** adicionar, em fase futura, acompanhamento de jejum de forma compatível com dados atuais e com a rotina diária do aplicativo.

**Escopo inicial:** especificar conceito de jejum, modelo de dados, UX, histórico, relação com dieta e persistência antes de implementar.

**Decisões necessárias antes da implementação:**

- O jejum será apenas um timer atual ou terá histórico?
- O usuário poderá configurar protocolos, como 12:12, 14:10, 16:8, 18:6 ou personalizado?
- O jejum terá início e fim manuais?
- O app deve sugerir início/fim com base nas refeições cadastradas?
- O jejum se relaciona com a dieta do dia ou será independente?
- O histórico deve armazenar duração, data de início, data de fim e status?
- O jejum em andamento deve persistir entre dispositivos?
- Como tratar mudança de fuso, virada de dia e offline?
- Como apresentar alertas sem conflitar com notificações do sistema/PWA?

**Partes afetadas prováveis:** nova página ou seção na Home, tipos de estado, `App.tsx`, persistência remota, possíveis tabelas relacionais, normalização legada, componentes de timer, testes de datas e talvez PWA/notificações.

**Dependências:** Fases 1, 5, 6, 8 e 11.

**Riscos:** introduzir novo domínio persistido sem migração segura, conflito com reset diário, perda de histórico, comportamento incorreto em virada de dia/fuso ou dependência excessiva de notificações.

**Critérios de conclusão da fase de planejamento:** modelo de dados definido, compatibilidade com usuários existentes garantida, UX documentada, estratégia de persistência escolhida e testes planejados.

### Fase 13 — Revisão de perfil, metas e peso

**Objetivo:** melhorar clareza dos dados corporais e metas.

**Escopo:** revisar formulário de perfil, cálculo de idade, metas nutricionais, explicação de fórmulas, histórico de peso e remoção de registros.

**Partes afetadas:** `NutritionGoalsPage`, `CalculationInfoPage`, `nutrition`, `date`, `appUpdates` e tipos de perfil/peso.

**Dependências:** Fases 1, 2 e 3.

**Riscos:** alterar fórmulas sem decisão explícita ou afetar peso atual ao remover histórico.

**Critérios de conclusão:** metas compreensíveis e dados existentes preservados.

### Fase 14 — Revisão de autenticação

**Objetivo:** melhorar robustez e clareza dos fluxos de conta.

**Escopo:** revisar login, cadastro, confirmação, reenvio, recuperação, redefinição, logout, mensagens e redirects.

**Partes afetadas:** `LoginPage`, `authService`, `authErrors`, `authRedirect`, `useAuthSession` e `supabaseClient`.

**Dependências:** Fase 1.

**Riscos:** quebrar recovery redirect, confirmação de e-mail ou base path.

**Critérios de conclusão:** fluxos de conta claros, testados e compatíveis.

### Fase 15 — Revisão de PWA, cache e atualização

**Objetivo:** garantir que usuários recebam versões novas sem inconsistências de cache.

**Escopo:** revisar service worker, manifest, registro, cache de shell, fallback offline e base path.

**Partes afetadas:** `public/sw.js`, `public/manifest.webmanifest`, `src/main.tsx`, `index.html` e `vite.config.ts`.

**Dependências:** Fase 1.

**Riscos:** usuário ficar preso em versão antiga ou cache servir assets incompatíveis.

**Critérios de conclusão:** atualização previsível, offline básico funcional e cache seguro.

### Fase 16 — Redesign visual incremental

**Objetivo:** aplicar melhorias visuais após inventário e organização.

**Escopo:** revisar tipografia, espaçamento, hierarquia, cards, botões, formulários, listas, mensagens, estados vazios, tema claro, tema escuro e responsividade.

**Partes afetadas:** `src/styles/app.css`, `src/components/` e `src/pages/`.

**Dependências:** Fases 2, 3 e 4.

**Riscos:** reduzir contraste, quebrar responsividade ou alterar comportamento por acidente.

**Critérios de conclusão:** UI consistente, acessível e sem alteração indevida de regras.

### Fase 17 — Melhorias funcionais futuras

**Objetivo:** planejar novas funcionalidades depois da base estar estável.

**Escopo possível:** metas personalizadas, gráficos avançados, duplicação de treino, templates de dieta, exportação de dados, backup manual, preferências, notificações, integração com dispositivos e melhorias avançadas de acessibilidade.

**Partes afetadas:** a definir por funcionalidade.

**Dependências:** fases anteriores conforme o domínio envolvido.

**Riscos:** aumentar escopo antes de estabilizar arquitetura e dados.

**Critérios de conclusão:** cada funcionalidade tem plano próprio, testes e estratégia de compatibilidade.

## 8. Ordem recomendada

1. Fase 0 — Baseline técnico e funcional.
2. Fase 1 — Fortalecimento de testes de compatibilidade.
3. Fase 2 — Auditoria de UX.
4. Fase 3 — Auditoria de UI e Design System.
5. Fase 4 — Organização arquitetural sem alterar comportamento.
6. Fase 5 — Revisão da sincronização e persistência.
7. Fase 6 — Revisão de banco e migrações.
8. Fase 7 — Revisão de onboarding e navegação.
9. Fase 8 — Revisão da Home.
10. Fase 9 — Revisão do fluxo de treino.
11. Fase 10 — Cronômetro de descanso.
12. Fase 11 — Revisão do fluxo de dieta.
13. Fase 12 — Acompanhamento de jejum.
14. Fase 13 — Revisão de perfil, metas e peso.
15. Fase 14 — Revisão de autenticação.
16. Fase 15 — Revisão de PWA, cache e atualização.
17. Fase 16 — Redesign visual incremental.
18. Fase 17 — Melhorias funcionais futuras.

O cronômetro de descanso deve ser planejado depois da revisão do fluxo de treino, pois depende diretamente de como a execução de treino será organizada. O acompanhamento de jejum deve ser planejado depois da revisão da Home, da dieta e da persistência, pois pode criar novo domínio diário e histórico.

## 9. Regras para PRs futuros

Cada PR futuro deve seguir as regras abaixo:

1. Ter escopo pequeno e independente.
2. Não misturar refatoração, redesign, regra de negócio e migração de banco no mesmo PR.
3. Explicar impacto em dados existentes sempre que tocar persistência, normalização ou tipos.
4. Incluir testes proporcionais ao risco.
5. Manter compatibilidade com snapshot legado e modelo relacional.
6. Evitar remoção de código legado sem plano específico.
7. Documentar decisões de UX antes de implementar grandes mudanças.
8. Preservar os fluxos atuais enquanto usuários existentes dependem deles.
9. Tratar cronômetro de descanso e jejum como novos domínios que precisam de especificação, testes e decisão de persistência antes da implementação.

## 10. Critérios globais de sucesso

A evolução do FitTrack será considerada bem-sucedida quando:

- a arquitetura estiver mais modular;
- os fluxos principais estiverem mais claros;
- a UI estiver consistente;
- a UX reduzir esforço do usuário;
- a persistência estiver segura e bem documentada;
- dados existentes continuarem compatíveis;
- testes protegerem domínios críticos;
- novas funcionalidades forem adicionadas sem comprometer dados atuais;
- o app continuar utilizável por usuários existentes durante toda a transição.
