---
name: pignal-oss-development
description: Use when developing on Pignal OSS packages (db, core, web, server) — adding fields, endpoints, MCP tools, permissions, or migrations in the self-hosted signal store
---

# Pignal OSS Development

Four packages with strict layering: `@pignal/db` (schema + types) -> `@pignal/core` (logic + routes) -> `@pignal/server` + `@pignal/web` (deployment + UI). Always modify bottom-up.

## Which Package?

| Change | Package | Key File |
|--------|---------|----------|
| New DB column / table | `db` | `db/src/schema.ts` + `db/src/types.ts` |
| Business logic / CRUD | `core` | `core/src/store/signal-store.ts` |
| API endpoint | `core` | `core/src/routes/*.ts` |
| Validation schema | `core` | `core/src/validation/schemas.ts` |
| MCP tool | `core` | `core/src/mcp/tools.ts` + `core/src/mcp/manifest.ts` |
| Permission | `core` | `core/src/auth/permissions.ts` |
| Server wiring / auth | `server` | `server/src/index.ts` + `server/src/middleware/` |
| Web UI page | `web` | `web/src/pages/*.tsx` |
| D1 migration | `server` | `server/migrations/NNNN_description.sql` |

## Modification Order

Always: `db -> core -> server/web`. Never modify upstream packages first.

## Detailed Guides

- [recipes.md](./recipes.md) — Step-by-step for 5 common tasks
- [pitfalls.md](./pitfalls.md) — Common mistakes and fixes
- [type-flow.md](./type-flow.md) — How types propagate across packages

Read `CLAUDE.md` at repo root for full architecture and key source locations.
