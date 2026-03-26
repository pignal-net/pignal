# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Pignal — an AI-native website platform powered by Cloudflare Workers + D1. A growing template library with built-in SEO, structured data, and LLM-readiness. Every site is an MCP server for AI-driven content lifecycle management. REST API and web dashboard included. Open source (AGPL-3.0) for full customization.

## Commands

All commands run from the repo root using pnpm workspaces:

```bash
pnpm install              # Install all workspace dependencies
pnpm dev:server           # Start local dev server (runs resolve-template first, then localhost:8787)
pnpm deploy:server        # Deploy to Cloudflare Workers
pnpm db:migrate           # Apply D1 migrations locally
pnpm db:migrate:prod      # Apply D1 migrations to production
pnpm db:seed:blog         # Seed blog template data locally
pnpm db:seed:shop         # Seed shop template data locally
pnpm template:create      # Scaffold a new template (into templates/src/<name>/)
pnpm resolve-template     # Generate _resolved.ts for the active template (reads TEMPLATE env var)
pnpm css:build            # Build Tailwind v4 CSS (render/src/styles/input.css → render/src/static/tailwind.css)
pnpm css:watch            # Watch mode for Tailwind CSS during development
pnpm type-check           # Type-check all packages
pnpm lint                 # Lint all packages (server only currently)
pnpm check-all            # Type-check + lint all packages
```

Server-specific (run from `server/`):

```bash
pnpm dev                  # Local dev with --persist-to .wrangler-state
pnpm deploy               # Deploy to Cloudflare Workers
pnpm db:migrate           # Apply D1 migrations locally
pnpm db:migrate:prod      # Apply D1 migrations to production
pnpm lint                 # ESLint src/
pnpm lint:fix             # Auto-fix lint issues
```

No test framework is currently configured.

### First-Time Local Setup

```bash
pnpm install
cd server
cp .dev.vars.example .dev.vars   # Set SERVER_TOKEN
pnpm db:migrate                  # Create tables in local D1
pnpm db:seed:blog                # Seed blog template data (or db:seed:shop for shop)
pnpm dev                         # http://localhost:8787
```

D1 migrations live in `server/migrations/`. Seed SQL files live in `templates/seeds/`. After a fresh clone or when new migrations are added, always run `pnpm db:migrate` before `pnpm dev`.

## Architecture

### Package Dependency Graph

```
@pignal/db          Schema + types (no business logic)
  ↑
@pignal/core        ItemStore, ActionStore, route factories, validation, MCP tools, directives, webhooks, events (GENERIC)
  ↑
@pignal/render      Shared rendering: components, lib utilities, i18n, static assets, styles
  ↑
@pignal/templates   Self-contained templates (config + JSX per folder), build-time resolution, seed SQL
  ↑
@pignal/web         Admin dashboard + routing only (no templates, no shared components)
  ↑
@pignal/server      Deployable Worker: REST + MCP + Web, D1 storage, token auth
```

### Data Flow

```
Request → Worker → Auth Middleware → Store Middleware → Route Handler → ItemStore/ActionStore → D1
                                                                     → EventBus → Webhook Dispatcher → External URL
Public pages: Request → Source Page/Item Post → renderContentWithDirectives → DirectiveRegistry → HTML
Form submit:  POST /form/:slug → ActionStore.submitForm → D1 + EventBus → Webhook
```

Every request creates an `ItemStore` and `ActionStore` from D1 via middleware. An `EventBus` connects stores to webhook delivery.

### Key Packages

| Package | Path | What It Does |
|---------|------|-------------|
| `@pignal/db` | `db/` | Drizzle ORM schemas (`schema.ts`: items, item_types, type_actions, workspaces, settings, site_actions, submissions, page_views) and TypeScript types (`ItemStoreRpc`, `ActionStoreRpc`, `ItemWithMeta`, etc.). |
| `@pignal/core` | `core/` | `ItemStore` + `ActionStore` (pure business logic), route factories, Zod validation, MCP tools (15 tools), `DirectiveRegistry`, `FieldTypeRegistry`, `EventBus`, webhook dispatcher, federation. Template-agnostic. |
| `@pignal/render` | `render/` | Shared rendering layer: Hono JSX components (layout, public-layout, pagination, item-card, cta-block, icons, etc.), lib utilities (theme, seo, markdown, directives, time, rss), i18n, static assets (tailwind.css, htmx.min.js, app.js), Tailwind v4 styles (input.css). Used by templates and web admin. |
| `@pignal/templates` | `templates/` | 24 self-contained templates. Each folder (`src/<name>/`) has `config.ts` (vocabulary, SEO, MCP) + JSX (`index.tsx`, `source-page.tsx`, `item-post.tsx`, `layout.tsx`). Build-time resolution via `_resolved.ts`. Seed SQL in `seeds/`. `all-configs.ts` barrel for hub use. |
| `@pignal/web` | `web/` | Admin dashboard + routing only. Admin-specific components (app-layout, page-header, filter-sidebar, etc.), pages (dashboard, items, settings, etc.), middleware (session, CSRF, analytics). No template JSX, no shared components. |
| `@pignal/server` | `server/` | Wires everything together. D1 storage, token auth, mounts route factories at `/api/*`, MCP at `/mcp`, public forms at `/form/*`, public source page at `/`, admin UI at `/pignal`, `/.well-known/pignal` for federation |

### Route Factory Pattern

All core route factories accept `RouteFactoryConfig` to decouple auth/storage resolution from business logic:

```typescript
type RouteFactoryConfig = {
  getStore: (c: Context) => ItemStoreRpc;  // How to get the store
  middleware?: MiddlewareHandler[];          // Auth middleware to apply
};
```

The server creates `ItemStore` and `ActionStore` from `drizzle(env.DB)` in middleware, along with `EventBus` and `FieldTypeRegistry`.

### Two Auth Modes

- **REST API** (`/api/*`): Bearer token — `SERVER_TOKEN` (admin) or API keys with flat permissions
- **Web UI** (`/pignal/*`): HMAC-signed HttpOnly session cookie (set after login at `/pignal/login`) + CSRF double-submit token

### Validation Strategy

- **Hard ceilings** (Zod, in `core/src/validation/schemas.ts`): keySummary max 500 chars, content max 50,000 chars
- **Soft limits** (configurable, stored in settings table): Quality guidelines + validation limits enforced at runtime in `ItemStore.create/update`

### Visibility Model

Each item has a visibility level: `private` (default), `unlisted` (accessible via `/s/:token`), or `vouched` (listed on source page, SEO-indexed). Vouched items get a unique `slug`; unlisted ones get a `shareToken`.

### Tags

Items can have tags — a JSON array of lowercase strings stored as text in SQLite (e.g., `'["react","hooks"]'`). Tags are normalized (lowercase, deduped, sorted) in `ItemStore.create/update`. Filtering uses `LIKE '%"tagname"%'`. AI clients can create tags during item creation via MCP `save_item`.

### Public Page Filtering

The public source page (`/`) supports filtering by type (`?type=`), workspace (`?workspace=`), and tag (`?tag=`). Only workspaces with `visibility: 'public'` are shown. The sidebar uses collapsible `<details>/<summary>` sections for Categories and Workspaces. The page layout is determined by the active template (set via `TEMPLATE` env var in `wrangler.toml`).

### Federation

Every instance serves `/.well-known/pignal` with owner info, capabilities, stats, and API endpoints for cross-instance discovery.

### Site Actions (Forms & Lead Capture)

A generic system for all form-like interactions: contact forms, newsletter signup, lead capture, booking requests, feedback. Two tables: `site_actions` (form definitions with JSON field array) and `submissions` (submitted data as JSON). Managed via REST API, admin dashboard, or MCP tools.

### Content Directives

Special tokens in markdown content (`{{name:param}}`) that get replaced with interactive components during rendering. Three built-in directives:
- `{{action:slug}}` — Renders an inline form (from site_actions)
- `{{cta:title="..." button="..." action="slug"}}` — Renders an inline CTA block
- `{{testimonials}}` — Renders a testimonial card grid from vouched items

Extensible via `DirectiveRegistry` — add new directive types by implementing `DirectiveHandler` and registering it.

### Webhooks

Fire-and-forget HTTP webhooks on business events. Configured via settings (`webhook_url`, `webhook_events`, `webhook_secret`). Events: `submission.created`, `item.published`. HMAC-SHA256 signed payloads with `X-Pignal-Signature` header. Uses `EventBus` — add new event types or listeners without modifying stores.

### Page View Analytics

Lightweight server-side view counting on public pages (`/`, `/item/:slug`). No cookies, no JS, no external deps. Tracks path, slug, referrer, and country (from `CF-IPCountry` header). Non-blocking via `waitUntil()`. Stored in `page_views` table.

## Key Source Locations

- **ItemStore**: `core/src/store/item-store.ts` — All item CRUD, search, stats, settings (60s cache), vouch/slug management, event emission
- **ActionStore**: `core/src/store/action-store.ts` — Site actions (forms) CRUD, form submission with field validation, submission management, CSV export
- **Permissions**: `core/src/auth/permissions.ts` — Flat permission definitions (10 permissions: `save_item`, `list_items`, `edit_item`, `delete_item`, `validate_item`, `get_metadata`, `manage_types`, `manage_workspaces`, `manage_settings`, `manage_actions`) + `hasPermission`, `parsePermissions`, `validatePermissions`
- **Route factories**: `core/src/routes/` — items, types, workspaces, stats, settings, public, actions, submissions, forms
- **Validation schemas**: `core/src/validation/schemas.ts` — Zod schemas with hard limits + MCP tool schemas for items and actions
- **MCP tools**: `core/src/mcp/tools.ts` — 15 operations: save_item, list_items, search_items, validate_item, update_item, vouch_item, batch_vouch, create_workspace, create_type, get_metadata, create_action, update_action, list_actions, list_submissions, manage_submission
- **DirectiveRegistry**: `core/src/directives/registry.ts` — `DirectiveRegistry` class, `DirectiveHandler` interface, `DirectiveParams`, `DirectiveContext` types. Extensible `{{name:param}}` system.
- **FieldTypeRegistry**: `core/src/actions/field-types.ts` — `FieldTypeRegistry` class with 8 built-in field type handlers (text, email, textarea, select, url, tel, number, checkbox)
- **EventBus**: `core/src/events/event-bus.ts` — Lightweight event system with wildcard support. Used by webhooks.
- **Webhook dispatcher**: `core/src/webhooks/dispatcher.ts` — `createWebhookListener()` factory, HMAC-SHA256 signing, fire-and-forget delivery
- **Template configs**: `templates/src/<name>/config.ts` — Per-template TemplateConfig (vocabulary, SEO, MCP, schemaDescriptions). Type definitions in `templates/src/config.ts`.
- **Template JSX**: `templates/src/<name>/` — Self-contained template folders with `config.ts`, `index.tsx`, `source-page.tsx`, `item-post.tsx`, `layout.tsx`
- **Template registry**: `templates/src/registry.ts` — Uses build-time `_resolved.ts` (generated by `scripts/resolve-template.ts`)
- **Template configs barrel**: `templates/src/all-configs.ts` — Exports all 24 template configs (used by hub for directory/catalog)
- **Template types**: `templates/src/types.ts` — Template interface, SourcePageProps, ItemPostProps, LayoutProps
- **Template seeds**: `templates/seeds/` — blog.sql, shop.sql (seed data per template)
- **Render components**: `render/src/components/` — Shared JSX: layout, public-layout, pagination, type-badge, empty-state, item-feed, item-card, type-sidebar, source-action-bar, json-ld, icons, cta-block, language-switcher, action-form, visibility-badge, testimonials
- **Render lib**: `render/src/lib/` — theme.ts, seo.ts, markdown.ts, time.ts, css-sanitize.ts, static-versions.ts, geo.ts, rss.ts, directives.ts
- **Render i18n**: `render/src/i18n/` — index.ts, t.ts, types.ts, utils.ts, locales/
- **Design tokens / input CSS**: `render/src/styles/input.css` — `@theme` block, dark mode, base layer, `@layer components` classes
- **Static assets**: `render/src/static/` — tailwind.css, htmx.min.js, app.js, logo.svg, logo.png
- **SVG icons**: `render/src/components/icons.tsx` — Shared inline SVG icon components
- **Theme engine**: `render/src/lib/theme.ts` — CSS custom property generation from source settings
- **Directives rendering**: `render/src/lib/directives.ts` — Directive rendering (action forms, CTAs, testimonials) + `renderContentWithDirectives()`
- **Federation**: `core/src/federation/` — `well-known.ts` (handler), `types.ts` (WellKnownResponse, etc.)
- **DB schema**: `db/src/schema.ts` — 8 tables (items, item_types, type_actions, workspaces, settings, api_keys, site_actions, submissions, page_views)
- **TypeScript types**: `db/src/types.ts` — `ItemStoreRpc`, `ActionStoreRpc` interfaces, all data types
- **Web components (admin)**: `web/src/components/` — Admin-only: app-layout, create-section, feed-item, filter-sidebar, flash, form-dropdown, managed-list, page-header, skeleton, stat-card, status-badge
- **Web pages**: `web/src/pages/` — dashboard, items, source-page, item-post, settings, api-keys, actions (form management), submissions (lead management)
- **Web middleware**: `web/src/middleware/` — session, CSRF, security headers, analytics (page view tracking), locale, visitor
- **Web lib**: `web/src/lib/` — cookie.ts, htmx.ts, slug.ts (admin-specific utilities only)
- **Server entry**: `server/src/index.ts` — Hono app, mounts all routes including `/api/actions`, `/api/submissions`, `/form/*`
- **Store middleware**: `server/src/middleware/store.ts` — Creates ItemStore, ActionStore, EventBus, FieldTypeRegistry from D1
- **Permission middleware**: `server/src/middleware/permission-auth.ts` — `requirePermission`, `requireByMethod`, `resolveItemPermission`, `mcpPermissionCheck`
- **Token auth**: `server/src/middleware/token-auth.ts` — Bearer token validation (SERVER_TOKEN → admin, API keys → flat permissions)
- **MCP agent**: `server/src/mcp/agent.ts` — `SelfHostedMcpAgent` with 15 registered tools, applies template `schemaDescriptions`

## Template System

The template system is split across three packages:
- **`@pignal/render`** (`render/`) — Shared rendering components, lib utilities, i18n, static assets, and styles. Used by all templates and the web admin.
- **`@pignal/templates`** (`templates/`) — 24 self-contained template folders. Each folder has config (vocabulary, SEO, MCP) + JSX (source-page, item-post, layout) together. Build-time resolution selects one template per deployment.

Templates import shared components and utilities from `@pignal/render`:
```tsx
import { ItemCard } from '@pignal/render/components/item-card';
import { renderMarkdown } from '@pignal/render/lib/markdown';
```

### Template Contract

Every template exports an object conforming to the `Template` interface (`templates/src/types.ts`):

- **Required components**: `SourcePage`, `ItemPost`, `Layout`, `PartialResults`
- **Optional overrides**: `ItemCard`, `Header`, `Footer`, `FilterBar` (fall back to shared components in `@pignal/render`)
- **`vocabulary`**: `TemplateVocabulary` — maps generic terms (item, type, workspace, vouch) to domain-specific language
- **`seo`**: `TemplateSeoHints` — Schema.org types for JSON-LD
- **`meta`**: `{ name, description }` — template metadata
- **`styles`**: Empty string (`''`) — all styling uses Tailwind utility classes in JSX

### Template Config

Each template has its own `config.ts` in `templates/src/<name>/config.ts` with:
- **`vocabulary`** — domain language mapping (e.g., "product", "category", "collection" for shop)
- **`seo`** — Schema.org `@type` for source page and items
- **`mcp`** — instructions, tool descriptions, response labels, and `schemaDescriptions` (per-field Zod `.describe()` overrides for rich MCP quality)

Type definitions (`TemplateConfig`, `TemplateVocabulary`, etc.) remain in `templates/src/config.ts`. The `all-configs.ts` barrel re-exports all 24 configs for hub use (directory/catalog).

### Template Registry (Build-Time Resolution)

Templates use **build-time resolution** instead of a runtime registry. The `resolve-template` script (`templates/scripts/resolve-template.ts`) reads the `TEMPLATE` env var and generates `templates/src/_resolved.ts`, which imports only the selected template.

`templates/src/registry.ts` provides `getTemplate()` which returns the resolved template. Only one template is bundled per deployment, keeping the worker size minimal.

The server imports the resolved config via:
```typescript
import { resolvedConfig } from '@pignal/templates/resolved';
```

Available templates (24): awesome-list, blog (default), bookshelf, case-studies, changelog, course, directory, flashcards, glossary, incidents, journal, magazine, menu, podcast, portfolio, recipes, resume, reviews, runbook, services, shop, til, wiki, writing.

### Creating a New Template

1. Run `pnpm template:create <name>` — scaffolds `templates/src/<name>/` with `config.ts`, `index.tsx`, `source-page.tsx`, `item-post.tsx`, `layout.tsx`, and adds the config to `all-configs.ts`
2. Edit `config.ts` with vocabulary, SEO, MCP config, and `schemaDescriptions`
3. Implement `source-page.tsx`, `item-post.tsx`, and `layout.tsx` using Tailwind utility classes, importing shared components from `@pignal/render/components/*`
4. (Optional) Add seed data in `templates/seeds/<name>.sql`

No registry modification is needed -- the build-time resolution (`pnpm resolve-template`) picks up the new template automatically when `TEMPLATE=<name>` is set.

See `templates/TEMPLATE_GUIDE.md` for the full contract, prop types, and checklist.

### Design System

#### Architecture Overview

- **Tailwind v4** with CSS-first configuration at `render/src/styles/input.css`
- Built to `render/src/static/tailwind.css` via `pnpm css:build` (watch mode: `pnpm css:watch`)
- The compiled CSS is imported as text via Wrangler rules (configured in `wrangler.toml` with `type = "Text"` for `.css` and `.png` files) and served at `/static/tailwind.css`
- Theme engine (`render/src/lib/theme.ts`) generates `--tw-*` CSS custom properties from source settings, overriding the defaults in the `@theme {}` block
- **NO per-template CSS files** — all styling uses Tailwind utility classes directly in JSX (`styles: ''` on all templates)

#### Design Tokens

All tokens are declared in the `@theme {}` block of `input.css` and available as Tailwind utilities.

**Colors:**

| Token | Utility | Light | Dark | Usage |
|-------|---------|-------|------|-------|
| `--color-primary` | `text-primary`, `bg-primary` | `#1095C1` | user overridable | Links, buttons, accents |
| `--color-primary-hover` | `bg-primary-hover` | 80% primary + black | 90% primary + white | Button/link hover |
| `--color-primary-focus` | — (used in box-shadow) | 25% primary | 25% primary | Focus rings |
| `--color-primary-inverse` | `text-primary-inverse` | `#fff` | `#fff` | Text on primary bg |
| `--color-secondary` | `text-secondary`, `bg-secondary` | `#596B7C` | user overridable | Secondary buttons |
| `--color-text` | `text-text` | `#373C44` | `#e6edf3` | Body text |
| `--color-muted` | `text-muted` | `#646B79` | `#8b949e` | Secondary text, captions |
| `--color-bg` | `bg-bg` | `#ffffff` | `#0d1117` | Page background |
| `--color-bg-page` | `bg-bg-page` | `#f8f9fa` | `#010409` | Recessed page background |
| `--color-surface` | `bg-surface` | `#ffffff` | `#161b22` | Card backgrounds |
| `--color-surface-raised` | `bg-surface-raised` | `#ffffff` | `#21262d` | Elevated surfaces (code blocks) |
| `--color-surface-hover` | `bg-surface-hover` | `#f8f9fa` | `#1c2128` | Interactive surface hover |
| `--color-border` | `border-border` | 20% muted | `rgba(255,255,255,0.1)` | Standard borders |
| `--color-border-subtle` | `border-border-subtle` | 12% muted | `rgba(255,255,255,0.06)` | Subtle card borders |
| `--color-success` | `text-success`, `bg-success` | `#059669` | `#3fb950` | Success states |
| `--color-error` | `text-error`, `bg-error` | `#DC2626` | `#f85149` | Error states |
| `--color-warning` | `text-warning`, `bg-warning` | `#D97706` | `#d29922` | Warning states |
| `--color-info` | `text-info`, `bg-info` | `#7C3AED` | `#a371f7` | Info/accent states |

Each semantic color also has `-bg` and `-border` variants (e.g., `--color-success-bg`, `--color-success-border`) for tinted backgrounds and borders.

**Type badge colors** (used by `TypeBadge` component):

| Token | Light | Dark |
|-------|-------|------|
| `--color-type-insight` | `#8B5CF6` | `#a371f7` |
| `--color-type-decision` | `#3B82F6` | `#58a6ff` |
| `--color-type-solution` | `#10B981` | `#3fb950` |
| `--color-type-core` | `#F59E0B` | `#d29922` |
| `--color-type-default` | `#6B7280` | `#8b949e` |

**Shadows:**

| Token | Utility | Usage |
|-------|---------|-------|
| `--shadow-xs` | `shadow-xs` | Buttons resting state |
| `--shadow-sm` | `shadow-sm` | Button hover, flash messages |
| `--shadow-card` | `shadow-card` | Card resting state |
| `--shadow-card-hover` | `shadow-card-hover` | Card hover state |
| `--shadow-md` | `shadow-md` | Dropdowns, back-to-top button |
| `--shadow-lg` | `shadow-lg` | Modals, popovers, toast notifications |
| `--shadow-xl` | `shadow-xl` | Highest elevation |

**Border Radius:**

| Token | Utility | Value |
|-------|---------|-------|
| `--radius-xs` | `rounded-xs` | 0.125rem |
| `--radius-sm` | `rounded-sm` | 0.25rem |
| `--radius-md` | `rounded-md` | 0.375rem |
| `--radius-lg` | `rounded-lg` | 0.5rem |
| `--radius-xl` | `rounded-xl` | 0.75rem |
| `--radius-2xl` | `rounded-2xl` | 1rem |
| `--radius-full` | `rounded-full` | 9999px |

**Transitions:**

| Token | Value | Usage |
|-------|-------|-------|
| `--transition-fast` | `150ms ease` | Hover, focus, color changes |
| `--transition-normal` | `200ms ease` | General UI transitions |
| `--transition-slow` | `300ms ease` | Layout shifts, modals |

#### Component Patterns

Standard patterns used across all pages. Use these exactly to maintain consistency.

**Page header** (every admin page):

```tsx
<div class="mb-8">
  <h1 class="text-2xl font-bold tracking-tight">{title}</h1>
  <p class="text-muted text-sm mt-1">{description}</p>
</div>
```

**Card:**

```tsx
<div class="bg-surface rounded-xl border border-border-subtle shadow-card p-6">
```

**Card with hover:**

```tsx
<div class="bg-surface rounded-xl border border-border-subtle shadow-card hover:shadow-card-hover transition-shadow">
```

**Create section (dashed border):**

```tsx
<div class="bg-surface rounded-xl border-2 border-dashed border-border hover:border-primary/30 transition-colors p-6 mb-8">
```

**Empty state** (CSS component class):

```tsx
<div class="empty-state">
  <svg class="empty-state-icon" ...>[icon]</svg>
  <p class="empty-state-title">No items found</p>
  <p class="empty-state-description">descriptive text</p>
</div>
```

**Tinted badge** (TypeBadge pattern — inline styles for dynamic colors):

```tsx
<span style={`background: color-mix(in srgb, ${color} 15%, transparent); color: ${color}; border: 1px solid color-mix(in srgb, ${color} 25%, transparent);`}>
```

**Button variants** (base layer classes):
- Default (primary): no extra class needed — uses `--color-primary`
- Secondary: `.btn-secondary` or `.secondary` — transparent bg, border, secondary text
- Outline: `.btn-outline` or `.outline` — transparent bg, primary border and text
- Destructive: `.btn-danger` or `[class*="destructive"]` — error bg, white text
- Ghost: `.btn-ghost` or `.ghost` — transparent bg, no border, no shadow

**Flash messages** (success/error):

```tsx
<div class="flash flash-success">Success message</div>
<div class="flash flash-error">Error message</div>
```

**Toast notifications** (JS-animated, positioned fixed top-right):

```tsx
<div class="toast-container">
  <div class="toast toast-success">Toast message</div>
</div>
```

**Filter chips** (pill-shaped, used in source pages):

```tsx
<a class="filter-chip">All</a>
<a class="filter-chip active">Active</a>
```

#### Navigation

- **Admin** (`/pignal/*`): Sticky glassmorphism header with all nav items in a horizontal pill group
- **Public** (source pages): Sticky blur header with site title and social links as SVG icon buttons
- **Mobile**: `<details>` hamburger menu pattern (no JS needed) — collapses at `max-lg:` breakpoint

#### Dark Mode

- **Three modes**: light, dark, auto (system preference)
- Theme toggle cycles: light -> dark -> auto
- CSS variant: `@custom-variant dark` covers both `[data-theme="dark"]` and `@media (prefers-color-scheme: dark)` for `data-theme` absent
- All colors adapt automatically via CSS custom properties — dark overrides are duplicated in both `@media (prefers-color-scheme: dark)` and `[data-theme="dark"]` blocks
- **Never hardcode colors** — always use design tokens (`text-text`, `bg-surface`, `border-border`, etc.)
- Use Tailwind `dark:` prefix for one-off dark mode overrides in JSX

#### SVG Icons

Shared icon components in `render/src/components/icons.tsx`. All icons are inline SVGs with no external dependencies.

**Available icons:**
- Theme: `IconSun`, `IconMoon`, `IconMonitor`
- Social: `IconGitHub`, `IconTwitter`, `IconRSS`
- Navigation: `IconHamburger`, `IconExternalLink`, `IconChevronLeft`, `IconChevronDown`, `IconLogout`
- Content: `IconKey`, `IconSettings`, `IconList`, `IconTag`, `IconEmptyInbox`

**Usage:**

```tsx
<IconSun size={16} class="text-muted" />
```

- Default size: 16x16 (`IconEmptyInbox` uses 48x48 viewBox)
- Stroke-based (except `IconGitHub` and `IconTwitter` which are fill-based)
- Inherit `currentColor` — style via parent `text-*` or `class` prop

#### Theme Customization

5 user-customizable colors, set via the settings page (stored in D1):

| Setting Key | Token Override | Default |
|-------------|---------------|---------|
| `source_color_primary` | `--tw-primary`, `--tw-primary-bg`, `--tw-primary-hover`, `--tw-primary-focus` | `#1095C1` |
| `source_color_secondary` | `--tw-secondary`, `--tw-secondary-hover` | `#596B7C` |
| `source_color_background` | `--tw-bg`, `--tw-bg-page` | `#FFFFFF` |
| `source_color_text` | `--tw-text` | `#373C44` |
| `source_color_muted` | `--tw-muted`, `--tw-border` | `#646B79` |

`render/src/lib/theme.ts` reads these from settings and generates a `<style>` tag with CSS variable overrides for both light and dark mode. Dark mode values are automatically derived using `color-mix()`. Custom CSS is also supported via the `source_custom_css` setting (sanitized, injected via `<style>`).

#### Responsive Breakpoints

| Prefix | Min-width | Usage |
|--------|-----------|-------|
| (none) | 0px | Mobile-first base styles |
| `sm:` | 640px | Small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Wide desktop |

- **Mobile-first**: default styles target mobile, add breakpoints for larger screens
- **Sidebar layouts**: `grid grid-cols-1 lg:grid-cols-[240px_1fr]` with `max-lg:` for collapse
- **Touch targets**: minimum 44px height (`min-h-[44px]`) on interactive elements (filter chips, feed tabs)
- **Container**: `max-w-[1200px] mx-auto` for content width

#### Typography Scale

| Element | Class | Size |
|---------|-------|------|
| Page title | `text-2xl font-bold tracking-tight` | 1.5rem |
| Article title | `text-3xl sm:text-4xl font-bold tracking-tight` | 1.875rem -> 2.25rem |
| Section heading | `text-lg font-semibold` | 1.125rem |
| Section label | `text-sm font-semibold uppercase tracking-wider text-muted` | 0.875rem |
| Body | `text-base` | 1rem |
| Small/meta | `text-sm` | 0.875rem |
| Badge | `text-xs` | 0.75rem |

Base layer headings use `clamp()` for `h1` (1.75rem to 2.25rem) and negative letter-spacing for tighter display. Body line-height is 1.6 (headings: 1.25). System font stack: `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`.

#### CSS Component Classes

These classes are defined in the `@layer components` block of `render/src/styles/input.css` and referenced by JavaScript (`render/src/static/app.js`). Use them as-is:

| Class | Purpose |
|-------|---------|
| `.theme-toggle` | Dark mode toggle button (no bg, no shadow) |
| `.flash`, `.flash-success`, `.flash-error` | Server-rendered flash messages |
| `.toast-container`, `.toast`, `.toast-success`, `.toast-error` | JS-animated toast notifications |
| `.empty-state`, `.empty-state-icon`, `.empty-state-title`, `.empty-state-description` | Centered empty state pattern |
| `.reading-progress` | Fixed top reading progress bar (item posts) |
| `.back-to-top` | Fixed bottom-right scroll-to-top button |
| `.source-toc`, `.toc-title`, `.toc-h3` | Sticky table of contents sidebar with scroll spy |
| `.save-bar`, `.save-bar-content`, `.save-bar-text`, `.save-bar-actions` | Fixed bottom save bar for settings/workspaces |
| `.filter-chip`, `.filter-chip.active` | Pill-shaped filter buttons |
| `.feed-tab`, `.feed-tab-active` | Horizontal feed navigation tabs |
| `.ws-dropdown`, `.ws-dropdown-menu`, `.ws-dropdown-item` | Hover/focus workspace dropdown |
| `details.dropdown` | Generic dropdown menu (no JS, CSS-only) |
| `.htmx-indicator`, `.source-loading`, `.search-loading`, `.nav-loading` | HTMX loading state indicators |
| `.app-spinner` | Small animated spinner (16px) |

#### Print Styles

Print media hides navigation, filters, TOC, back-to-top, theme toggle, and footer. Links append their `href` in parentheses. Background becomes white, text becomes black.

### The `TEMPLATE` Environment Variable

The active template is set via the `TEMPLATE` env var in `wrangler.toml` under `[vars]` (defaults to `blog`). When changed, run `pnpm resolve-template` (or `pnpm dev:server`, which runs it automatically) to regenerate `templates/src/_resolved.ts`. Only the selected template's code is bundled into the deployed worker.

## URL Structure

| Path | Auth | Description |
|------|------|-------------|
| `/` | No | Public source page (template-driven) |
| `/item/:slug` | No | Public item post page |
| `/item/:slug.md` | No | Raw markdown of item |
| `/s/:token` | No | Unlisted item (share token) |
| `/form/:slug` | No | Public form submission (GET: definition, POST: submit) |
| `/feed.xml` | No | Atom RSS feed |
| `/sitemap.xml` | No | Sitemap |
| `/llms.txt` | No | LLM-readable summary |
| `/.well-known/pignal` | No | Federation discovery |
| `/api/items` | Bearer | Item CRUD |
| `/api/types` | Bearer | Type management |
| `/api/workspaces` | Bearer | Workspace management |
| `/api/settings` | Bearer | Settings management |
| `/api/actions` | Bearer | Site action (form) management |
| `/api/submissions` | Bearer | Submission management |
| `/api/public/items` | No | Public item list (JSON) |
| `/mcp` | Bearer | MCP endpoint (SSE) |
| `/pignal` | Session | Admin dashboard |
| `/pignal/items` | Session | Item management |
| `/pignal/actions` | Session | Form management |
| `/pignal/submissions` | Session | Submission management |
| `/pignal/settings` | Session | Settings (including CTA, webhooks) |

## Extensibility Points

| Extension | Pattern | How to Add |
|-----------|---------|------------|
| New directive | `DirectiveHandler` + registry | Implement handler, call `registry.register()` |
| New form field type | `FieldTypeHandler` + registry | Implement handler, call `fieldTypes.register()` |
| New event listener | `EventBus.on()` | Add listener (e.g., email on submission) |
| New webhook event | `EventBus` | Emit from store, webhook listener auto-fires |
| New MCP tool | `manifest.ts` + `tools.ts` | Follow existing tool pattern |
| New permission | `VALID_PERMISSIONS` array | Add to array, enforce in middleware |
| New settings | `ALLOWED_SETTINGS_KEYS` | Add key (additive only, never remove) |

## Code Conventions

- `import type` required for type-only imports (`consistent-type-imports: error`)
- Unused vars are errors (prefix with `_` to suppress)
- `no-console`: only `console.error` and `console.warn` allowed
- `prefer-const`, `no-var`, `eqeqeq: always`
- All packages: TypeScript strict mode, ES2022 target, `moduleResolution: bundler`
- Server/web use Hono JSX (`jsxImportSource: hono/jsx`)
- **JSX pragma required** for `@pignal/render` and `@pignal/templates` TSX files (packages outside the `jsxImportSource` tsconfig scope):
  ```tsx
  /** @jsxRuntime automatic */
  /** @jsxImportSource hono/jsx */
  ```
