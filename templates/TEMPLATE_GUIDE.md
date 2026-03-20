# Template Guide

This guide covers everything needed to create a new Pignal web template.

Quick start: `pnpm template:create <name>` (from `templates/`) scaffolds a complete template with working defaults.

---

## Template Contract

Every template must export an object conforming to the `Template` interface (defined in `@pignal/templates`, see `templates/src/types.ts`):

```ts
export interface Template {
  // Required components
  SourcePage: (props: SourcePageProps) => any;  // Feed/list view at /
  ItemPost:   (props: ItemPostProps) => any;    // Detail view at /item/:slug
  Layout:     (props: LayoutProps) => any;      // HTML wrapper

  // Optional overrides (fall back to shared components)
  ItemCard?:  (props: ItemCardProps) => any;
  Header?:    (props: HeaderProps) => any;
  Footer?:    (props: FooterProps) => any;
  FilterBar?: (props: FilterBarProps) => any;

  vocabulary: TemplateVocabulary;   // Domain language mapping (from template config)
  seo: TemplateSeoHints;            // Schema.org types (from template config)
  meta: { name: string; description: string };
  styles: string;                   // CSS text (imported from .css file)
}
```

**Registration**: Templates are registered in `web/src/templates/registry.ts`. The `getTemplate()` function reads the `source_template` setting and returns the matching template (defaulting to `blog`).

**Example** (`shop/index.ts`):

```ts
import type { Template } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { ShopSourcePage } from './source-page';
import { ShopItemPost } from './item-post';
import { ShopLayout } from './layout';
import shopStyles from './styles.css';

const config = getTemplateConfig('shop');

export const shopTemplate: Template = {
  SourcePage: ShopSourcePage,
  ItemPost: ShopItemPost,
  Layout: ShopLayout,
  vocabulary: config.vocabulary,
  seo: config.seo,
  meta: { name: 'shop', description: 'Grid-based product catalog layout' },
  styles: shopStyles,
};
```

---

## Prop Types Reference

### SourcePageProps

| Field | Type | Description |
|---|---|---|
| `items` | `Item[]` | Vouched items for the current page |
| `types` | `ItemTypeWithActions[]` | All item types (for filtering) |
| `workspaces` | `WorkspaceSelect[]` | Public workspaces (for filtering) |
| `counts` | `{ total, byType, byWorkspace, byWorkspaceType }` | Item counts for filter badges |
| `settings` | `SettingsMap` | Key-value settings (title, description, toggles) |
| `filters` | `{ typeId?, workspaceId?, tag?, q?, sort }` | Active filter state |
| `pagination` | `{ limit, offset, total }` | Pagination state |
| `paginationBase` | `string` | Base URL with current filters for pagination links |
| `sourceUrl` | `string` | Origin URL of the source (e.g. `https://signals.example.com`) |
| `isHtmxRequest` | `boolean` | Whether this is an HTMX partial request |
| `vocabulary` | `TemplateVocabulary` | Domain language mapping |

### ItemPostProps

| Field | Type | Description |
|---|---|---|
| `item` | `Item` | The item being displayed |
| `settings` | `SettingsMap` | Source settings |
| `renderedContent` | `string` | Pre-rendered HTML from markdown content |
| `headings` | `{ id, text, level }[]` | Extracted headings for table of contents |
| `sourceUrl` | `string` | Origin URL |
| `sourceAuthor` | `string` | Author display name (owner_name > source_title > hostname) |
| `githubUrl` | `string` | GitHub profile URL for author linking |
| `vocabulary` | `TemplateVocabulary` | Domain language mapping |

### LayoutProps

| Field | Type | Description |
|---|---|---|
| `title` | `string` | Page title |
| `head` | `string?` | Extra HTML for `<head>` (meta tags, rel links) |
| `sourceTitle` | `string` | Source display name |
| `sourceUrl` | `string` | Origin URL |
| `settings` | `SettingsMap` | Source settings |
| `children` | `Child` | Page content |

### Item (from @pignal/core)

| Field | Type | Description |
|---|---|---|
| `id` | `string` | UUID |
| `keySummary` | `string` | Item title/headline |
| `content` | `string` | Markdown content body |
| `typeId` | `string?` | Type ID |
| `typeName` | `string?` | Type display name |
| `workspaceId` | `string?` | Workspace ID |
| `workspaceName` | `string?` | Workspace display name |
| `sourceAi` | `string?` | AI source attribution (e.g. `"claude.ai:Claude Desktop"`) |
| `validationActionLabel` | `string?` | Human validation label (e.g. "Verified") |
| `tags` | `string[]?` | Tag array |
| `pinnedAt` | `string?` | ISO date if pinned |
| `isArchived` | `boolean` | Whether archived |
| `visibility` | `'private' \| 'unlisted' \| 'vouched'` | Visibility level |
| `slug` | `string?` | URL slug (vouched items only) |
| `vouchedAt` | `string?` | ISO date when vouched |
| `createdAt` | `string` | ISO creation date |
| `updatedAt` | `string` | ISO last-modified date |

---

## CSS Naming Convention

All template CSS classes must be prefixed with `.<template-name>-` to avoid collisions with base styles and other templates.

```css
/* Good */
.news-card { ... }
.news-card-header { ... }
.news-grid { ... }

/* Bad — collides with other templates or base styles */
.card { ... }
.grid { ... }
```

Template styles are imported as text and injected at runtime via the `styles` field. The base Pico CSS framework and `app.css` styles are always available.

**Wrangler requirement**: `server/wrangler.toml` must include a rule to import `.css` files as text:

```toml
[[rules]]
type = "Text"
globs = ["**/*.css"]
```

Without this rule, CSS imports will fail or return `[object Object]` instead of CSS text.

Shared CSS classes from `app.css` that any template can use:
- `.source-page`, `.source-page--post`, `.source-page--feed`
- `.source-card`, `.source-card-header`, `.source-card-footer`
- `.source-article`, `.source-main`, `.source-category`
- `.item-tags`, `.item-tag`, `.item-tags-footer`
- `.post-meta`, `.post-author`
- `.workspace-badge`, `.validation-badge`
- `.source-loading`, `.htmx-indicator`, `.app-spinner`
- `.container`, `.content`
- `.empty-state`

---

## HTMX Integration

Templates render full pages. HTMX partial requests (filter changes, search, pagination) are handled by the route handler *before* the template is called -- partials bypass templates entirely and return `<FeedResults>` directly.

### How it works

1. Route handler checks `isHtmxRequest(c)` via `HX-Request` header
2. If HTMX: returns only `<FeedResults>` (replaces `#source-results` content)
3. If full page: calls `template.SourcePage(props)` for a complete HTML page

### What templates must provide

Templates must include these HTMX anchor elements in their `SourcePage`:

```tsx
{/* Loading indicator — shown during HTMX requests */}
<div id="source-loading" class="source-loading htmx-indicator">
  <span class="app-spinner" />
</div>

{/* Results container — HTMX swaps content into this div */}
<div id="source-results">
  {/* Your item list, grid, or feed goes here */}
</div>
```

### CRITICAL: All interactive links must use HTMX

**Every link that filters, sorts, paginates, or clears a filter MUST include HTMX attributes.** Without them, clicking a filter triggers a full page reload instead of a smooth partial swap — this is the difference between good UX and broken UX.

The required attributes for **every** interactive `<a>` element (sidebar links, sort tabs, tag chips, pagination, tag clear):

```tsx
<a
  href={url}                        // Fallback for non-JS browsers
  hx-get={url}                      // HTMX request URL
  hx-target="#source-results"       // Swap into results container
  hx-swap="innerHTML"               // Replace inner HTML only
  hx-push-url="true"               // Update browser URL bar
  hx-indicator="#source-loading"    // Show loading spinner
>
```

**Helper pattern** (recommended — avoids repeating 5 attributes):

```tsx
function hxProps(url: string) {
  return {
    'hx-get': url,
    'hx-target': '#source-results',
    'hx-swap': 'innerHTML',
    'hx-push-url': 'true',
    'hx-indicator': '#source-loading',
  };
}

// Usage:
<a href={url} {...hxProps(url)}>Newest</a>
```

### Adding HTMX to search inputs

Search inputs use `hx-trigger` instead of click, plus `hx-vals` to preserve current filter state:

```tsx
<input
  type="text"
  name="q"
  placeholder={`Search ${vocabulary.itemPlural}...`}
  value={filters.q || ''}
  hx-get="/"
  hx-target="#source-results"
  hx-swap="innerHTML"
  hx-trigger="input changed delay:300ms, keyup[key=='Enter']"
  hx-push-url="true"
  hx-indicator="#source-loading"
  hx-vals={JSON.stringify({ type: filters.typeId, workspace: filters.workspaceId })}
/>
```

The `hx-vals` attribute passes current filter state along with the search query so results respect active filters.

### Pagination

Pass `htmxTarget` to the `Pagination` component so pagination links also use HTMX:

```tsx
<Pagination
  total={pagination.total}
  limit={pagination.limit}
  offset={pagination.offset}
  baseUrl={paginationBase}
  htmxTarget="#source-results"
/>
```

### Vary header

The route handler sets `Vary: HX-Request` so browsers cache the full page and HTMX partial responses separately.

---

## Theme Variables

Templates use [Pico CSS v2](https://picocss.com/) variables and custom `--app-*` tokens. Never hardcode colors.

### Pico CSS variables (most commonly used)

| Variable | Usage |
|---|---|
| `--pico-color` | Primary text color |
| `--pico-muted-color` | Secondary/muted text |
| `--pico-primary` | Primary accent color |
| `--pico-card-background-color` | Card/surface background |
| `--pico-background-color` | Page background |
| `--pico-muted-border-color` | Borders, dividers |
| `--pico-border-radius` | Default border radius |
| `--pico-spacing` | Base spacing unit |
| `--pico-transition` | Default transition timing |

### App semantic tokens

| Variable | Usage |
|---|---|
| `--app-success` | Success state (green) |
| `--app-success-bg` | Success background tint |
| `--app-success-border` | Success border tint |
| `--app-error` | Error state (red) |
| `--app-error-bg` | Error background tint |
| `--app-error-border` | Error border tint |
| `--app-info` | Info state (purple) |
| `--app-info-bg` | Info background tint |
| `--app-info-border` | Info border tint |
| `--app-warning` | Warning state (amber) |
| `--app-warning-bg` | Warning background tint |
| `--app-warning-border` | Warning border tint |

### Type color tokens

| Variable | Maps to |
|---|---|
| `--app-type-insight` | Purple |
| `--app-type-decision` | Blue |
| `--app-type-solution` | Green |
| `--app-type-core` | Yellow |
| `--app-type-default` | Gray |

All tokens adapt automatically to light/dark mode via `prefers-color-scheme` and `[data-theme]`.

---

## Template Config

Each template has a corresponding `TemplateConfig` in `templates/src/config.ts`. This config provides vocabulary, SEO hints, MCP content, and schema descriptions that flow through to all public-facing outputs (JSON-LD, llms.txt, Atom feed, MCP server).

```ts
import type { TemplateConfig } from '@pignal/templates';

interface TemplateConfig {
  vocabulary: TemplateVocabulary;  // Domain language mapping
  seo: TemplateSeoHints;           // Schema.org types
  mcp: TemplateMcpConfig;          // MCP instructions, tool descriptions, response labels, schema descriptions
}
```

### SEO Hints

```ts
interface TemplateSeoHints {
  siteSchemaType: string;   // Schema.org @type for source page (e.g. 'Blog', 'WebSite')
  itemSchemaType: string;   // Schema.org @type for items (e.g. 'BlogPosting', 'Product')
}
```

The `seo` field on `Template` is passed through to `buildSourceJsonLd()` and `buildSourcePostingJsonLd()` via `SourcePageProps.seo` and `ItemPostProps.seo`. When `itemSchemaType` is `'Product'`, JSON-LD uses `name` instead of `headline`.

### MCP Config

```ts
interface TemplateMcpConfig {
  instructions: string;                        // Server-level instructions shown to AI on connect
  toolDescriptions: Record<string, string>;    // Per-tool descriptions (tool name → text)
  responseLabels: {
    saved: string;          // "Signal saved!" vs "Product created!"
    updated: string;        // "Signal updated!" vs "Product updated!"
    validated: string;      // "Signal validated!" vs "Product reviewed!"
    notFound: string;       // "Signal not found." vs "Product not found."
    found: string;          // "Found {total} signals (showing {count})"
    visibilityUpdated: string;
    batchComplete: string;
  };
  schemaDescriptions: Record<string, string>; // Per-field Zod .describe() overrides (toolName.fieldName → text)
}
```

The `schemaDescriptions` field lets templates override the generic `.describe()` text on individual Zod schema fields. Keys use `toolName.fieldName` format (e.g., `"save_item.keySummary"`). The MCP agent applies these at tool registration time, restoring domain-specific quality to field-level guidance without modifying core schemas.

The MCP agent reads the `source_template` setting at startup and uses the matching config for:
- **Server instructions** — shown to AI clients on connect
- **Tool descriptions** — per-tool text describing what each tool does in domain terms
- **Response labels** — text returned after tool execution (e.g., "Product created!" for shop)

### Creating a New Template Config

1. Add a new `TemplateConfig` object in `templates/src/config.ts`
2. Add it to the `TEMPLATE_CONFIGS` record (keyed by template name)
3. Write domain-appropriate MCP instructions, tool descriptions, response labels, and schema descriptions
4. (Optional) Add seed data in `templates/seeds/<name>.sql`
5. The `seo` hints, vocabulary, and MCP content are automatically used by:
   - JSON-LD structured data (`web/src/lib/seo.ts`)
   - llms.txt / llms-full.txt (`web/src/lib/geo.ts`)
   - Atom feed (`web/src/lib/rss.ts`)
   - MCP metadata text (`core/src/mcp/tools.ts`)
   - MCP agent (`server/src/mcp/agent.ts`)

---

## Vocabulary Mapping

Vocabulary customizes the domain language shown in the UI. Every template defines a `TemplateVocabulary`:

```ts
interface TemplateVocabulary {
  item: string;          // "signal" | "product" | "article" | "recipe"
  itemPlural: string;    // "signals" | "products" | "articles" | "recipes"
  type: string;          // "type" | "category" | "topic" | "cuisine"
  typePlural: string;    // "types" | "categories" | "topics" | "cuisines"
  workspace: string;     // "workspace" | "collection" | "section" | "cookbook"
  workspacePlural: string;
  vouch: string;         // "vouch" | "list" | "publish" | "approve"
  vouched: string;       // "vouched" | "listed" | "published" | "approved"
}
```

### Examples

| Template | item | type | workspace | vouch |
|---|---|---|---|---|
| Blog | signal | type | workspace | vouch |
| Shop | product | category | collection | list |
| Wiki | article | topic | section | publish |
| Recipe | recipe | cuisine | cookbook | approve |
| Portfolio | project | skill | series | showcase |

### Usage in components

Always use vocabulary for user-facing text:

```tsx
// Good
<p>No {vocabulary.itemPlural} matching this filter.</p>
<label>Search {vocabulary.itemPlural}...</label>

// Bad — hardcoded
<p>No signals matching this filter.</p>
```

---

## Complete Template Checklist

### Files (all in `web/src/templates/<name>/`)

- [ ] `index.ts` — Template export with vocabulary, meta, and styles
- [ ] `source-page.tsx` — Feed/list/grid view
- [ ] `item-post.tsx` — Individual item detail page
- [ ] `layout.tsx` — Layout wrapper (usually delegates to `PublicLayout`)
- [ ] `styles.css` — Scoped CSS with `<name>-*` prefix

### Template config (`templates/src/config.ts`)

- [ ] `TemplateConfig` object created with vocabulary, SEO hints, and MCP content
- [ ] Added to `TEMPLATE_CONFIGS` record (keyed by template name)
- [ ] MCP `instructions` written in domain-appropriate language
- [ ] MCP `toolDescriptions` customized for all 10 tools
- [ ] MCP `responseLabels` customized (saved, updated, validated, notFound, found, visibilityUpdated, batchComplete)
- [ ] MCP `schemaDescriptions` customized for key fields (save_item.keySummary, save_item.content, etc.)

### Registry

- [ ] Import added in `web/src/templates/registry.ts`
- [ ] Entry added to `TEMPLATES` record

### Source page requirements

- [ ] `#source-loading` div with `htmx-indicator` class
- [ ] `#source-results` div wrapping the item list
- [ ] **All filter/sort/tag/pagination links have HTMX attributes** (`hx-get`, `hx-target="#source-results"`, `hx-swap="innerHTML"`, `hx-push-url="true"`, `hx-indicator="#source-loading"`)
- [ ] Search input includes `hx-vals` to preserve current filter state
- [ ] Pagination component receives `htmxTarget="#source-results"`
- [ ] SEO meta tags via `buildMetaTags()`
- [ ] JSON-LD structured data via `buildSourceJsonLd(settings, sourceUrl, props.seo)` + `<JsonLd />`
- [ ] Pagination rel links (`<link rel="prev/next">`)
- [ ] Filter state reflected in page title
- [ ] OG image derived from GitHub avatar or fallback
- [ ] Empty state message using vocabulary

### Item post requirements

- [ ] SEO meta tags via `buildMetaTags()`
- [ ] JSON-LD via `buildSourcePostingJsonLd(item, settings, sourceUrl, description, props.seo)` + `<JsonLd />`
- [ ] `<SourceActionBar>` for copy/share actions
- [ ] Rendered content via `raw(renderedContent)`
- [ ] Type badge and workspace badge
- [ ] Author attribution with GitHub link
- [ ] Date display (`vouchedAt` or `createdAt`)
- [ ] Tags footer with filter links
- [ ] Table of contents (optional, based on `source_show_toc` setting)
- [ ] Reading time (optional, based on `source_show_reading_time` setting)

### CSS requirements

- [ ] All classes prefixed with `<template-name>-`
- [ ] Uses Pico CSS / `--app-*` variables only (no hardcoded colors)
- [ ] Responsive breakpoints for mobile
- [ ] Dark mode works automatically (via CSS variables)

---

## Common Layout Patterns

### Feed (vertical list)

Used by the `blog` template. Items stacked vertically, optionally grouped by timeline.

```css
.news-feed {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
```

Key components: `<FeedResults>` (shared), `<ItemCard>` (shared), `<FilterBar>` (shared sidebar).

### Grid (card grid)

Used by the `shop` template. Responsive multi-column grid.

```css
.shop-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}
```

Best for visual content or items that benefit from scanning.

### Magazine (featured + grid)

Hero item at top, smaller cards below.

```css
.mag-hero { grid-column: 1 / -1; }
.mag-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}
```

### Table/list

Compact rows, good for reference content.

```css
.ref-table { width: 100%; border-collapse: collapse; }
.ref-row { border-bottom: 1px solid var(--pico-muted-border-color); padding: 0.75rem 0; }
```

---

## Available Shared Components

Import from `../../components/`:

| Component | Import path | Purpose |
|---|---|---|
| `PublicLayout` | `public-layout` | Full HTML shell (header, footer, HTMX/JS) |
| `ItemCard` | `item-feed` | Standard item card |
| `FeedResults` | `item-feed` | Timeline-grouped feed with pagination |
| `FilterBar` | `type-sidebar` | Sidebar with type/workspace/tag filters |
| `Pagination` | `pagination` | Page navigation |
| `TypeBadge` | `type-badge` | Colored type label |
| `VisibilityBadge` | `visibility-badge` | Visibility status badge |
| `TableOfContents` | `table-of-contents` | Heading-based TOC sidebar |
| `SourceActionBar` | `source-action-bar` | Copy link / share actions |
| `JsonLd` | `json-ld` | JSON-LD script tag |

Import from `../../lib/`:

| Function | Import path | Purpose |
|---|---|---|
| `buildMetaTags`, `buildSourceJsonLd`, `buildSourcePostingJsonLd`, `escapeHtmlAttr` | `seo` | SEO helpers |
| `stripMarkdown` | `markdown` | Strip markdown to plain text |
| `formatDate`, `relativeTime`, `readingTime` | `time` | Date/time formatting |
| `raw` | `hono/html` | Render pre-escaped HTML strings |

---

## Settings Reference

Templates read configuration from the `settings` map. Key settings:

| Setting | Default | Description |
|---|---|---|
| `source_title` | `'My Pignal'` | Source display name |
| `source_description` | `''` | Source description for meta tags |
| `source_template` | `'blog'` | Active template name (selectable in admin UI at `/pignal/settings`) |
| `source_show_toc` | `'true'` | Show table of contents on post pages |
| `source_show_reading_time` | `'true'` | Show reading time estimates |
| `source_card_style` | `''` | Card style hint (`'grid'` or default) |
| `source_posts_per_page` | `'20'` | Items per page |
| `source_social_github` | `''` | GitHub profile URL |
| `source_social_twitter` | `''` | Twitter profile URL |
| `source_custom_css` | `''` | User-provided custom CSS |
| `source_custom_footer` | `''` | Custom footer HTML |
| `source_logo_text` | `''` | Custom logo text (falls back to title) |
| `source_code_theme` | `'default'` | Code syntax highlighting theme |
| `source_custom_head` | `''` | Custom HTML injected into `<head>` |

---

## Common Pitfalls

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Missing wrangler CSS rule | CSS not loading; `styles` field is empty or undefined | Add `{ type = "Text", globs = ["**/*.css"] }` to `[[rules]]` in `server/wrangler.toml` |
| CSS imported as module instead of text | `styles` renders as `[object Object]` in the page | Ensure the wrangler `Text` rule is present; do not use CSS module syntax (`import styles from './styles.module.css'`) |
| Template not registered | Template exists on disk but is not selectable via `source_template` | Add import and entry to `TEMPLATES` record in `web/src/templates/registry.ts` |
| CSS class collisions | Styles bleed between templates or override base styles | Prefix all CSS classes with `<template-name>-` (e.g., `.shop-grid`, `.blog-hero`) |
| Hardcoded colors | Theme breaks in dark mode | Use Pico CSS variables (`--pico-*`) and app tokens (`--app-*`) only |
| Missing HTMX anchors | Filter/search/pagination stops working | Include `#source-loading` and `#source-results` divs in `SourcePage` |
| Forgetting vocabulary | UI shows hardcoded "signal" or "item" instead of domain term | Always use `vocabulary.item`, `vocabulary.itemPlural`, etc. for user-facing text |
| Missing template config | MCP, llms.txt, JSON-LD, Atom feed use generic "item" language | Register a `TemplateConfig` in `templates/src/config.ts` with vocabulary, SEO hints, and MCP content |
