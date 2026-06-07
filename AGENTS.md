# AGENTS.md

Guia para agentes de IA trabalhando neste repositório.

## Visão geral

**Agenda Bem** é um SaaS multi-tenant para salões, clínicas e estúdios. O monorepo contém:

- **`apps/app`** — painel operacional, autenticação, portal público `/book/{slug}`
- **`apps/landing`** — marketing, blog MDX e CTAs para o app
- **`packages/theme`** — tokens CSS compartilhados (paleta rose/lagoon)

Stack principal: TanStack Start, React 19, TanStack Router, Drizzle + Turso, Better Auth, Tailwind 4, Zod.

## Estrutura e onde editar

| Tarefa                      | Onde olhar                                 |
| --------------------------- | ------------------------------------------ |
| Nova rota do painel         | `apps/app/src/routes/app/`                 |
| Rotas públicas (auth, book) | `apps/app/src/routes/`                     |
| Server functions            | `apps/app/src/server/fns/`                 |
| Regras de negócio           | `apps/app/src/server/services/`            |
| Schema / migrations         | `apps/app/src/server/db/schema/`           |
| Componentes UI do painel    | `apps/app/src/components/`                 |
| Auth (servidor)             | `apps/app/src/server/auth.ts`              |
| Auth (cliente)              | `apps/app/src/lib/auth-client.ts`          |
| Tenant / roles              | `apps/app/src/server/middleware/tenant.ts` |
| Landing copy e CTAs         | `apps/landing/src/lib/landing-content.ts`  |
| Posts do blog               | `apps/landing/content/blog/*.mdx`          |
| Tema compartilhado          | `packages/theme/styles.css`                |

## Convenções de código

### Imports e paths

- Use `#/*` para imports internos (ex.: `#/server/fns/app`, `#/components/PageHeader`).
- Não introduza novos aliases sem necessidade; siga o padrão existente em cada `package.json`.

### Rotas (TanStack Router)

- Rotas file-based em `src/routes/`; o plugin gera `routeTree.gen.ts` — **não edite** esse arquivo manualmente.
- Layout autenticado: `apps/app/src/routes/app/route.tsx` redireciona para `/login` se não houver sessão.
- Loaders buscam dados via server functions; prefira `Route.useLoaderData()` no componente.
- Portal público: `apps/app/src/routes/book/$orgSlug.tsx` (sem auth).

### Server functions

- Crie funções com `createServerFn` em `server/fns/`.
- Valide entrada com Zod no handler (`data` tipado).
- Operações do painel devem passar por `requireTenantContext()` e, quando aplicável, `assertRole()`.
- Agendamento público usa rate limit (`assertPublicBookingRateLimit`).

### Banco de dados

- Schema modular em `server/db/schema/` (auth, organizations, scheduling, finance, clinical, notifications).
- Cliente: `server/db/client.ts`.
- Local: `TURSO_DATABASE_URL=file:local.db`. Produção: Turso remoto com `TURSO_AUTH_TOKEN`.
- Seed demo: `pnpm db:seed` → slug `studio-demo`, URL `/book/studio-demo`.

### Dinheiro e datas

- Valores financeiros em **centavos** (`formatCents`, `lib/money.ts`).
- Datas com `date-fns` e `date-fns-tz` quando houver fuso.

### Landing

- Copy centralizada em `landing-content.ts`; alterações de texto/URL devem manter testes em `apps/landing/tests/unit/`.
- `getAppUrl()` monta links para signup/login a partir de `VITE_APP_URL`.
- Blog: frontmatter MDX + rotas em `src/routes/blog/`.

### Estilo

- Tailwind 4 com variáveis CSS do tema (`--sea-ink`, `--lagoon-deep`, etc.).
- Reutilize classes utilitárias existentes (`btn-primary`, `app-nav-link`, `page-wrap`).
- Importe `@agenda-pro/theme/styles.css` no root de cada app.

## Testes

| Tipo        | App                           | Landing                    |
| ----------- | ----------------------------- | -------------------------- |
| Unit        | `apps/app/tests/unit/`        | `apps/landing/tests/unit/` |
| Integration | `apps/app/tests/integration/` | —                          |
| E2E         | `apps/app/tests/e2e/`         | `apps/landing/tests/e2e/`  |

Antes de concluir mudanças significativas:

```bash
pnpm verify                    # todos os pacotes
pnpm --filter @agenda-pro/app verify:full   # app + e2e
```

CI (`.github/workflows/ci.yml`) espelha esses passos em três jobs.

## Comandos úteis

```bash
pnpm install
pnpm dev:app          # :3000
pnpm dev:landing      # :3001
pnpm db:push
pnpm db:seed
pnpm verify
```

Node **22** e pnpm **11.5.1** (ver `packageManager` na raiz).

## Deploy

- App: AWS Amplify via `amplify.yml` (build em `apps/app`, artefatos em `.amplify-hosting`).
- Build de produção roda `db:push` antes do `vite build`.
- `BETTER_AUTH_URL` deve ser a URL pública final do app.
- Landing: deploy separado; configure `VITE_APP_URL` para o domínio do app.

## O que evitar

- Não commitar `.env`, `*.db`, `.amplify-hosting`, `test-results` ou `playwright-report`.
- Não editar `routeTree.gen.ts` manualmente.
- Não misturar lógica de negócio pesada em componentes de rota — extraia para `server/services/`.
- Não quebrar isolamento multi-tenant; sempre use o contexto da organização nas queries.
- Não alterar copy da landing sem atualizar testes unitários correspondentes.
- Escopo mínimo: evite refatorações amplas não solicitadas.

## Módulos do painel

Navegação em `AppShell.tsx`:

Dashboard, Agenda, Clientes, Serviços, Financeiro, Equipe, WhatsApp, Anamnese, Relatórios, Configurações.

Features transversais: notificações (cron + fila), LGPD (export/delete de dados do cliente), recibos PDF, PWA.

---

<!-- intent-skills:start -->

# Skill mappings - load `use` with `pnpm dlx @tanstack/intent@latest load <use>`.

skills:

- when: "Install TanStack Devtools, pick framework adapter (React/Vue/Solid/Preact), register plugins via plugins prop, configure shell (position, hotkeys, theme, hideUntilHover, requireUrlFlag, eventBusConfig). TanStackDevtools component, defaultOpen, localStorage persistence."
  use: "@tanstack/devtools#devtools-app-setup"
- when: "Publish plugin to npm and submit to TanStack Devtools Marketplace. PluginMetadata registry format, plugin-registry.ts, pluginImport (importName, type), requires (packageName, minVersion), framework tagging, multi-framework submissions, featured plugins."
  use: "@tanstack/devtools#devtools-marketplace"
- when: "Build devtools panel components that display emitted event data. Listen via EventClient.on(), handle theme (light/dark), use @tanstack/devtools-ui components. Plugin registration (name, render, id, defaultOpen), lifecycle (mount, activate, destroy), max 3 active plugins. Two paths: Solid.js core with devtools-ui for multi-framework support, or framework-specific panels."
  use: "@tanstack/devtools#devtools-plugin-panel"
- when: "Handle devtools in production vs development. removeDevtoolsOnBuild, devDependency vs regular dependency, conditional imports, NoOp plugin variants for tree-shaking, non-Vite production exclusion patterns."
  use: "@tanstack/devtools#devtools-production"
- when: "Two-way event patterns between devtools panel and application. App-to-devtools observation, devtools-to-app commands, time-travel debugging with snapshots and revert. structuredClone for snapshot safety, distinct event suffixes for observation vs commands, serializable payloads only."
  use: "@tanstack/devtools-event-client#devtools-bidirectional"
- when: "Create typed EventClient for a library. Define event maps with typed payloads, pluginId auto-prepend namespacing, emit()/on()/onAll()/onAllPluginEvents() API. Connection lifecycle (5 retries, 300ms), event queuing, enabled/disabled state, SSR fallbacks, singleton pattern. Unique pluginId requirement to avoid event collisions."
  use: "@tanstack/devtools-event-client#devtools-event-client"
- when: "Analyze library codebase for critical architecture and debugging points, add strategic event emissions. Identify middleware boundaries, state transitions, lifecycle hooks. Consolidate events (1 not 15), debounce high-frequency updates, DRY shared payload fields, guard emit() for production. Transparent server/client event bridging."
  use: "@tanstack/devtools-event-client#devtools-instrumentation"
- when: "Configure @tanstack/devtools-vite for source inspection (data-tsd-source, inspectHotkey, ignore patterns), console piping (client-to-server, server-to-client, levels), enhanced logging, server event bus (port, host, HTTPS), production stripping (removeDevtoolsOnBuild), editor integration (launch-editor, custom editor.open). Must be FIRST plugin in Vite config. Vite ^6 || ^7 only."
  use: "@tanstack/devtools-vite#devtools-vite-plugin"
- when: "Step-by-step migration from Next.js App Router to TanStack Start: route definition conversion, API mapping, server function conversion from Server Actions, middleware conversion, data fetching pattern changes."
  use: "@tanstack/react-start#lifecycle/migrate-from-nextjs"
- when: "React bindings for TanStack Start: createStart, StartClient, StartServer, React-specific imports, re-exports from @tanstack/react-router, full project setup with React, useServerFn hook."
  use: "@tanstack/react-start#react-start"
- when: "Implement, review, debug, and refactor TanStack Start React Server Components in React 19 apps. Use when tasks mention @tanstack/react-start/rsc, renderServerComponent, createCompositeComponent, CompositeComponent, renderToReadableStream, createFromReadableStream, createFromFetch, Composite Components, React Flight streams, loader or query owned RSC caching, router.invalidate, structuralSharing: false, selective SSR, stale names like renderRsc or .validator, or migration from Next App Router RSC patterns. Do not use for generic SSR or non-TanStack RSC frameworks except brief comparison."
  use: "@tanstack/react-start#react-start/server-components"
- when: "Framework-agnostic core concepts for TanStack Router: route trees, createRouter, createRoute, createRootRoute, createRootRouteWithContext, addChildren, Register type declaration, route matching, route sorting, file naming conventions. Entry point for all router skills."
  use: "@tanstack/router-core#router-core"
- when: "Route protection with beforeLoad, redirect()/throw redirect(), isRedirect helper, authenticated layout routes (\_authenticated), non-redirect auth (inline login), RBAC with roles and permissions, auth provider integration (Auth0, Clerk, Supabase), router context for auth state."
  use: "@tanstack/router-core#router-core/auth-and-guards"
- when: "Automatic code splitting (autoCodeSplitting), .lazy.tsx convention, createLazyFileRoute, createLazyRoute, lazyRouteComponent, getRouteApi for typed hooks in split files, codeSplitGroupings per-route override, splitBehavior programmatic config, critical vs non-critical properties."
  use: "@tanstack/router-core#router-core/code-splitting"
- when: "Route loader option, loaderDeps for cache keys, staleTime/gcTime/ defaultPreloadStaleTime SWR caching, pendingComponent/pendingMs/ pendingMinMs, errorComponent/onError/onCatch, beforeLoad, router context and createRootRouteWithContext DI pattern, router.invalidate, Await component, deferred data loading with unawaited promises."
  use: "@tanstack/router-core#router-core/data-loading"
- when: "Link component, useNavigate, Navigate component, router.navigate, ToOptions/NavigateOptions/LinkOptions, from/to relative navigation, activeOptions/activeProps, preloading (intent/viewport/render), preloadDelay, navigation blocking (useBlocker, Block), createLink, linkOptions helper, scroll restoration, MatchRoute."
  use: "@tanstack/router-core#router-core/navigation"
- when: "notFound() function, notFoundComponent, defaultNotFoundComponent, notFoundMode (fuzzy/root), errorComponent, CatchBoundary, CatchNotFound, isNotFound, NotFoundRoute (deprecated), route masking (mask option, createRouteMask, unmaskOnReload)."
  use: "@tanstack/router-core#router-core/not-found-and-errors"
- when: "Dynamic path segments ($paramName), splat routes ($ / \_splat), optional params ({-$paramName}), prefix/suffix patterns ({$param}.ext), useParams, params.parse/stringify, pathParamsAllowedCharacters, i18n locale patterns."
  use: "@tanstack/router-core#router-core/path-params"
- when: "validateSearch, search param validation with Zod/Valibot/ArkType adapters, fallback(), search middlewares (retainSearchParams, stripSearchParams), custom serialization (parseSearch, stringifySearch), search param inheritance, loaderDeps for cache keys, reading and writing search params."
  use: "@tanstack/router-core#router-core/search-params"
- when: "Non-streaming and streaming SSR, RouterClient/RouterServer, renderRouterToString/renderRouterToStream, createRequestHandler, defaultRenderHandler/defaultStreamHandler, HeadContent/Scripts components, head route option (meta/links/styles/scripts), ScriptOnce, automatic loader dehydration/hydration, memory history on server, data serialization, document head management."
  use: "@tanstack/router-core#router-core/ssr"
- when: "Full type inference philosophy (never cast, never annotate inferred values), Register module declaration, from narrowing on hooks and Link, strict:false for shared components, getRouteApi for code-split typed access, addChildren with object syntax for TS perf, LinkProps and ValidateLinkOptions type utilities, as const satisfies pattern."
  use: "@tanstack/router-core#router-core/type-safety"
- when: "TanStack Router bundler plugin for route generation and automatic code splitting. Supports Vite, Webpack, Rspack, and esbuild. Configures autoCodeSplitting, routesDirectory, target framework, and code split groupings."
  use: "@tanstack/router-plugin#router-plugin"
- when: "Programmatic route tree building as an alternative to filesystem conventions: rootRoute, index, route, layout, physical, defineVirtualSubtreeConfig. Use with TanStack Router plugin's virtualRouteConfig option."
use: "@tanstack/virtual-file-routes#virtual-file-routes"
<!-- intent-skills:end -->
