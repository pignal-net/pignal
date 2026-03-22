# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Pignal — an AI-native website platform powered by Cloudflare Workers + D1. A growing template library with built-in SEO, structured data, and LLM-readiness. Every site is an MCP server for AI-driven content lifecycle management. REST API and web dashboard included. Open source (AGPL-3.0) for full customization.

## Commands

All commands run from the repo root using pnpm workspaces:

```bash
pnpm install              # Install all workspace dependencies
pnpm dev:server           # Start local dev server (localhost:8787)
pnpm deploy:server        # Deploy to Cloudflare Workers
pnpm db:migrate           # Apply D1 migrations locally
pnpm db:migrate:prod      # Apply D1 migrations to production
pnpm db:seed:blog         # Seed blog template data locally
pnpm db:seed:shop         # Seed shop template data locally
pnpm template:create      # Scaffold a new template
pnpm css:build            # Build Tailwind v4 CSS (web/src/styles/input.css → web/src/static/tailwind.css)
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
@pignal/core        ItemStore, route factories, validation, MCP tools (GENERIC)
  ↑
@pignal/templates   Template configs, vocabulary, SEO, MCP config, schema overrides, seed SQL
  ↑
@pignal/web         Hono JSX SSR admin dashboard + template-driven source page
  ↑
@pignal/server      Deployable Worker: REST + MCP + Web, D1 storage, token auth
```

### Data Flow

```
Request → Worker → Auth Middleware → Store Middleware → Route Handler → ItemStore → D1
```

Every request creates an `ItemStore` from D1 via middleware. The store contains all business logic.

### Key Packages

| Package | Path | What It Does |
|---------|------|-------------|
| `@pignal/db` | `db/` | Drizzle ORM schemas (`schema.ts`: items, item_types, type_actions, workspaces, settings) and TypeScript types (`ItemStoreRpc`, `ItemWithMeta`, `ListParams`, etc.). Items have a `tags` column (JSON text array). |
| `@pignal/core` | `core/` | `ItemStore` (pure business logic accepting any Drizzle SQLite DB), route factories (`createItemRoutes`, `createTypeRoutes`, etc.), Zod validation schemas, MCP tool operations, federation (`/.well-known/pignal` handler). Template-agnostic. |
| `@pignal/templates` | `templates/` | Template configs (vocabulary, SEO hints, MCP instructions, schema descriptions), `Template` interface, prop types, seed SQL |
| `@pignal/web` | `web/` | Admin dashboard + public source page via Hono JSX SSR. HTMX for interactivity. Tailwind v4 for styling. Template JSX components (blog, shop). HMAC session cookies, CSRF protection, CSP headers, safe markdown rendering |
| `@pignal/server` | `server/` | Wires everything together. D1 storage via `storeMiddleware`, token auth, health endpoint, mounts route factories at `/api/*`, MCP at `/mcp`, public source page at `/`, admin UI at `/pignal`, `/.well-known/pignal` for federation |

### Route Factory Pattern

All core route factories accept `RouteFactoryConfig` to decouple auth/storage resolution from business logic:

```typescript
type RouteFactoryConfig = {
  getStore: (c: Context) => ItemStoreRpc;  // How to get the store
  middleware?: MiddlewareHandler[];          // Auth middleware to apply
};
```

The server creates an `ItemStore(drizzle(env.DB))` in middleware.

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

## Key Source Locations

- **ItemStore**: `core/src/store/item-store.ts` — All CRUD, search, stats, settings (60s cache), vouch/slug management
- **Permissions**: `core/src/auth/permissions.ts` — Flat permission definitions (9 permissions: `save_item`, `list_items`, `edit_item`, `delete_item`, `validate_item`, `get_metadata`, `manage_types`, `manage_workspaces`, `manage_settings`) + `hasPermission`, `parsePermissions`, `validatePermissions`
- **Route factories**: `core/src/routes/` — items, types, workspaces, stats, settings, public
- **Validation schemas**: `core/src/validation/schemas.ts` — Zod schemas with hard limits + MCP tool schemas (includes `tags` array validation)
- **MCP tools**: `core/src/mcp/tools.ts` — save_item, list_items, search_items, validate_item, get_metadata operations
- **Template configs**: `templates/src/config.ts` — TemplateConfig, vocabulary, SEO hints, MCP config with schemaDescriptions
- **Template types**: `templates/src/types.ts` — Template interface, SourcePageProps, ItemPostProps, LayoutProps
- **Template seeds**: `templates/seeds/` — blog.sql, shop.sql (seed data per template)
- **Federation**: `core/src/federation/` — `well-known.ts` (handler), `types.ts` (WellKnownResponse, etc.)
- **DB schema**: `db/src/schema.ts` — 5 tables (items, item_types, type_actions, workspaces, settings) + api_keys. Items include `tags` (JSON text array).
- **TypeScript types**: `db/src/types.ts` — `ItemStoreRpc` interface, all data types (`ItemWithMeta`, `ItemSelect`, etc.)
- **Web templates**: `web/src/templates/` — Template JSX components: `registry.ts` (lookup), `blog/` (default), `shop/` (grid catalog). All styling via Tailwind utility classes. Types/config in `@pignal/templates`.
- **Design tokens / input CSS**: `web/src/styles/input.css` — `@theme` block (colors, shadows, radii, typography), dark mode overrides, base layer styles, `@layer components` classes. Built to `web/src/static/tailwind.css` via `pnpm css:build`.
- **SVG icons**: `web/src/components/icons.tsx` — 16 shared inline SVG icon components (IconSun, IconMoon, IconMonitor, IconGitHub, IconTwitter, IconRSS, IconHamburger, IconExternalLink, IconChevronLeft, IconChevronDown, IconLogout, IconKey, IconSettings, IconList, IconTag, IconEmptyInbox).
- **Theme engine**: `web/src/lib/theme.ts` — Generates `--tw-*` CSS custom properties from source settings for per-source color customization. Exports `buildThemeCss`, `buildThemeStyleTag`, `THEME_TOKENS`.
- **Web pages**: `web/src/pages/` — Hono JSX components (dashboard at `/pignal`, items, source-page at `/` with type/workspace/tag filtering, item-post at `/item/:slug`, settings, api-keys)
- **Web middleware**: `web/src/middleware/` — session (protects `/pignal/*`), CSRF, security headers
- **Server entry**: `server/src/index.ts` — Hono app, mounts all routes
- **Store middleware**: `server/src/middleware/store.ts` — Creates ItemStore from D1
- **Permission middleware**: `server/src/middleware/permission-auth.ts` — `requirePermission`, `requireByMethod`, `resolveItemPermission`, `mcpPermissionCheck`
- **Token auth**: `server/src/middleware/token-auth.ts` — Bearer token validation (SERVER_TOKEN → admin, API keys → flat permissions)
- **MCP agent**: `server/src/mcp/agent.ts` — `SelfHostedMcpAgent` with 10 registered tools, applies template `schemaDescriptions`

## Template System

The template system is split across two packages:
- **`@pignal/templates`** (`templates/`) — Config, types, seed data. Defines `TemplateConfig` (vocabulary, SEO hints, MCP config with `schemaDescriptions`), `Template` interface, and prop types.
- **`@pignal/web`** (`web/src/templates/`) — JSX components (blog, shop) and registry. Each template folder contains `index.tsx`, `source-page.tsx`, `item-post.tsx`, and `layout.tsx`. All styling uses Tailwind utility classes directly in JSX.

### Template Contract

Every template exports an object conforming to the `Template` interface (`templates/src/types.ts`):

- **Required components**: `SourcePage`, `ItemPost`, `Layout`, `PartialResults`
- **Optional overrides**: `ItemCard`, `Header`, `Footer`, `FilterBar` (fall back to shared components)
- **`vocabulary`**: `TemplateVocabulary` — maps generic terms (item, type, workspace, vouch) to domain-specific language
- **`seo`**: `TemplateSeoHints` — Schema.org types for JSON-LD
- **`meta`**: `{ name, description }` — template metadata
- **`styles`**: Empty string (`''`) — all styling uses Tailwind utility classes in JSX

### Template Config

Each template has a `TemplateConfig` in `templates/src/config.ts` with:
- **`vocabulary`** — domain language mapping (e.g., "product", "category", "collection" for shop)
- **`seo`** — Schema.org `@type` for source page and items
- **`mcp`** — instructions, tool descriptions, response labels, and `schemaDescriptions` (per-field Zod `.describe()` overrides for rich MCP quality)

### Template Registry

Templates are registered in `web/src/templates/registry.ts`. The `getTemplate(templateName)` function returns the matching template (defaulting to `blog`).

Available templates:
- **blog** (default) — Vertical feed layout with timeline grouping
- **shop** — Grid-based product catalog layout

### Creating a New Template

1. Add a `TemplateConfig` in `templates/src/config.ts` with vocabulary, SEO, MCP config, and `schemaDescriptions`
2. Run `pnpm template:create <name>` (from `templates/`) to scaffold JSX components in `web/src/templates/<name>/`
3. Implement `source-page.tsx`, `item-post.tsx`, and `layout.tsx` using Tailwind utility classes
4. (Optional) Add seed data in `templates/seeds/<name>.sql`

See `templates/TEMPLATE_GUIDE.md` for the full contract, prop types, and checklist.

### Design System

#### Architecture Overview

- **Tailwind v4** with CSS-first configuration at `web/src/styles/input.css`
- Built to `web/src/static/tailwind.css` via `pnpm css:build` (watch mode: `pnpm css:watch`)
- The compiled CSS is imported as text via Wrangler rules (configured in `wrangler.toml` with `type = "Text"` for `.css` and `.png` files) and served at `/static/tailwind.css`
- Theme engine (`web/src/lib/theme.ts`) generates `--tw-*` CSS custom properties from source settings, overriding the defaults in the `@theme {}` block
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

Shared icon components in `web/src/components/icons.tsx`. All icons are inline SVGs with no external dependencies.

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

`theme.ts` reads these from settings and generates a `<style>` tag with CSS variable overrides for both light and dark mode. Dark mode values are automatically derived using `color-mix()`. Custom CSS is also supported via the `source_custom_css` setting (sanitized, injected via `<style>`).

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

These classes are defined in the `@layer components` block of `input.css` and referenced by JavaScript (`app.js`). Use them as-is:

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

The active template is set via the `TEMPLATE` env var in `wrangler.toml` under `[vars]` (defaults to `blog`). When changed and redeployed, the public source page renders using the new template's components, vocabulary, and styles.

## Code Conventions

- `import type` required for type-only imports (`consistent-type-imports: error`)
- Unused vars are errors (prefix with `_` to suppress)
- `no-console`: only `console.error` and `console.warn` allowed
- `prefer-const`, `no-var`, `eqeqeq: always`
- All packages: TypeScript strict mode, ES2022 target, `moduleResolution: bundler`
- Server/web use Hono JSX (`jsxImportSource: hono/jsx`)
