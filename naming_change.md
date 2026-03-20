# OSS Rename: signal → item

## Why

Pignal OSS is becoming a **generic content platform**. Each self-hosted instance can represent any domain — a blog, shop, portfolio, news site, docs — by selecting a template. The data model needed to stop assuming "signal" as the entity name. "Item" is domain-agnostic; templates supply the user-facing vocabulary (e.g. "product", "article", "signal").

A pluggable template system was added alongside the rename. Templates define presentation (SourcePage, ItemPost, Layout, PartialResults components) plus a vocabulary mapping that controls all public-facing labels.

## What changed in OSS

### Database tables

| Before | After |
|--------|-------|
| `signals` | `items` |
| `signal_types` | `item_types` |
| `type_actions` | `type_actions` (unchanged) |
| `workspaces` | `workspaces` (unchanged) |
| `settings` | `settings` (unchanged) |
| `api_keys` | `api_keys` (unchanged) |

Migration: `server/migrations/0002_rename_signals_to_items.sql` — renames tables, recreates indexes with `idx_items_*` names, updates API key scope strings.

### TypeScript types (`@pignal/db`)

| Before | After |
|--------|-------|
| `SignalSelect` / `SignalInsert` | `ItemSelect` / `ItemInsert` |
| `SignalTypeSelect` / `SignalTypeInsert` | `ItemTypeSelect` / `ItemTypeInsert` |
| `SignalWithMeta` | `ItemWithMeta` |
| `SignalStoreRpc` | `ItemStoreRpc` |
| `SignalTypeWithActions` | `ItemTypeWithActions` |

### Drizzle schema variables (`@pignal/db/schema`)

| Before | After |
|--------|-------|
| `signals` | `items` |
| `signalTypes` | `itemTypes` |

### Business logic class (`@pignal/core`)

| Before | After |
|--------|-------|
| `SignalStore` (in `store/signal-store.ts`) | `ItemStore` (in `store/item-store.ts`) |
| `createSignalRoutes` (in `routes/signals.ts`) | `createItemRoutes` (in `routes/items.ts`) |

### Permissions (`@pignal/core/auth/permissions`)

| Before | After |
|--------|-------|
| `save_signal` | `save_item` |
| `list_signals` | `list_items` |
| `edit_signal` | `edit_item` |
| `delete_signal` | `delete_item` |
| `validate_signal` | `validate_item` |

`get_metadata`, `manage_types`, `manage_workspaces`, `manage_settings` — unchanged.

### MCP tool names (`@pignal/core/mcp`)

| Before | After |
|--------|-------|
| `save_signal` | `save_item` |
| `list_signals` | `list_items` |
| `search_signals` | `search_items` |
| `validate_signal` | `validate_item` |
| `update_signal` | `update_item` |
| `vouch_signal` | `vouch_item` |
| `batch_vouch_signals` | `batch_vouch_items` |

`get_metadata`, `create_workspace`, `create_type` — unchanged.

Tool input fields: `signalId` → `itemId`. Batch vouch array field: `signals` → `items`, inner `signalId` → `itemId`.

### REST API paths (`@pignal/server`)

| Before | After |
|--------|-------|
| `/api/signals` | `/api/items` |
| `/api/signals/:id` | `/api/items/:id` |
| `/api/signals/:id/validate` | `/api/items/:id/validate` |
| `/api/signals/:id/archive` | `/api/items/:id/archive` |
| `/api/signals/:id/unarchive` | `/api/items/:id/unarchive` |
| `/api/signals/:id/vouch` | `/api/items/:id/vouch` |
| `/api/public/signals` | `/api/public/items` |
| `/api/public/signals/:slug` | `/api/public/items/:slug` |

### Web UI paths (`@pignal/web`)

| Before | After |
|--------|-------|
| `/signal/:slug` | `/item/:slug` |
| `/signal/:slug.md` | `/item/:slug.md` |
| `/pignal/signals` | `/pignal/items` |
| `/pignal/signals/:id` | `/pignal/items/:id` |

### Federation protocol (`/.well-known/pignal`)

The JSON response fields changed:

```
capabilities.signals        → capabilities.items
stats.public_signal_count   → stats.public_item_count
stats.signal_type_count     → stats.item_type_count
stats.last_signal_at        → stats.last_item_at
endpoints.public_signals    → endpoints.public_items
```

Federation scopes:

| Before | After |
|--------|-------|
| `signals:read` | `items:read` |
| `signals:write` | `items:write` |

Tool manifest `responseFormat` values: `signal` → `item`, `signal_list` → `item_list`.

### Core package exports (`@pignal/core/package.json`)

| Before | After |
|--------|-------|
| `./store` → `./src/store/signal-store.ts` | `./store` → `./src/store/item-store.ts` |
| `./routes/signals` → `./src/routes/signals.ts` | `./routes/items` → `./src/routes/items.ts` |

### Validation schemas (`@pignal/core/validation`)

All Zod schemas renamed: `createSignalSchema` → `createItemSchema`, `saveSignalToolSchema` → `saveItemToolSchema`, etc. Type exports follow the same pattern (`SaveSignalToolInput` → `SaveItemToolInput`).

### Formatting functions (`@pignal/core/mcp`)

| Before | After |
|--------|-------|
| `formatSignal()` | `formatItem()` |
| `saveSignal()` | `saveItem()` |
| `listSignals()` | `listItems()` |
| `searchSignals()` | `searchItems()` |
| `validateSignal()` | `validateItem()` |
| `updateSignal()` | `updateItem()` |
| `vouchSignal()` | `vouchItem()` |
| `batchVouchSignals()` | `batchVouchItems()` |

### Server middleware (`@pignal/server`)

| Before | After |
|--------|-------|
| `resolveSignalPermission` | `resolveItemPermission` |
| `MCP_TOOL_PERMISSIONS` keys | All tool names updated to `save_item`, `list_items`, etc. |

## What did NOT change

- Product name "Pignal" — unchanged everywhere
- Table structure (columns, indexes, FKs) — only table names changed
- `type_actions`, `workspaces`, `settings`, `api_keys` tables — unchanged
- `keySummary`, `content`, `sourceAi`, `validationActionId`, `vouchedAt`, `shareToken`, `slug` columns — unchanged
- Visibility model (`private`/`unlisted`/`vouched`) — unchanged
- Tag format (JSON text array) — unchanged
- Auth flows (bearer token, session cookie) — unchanged
- `/s/:token` shared item URL — unchanged
- `/health`, `/.well-known/pignal`, `/mcp` endpoints — unchanged (content updated)
- Admin UI at `/pignal/*` prefix — unchanged (sub-paths renamed)
- `@pignal/db`, `@pignal/core`, `@pignal/web`, `@pignal/server` package names — unchanged

## Hub integration points

The hub consumes OSS packages and the federation protocol. The key surfaces where the rename is visible:

1. **`@pignal/db` types** — Hub imports `SignalWithMeta`, `SignalStoreRpc`, `SignalTypeWithActions`, `ItemTypeSelect` etc. These are now `ItemWithMeta`, `ItemStoreRpc`, `ItemTypeWithActions`.

2. **`@pignal/core` exports** — Hub imports `SignalStore`, `createSignalRoutes`, `formatSignal`, tool schemas, permissions. All renamed.

3. **Federation protocol** — Hub cron fetches `/.well-known/pignal` from sources and parses the response. Field names in `stats`, `capabilities`, `endpoints` changed. Federation scopes changed.

4. **Tool manifest** — Hub cron syncs tool definitions from sources. Tool names, `responseFormat` values, and `requiredScopes` changed.

5. **Hub's own `hub_signals` table** — This is the hub's local index of items from federated sources. The hub can rename this on its own schedule since it's a separate schema (`@pignal/hub-db`).
