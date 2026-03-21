# Type Propagation Flow

Types flow strictly bottom-up across five packages. No build step — all packages export `.ts` source directly (Wrangler bundles at deploy).

## Package Chain

```
@pignal/db                    Schema + types (no logic)
  |
  v
@pignal/core                  Business logic + routes + MCP + validation + federation
  |
  v
@pignal/templates             Template profiles, configs, catalog, seed data
  |
  v
@pignal/server + @pignal/web  Deployment wiring + UI
```

## Key Type Locations

### `@pignal/db` — Source of Truth

- `db/src/schema.ts` — Drizzle table definitions (`items`, `itemTypes`, `typeActions`, `workspaces`, `settings`, `apiKeys`). Drizzle infers `ItemSelect`, `ItemInsert`, etc.
- `db/src/types.ts` — Hand-written interfaces:
  - `ItemStoreRpc` — 57-method interface defining all business operations
  - `ItemWithMeta` — Item joined with type name, workspace name, validation action label, parsed tags array
  - `ListParams`, `CreateParams`, `UpdateParams`, `VouchParams` — operation parameter types
  - `MetadataResult` — combined types + workspaces + settings

### `@pignal/core` — Implements and Consumes

- `core/src/store/item-store.ts` — `class ItemStore implements ItemStoreRpc` (accepts any Drizzle SQLite DB)
- `core/src/routes/*.ts` — Route factories accept `RouteFactoryConfig { getStore, middleware? }`, call `config.getStore(c)` to get `ItemStoreRpc`
- `core/src/validation/schemas.ts` — Zod schemas (independent of Drizzle types, but field names must match)
- `core/src/mcp/tools.ts` — Tool functions accept `ItemStoreRpc` + validated params
- `core/src/federation/types.ts` — `WellKnownResponse`, `WellKnownTemplate` — federation discovery types
- `core/src/types.ts` — `RouteFactoryConfig`, `PUBLIC_ITEM_FIELDS`

### `@pignal/templates` — Template Identity + Generation

- `templates/src/config.ts` — `TemplateProfile` (identity + classification + seedData), `TemplateConfig` (profile + vocabulary + SEO + MCP), classification enums (`TemplateDomain`, `TemplateContentType`, `TemplateLayout`), seed data types (`TemplateSeedData`, `TemplateTypeSeed`, etc.)
- `templates/src/catalog.ts` — `TEMPLATE_CATALOG` — static registry of all templates (shipped, planned, rejected) with `CatalogEntry` type. Read by LLMs before generating new templates.
- `templates/src/types.ts` — `Template` interface (JSX components + `profile: TemplateProfile`), prop types (`SourcePageProps`, `ItemPostProps`, etc.)
- `templates/src/index.ts` — Barrel exports for all types and catalog

### `@pignal/server` — Wires Everything

- `server/src/middleware/store.ts` — Creates `ItemStore` from `env.DB` (D1), sets on Hono context as `store`
- `server/src/index.ts` — Passes `{ getStore: (c) => c.get('store') }` to route factories. `/.well-known/pignal` exposes `template` field from profile.
- `server/src/mcp/agent.ts` — Gets store from context, passes to core MCP tool functions

### `@pignal/web` — Template Visual Components

- `web/src/templates/<name>/index.tsx` — Exports `Template` object with JSX components + `profile: config.profile`
- `web/src/templates/registry.ts` — `getTemplate()` returns template by name, `getAvailableTemplates()` lists all with profile metadata

## When You Change a Type

1. **Add/modify column** -> Update `db/src/schema.ts` + `db/src/types.ts`
2. **Run `pnpm type-check`** -> TypeScript shows every downstream breakage in core/templates/server/web
3. **Fix core** -> Update store methods, validation schemas, route handlers
4. **Fix templates** -> Update profile types, config interfaces if needed
5. **Fix server/web** -> Update middleware, agent, UI as needed
6. **Write migration SQL** -> `server/migrations/NNNN_*.sql`
