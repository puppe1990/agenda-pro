# Agenda Pro Design Spec

SaaS multi-tenant para agenda, CRM, financeiro, WhatsApp (deep links), portal público, equipe, anamnese e relatórios.

## Stack

- TanStack Start + React 19
- Drizzle ORM + Turso (libSQL)
- Better Auth
- Vitest + Playwright
- ESLint + Prettier + Husky

## Módulos entregues

1. Agenda e agendamentos
2. Clientes (CRM)
3. Serviços
4. Portal `/book/{slug}`
5. WhatsApp (templates + fila + wa.me)
6. Financeiro (receitas, despesas, caixa, metas)
7. Equipe e comissões
8. Anamnese
9. Relatórios + CSV + gráficos
10. PWA manifest + service worker
11. LGPD básico em configurações

## Quality gates

- `pnpm verify` no CI
- pre-commit: lint-staged + test + audit quando lock muda
- e2e smoke na Fase 0; fluxos adicionais em `tests/e2e/agenda.spec.ts`
