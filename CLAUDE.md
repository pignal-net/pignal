# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

pignal — a self-hosted MCP server + REST API + web UI for capturing and organizing personal signals from AI conversations. Runs on Cloudflare Workers with D1. Federated architecture: each user owns their signal store.

## Commands

All commands run from the repo root using pnpm workspaces:

```bash
pnpm install              # Install all workspace dependencies
pnpm dev:server           # Start local dev server (localhost:8787)
pnpm deploy:server        # Deploy to Cloudflare Workers
pnpm db:migrate           # Apply D1 migrations locally
pnpm db:migrate:prod      # Apply D1 migrations to production
pnpm type-check           # Type-check all packages
pnpm lint                 # Lint all packages (server only currently)
pnpm check-all            # Type-check + lint all packages
```

Server-specific (run from `server/`):

```bash
pnpm dev                  # Local dev with --persist-to .wrangler-state
pnpm deploy               # Deploy to Cloudflare Workers
pnpm db:migrate           # Apply D1 migrations locally
pnpm db:migrate:prod      # Apply D1 migrations to production
pnpm lint                 # ESLint src/
pnpm lint:fix             # Auto-fix lint issues
```

No test framework is currently configured.

### First-Time Local Setup

```bash
pnpm install
cd server
cp .dev.vars.example .dev.vars   # Set SERVER_TOKEN
pnpm db:migrate                  # Create tables and seed data in local D1
pnpm dev                         # http://localhost:8787
```

D1 migrations live in `server/migrations/`. After a fresh clone or when new migrations are added, always run `pnpm db:migrate` before `pnpm dev`.

## Architecture

### Package Dependency Graph

```
@pignal/db         Schema + types (no business logic)
  ↑
@pignal/core       SignalStore, route factories, validation, MCP tools, federation
  ↑
@pignal/web        Hono JSX SSR admin dashboard + public source page
  ↑
@pignal/server     Deployable Worker: REST + MCP + Web, D1 storage, token auth
```

### Data Flow

```
Request → Worker → Auth Middleware → Store Middleware → Route Handler → SignalStore → D1
```

Every request creates a `SignalStore` from D1 via middleware. The store contains all business logic.

### Key Packages

| Package | Path | What It Does |
|---------|------|-------------|
| `@pignal/db` | `db/` | Drizzle ORM schemas (`schema.ts`: signals, signal_types, type_actions, workspaces, settings) and TypeScript types (`SignalStoreRpc`, `SignalWithMeta`, `ListParams`, etc.). Signals have a `tags` column (JSON text array). |
| `@pignal/core` | `core/` | `SignalStore` (pure business logic accepting any Drizzle SQLite DB), route factories (`createSignalRoutes`, `createTypeRoutes`, etc.), Zod validation schemas, MCP tool operations, federation (`/.well-known/pignal` handler) |
| `@pignal/web` | `web/` | Admin dashboard + public source page via Hono JSX SSR. HTMX for interactivity. HMAC session cookies, CSRF protection, CSP headers, safe markdown rendering |
| `@pignal/server` | `server/` | Wires everything together. D1 storage via `storeMiddleware`, token auth, health endpoint, mounts route factories at `/api/*`, MCP at `/mcp`, public source page at `/`, admin UI at `/pignal`, `/.well-known/pignal` for federation |

### Route Factory Pattern

All core route factories accept `RouteFactoryConfig` to decouple auth/storage resolution from business logic:

```typescript
type RouteFactoryConfig = {
  getStore: (c: Context) => SignalStoreRpc;  // How to get the store
  middleware?: MiddlewareHandler[];            // Auth middleware to apply
};
```

The server creates a `SignalStore(drizzle(env.DB))` in middleware.

### Two Auth Modes

- **REST API** (`/api/*`): Bearer token — `SERVER_TOKEN` (admin) or API keys with flat permissions
- **Web UI** (`/pignal/*`): HMAC-signed HttpOnly session cookie (set after login at `/pignal/login`) + CSRF double-submit token

### Validation Strategy

- **Hard ceilings** (Zod, in `core/src/validation/schemas.ts`): keySummary max 500 chars, content max 50,000 chars
- **Soft limits** (configurable, stored in settings table): Quality guidelines + validation limits enforced at runtime in `SignalStore.create/update`

### Visibility Model

Each signal has a visibility level: `private` (default), `unlisted` (accessible via `/s/:token`), or `vouched` (listed on source page, SEO-indexed). Vouched signals get a unique `slug`; unlisted ones get a `shareToken`.

### Tags

Signals can have tags — a JSON array of lowercase strings stored as text in SQLite (e.g., `'["react","hooks"]'`). Tags are normalized (lowercase, deduped, sorted) in `SignalStore.create/update`. Filtering uses `LIKE '%"tagname"%'`. AI clients can create tags during signal creation via MCP `save_signal`.

### Public Page Filtering

The public source page (`/`) supports filtering by type (`?type=`), workspace (`?workspace=`), and tag (`?tag=`). Only workspaces with `visibility: 'public'` are shown. The sidebar uses collapsible `<details>/<summary>` sections for Categories and Workspaces.

### Federation

Every instance serves `/.well-known/pignal` with owner info, capabilities, stats, and API endpoints for cross-instance discovery.

## Key Source Locations

- **SignalStore**: `core/src/store/signal-store.ts` — All CRUD, search, stats, settings (60s cache), vouch/slug management
- **Permissions**: `core/src/auth/permissions.ts` — Flat permission definitions (9 permissions) + `hasPermission`, `parsePermissions`, `validatePermissions`
- **Route factories**: `core/src/routes/` — signals, types, workspaces, stats, settings, public
- **Validation schemas**: `core/src/validation/schemas.ts` — Zod schemas with hard limits + MCP tool schemas (includes `tags` array validation)
- **MCP tools**: `core/src/mcp/tools.ts` — save, list, search, validate, getMetadata operations
- **Federation**: `core/src/federation/` — `well-known.ts` (handler), `types.ts` (WellKnownResponse, etc.)
- **DB schema**: `db/src/schema.ts` — 5 tables (signals, signal_types, type_actions, workspaces, settings) + api_keys. Signals include `tags` (JSON text array).
- **TypeScript types**: `db/src/types.ts` — `SignalStoreRpc` interface, all data types
- **Web pages**: `web/src/pages/` — Hono JSX components (dashboard at `/pignal`, signals, source-page at `/` with type/workspace/tag filtering, signal-post at `/signal/:slug`, settings, api-keys)
- **Web middleware**: `web/src/middleware/` — session (protects `/pignal/*`), CSRF, security headers
- **Server entry**: `server/src/index.ts` — Hono app, mounts all routes
- **Store middleware**: `server/src/middleware/store.ts` — Creates SignalStore from D1
- **Permission middleware**: `server/src/middleware/permission-auth.ts` — `requirePermission`, `requireByMethod`, `resolveSignalPermission`, `mcpPermissionCheck`
- **Token auth**: `server/src/middleware/token-auth.ts` — Bearer token validation (SERVER_TOKEN → admin, API keys → flat permissions)
- **MCP agent**: `server/src/mcp/agent.ts` — `SelfHostedMcpAgent` with 5 registered tools

## Code Conventions

- `import type` required for type-only imports (`consistent-type-imports: error`)
- Unused vars are errors (prefix with `_` to suppress)
- `no-console`: only `console.error` and `console.warn` allowed
- `prefer-const`, `no-var`, `eqeqeq: always`
- All packages: TypeScript strict mode, ES2022 target, `moduleResolution: bundler`
- Server/web use Hono JSX (`jsxImportSource: hono/jsx`)
