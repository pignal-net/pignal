# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.3.0] - 2026-03-26

### Changed

- **Template isolation architecture** — introduced `@pignal/render` package and restructured `@pignal/templates` for self-contained, build-time-resolved templates
- New package `@pignal/render` (`render/`) — shared rendering components, lib utilities, i18n, static assets, and Tailwind styles extracted from `@pignal/web`
- Each template is now a self-contained folder in `templates/src/<name>/` with config + JSX co-located (was split across `templates/` for config and `web/src/templates/` for JSX)
- Template configs split from monolithic `config.ts` into individual `<name>/config.ts` files
- `@pignal/web` slimmed to admin dashboard + routing only (no template code)
- Build-time template resolution via `templates/scripts/resolve-template.ts` — only the selected template is bundled per deployment (~700K reduction)
- New dependency graph: `db → core → render → templates/<name> → web → server`
- All render/template TSX files require `@jsxRuntime automatic` + `@jsxImportSource hono/jsx` pragmas for Wrangler compatibility
- `pnpm dev:server` auto-runs `resolve-template` before starting
- CSS build (`pnpm css:build`) now targets `@pignal/render` instead of `@pignal/web`

### Added

- `pnpm resolve-template` command — generates `_resolved.ts` for build-time template selection
- `templates/src/all-configs.ts` — barrel export of all 24 template configs (for hub use)
- 24 self-contained template folders with config + JSX: blog, shop, wiki, course, awesome-list, changelog, portfolio, recipes, journal, reviews, writing, til, podcast, runbook, glossary, directory, bookshelf, flashcards, services, incidents, magazine, case-studies, menu, resume

### Removed

- `web/src/templates/` directory (moved to `templates/src/`)
- `web/src/components/` shared rendering components (moved to `render/src/components/`)
- `web/src/lib/` shared utilities (moved to `render/src/lib/`)
- `web/src/i18n/`, `web/src/static/`, `web/src/styles/` (moved to `render/`)
- Monolithic config files: `configs-feed.ts`, `configs-grid.ts`, `configs-directory.ts`, `configs-remaining.ts`
- `getAvailableTemplates()` (unused)

## [0.2.0] - 2026-03-19

### Changed

- **Renamed signals to items** across the entire codebase: `SignalStore` -> `ItemStore`, `SignalWithMeta` -> `ItemWithMeta`, `SignalStoreRpc` -> `ItemStoreRpc`, `signal_types` -> `item_types`, `createSignalRoutes` -> `createItemRoutes`, `/api/signals` -> `/api/items`, `/signal/:slug` -> `/item/:slug`, `/pignal/signals` -> `/pignal/items`
- All permissions renamed: `save_signal` -> `save_item`, `list_signals` -> `list_items`, `edit_signal` -> `edit_item`, `delete_signal` -> `delete_item`, `validate_signal` -> `validate_item`
- All MCP tools renamed: `save_signal` -> `save_item`, `list_signals` -> `list_items`, `search_signals` -> `search_items`, `validate_signal` -> `validate_item`
- File renames: `signal-store.ts` -> `item-store.ts`, `routes/signals.ts` -> `routes/items.ts`

### Added

- **Template system** for customizable source page layouts
- `blog` template (default) — vertical feed layout with timeline grouping
- `shop` template — grid-based product catalog layout
- Template contract (`Template` interface) with required components (`SourcePage`, `ItemPost`, `Layout`) and optional overrides (`ItemCard`, `Header`, `Footer`, `FilterBar`)
- `TemplateVocabulary` for domain-specific language mapping (item/type/workspace/vouch terms)
- `pnpm template:create <name>` scaffolding script for new templates

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
