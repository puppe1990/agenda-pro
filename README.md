# Agenda Pro

SaaS de agenda, CRM e financeiro inspirado no MinhaAgenda.

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
pnpm dev
```

## Qualidade

```bash
pnpm verify       # format, lint, audit, typecheck, test, build
pnpm verify:full  # verify + e2e
```

## Rotas principais

- `/` landing
- `/login`, `/signup`, `/onboarding`
- `/app/*` painel autenticado
- `/book/{slug}` agendamento online público
