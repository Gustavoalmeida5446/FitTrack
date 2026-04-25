# FitTrack

App de fitness em React + Vite + TypeScript com componentes Carbon e cliente Supabase preparado.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Deploy GitHub Pages

```bash
npm run deploy
```

O script:

- gera o build em `dist/`
- copia `dist/index.html` para `dist/404.html`
- publica o conteúdo em `origin/gh-pages`

## Estado atual

- UI local com dados mockados para treino, hidratação, dieta semanal e metas nutricionais
- Persistência local em `localStorage` para manter o estado entre recargas
- Busca de exercícios via WGER
- Busca de alimentos via USDA FoodData Central com fallback local
- Cliente Supabase configurado em `src/lib/supabaseClient.ts`

## Variáveis de ambiente

Use os valores de `.env.example`:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_USDA_API_KEY=
```

## Observações

- O projeto não usa Tailwind na UI atual.
- Não existe script `deploy` no `package.json` neste momento.
- A persistência remota no Supabase ainda não está conectada às telas.
