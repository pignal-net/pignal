---
name: pignal-oss-development
description: Use when developing on Pignal OSS packages (db, core, web, server) — adding fields, endpoints, MCP tools, permissions, templates, or migrations in the self-hosted item store
---

# Pignal OSS Development

Five packages with strict layering: `@pignal/db` (schema + types) -> `@pignal/core` (logic + routes) -> `@pignal/templates` (profiles + configs + catalog) -> `@pignal/server` + `@pignal/web` (deployment + UI). Always modify bottom-up.

## Which Package?

| Change | Package | Key File |
|--------|---------|----------|
| New DB column / table | `db` | `db/src/schema.ts` + `db/src/types.ts` |
| Business logic / CRUD | `core` | `core/src/store/item-store.ts` |
| API endpoint | `core` | `core/src/routes/*.ts` |
| Validation schema | `core` | `core/src/validation/schemas.ts` |
| MCP tool | `core` | `core/src/mcp/tools.ts` + `core/src/mcp/manifest.ts` |
| Permission | `core` | `core/src/auth/permissions.ts` |
| Server wiring / auth | `server` | `server/src/index.ts` + `server/src/middleware/` |
| Web UI page | `web` | `web/src/pages/*.tsx` |
| Template profile/config | `templates` | `templates/src/config.ts` (profile + vocabulary + SEO + MCP) |
| Template catalog | `templates` | `templates/src/catalog.ts` (shipped/planned/rejected registry) |
| Template seed data | `templates` | `templates/seeds/<name>.sql` (generated via `pnpm seed:generate`) |
| Web template JSX | `web` | `web/src/templates/<name>/` (see `GENERATION_GUIDE.md`) |
| D1 migration | `server` | `server/migrations/NNNN_description.sql` |

## Modification Order

Always: `db -> core -> server/web`. Never modify upstream packages first.

## Detailed Guides

- [recipes.md](./recipes.md) — Step-by-step for 6 common tasks
- [pitfalls.md](./pitfalls.md) — Common mistakes and fixes
- [type-flow.md](./type-flow.md) — How types propagate across packages

Read `CLAUDE.md` at repo root for full architecture and key source locations.
