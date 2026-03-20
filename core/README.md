# @pignal/core

Business logic layer: ItemStore, route factories, Zod validation, MCP tool operations, and federation protocol.

## ItemStore

Pure business logic class accepting any Drizzle SQLite database (`core/src/store/item-store.ts`). Provides CRUD on items/types/workspaces, visibility management (vouch with slug generation, unlisted with share tokens), runtime settings with caching, full-text search, and stats.

## Route Factories

Configurable Hono route creators that decouple auth/storage from business logic. Available factories: items (`createItemRoutes`), types (`createTypeRoutes`), workspaces, settings, stats, and public.

## MCP Tools

Five tool operations: save_item, list_items, search_items, validate_item, and get_metadata. Used by `@pignal/server` to register MCP tools.

## Federation

Serves `/.well-known/pignal` with owner info, capabilities, stats, and API endpoints for cross-instance discovery.

## Validation

Zod schemas shared between REST validation and MCP tool definitions. Hard ceilings enforced at schema level; soft limits configurable via settings.

## Dependencies

- `@pignal/db` — Schema and type definitions