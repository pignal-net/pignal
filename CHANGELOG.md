# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.2.0] - 2026-03-19

### Changed

- **Renamed signals to items** across the entire codebase: `SignalStore` -> `ItemStore`, `SignalWithMeta` -> `ItemWithMeta`, `SignalStoreRpc` -> `ItemStoreRpc`, `signal_types` -> `item_types`, `createSignalRoutes` -> `createItemRoutes`, `/api/signals` -> `/api/items`, `/signal/:slug` -> `/item/:slug`, `/pignal/signals` -> `/pignal/items`
- All permissions renamed: `save_signal` -> `save_item`, `list_signals` -> `list_items`, `edit_signal` -> `edit_item`, `delete_signal` -> `delete_item`, `validate_signal` -> `validate_item`
- All MCP tools renamed: `save_signal` -> `save_item`, `list_signals` -> `list_items`, `search_signals` -> `search_items`, `validate_signal` -> `validate_item`
- File renames: `signal-store.ts` -> `item-store.ts`, `routes/signals.ts` -> `routes/items.ts`

### Added

- **Template system** for customizable source page layouts (`web/src/templates/`)
- `blog` template (default) — vertical feed layout with timeline grouping
- `shop` template — grid-based product catalog layout
- Template contract (`Template` interface) with required components (`SourcePage`, `ItemPost`, `Layout`) and optional overrides (`ItemCard`, `Header`, `Footer`, `FilterBar`)
- `TemplateVocabulary` for domain-specific language mapping (item/type/workspace/vouch terms)
- Template registry with `getTemplate()` lookup and `getAvailableTemplates()` listing
- `source_template` setting to select the active template
- `pnpm template:create <name>` scaffolding script for new templates
- Template CSS scoping convention (prefix all classes with `<template-name>-`)

## [0.1.0] - 2025-03-11

### Added

- MCP server with 5 tools: `get_metadata`, `save_signal`, `list_signals`, `search_signals`, `validate_signal` (renamed to `save_item`, `list_items`, `search_items`, `validate_item` in 0.2.0)
- REST API with full CRUD for items (originally signals), types, workspaces, and settings
- Web admin dashboard at `/pignal` with HTMX interactivity
- Public source page at `/` with SEO-optimized item posts
- Bearer token authentication with API key support and flat permissions
- Item visibility model: private, unlisted (share links), vouched (public)
- Item types with configurable validation actions
- Workspaces for organizing items
- Tags support (JSON array, normalized, filterable)
- Atom feed at `/feed.xml`
- LLMs.txt at `/llms.txt`
- Federation via `/.well-known/pignal` for cross-instance discovery
- D1 storage with Drizzle ORM migrations
- HMAC session cookies + CSRF protection for web UI
