# Common Pitfalls

| Mistake | Why It Happens | Fix |
|---------|---------------|-----|
| Schema change without SQL migration | Drizzle schema defines types only — D1 needs explicit SQL | Create `server/migrations/NNNN_*.sql` with `ALTER TABLE` / `CREATE TABLE` |
| Adding `ItemStore` method without updating `ItemStoreRpc` | Interface lives in a separate package | Update `ItemStoreRpc` in `db/src/types.ts` first |
| Using `console.log` | ESLint `no-console: warn` — only `console.error` and `console.warn` allowed | Use `console.error` / `console.warn`, or remove the log |
| Relative imports between packages | Packages must use workspace aliases | Use `@pignal/db`, `@pignal/core`, `@pignal/render`, `@pignal/templates` — never `../../packages/` |
| Missing `import type` for type-only imports | `@typescript-eslint/consistent-type-imports: error` | Use `import type { Foo }` when importing only types |
| Skipping `pnpm type-check` after cross-package changes | Changes in `db` or `core` can break downstream packages | Always run `pnpm type-check` from repo root — checks all packages |
| Forgetting MCP manifest update | Adding a tool function without registering it | Update `getDefaultToolManifest()` in `core/src/mcp/manifest.ts` AND register in `server/src/mcp/agent.ts` |
| Modifying server/web before updating db/core | Top-down causes type errors because server depends on core depends on db | Always modify bottom-up: `db -> core -> render -> templates -> web -> server` |
| Hard-coding Zod limits | Soft limits come from `settings` table at runtime | Use Zod for hard ceilings only; runtime checks for configurable soft limits |
| Missing `.describe()` on MCP Zod fields | AI clients rely on field descriptions for tool usage | Add `.describe('...')` to every field in MCP tool schemas |
| Template CSS not loading | Wrangler needs a rule to import `.css` as text | Add `{ type = "Text", globs = ["**/*.css"] }` to `server/wrangler.toml` `[[rules]]` |
| Template CSS shows `[object Object]` | CSS imported as module instead of text | Ensure the wrangler `Text` rule is present; do not use CSS module imports |
| Adding template config to monolithic `config.ts` | Old pattern — configs are now per-template | Create `templates/src/<name>/config.ts` with the template's own config. Add to `all-configs.ts` barrel for hub |
| Forgetting `all-configs.ts` update | Hub needs access to all template configs | After adding `<name>/config.ts`, add import/export to `templates/src/all-configs.ts` |
| Forgetting `resolve-template` after adding a template | Server uses build-time resolved template | Run `pnpm resolve-template` or `TEMPLATE=<name> pnpm dev:server` (auto-runs it) |
| Creating template JSX in `web/src/templates/` | Old location — templates are now self-contained | Template JSX lives in `templates/src/<name>/` alongside its config |
| Putting shared components in `templates` or `web` | Components needed by multiple templates belong in render | Move to `render/src/components/`. Templates and web import from `@pignal/render/components/*` |
| Putting shared libs in `web` | Libs like theme, seo, markdown belong in render | These now live in `render/src/lib/`. Import from `@pignal/render/lib/*` |
| Missing JSX pragmas in render/template TSX | Hono JSX requires explicit pragma in each file | Add `/** @jsxRuntime automatic */` and `/** @jsxImportSource hono/jsx */` at the top |
| Importing icons from `web/src/components/icons.tsx` | Icons moved to render package | Import from `@pignal/render/components/icons` |
| Creating template without checking catalog | Duplicate or rejected template gets built | Read `templates/src/catalog.ts` first — check for ID conflicts and rejected entries |
| Using `meta` instead of `profile` on Template | `meta` was replaced by `profile` | Use `profile: config.profile` in template index.tsx, not `meta: { name, description }` |
| Writing seed SQL by hand | UUIDs and schema can drift from profile seedData | Run `pnpm seed:generate <name>` to generate from the profile's `seedData` |
| Missing catalog entry for shipped template | Hub and governance lose track of it | Add entry with `status: 'shipped'` to `TEMPLATE_CATALOG` in `catalog.ts` |
