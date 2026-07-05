# FitTrack

FitTrack é um app de acompanhamento fitness feito com React, Vite, TypeScript, Carbon Design System e Supabase. Ele ajuda o usuário a registrar treinos, montar uma dieta semanal, acompanhar água, peso corporal e metas nutricionais.

## Funcionalidades principais

- Autenticação por e-mail com Supabase e confirmação de cadastro.
- Cadastro de perfil com peso, altura, data de nascimento, sexo, atividade, objetivo e tipo de dieta.
- Cálculo de metas diárias de calorias, macronutrientes e água.
- Cadastro de treinos com exercícios, séries, repetições, carga, descanso, observações e mídia quando disponível.
- Cadastro de dieta por refeições, alimentos e dias da semana.
- Acompanhamento diário de treino, dieta e consumo de água.
- Histórico recente de peso.
- Sincronização remota via Supabase para usuários autenticados.
- PWA básico com manifest e service worker.
- Deploy automático no GitHub Pages após merge/push em `main` ou `master`.

## Como as metas são calculadas

As metas são estimativas para acompanhamento diário e não substituem orientação profissional.

### TMB / BMR

O app usa a equação de Mifflin-St Jeor:

- Homem: `10 × peso(kg) + 6,25 × altura(cm) - 5 × idade + 5`
- Mulher: `10 × peso(kg) + 6,25 × altura(cm) - 5 × idade - 161`

Quando a data de nascimento está disponível, a idade é recalculada a partir dela para evitar usar uma idade salva desatualizada.

### Gasto diário / TDEE

`TDEE = TMB × fator de atividade`

Fatores usados:

- Sedentário: `1,2`
- Leve: `1,375`
- Moderado: `1,55`
- Intenso: `1,725`
- Atleta: `1,9`

### Calorias

`calorias diárias = TDEE + ajuste do objetivo`

Ajustes usados:

- Perda de gordura: `-350 kcal`
- Manutenção: `0 kcal`
- Ganho de massa: `+250 kcal`

O app não exibe meta calórica abaixo de `1200 kcal`.

### Macronutrientes

Proteína é calculada por peso e tipo de dieta:

- Equilibrada: `1,8 g/kg`
- Baixo carboidrato: `2,0 g/kg`
- Alta em carboidrato: `1,7 g/kg`

A distribuição considera:

- Proteína: `4 kcal/g`
- Carboidrato: `4 kcal/g`
- Gordura: `9 kcal/g`

Na dieta baixa em carboidrato, carboidratos ficam em `1,5 g/kg` e gorduras completam as calorias restantes. Nas demais dietas, gordura é definida por peso e carboidratos completam o restante das calorias.

### Água

A meta diária de água é estimada por:

`35 ml × peso(kg)`

## Desenvolvimento

```bash
npm install
cp .env.example .env
npm run dev
```

Use apenas variáveis públicas esperadas pelo Vite/Supabase no arquivo `.env`. Não versione chaves privadas, tokens pessoais ou segredos de produção.

## Scripts

```bash
npm test
npm run build
npm run preview
npm run deploy
```

- `npm test`: executa typecheck dos testes e a suíte automatizada.
- `npm run build`: gera build de produção.
- `npm run preview`: pré-visualiza o build localmente.
- `npm run deploy`: deploy manual para `gh-pages`, quando necessário.

## Supabase

A persistência remota depende do schema em `supabase/schema.sql`. Configure as variáveis públicas do projeto conforme `.env.example`.

## GitHub Pages

O workflow de Pages:

- Em pull requests: instala dependências, executa testes e gera build.
- Em push/merge para `main` ou `master`: valida o projeto e publica automaticamente no GitHub Pages.
- Também pode ser executado manualmente pela aba Actions.

## PWA

O app inclui manifest, service worker e registro do service worker. Para testar localmente:

```bash
npm run build
npm run preview
```

Depois abra no navegador, recarregue uma vez e teste instalação/offline básico com arquivos já em cache.
