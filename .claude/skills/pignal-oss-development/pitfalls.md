# Common Pitfalls

| Mistake | Why It Happens | Fix |
|---------|---------------|-----|
| Schema change without SQL migration | Drizzle schema defines types only — D1 needs explicit SQL | Create `server/migrations/NNNN_*.sql` with `ALTER TABLE` / `CREATE TABLE` |
| Adding `ItemStore` method without updating `ItemStoreRpc` | Interface lives in a separate package | Update `ItemStoreRpc` in `db/src/types.ts` first |
| Using `console.log` | ESLint `no-console: warn` — only `console.error` and `console.warn` allowed | Use `console.error` / `console.warn`, or remove the log |
| Relative imports between packages | Packages must use workspace aliases | Use `@pignal/db`, `@pignal/core`, `@pignal/web` — never `../../packages/` |
| Missing `import type` for type-only imports | `@typescript-eslint/consistent-type-imports: error` | Use `import type { Foo }` when importing only types |
| Skipping `pnpm type-check` after cross-package changes | Changes in `db` or `core` can break `server` / `web` | Always run `pnpm type-check` from repo root — checks all packages |
| Forgetting MCP manifest update | Adding a tool function without registering it | Update `getDefaultToolManifest()` in `core/src/mcp/manifest.ts` AND register in `server/src/mcp/agent.ts` |
| Modifying server/web before updating db/core | Top-down causes type errors because server depends on core depends on db | Always modify bottom-up: `db -> core -> server/web` |
| Hard-coding Zod limits | Soft limits come from `settings` table at runtime | Use Zod for hard ceilings only; runtime checks for configurable soft limits |
| Missing `.describe()` on MCP Zod fields | AI clients rely on field descriptions for tool usage | Add `.describe('...')` to every field in MCP tool schemas |
| Template CSS not loading | Wrangler needs a rule to import `.css` as text | Add `{ type = "Text", globs = ["**/*.css"] }` to `server/wrangler.toml` `[[rules]]` |
| Template CSS shows `[object Object]` | CSS imported as module instead of text | Ensure the wrangler `Text` rule is present; do not use CSS module imports |
| Forgetting to register template | Template file exists but is not selectable | Add to `TEMPLATES` record in `web/src/templates/registry.ts` |
