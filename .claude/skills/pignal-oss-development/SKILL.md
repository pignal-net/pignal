---
name: pignal-oss-development
description: Use when developing on Pignal OSS packages (db, core, render, templates, web, server) — adding fields, endpoints, MCP tools, permissions, templates, or migrations in the self-hosted item store
---

# Pignal OSS Development

Six packages with strict layering: `@pignal/db` (schema + types) -> `@pignal/core` (logic + routes) -> `@pignal/render` (shared rendering) -> `@pignal/templates` (self-contained template folders) -> `@pignal/web` (admin dashboard) -> `@pignal/server` (deployment wiring). Always modify bottom-up.

## Which Package?

| Change | Package | Key File |
|--------|---------|----------|
| New DB column / table | `db` | `db/src/schema.ts` + `db/src/types.ts` |
| Business logic / CRUD | `core` | `core/src/store/item-store.ts` |
| API endpoint | `core` | `core/src/routes/*.ts` |
| Validation schema | `core` | `core/src/validation/schemas.ts` |
| MCP tool | `core` | `core/src/mcp/tools.ts` + `core/src/mcp/manifest.ts` |
| Permission | `core` | `core/src/auth/permissions.ts` |
| Shared rendering component | `render` | `render/src/components/*.tsx` |
| Shared rendering lib | `render` | `render/src/lib/*.ts` |
| SVG icons | `render` | `render/src/components/icons.tsx` |
| Design tokens / CSS | `render` | `render/src/styles/input.css` |
| Theme engine | `render` | `render/src/lib/theme.ts` |
| i18n / translations | `render` | `render/src/i18n/` |
| Template config (vocabulary/SEO/MCP) | `templates` | `templates/src/<name>/config.ts` |
| Template JSX (source page, item post) | `templates` | `templates/src/<name>/source-page.tsx`, `item-post.tsx`, `layout.tsx` |
| Template catalog | `templates` | `templates/src/catalog.ts` (shipped/planned/rejected registry) |
| Template seed data | `templates` | `templates/seeds/<name>.sql` (generated via `pnpm seed:generate`) |
| All-configs barrel (for hub) | `templates` | `templates/src/all-configs.ts` |
| Admin dashboard page | `web` | `web/src/pages/*.tsx` |
| Admin component | `web` | `web/src/components/*.tsx` |
| Server wiring / auth | `server` | `server/src/index.ts` + `server/src/middleware/` |
| D1 migration | `server` | `server/migrations/NNNN_description.sql` |

## Modification Order

Always: `db -> core -> render -> templates -> web -> server`. Never modify upstream packages first.

## Import Patterns

- Templates and web admin import shared rendering: `import { X } from '@pignal/render/components/x'` and `import { y } from '@pignal/render/lib/y'`
- Server/web import the resolved template config: `import { resolvedConfig } from '@pignal/templates/resolved'`
- TSX files in `render` and `templates` need JSX pragmas: `/** @jsxRuntime automatic */` and `/** @jsxImportSource hono/jsx */`

## Detailed Guides

- [recipes.md](./recipes.md) — Step-by-step for 7 common tasks
- [pitfalls.md](./pitfalls.md) — Common mistakes and fixes
- [type-flow.md](./type-flow.md) — How types propagate across packages

Read `CLAUDE.md` at repo root for full architecture and key source locations.
