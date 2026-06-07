# Gestão Bem

SaaS de gestão para salões, clínicas e estúdios de beleza e bem-estar. Monorepo com o painel operacional e a landing page de marketing.

Repositório: https://github.com/puppe1990/agenda-pro

## Funcionalidades

**App** (`apps/app`)

- Agenda com visão diária/semanal, reagendamento e controle de faltas
- CRM de clientes com histórico, notas e busca
- Serviços, equipe e disponibilidade
- Financeiro (receitas, despesas, comissões, recibos em PDF)
- Portal público de agendamento (`/book/{slug}`)
- WhatsApp (templates e fila de notificações)
- Anamnese clínica
- Relatórios e dashboard
- Multi-tenant por organização com Better Auth

**Landing** (`apps/landing`)

- Página de marketing com CTAs para signup/login
- Blog em MDX (`content/blog/`)
- Botão flutuante de WhatsApp

## Estrutura

```
apps/
  app/                    # TanStack Start — painel, auth, portal /book
    src/
      routes/             # rotas file-based (TanStack Router)
      server/
        db/schema/        # Drizzle (auth, orgs, scheduling, finance, clinical…)
        fns/              # server functions (createServerFn)
        services/         # regras de negócio
      components/         # UI do painel
      lib/                # utilitários (auth-client, money, env…)
    tests/                # unit, integration e e2e (Playwright)
  landing/                # TanStack Start — marketing + blog
    content/blog/         # posts MDX
    src/lib/landing-content.ts  # copy e URLs (testada em unit tests)
packages/
  theme/                  # tokens CSS compartilhados (rose/lagoon)
```

## Stack

| Camada          | Tecnologia                                          |
| --------------- | --------------------------------------------------- |
| Framework       | TanStack Start + React 19 + TanStack Router         |
| Banco           | Drizzle ORM + Turso (libSQL)                        |
| Auth            | Better Auth + adapter Drizzle                       |
| Estilo          | Tailwind CSS 4 + `@agenda-pro/theme`                |
| Validação       | Zod                                                 |
| Testes          | Vitest + Playwright                                 |
| Qualidade       | ESLint + Prettier + Husky + lint-staged             |
| Deploy app      | AWS Amplify Hosting (`amplify.yml`, `apps/app`)     |
| Deploy landing  | AWS Amplify Hosting (`amplify.yml`, `apps/landing`) |
| Observabilidade | Sentry (opcional)                                   |

## Pré-requisitos

- Node.js 22
- pnpm 11.5.1 (`corepack enable`)

## Desenvolvimento

```bash
cp apps/app/.env.example apps/app/.env
cp apps/landing/.env.example apps/landing/.env
pnpm install
pnpm db:push
pnpm db:seed
pnpm dev:app       # http://localhost:3000
pnpm dev:landing   # http://localhost:3001
```

Após o seed, o portal público de demonstração fica em:

http://localhost:3000/book/studio-demo

### Variáveis de ambiente

**App** (`apps/app/.env`)

| Variável             | Descrição                                    |
| -------------------- | -------------------------------------------- |
| `TURSO_DATABASE_URL` | URL do banco (local: `file:local.db`)        |
| `TURSO_AUTH_TOKEN`   | Token Turso (obrigatório em produção)        |
| `BETTER_AUTH_SECRET` | Segredo da sessão (longo e aleatório)        |
| `BETTER_AUTH_URL`    | URL pública do app (ex.: URL do Amplify)     |
| `CRON_SECRET`        | Proteção do endpoint de cron de notificações |
| `SENTRY_DSN`         | DSN do Sentry (opcional)                     |
| `SMTP_*`             | E-mail transacional (opcional)               |

**Landing** (`apps/landing/.env`)

| Variável              | Descrição                                   |
| --------------------- | ------------------------------------------- |
| `VITE_APP_URL`        | URL base do app para CTAs (signup, login)   |
| `VITE_WHATSAPP_PHONE` | Telefone do botão WhatsApp (apenas dígitos) |

## Scripts

| Comando                                      | Descrição                                  |
| -------------------------------------------- | ------------------------------------------ |
| `pnpm dev:app`                               | Dev server do painel (porta 3000)          |
| `pnpm dev:landing`                           | Dev server da landing (porta 3001)         |
| `pnpm db:push`                               | Aplica schema Drizzle no banco             |
| `pnpm db:seed`                               | Cria organização demo (`studio-demo`)      |
| `pnpm db:generate`                           | Gera migrations Drizzle                    |
| `pnpm verify`                                | format + lint + verify em todos os pacotes |
| `pnpm verify:full`                           | verify + e2e do app                        |
| `pnpm test:e2e`                              | E2E do app                                 |
| `pnpm --filter @agenda-pro/landing test:e2e` | E2E da landing                             |

## Qualidade e CI

```bash
pnpm verify       # format, lint, typecheck, test e build
pnpm verify:full  # verify + e2e do app
```

O workflow em `.github/workflows/ci.yml` roda em push/PR:

1. **quality** — format, lint, typecheck, test, build
2. **e2e-app** — build + Playwright do app
3. **e2e-landing** — build + Playwright da landing

A landing mantém TDD em `apps/landing/tests/unit/` para conteúdo, CTAs e URLs.

## Rotas

**App**

| Rota                      | Descrição                                         |
| ------------------------- | ------------------------------------------------- |
| `/login`, `/signup`       | Autenticação                                      |
| `/onboarding`             | Configuração inicial da organização               |
| `/app/*`                  | Painel autenticado (dashboard, agenda, clientes…) |
| `/book/{slug}`            | Agendamento online público                        |
| `/api/auth/*`             | Handlers Better Auth                              |
| `/api/cron/notifications` | Job de notificações (protegido por `CRON_SECRET`) |

**Landing**

| Rota           | Descrição             |
| -------------- | --------------------- |
| `/`            | Página de marketing   |
| `/blog`        | Listagem de posts     |
| `/blog/{slug}` | Post individual (MDX) |

## Deploy (AWS Amplify + Turso)

1. Crie um banco no [Turso](https://turso.tech) e copie `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`.
2. No [Amplify Hosting](https://console.aws.amazon.com/amplify/), conecte o repositório e use o `amplify.yml` da raiz.
3. Configure as variáveis de `apps/app/.env.example` (incluindo `BETTER_AUTH_URL` com a URL pública do app).
4. O build executa `db:push` antes do `build` para sincronizar o schema.
5. Artefatos saem de `apps/app/.amplify-hosting`.
6. A landing usa um app Amplify separado (`AMPLIFY_MONOREPO_APP_ROOT=apps/landing`) com `VITE_APP_URL`, `VITE_LANDING_URL` e `VITE_WHATSAPP_PHONE`.
7. Deploy manual da landing via AWS CLI:

```bash
chmod +x scripts/deploy-landing-amplify.sh
AMPLIFY_LANDING_APP_ID=<app-id> ./scripts/deploy-landing-amplify.sh
```

## Convenções

- Imports internos usam o alias `#/*` (mapeado em `package.json` de cada app).
- Lógica de servidor fica em `server/fns/` (`createServerFn`) e `server/services/`.
- Rotas protegidas usam `beforeLoad` com `getSessionFn()` no layout `/app`.
- Contexto multi-tenant via `requireTenantContext()` em server functions.
- Valores monetários em centavos (`lib/money.ts`).
- Tema compartilhado: importar `@agenda-pro/theme/styles.css` nos apps.

Para orientações detalhadas a agentes de IA, veja [AGENTS.md](./AGENTS.md).
