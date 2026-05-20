# Regras de Manutencao

## Fluxo de Trabalho

- Sempre trabalhar em branch.
- Nunca alterar partes nao relacionadas ao objetivo da tarefa.
- Fazer mudancas pequenas, revisaveis e com escopo claro.
- Antes de commit, rodar pelo menos:

```bash
npm test
npm run build
```

- Documentar mudancas importantes em `CHANGELOG.md` ou nos arquivos de `docs/` quando afetarem manutencao.

## Preservacao de Comportamento

- Preservar o comportamento atual do app, principalmente em persistencia remota.
- Nao remover `user_app_states` enquanto ele for usado por `src/services/appStateService.ts`.
- Nao remover normalizacao legado em `src/lib/legacyState.ts` sem plano de migracao e validacao de dados reais.
- Nao alterar schema Supabase diretamente sem backup e plano de rollback.
- Evitar refactors grandes sem necessidade.

## Dados e Banco

- Tratar `user_app_states` como fonte de compatibilidade legado.
- Tratar tabelas relacionais como modelo novo em uso pelo app.
- Ao mexer em sincronizacao, revisar `src/hooks/useRemoteAppState.ts`, `src/services/appStateService.ts` e `src/services/relationalAppStateService.ts` juntos.
- Se alterar tabelas relacionais, revisar tambem `supabase/realtime-publication.sql`.
- Documentar qualquer risco de divergencia entre snapshot agregado e tabelas relacionais.

## Codigo

- Manter tipagem forte nos tipos de `src/data/types.ts`.
- Usar validadores de `src/lib/validation.ts` para payloads persistidos e formularios.
- Preferir funcoes puras em `src/lib/` para regras de negocio.
- Evitar duplicacao entre pages; extrair somente quando houver repeticao real.
- Manter codigo simples e legivel.
- Nao introduzir dependencias sem necessidade clara.

## UI

- Nao mudar UI em tarefas de manutencao tecnica sem pedido explicito.
- Preservar componentes Carbon e padroes existentes.
- Validar que textos e estados de erro continuem coerentes em telas autenticadas e nao autenticadas.

## Testes

- Adicionar ou atualizar testes quando mudar:
  - normalizacao de estado;
  - conversao relacional;
  - calculo nutricional;
  - validacao;
  - roteamento;
  - busca de exercicios/alimentos.
- Testes existentes ficam em `tests/` e rodam via `npm test`.

## Deploy

- Validar `npm run build` antes de publicar.
- Usar `npm run deploy` para GitHub Pages.
- Lembrar que producao usa base `/FitTrack/`.
- Ao alterar PWA, atualizar cache name em `public/sw.js` quando for necessario invalidar cache antigo.
