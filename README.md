# Agenda Pro

SaaS de agenda, CRM e financeiro inspirado no MinhaAgenda.

Repositório: https://github.com/puppe1990/agenda-pro

## Stack

- TanStack Start
- Drizzle + Turso
- Better Auth
- Tailwind CSS 4

## Desenvolvimento

```bash
cp .env.example .env
pnpm install
pnpm db:push
pnpm db:seed
pnpm dev
```

Portal demo (após seed): http://localhost:3000/book/studio-demo

## Qualidade

```bash
pnpm verify       # format, lint, audit, typecheck, test, build
pnpm verify:full  # verify + e2e
```

## Deploy (AWS Amplify + Turso)

1. Crie um banco no [Turso](https://turso.tech) e copie `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`.
2. No [Amplify Hosting](https://console.aws.amazon.com/amplify/), conecte o repositório Git e use o `amplify.yml` da raiz (build SSR com preset Nitro `aws_amplify`).
3. Em **Environment variables**, configure as variáveis de `.env.example` (incluindo `BETTER_AUTH_URL` com a URL do app Amplify, `CRON_SECRET` e `SENTRY_DSN`).
4. O `amplify.yml` roda `pnpm db:push` antes do build; alternativamente, aplique o schema localmente contra o Turso cloud antes do primeiro deploy.
5. Para lembretes diários, agende no [EventBridge Scheduler](https://docs.aws.amazon.com/scheduler/latest/UserGuide/schedule-types.html) um `GET` em `/api/cron/notifications` (ex.: `0 8 * * *`) com header `Authorization: Bearer <CRON_SECRET>`.

## Rotas principais

- `/` landing
- `/login`, `/signup`, `/onboarding`
- `/app/*` painel autenticado
- `/book/{slug}` agendamento online público
