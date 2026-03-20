# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

pignal — a lightweight, self-hosted content platform powered by Cloudflare Workers + D1. Template-driven layouts, MCP server, REST API, and web UI. Federated architecture: each user owns their item store.

## Commands

All commands run from the repo root using pnpm workspaces:

```bash
pnpm install              # Install all workspace dependencies
pnpm dev:server           # Start local dev server (localhost:8787)
pnpm deploy:server        # Deploy to Cloudflare Workers
pnpm db:migrate           # Apply D1 migrations locally
pnpm db:migrate:prod      # Apply D1 migrations to production
pnpm db:seed:blog         # Seed blog template data locally
pnpm db:seed:shop         # Seed shop template data locally
pnpm template:create      # Scaffold a new template
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
pnpm db:migrate                  # Create tables in local D1
pnpm db:seed:blog                # Seed blog template data (or db:seed:shop for shop)
pnpm dev                         # http://localhost:8787
```

D1 migrations live in `server/migrations/`. Seed SQL files live in `templates/seeds/`. After a fresh clone or when new migrations are added, always run `pnpm db:migrate` before `pnpm dev`.

## Architecture

### Package Dependency Graph

```
@pignal/db          Schema + types (no business logic)
  ↑
@pignal/core        ItemStore, route factories, validation, MCP tools (GENERIC)
  ↑
@pignal/templates   Template configs, vocabulary, SEO, MCP config, schema overrides, seed SQL
  ↑
@pignal/web         Hono JSX SSR admin dashboard + template-driven source page
  ↑
@pignal/server      Deployable Worker: REST + MCP + Web, D1 storage, token auth
```

### Data Flow

```
Request → Worker → Auth Middleware → Store Middleware → Route Handler → ItemStore → D1
```

Every request creates an `ItemStore` from D1 via middleware. The store contains all business logic.

### Key Packages

| Package | Path | What It Does |
|---------|------|-------------|
| `@pignal/db` | `db/` | Drizzle ORM schemas (`schema.ts`: items, item_types, type_actions, workspaces, settings) and TypeScript types (`ItemStoreRpc`, `ItemWithMeta`, `ListParams`, etc.). Items have a `tags` column (JSON text array). |
| `@pignal/core` | `core/` | `ItemStore` (pure business logic accepting any Drizzle SQLite DB), route factories (`createItemRoutes`, `createTypeRoutes`, etc.), Zod validation schemas, MCP tool operations, federation (`/.well-known/pignal` handler). Template-agnostic. |
| `@pignal/templates` | `templates/` | Template configs (vocabulary, SEO hints, MCP instructions, schema descriptions), `Template` interface, prop types, seed SQL |
| `@pignal/web` | `web/` | Admin dashboard + public source page via Hono JSX SSR. HTMX for interactivity. Template JSX components (blog, shop). HMAC session cookies, CSRF protection, CSP headers, safe markdown rendering |
| `@pignal/server` | `server/` | Wires everything together. D1 storage via `storeMiddleware`, token auth, health endpoint, mounts route factories at `/api/*`, MCP at `/mcp`, public source page at `/`, admin UI at `/pignal`, `/.well-known/pignal` for federation |

### Route Factory Pattern

All core route factories accept `RouteFactoryConfig` to decouple auth/storage resolution from business logic:

```typescript
type RouteFactoryConfig = {
  getStore: (c: Context) => ItemStoreRpc;  // How to get the store
  middleware?: MiddlewareHandler[];          // Auth middleware to apply
};
```

The server creates an `ItemStore(drizzle(env.DB))` in middleware.

### Two Auth Modes

- **REST API** (`/api/*`): Bearer token — `SERVER_TOKEN` (admin) or API keys with flat permissions
- **Web UI** (`/pignal/*`): HMAC-signed HttpOnly session cookie (set after login at `/pignal/login`) + CSRF double-submit token

### Validation Strategy

- **Hard ceilings** (Zod, in `core/src/validation/schemas.ts`): keySummary max 500 chars, content max 50,000 chars
- **Soft limits** (configurable, stored in settings table): Quality guidelines + validation limits enforced at runtime in `ItemStore.create/update`

### Visibility Model

Each item has a visibility level: `private` (default), `unlisted` (accessible via `/s/:token`), or `vouched` (listed on source page, SEO-indexed). Vouched items get a unique `slug`; unlisted ones get a `shareToken`.

### Tags

Items can have tags — a JSON array of lowercase strings stored as text in SQLite (e.g., `'["react","hooks"]'`). Tags are normalized (lowercase, deduped, sorted) in `ItemStore.create/update`. Filtering uses `LIKE '%"tagname"%'`. AI clients can create tags during item creation via MCP `save_item`.

### Public Page Filtering

The public source page (`/`) supports filtering by type (`?type=`), workspace (`?workspace=`), and tag (`?tag=`). Only workspaces with `visibility: 'public'` are shown. The sidebar uses collapsible `<details>/<summary>` sections for Categories and Workspaces. The page layout is determined by the active template (set via `TEMPLATE` env var in `wrangler.toml`).

### Federation

Every instance serves `/.well-known/pignal` with owner info, capabilities, stats, and API endpoints for cross-instance discovery.

## Key Source Locations

- **ItemStore**: `core/src/store/item-store.ts` — All CRUD, search, stats, settings (60s cache), vouch/slug management
- **Permissions**: `core/src/auth/permissions.ts` — Flat permission definitions (9 permissions: `save_item`, `list_items`, `edit_item`, `delete_item`, `validate_item`, `get_metadata`, `manage_types`, `manage_workspaces`, `manage_settings`) + `hasPermission`, `parsePermissions`, `validatePermissions`
- **Route factories**: `core/src/routes/` — items, types, workspaces, stats, settings, public
- **Validation schemas**: `core/src/validation/schemas.ts` — Zod schemas with hard limits + MCP tool schemas (includes `tags` array validation)
- **MCP tools**: `core/src/mcp/tools.ts` — save_item, list_items, search_items, validate_item, get_metadata operations
- **Template configs**: `templates/src/config.ts` — TemplateConfig, vocabulary, SEO hints, MCP config with schemaDescriptions
- **Template types**: `templates/src/types.ts` — Template interface, SourcePageProps, ItemPostProps, LayoutProps
- **Template seeds**: `templates/seeds/` — blog.sql, shop.sql (seed data per template)
- **Federation**: `core/src/federation/` — `well-known.ts` (handler), `types.ts` (WellKnownResponse, etc.)
- **DB schema**: `db/src/schema.ts` — 5 tables (items, item_types, type_actions, workspaces, settings) + api_keys. Items include `tags` (JSON text array).
- **TypeScript types**: `db/src/types.ts` — `ItemStoreRpc` interface, all data types (`ItemWithMeta`, `ItemSelect`, etc.)
- **Web templates**: `web/src/templates/` — Template JSX components: `registry.ts` (lookup), `blog/` (default), `shop/` (grid catalog). Types/config in `@pignal/templates`.
- **Web pages**: `web/src/pages/` — Hono JSX components (dashboard at `/pignal`, items, source-page at `/` with type/workspace/tag filtering, item-post at `/item/:slug`, settings, api-keys)
- **Web middleware**: `web/src/middleware/` — session (protects `/pignal/*`), CSRF, security headers
- **Server entry**: `server/src/index.ts` — Hono app, mounts all routes
- **Store middleware**: `server/src/middleware/store.ts` — Creates ItemStore from D1
- **Permission middleware**: `server/src/middleware/permission-auth.ts` — `requirePermission`, `requireByMethod`, `resolveItemPermission`, `mcpPermissionCheck`
- **Token auth**: `server/src/middleware/token-auth.ts` — Bearer token validation (SERVER_TOKEN → admin, API keys → flat permissions)
- **MCP agent**: `server/src/mcp/agent.ts` — `SelfHostedMcpAgent` with 10 registered tools, applies template `schemaDescriptions`

## Template System

The template system is split across two packages:
- **`@pignal/templates`** (`templates/`) — Config, types, seed data. Defines `TemplateConfig` (vocabulary, SEO hints, MCP config with `schemaDescriptions`), `Template` interface, and prop types.
- **`@pignal/web`** (`web/src/templates/`) — JSX components (blog, shop) and registry. Each template folder contains `source-page.tsx`, `item-post.tsx`, `layout.tsx`, and optionally `styles.css`.

### Template Contract

Every template exports an object conforming to the `Template` interface (`templates/src/types.ts`):

- **Required components**: `SourcePage`, `ItemPost`, `Layout`, `PartialResults`
- **Optional overrides**: `ItemCard`, `Header`, `Footer`, `FilterBar` (fall back to shared components)
- **`vocabulary`**: `TemplateVocabulary` — maps generic terms (item, type, workspace, vouch) to domain-specific language
- **`seo`**: `TemplateSeoHints` — Schema.org types for JSON-LD
- **`meta`**: `{ name, description }` — template metadata
- **`styles`**: CSS text imported from a `.css` file, injected at runtime

### Template Config

Each template has a `TemplateConfig` in `templates/src/config.ts` with:
- **`vocabulary`** — domain language mapping (e.g., "product", "category", "collection" for shop)
- **`seo`** — Schema.org `@type` for source page and items
- **`mcp`** — instructions, tool descriptions, response labels, and `schemaDescriptions` (per-field Zod `.describe()` overrides for rich MCP quality)

### Template Registry

Templates are registered in `web/src/templates/registry.ts`. The `getTemplate(templateName)` function returns the matching template (defaulting to `blog`).

Available templates:
- **blog** (default) — Vertical feed layout with timeline grouping
- **shop** — Grid-based product catalog layout

### Creating a New Template

1. Add a `TemplateConfig` in `templates/src/config.ts` with vocabulary, SEO, MCP config, and `schemaDescriptions`
2. Run `pnpm template:create <name>` (from `templates/`) to scaffold JSX components in `web/src/templates/<name>/`
3. Implement `source-page.tsx`, `item-post.tsx`, `layout.tsx`, and `styles.css`
4. (Optional) Add seed data in `templates/seeds/<name>.sql`
5. Prefix all CSS classes with `<template-name>-` to avoid collisions

See `templates/TEMPLATE_GUIDE.md` for the full contract, prop types, and checklist.

### CSS Injection

Template CSS is imported as binary text data via wrangler rules (configured in `wrangler.toml` with `type = "Text"` for `.css` and `.png` files). The styles are injected into the page at render time via the template's `styles` field. Base Pico CSS and `app.css` styles are always available.

### The `TEMPLATE` Environment Variable

The active template is set via the `TEMPLATE` env var in `wrangler.toml` under `[vars]` (defaults to `blog`). When changed and redeployed, the public source page renders using the new template's components, vocabulary, and styles.

## Code Conventions

- `import type` required for type-only imports (`consistent-type-imports: error`)
- Unused vars are errors (prefix with `_` to suppress)
- `no-console`: only `console.error` and `console.warn` allowed
- `prefer-const`, `no-var`, `eqeqeq: always`
- All packages: TypeScript strict mode, ES2022 target, `moduleResolution: bundler`
- Server/web use Hono JSX (`jsxImportSource: hono/jsx`)
