# FitTrack

App de fitness em React + Vite + TypeScript com componentes Carbon e cliente Supabase preparado.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Deploy GitHub Pages

O deploy de produção roda automaticamente no GitHub Actions quando há push/merge na branch `main` ou `master`. O workflow executa:

- `npm ci`
- `npm test`
- `npm run build`
- publicação do conteúdo de `dist/` no GitHub Pages

Também é possível disparar o workflow manualmente pela aba Actions (`workflow_dispatch`).

Para publicar manualmente pelo computador local, ainda existe:

```bash
npm run deploy
```

O script local:

- gera o build em `dist/`
- copia `dist/index.html` para `dist/404.html`
- publica o conteúdo em `origin/gh-pages`

## Estado atual

- Cadastro de treinos com múltiplos exercícios
- Cadastro de dieta por dia, refeição e quantidade em gramas com base local TACO
- Reset diário do consumo de água
- Metas nutricionais calculadas a partir do perfil
- Persistência local com sincronização remota via Supabase para usuários autenticados
- Busca de exercícios via WGER
- Busca de alimentos via base local TACO em `src/data/taco-foods.json`

## Variáveis de ambiente

Use os valores de `.env.example`:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Supabase

Antes de usar a persistência remota, execute o schema em `supabase/schema.sql`.

## Observações

- O projeto não usa Tailwind na UI atual.
- O script `deploy` publica em `gh-pages`.


## PWA

O app agora possui configuração básica de PWA:

- Manifest (`favicon/site.webmanifest`)
- Service Worker (`public/sw.js`)
- Registro do Service Worker (`src/main.tsx`)

### Como testar

```bash
npm run build
npm run preview
```

Depois abra o app no navegador, recarregue uma vez e teste:

- instalação do app (opção "Instalar")
- funcionamento básico offline (com arquivos já visitados em cache)
