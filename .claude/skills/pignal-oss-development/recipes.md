# Development Recipes

All paths relative to repo root. Run `pnpm` commands from repo root.

## 1. Add a New Item Field

1. **Schema** — Add column to `items` table in `db/src/schema.ts`
2. **Types** — Update `ItemWithMeta` and relevant interfaces in `db/src/types.ts`. If the field affects store methods, update `ItemStoreRpc`
3. **Store** — Update queries in `core/src/store/item-store.ts` (select, insert, update as needed)
4. **Validation** — Add to Zod schemas in `core/src/validation/schemas.ts` (e.g., `createItemSchema`, `updateItemSchema`)
5. **MCP** — If exposed to AI clients, update tool schemas and `formatItem()` in `core/src/mcp/tools.ts`, then update manifest in `core/src/mcp/manifest.ts`
6. **Migration** — Create `server/migrations/NNNN_description.sql` with `ALTER TABLE items ADD COLUMN ...`
7. **Verify** — `pnpm type-check` then `pnpm db:migrate`

## 2. Add a New API Endpoint

1. **Route factory** — Add handler in the appropriate `core/src/routes/*.ts` file (items, types, workspaces, stats, settings, or public). Uses `config.getStore(c)` to get the store
2. **Validation** — Add Zod schema in `core/src/validation/schemas.ts` if the endpoint accepts a body
3. **Server wiring** — If new route group, mount in `server/src/index.ts`. Apply auth middleware via `requirePermission()` or `requireByMethod()` from `server/src/middleware/permission-auth.ts`
4. **Export** — Ensure the factory is exported from `core/src/routes/index.ts` and `core/src/index.ts`
5. **Verify** — `pnpm type-check`

## 3. Add a New MCP Tool

1. **Zod schema** — Add tool input schema in `core/src/validation/schemas.ts` (with `.describe()` on each field for AI documentation)
2. **Tool function** — Add operation function in `core/src/mcp/tools.ts` following existing pattern (accepts store + params, returns formatted string)
3. **Manifest** — Add tool definition to `getDefaultToolManifest()` in `core/src/mcp/manifest.ts` with name, description, and JSON schema
4. **Agent** — Register tool in `server/src/mcp/agent.ts` inside the `init()` method using `this.server.tool()`
5. **Permission** — Add permission check in `mcpPermissionCheck()` in `server/src/middleware/permission-auth.ts`
6. **Verify** — `pnpm type-check`

## 4. Add a New Permission

1. **Define** — Add to `VALID_PERMISSIONS` array in `core/src/auth/permissions.ts`
2. **Middleware mapping** — Map permission to routes in `server/src/middleware/permission-auth.ts` using `requirePermission()` or `requireByMethod()`
3. **Route mount** — Apply middleware when mounting routes in `server/src/index.ts`
4. **API keys** — The permission is automatically available for API key scoping (stored as comma-separated string)
5. **Web UI** — Update API key management page in `web/src/pages/api-keys.tsx` to show the new permission checkbox
6. **Verify** — `pnpm type-check`

## 5. Create a D1 Migration

1. **Naming** — Find the highest `NNNN` in `server/migrations/`, increment by 1
2. **Write SQL** — Create `server/migrations/NNNN_description.sql` with raw SQL (D1 is SQLite)
3. **Apply locally** — `pnpm db:migrate`
4. **Verify** — Start dev server with `pnpm dev` (from `server/`), test the affected endpoints
5. **Production** — `pnpm db:migrate:prod` (after code is deployed)

Note: Drizzle schema changes in `db/src/schema.ts` do NOT auto-generate migrations. You must write the SQL manually.

## 6. Create a New Web Template

**Profile-first workflow** — always define the identity before generating artifacts.

1. **Check catalog** — Read `templates/src/catalog.ts`. Verify no existing/rejected entry covers the same use case. Check the layout x contentType matrix in `templates/GENERATION_GUIDE.md`
2. **Profile** — Add a `TemplateProfile` in `templates/src/config.ts` with id, displayName, tagline, description, domain, contentType, layout, audience, useCases, differentiators, and `seedData` (types, workspaces, settings)
3. **Config** — Add the full `TemplateConfig` (profile + vocabulary + SEO + MCP with schemaDescriptions and responseLabels)
4. **Catalog** — Add entry to `TEMPLATE_CATALOG` in `templates/src/catalog.ts` with `status: 'shipped'`
5. **Seed SQL** — Run `pnpm seed:generate <name>` to generate `templates/seeds/<name>.sql` from the profile's seedData
6. **Scaffold** — Run `pnpm template:create <name>` to generate JSX components in `web/src/templates/<name>/`
7. **Components** — Implement `SourcePage`, `ItemPost`, `Layout`, and `PartialResults` in the generated `.tsx` files
8. **Styles** — Write scoped CSS in `styles.css` with `<name>-*` class prefix
9. **Wrangler rule** — Ensure `server/wrangler.toml` has a rule for `**/*.css` with `type = "Text"` (required for CSS text imports)
10. **Verify** — `pnpm check-all`. Set `TEMPLATE = "<name>"` under `[vars]` in `server/wrangler.toml` and run `pnpm dev:server`

See `templates/GENERATION_GUIDE.md` for full generation rules, differentiation criteria, and quality checklist.
