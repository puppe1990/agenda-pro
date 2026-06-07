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

## Deploy (Vercel + Turso)

1. Crie um banco no [Turso](https://turso.tech) e copie `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`.
2. No projeto Vercel, configure as variáveis de `.env.example` (incluindo `CRON_SECRET` e `SENTRY_DSN`).
3. O `vercel.json` agenda o cron diário em `/api/cron/notifications`.
4. Rode `pnpm db:push` localmente contra o Turso cloud antes do primeiro deploy, ou deixe o `buildCommand` aplicar o schema.

## Rotas principais

- `/` landing
- `/login`, `/signup`, `/onboarding`
- `/app/*` painel autenticado
- `/book/{slug}` agendamento online público
