# Deploy e PWA

## Setup Local

Requisitos praticos:

- Node.js compatível com Vite 5.
- Dependencias instaladas via `npm install`.
- Arquivo `.env` baseado em `.env.example`.

Comandos:

```bash
npm install
cp .env.example .env
npm run dev
```

`npm run dev` inicia Vite em modo desenvolvimento. `npm start` roda `vite --host`.

## Variaveis de Ambiente

`.env.example` define:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_ANON_KEY=
VITE_WGER_USERNAME=
VITE_WGER_PASSWORD=
VITE_EXERCISEDB_KEY=
VITE_USDA_API_KEY=
```

O codigo atual usa Supabase em `src/lib/supabaseClient.ts`.

Variaveis realmente lidas pelo cliente Supabase:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_ANON_KEY`

As variaveis WGER, ExerciseDB e USDA aparecem no exemplo, mas a busca atual usa `exercises.json`, `src/data/exercise-name-pt.json` e `src/data/taco-foods.json`.

## Scripts npm

Definidos em `package.json`:

- `npm run dev`: servidor Vite local.
- `npm start`: servidor Vite local com `--host`.
- `npm run build`: `tsc -b` e `vite build`.
- `npm test`: compila testes para `.test-dist` e roda `node --test`.
- `npm run preview`: preview do build.
- `npm run convert:taco`: converte CSV TACO para `src/data/taco-foods.json`.
- `npm run deploy`: build e deploy para GitHub Pages.

## Build

```bash
npm run build
```

O Vite usa `vite.config.ts`.

Em producao:

- `base` vira `/FitTrack/`.
- chunks de Supabase e Zod podem ser separados via `manualChunks`.
- saida vai para `dist/`.

## Deploy GitHub Pages

```bash
npm run deploy
```

O script `scripts/deploy-gh-pages.sh`:

1. executa depois do build;
2. copia `dist/index.html` para `dist/404.html`;
3. cria `dist/.nojekyll`;
4. cria um diretorio temporario;
5. inicializa um git novo no temporario;
6. copia o conteudo de `dist`;
7. faz commit `Deploy GitHub Pages`;
8. publica com `git push --force origin gh-pages`.

O `404.html` permite que rotas internas como `/FitTrack/treinos/:id` funcionem no GitHub Pages.

## Como Publicar Nova Versao

1. Trabalhar em branch.
2. Fazer alteracoes pequenas e revisaveis.
3. Rodar testes:

```bash
npm test
```

4. Validar build:

```bash
npm run build
```

5. Publicar:

```bash
npm run deploy
```

## PWA

Arquivos principais:

- `index.html`: metatags mobile/PWA e link para `./manifest.webmanifest`.
- `public/manifest.webmanifest`: nome, icones, `display: standalone`, `orientation: portrait`, cores e escopo.
- `public/sw.js`: service worker.
- `src/main.tsx`: registra o service worker apenas em producao.

O service worker usa cache `fittrack-v5`.

No install:

- pre-cacheia `./index.html`, manifesto e icones.

No activate:

- remove caches com nome diferente.

No fetch:

- navegacoes tentam rede primeiro e caem para `./index.html` em cache;
- assets `GET` same-origin sao cacheados em runtime;
- requests externas nao sao cacheadas pelo service worker.

Para testar PWA localmente:

```bash
npm run build
npm run preview
```

Depois abrir o preview, recarregar uma vez e verificar instalacao/offline basico.

## Observacoes

- `README.md` menciona `favicon/site.webmanifest`, mas o arquivo real usado pelo app e `public/manifest.webmanifest`.
- `dist/`, `.test-dist/` e arquivos `*.tsbuildinfo` sao artefatos locais e nao fazem parte da documentacao funcional do app.
