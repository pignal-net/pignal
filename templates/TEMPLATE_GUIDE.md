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
  styles: string;                   // Empty string — all styling via Tailwind utilities in JSX
}
```

**Registration**: Templates are registered in `web/src/templates/registry.ts`. The `getTemplate()` function receives the template name from the `TEMPLATE` env var and returns the matching template (defaulting to `blog`).

**Example** (`shop/index.ts`):

```ts
import type { Template } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { ShopSourcePage } from './source-page';
import { ShopItemPost } from './item-post';
import { ShopLayout } from './layout';
const config = getTemplateConfig('shop');

export const shopTemplate: Template = {
  SourcePage: ShopSourcePage,
  ItemPost: ShopItemPost,
  Layout: ShopLayout,
  vocabulary: config.vocabulary,
  seo: config.seo,
  meta: { name: 'shop', description: 'Grid-based product catalog layout' },
  styles: '',
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

## Styling Convention

Templates use **Tailwind v4 utility classes** directly in JSX. There are no per-template CSS files — all templates set `styles: ''`. Never create a separate `styles.css` file for a template.

A single compiled CSS file (`web/src/static/tailwind.css`, built from `web/src/styles/input.css`) provides the design system tokens and base styles for all pages. Run `pnpm css:build` before deploying (or `pnpm css:watch` during development).

### Design tokens

All tokens are defined in `input.css` under `@theme {}` and adapt to light/dark mode automatically. Use them as Tailwind utility classes or as CSS custom properties for inline styles.

**Surface colors:**

| Utility | Usage |
|---|---|
| `bg-bg` | Container background |
| `bg-bg-page` | Page/body background |
| `bg-surface` | Card/surface background |
| `bg-surface-raised` | Elevated surface (e.g., code blocks, nested cards) |
| `bg-surface-hover` | Surface hover state |

**Text colors:**

| Utility | Usage |
|---|---|
| `text-text` | Primary text |
| `text-muted` | Secondary/muted text |
| `text-primary` | Accent color (links, interactive elements) |

**Border colors:**

| Utility | Usage |
|---|---|
| `border-border` | Standard borders, dividers |
| `border-border-subtle` | Subtle card borders, section separators |

**Shadows:**

| Utility | Usage |
|---|---|
| `shadow-xs` | Minimal depth (buttons at rest) |
| `shadow-sm` | Light depth (button hover) |
| `shadow-card` | Standard card elevation |
| `shadow-card-hover` | Card hover elevation |
| `shadow-md` | Medium depth (dropdowns) |
| `shadow-lg` | High depth (modals, toast) |

**Semantic colors:**

| Utility | Usage |
|---|---|
| `text-success`, `bg-success-bg`, `border-success-border` | Success state |
| `text-error`, `bg-error-bg`, `border-error-border` | Error state |
| `text-warning`, `bg-warning-bg`, `border-warning-border` | Warning state |
| `text-info`, `bg-info-bg`, `border-info-border` | Info state |

**CSS custom properties** (for inline styles or `color-mix`):

Use these when Tailwind utilities are not sufficient (e.g., in `style` attributes or `color-mix()` expressions):

`var(--color-primary)`, `var(--color-primary-hover)`, `var(--color-primary-focus)`, `var(--color-primary-inverse)`, `var(--color-secondary)`, `var(--color-text)`, `var(--color-muted)`, `var(--color-border)`, `var(--color-border-subtle)`, `var(--color-surface)`, `var(--color-surface-raised)`, `var(--color-bg-page)`, `var(--color-success)`, `var(--color-error)`, `var(--color-warning)`, `var(--color-info)`

### Standard component patterns

**Card:**

```tsx
<div class="bg-surface rounded-xl border border-border-subtle shadow-card p-6">
  {/* card content */}
</div>
```

**Card with hover:**

```tsx
<a class="bg-surface rounded-xl border border-border-subtle shadow-card p-6 hover:shadow-card-hover transition-shadow block">
  {/* clickable card content */}
</a>
```

**Empty state** (use the `.empty-state` CSS class pattern defined in `input.css`):

```tsx
<div class="empty-state">
  <IconEmptyInbox class="empty-state-icon" />
  <p class="empty-state-title">No {vocabulary.itemPlural} found</p>
  <p class="empty-state-description">
    Try adjusting your filters or check back later.
  </p>
</div>
```

**Tag pill:**

```tsx
<a class="rounded-full bg-muted/8 border border-border-subtle px-2.5 py-0.5 text-xs text-muted hover:text-primary hover:border-primary transition-colors">
  tagname
</a>
```

**Badge (tinted)** — use `color-mix` for the background with a colored text:

```tsx
<span
  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
  style={`background: color-mix(in srgb, ${typeColor} 15%, transparent); color: ${typeColor};`}
>
  Badge Text
</span>
```

### Article typography hierarchy

Use these patterns for item post pages:

```tsx
{/* Title */}
<h1 class="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-4">
  {item.keySummary}
</h1>

{/* Content separator (no border, just vertical space) */}
<div class="mt-8">
  {raw(renderedContent)}
</div>

{/* Tags footer */}
<footer class="mt-10 pt-6 border-t border-border-subtle flex flex-wrap gap-2">
  {tags.map(tag => <a class="rounded-full bg-muted/8 border border-border-subtle px-2.5 py-0.5 text-xs text-muted">{tag}</a>)}
</footer>
```

### Responsive patterns

**Sidebar + main content (source page with filter sidebar):**

```tsx
<div class="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
  <aside>{/* sidebar filters */}</aside>
  <main>{/* item feed/grid */}</main>
</div>
```

**Responsive grid (cards):**

```tsx
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* card items */}
</div>
```

**Table of contents hidden on smaller screens:**

```tsx
<div class="max-xl:hidden">
  <TableOfContents headings={headings} />
</div>
```

### SVG icons

Import SVG icon components from `../../components/icons`. All icons default to 16x16 with `currentColor` fill/stroke:

| Icon | Name | Category |
|---|---|---|
| `IconSun` | Sun (light mode) | Theme |
| `IconMoon` | Moon (dark mode) | Theme |
| `IconMonitor` | Monitor (auto mode) | Theme |
| `IconGitHub` | GitHub logo | Social |
| `IconTwitter` | X / Twitter logo | Social |
| `IconRSS` | RSS feed | Social |
| `IconHamburger` | Menu / hamburger | Navigation |
| `IconExternalLink` | External link arrow | Navigation |
| `IconChevronLeft` | Left chevron | Navigation |
| `IconChevronDown` | Down chevron | Navigation |
| `IconLogout` | Logout / sign out | Navigation |
| `IconKey` | API key | Content |
| `IconSettings` | Settings gear | Content |
| `IconList` | Bulleted list | Content |
| `IconTag` | Tag label | Content |
| `IconEmptyInbox` | Empty inbox (48x48) | Empty states |

Usage: `<IconSun class="w-4 h-4" />` or `<IconSun size={18} />`

### Dark mode

Dark mode is handled automatically by CSS custom properties — tokens switch values based on `prefers-color-scheme` and `[data-theme]`. **Never hardcode hex colors in JSX.** Always use design tokens (`text-text`, `text-muted`, `bg-surface`, `border-border-subtle`, etc.) or CSS custom properties (`var(--color-*)`). If you use tokens correctly, dark mode works with zero extra effort.

### Theme customization

Source owners can set 5 customizable accent colors via settings (e.g., `source_color_primary`, `source_color_secondary`, `source_color_text`, `source_color_muted`, `source_color_border`). The theme engine (`web/src/lib/theme.ts`) generates `--tw-*` CSS custom properties that override the defaults in `@theme {}`. All tokens adapt automatically to light/dark mode via `prefers-color-scheme` and `[data-theme]`.

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

## Type Color Tokens

| CSS variable | Maps to |
|---|---|
| `--color-type-insight` | Purple |
| `--color-type-decision` | Blue |
| `--color-type-solution` | Green |
| `--color-type-core` | Yellow |
| `--color-type-default` | Gray |

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

The MCP agent reads the `TEMPLATE` env var at startup and uses the matching config for:
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

- [ ] `index.ts` — Template export with vocabulary, meta, and `styles: ''`
- [ ] `source-page.tsx` — Feed/list/grid view
- [ ] `item-post.tsx` — Individual item detail page
- [ ] `layout.tsx` — Layout wrapper (usually delegates to `PublicLayout`)

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

### Styling requirements

- [ ] Uses Tailwind utility classes only (no hardcoded hex colors)
- [ ] Uses design tokens: `bg-surface`, `bg-surface-raised`, `bg-bg-page`, `text-text`, `text-muted`, `text-primary`, `border-border`, `border-border-subtle`
- [ ] Cards use `rounded-xl border border-border-subtle shadow-card` (not `border-border`)
- [ ] Card hover uses `hover:shadow-card-hover transition-shadow`
- [ ] Shadows use token names: `shadow-card`, `shadow-card-hover`, `shadow-xs`, `shadow-sm`, `shadow-md`, `shadow-lg`
- [ ] Empty states use `.empty-state` pattern with `.empty-state-icon`, `.empty-state-title`, `.empty-state-description`
- [ ] Tag pills use `rounded-full bg-muted/8 border border-border-subtle px-2.5 py-0.5 text-xs`
- [ ] Article titles use `text-3xl sm:text-4xl font-bold tracking-tight leading-tight`
- [ ] Tags footer uses `mt-10 pt-6 border-t border-border-subtle`
- [ ] Responsive: grid collapses on mobile, sidebar stacks on `lg:`, ToC hidden via `max-xl:hidden`
- [ ] Sidebar layout uses `grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8`
- [ ] Touch targets: minimum 44px height for interactive elements (links, buttons, chips)
- [ ] Dark mode works automatically via CSS custom properties (no hardcoded colors, no `dark:` overrides needed)
- [ ] No separate `styles.css` file created — all styling via Tailwind utilities in JSX
- [ ] `styles: ''` in template export (always empty string)

---

## Common Layout Patterns

### Feed (vertical list)

Used by the `blog` template. Items stacked vertically, optionally grouped by timeline.

```tsx
<div class="flex flex-col gap-6">
  {/* item cards */}
</div>
```

Key components: `<FeedResults>` (shared), `<ItemCard>` (shared), `<FilterBar>` (shared sidebar).

### Grid (card grid)

Used by the `shop` template. Responsive multi-column grid.

```tsx
<div class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
  {/* card items */}
</div>
```

Best for visual content or items that benefit from scanning.

### Magazine (featured + grid)

Hero item at top, smaller cards below.

```tsx
<div class="col-span-full">{/* hero item */}</div>
<div class="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
  {/* smaller cards */}
</div>
```

### Table/list

Compact rows, good for reference content.

```tsx
<table class="w-full border-collapse">
  <tr class="border-b border-border py-3">{/* row content */}</tr>
</table>
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
| `TEMPLATE` (env var) | `'blog'` | Active template name (set in `wrangler.toml` under `[vars]`) |
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
| Forgot `pnpm css:build` | Tailwind CSS file missing or stale, unstyled pages | Run `pnpm css:build` before deploying, or use `pnpm css:watch` during development |
| Created a separate `styles.css` file | Extra CSS file not loaded, styles missing | Delete it. All styling uses Tailwind utility classes in JSX. Set `styles: ''` in the template export |
| Used `border-border` on cards | Borders too harsh, especially in dark mode | Use `border-border-subtle` for card borders and section separators. Reserve `border-border` for table rows and strong dividers |
| Used raw `shadow-sm` on cards | Card elevation inconsistent across templates | Use `shadow-card` for card resting state and `shadow-card-hover` for hover. `shadow-sm`/`shadow-md` are for buttons and dropdowns |
| No `.empty-state` pattern | Empty states look inconsistent, no icon, poor alignment | Use `.empty-state` container with `.empty-state-icon`, `.empty-state-title`, `.empty-state-description` classes |
| Hardcoded hex colors | Theme breaks in dark mode, user color customization ignored | Use Tailwind design tokens (`text-text`, `text-muted`, `bg-surface`, `border-border-subtle`) or CSS vars (`var(--color-*)`) |
| Forgot dark mode testing | Page looks fine in light mode but broken in dark | Never hardcode colors. Use CSS custom property tokens that switch automatically. Test both modes |
| Missing HTMX anchors | Filter/search/pagination stops working | Include `#source-loading` and `#source-results` divs in `SourcePage` |
| Forgetting vocabulary | UI shows hardcoded "signal" or "item" instead of domain term | Always use `vocabulary.item`, `vocabulary.itemPlural`, etc. for user-facing text |
| Missing template config | MCP, llms.txt, JSON-LD, Atom feed use generic "item" language | Register a `TemplateConfig` in `templates/src/config.ts` with vocabulary, SEO hints, and MCP content |
| Small touch targets | Buttons/links hard to tap on mobile | Ensure all interactive elements have at least 44px height (filter chips, feed tabs, pagination links) |
| Article title too small | Post page title doesn't stand out from body text | Use `text-3xl sm:text-4xl font-bold tracking-tight leading-tight` for article titles |
