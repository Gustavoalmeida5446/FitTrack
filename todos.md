# TODOs — Diagnóstico PWA (FitTrack)

## 1) Branch da feature
- [x] Branch criada: `feature/pwa-diagnostico`.

## 2) Diagnóstico técnico atual

### Stack e build
- [x] Projeto usa **React 18 + Vite 5 + TypeScript** (`@vitejs/plugin-react`, `vite`, `typescript`).
- [x] Build atual: `tsc -b && vite build`.
- [x] Deploy indica uso de **GitHub Pages** (script `deploy` + `scripts/deploy-gh-pages.sh`).
- [x] `base` no Vite está condicionado para produção como `/FitTrack/`.

### Itens de PWA já existentes
- [x] Existe `<link rel="manifest" href="./favicon/site.webmanifest" />` no `index.html`.
- [x] Existe arquivo de manifest em `favicon/site.webmanifest`.
- [x] Existem ícones para Android/Apple/Favicon em `favicon/`.

### Gaps para PWA funcional (instalável + offline)
- [ ] **Manifest incompleto**: `name` e `short_name` estão vazios.
- [ ] **URLs de ícones no manifest podem quebrar** em produção com `base=/FitTrack/` (atualmente com caminhos absolutos tipo `/android-chrome-192x192.png`, mas os arquivos estão em `/favicon/`).
- [ ] **Sem Service Worker registrado** em `src/main.tsx`.
- [ ] **Sem estratégia de cache/offline** (app shell/runtime) definida.
- [ ] Ausência de metadados PWA adicionais desejáveis (`theme-color`, descrição, etc.).

## 3) Plano de implementação proposto
- [ ] Padronizar `manifest.webmanifest` (nome, short_name, start_url, scope, colors, display, icons corretos para o contexto de build).
- [ ] Definir estratégia de SW (preferência: plugin oficial/ecossistema Vite para reduzir manutenção manual).
- [ ] Registrar SW com fluxo de atualização controlado.
- [ ] Ajustar caminhos/asset handling considerando `base=/FitTrack/`.
- [ ] Validar com build local + teste de instalabilidade/offline + Lighthouse PWA.
- [ ] Documentar no README como testar comportamento PWA.

## 4) Riscos mapeados
- [ ] Erros de caminho de assets por conta do `base` em produção (GitHub Pages).
- [ ] Cache agressivo causando conteúdo stale sem estratégia de update.
- [ ] Diferenças entre dev/prod no comportamento do SW.
