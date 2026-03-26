# Template Generation Guide

This document is the prompt context for AI-driven template generation. Read this **before** generating any template.

## What a Template Generation Produces

Every template generates exactly 3 artifacts, all within `templates/src/<name>/`:

1. **Config** (`config.ts`) -- `TemplateProfile` + vocabulary, SEO, MCP instructions, schemaDescriptions
2. **Visual JSX** (`index.tsx`, `source-page.tsx`, `item-post.tsx`, `layout.tsx`) -- template components with JSX pragmas
3. **Seed SQL** in `templates/seeds/<name>.sql` -- types, actions, workspaces, settings, quality guidelines

Auto-registration is handled by `pnpm template:create`, which updates `templates/src/all-configs.ts` and `templates/scripts/resolve-template.ts`. Build-time resolution via `resolve-template` generates `templates/src/_resolved.ts`.

---

## Differentiation Rules

Before creating a new template, determine whether it is truly a **new template** or just **different seed data** for an existing one.

### Create a new template when:
- The **layout** is structurally different (e.g., feed vs grid vs timeline vs table)
- The **content structure** requires different card/post components (e.g., rating scores, episode numbers, book covers)
- The **validation workflow** is fundamentally different (e.g., spaced repetition vs binary vouch)

### Do NOT create a new template when:
- Only the **vocabulary** changes (e.g., "tech blog" vs "personal blog" -- both are feed + articles)
- Only the **seed data** differs (e.g., "photography portfolio" vs "design portfolio" -- both are grid + media)
- The difference is **cosmetic** (colors, fonts) -- that's CSS theming, not a template

### Always check the catalog first:
1. Read `templates/src/catalog.ts` -- scan every entry for your proposed ID, domain, layout, and contentType
2. If an entry with your ID exists and is `rejected`, read `rejectionReason` -- do not re-propose it
3. If entries share your domain+layout or layout+contentType combo, read their differentiators and justify how yours is structurally different

---

## The Template Catalog

The catalog at `templates/src/catalog.ts` is the single source of truth for all templates -- shipped, planned, and rejected. Before generating:

1. Read the full `TEMPLATE_CATALOG` array in `catalog.ts`
2. Scan for ID conflicts -- if your proposed ID already exists, stop
3. Scan for structural overlap -- look at entries with the same domain, layout, or contentType
4. If your proposed template was previously rejected, read the `rejectionReason` and do NOT re-propose it

---

## Profile-First Workflow

**Always write the profile FIRST**, validate against the catalog, then generate.

1. Read `templates/src/catalog.ts` -- understand the full landscape of existing, planned, and rejected templates
2. Draft the `TemplateProfile` with all fields (id, displayName, tagline, description, domain, contentType, layout, audience, useCases, differentiators, seedData)
3. Verify the ID does not appear in the catalog
4. Verify no existing entry shares the same domain+layout+contentType without clear structural differentiation
5. Run `pnpm template:create <name>` to scaffold the template folder at `templates/src/<name>/`
6. Fill in the `TemplateConfig` in `templates/src/<name>/config.ts`
7. Add a catalog entry in `catalog.ts` with status `'shipped'`
8. Generate the remaining artifacts (JSX components, seed SQL)

---

## Config Generation Rules

### Vocabulary
- Map all 8 generic terms to domain-specific language
- `item` -- the primary content unit (e.g., "signal", "product", "recipe", "episode")
- `type` -- the categorization system (e.g., "type", "category", "cuisine", "genre")
- `workspace` -- the grouping mechanism (e.g., "workspace", "collection", "shelf", "season")
- `vouch`/`vouched` -- the publishing action (e.g., "vouch"/"vouched", "list"/"listed", "publish"/"published")

### MCP Instructions
- 2-3 sentences describing the domain
- List all 10 tools with domain-specific names:
  - `save_item`, `list_items`, `search_items`, `update_item`, `validate_item`
  - `vouch_item`, `batch_vouch_items`, `get_metadata`, `create_workspace`, `create_type`
- End with "Always call get_metadata first..."

### Schema Descriptions
- Must be domain-specific, not generic
- `save_item.keySummary` -- describe what a good title/summary looks like for this domain
- `save_item.content` -- describe what the content body should contain
- `save_item.typeId` -- use domain vocabulary for the type system
- `save_item.workspaceId` -- use domain vocabulary for grouping
- `save_item.tags` -- give domain-relevant tag examples
- `create_workspace.name` -- domain-specific workspace naming
- `create_type.name` -- domain-specific type naming
- `create_type.actions` -- domain-specific validation actions

### Response Labels
- All labels must use domain vocabulary
- `saved` -- "Recipe saved!" not "Item saved!"
- `found` -- "Found {total} recipes (showing {count})"
- `workspaceCreated` -- "Shelf created!" or "Collection created!"

---

## Seed Generation Rules

### Types (3-5 per template)
- Each type needs: `name`, `description`, `icon` (emoji), `color` (hex), `guidance`, `actions`
- `guidance.pattern` -- a fill-in-the-blank pattern for the keySummary
- `guidance.example` -- a concrete example following the pattern
- `guidance.whenToUse` -- one sentence explaining when to choose this type
- `guidance.contentHints` -- formatting guidance specific to this type's content

### Validation Actions (2-4 per type)
- Domain-appropriate evaluation criteria
- First action should be the positive/success case
- Include at least one negative/failure case
- Actions should drive meaningful quality evaluation

### Workspaces (3-5 per template)
- Domain-appropriate organizational categories
- Most should be `visibility: 'public'` for source page filtering
- Use `visibility: 'private'` for internal/draft groupings

### Settings
- `sourceTitle` -- sensible default for the domain
- `sourceDescription` -- one-line description
- `qualityGuidelines` -- tailored to the content type:
  - `keySummary.tips` -- how to write a good title for this domain
  - `content.tips` -- how to write good content for this domain
  - `formatting` -- 4-6 markdown formatting tips relevant to the content
  - `avoid` -- 3-4 common mistakes for this content type
- `validationLimits` -- appropriate min/max for keySummary and content

### Generating SQL from Seed Data
Run `pnpm seed:generate <name>` to convert the `TemplateSeedData` from the profile into a SQL file. This ensures UUIDs are generated consistently and the SQL matches the schema exactly.

---

## Visual Generation Rules

### JSX Pragma Requirement

All template `.tsx` files **must** include these pragmas at the very top of the file:

```tsx
/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
```

Without these pragmas, JSX compilation will fail.

### Layout Patterns
Reference existing templates as starting points:
- **feed** -- `blog/` (vertical chronological stream)
- **sidebar-grid** -- `shop/` (persistent sidebar + grid main)
- **grid** -- adapt from shop without sidebar
- **timeline** -- vertical with date/version markers
- **table** -- HTML table with sortable headers
- **magazine** -- hero card + mixed grid below
- **directory** -- categorized listing with alphabetical sections
- **dashboard** -- metrics/stats cards

### Styling Conventions

All templates use **Tailwind v4 utility classes only** -- no separate CSS files. Every template sets `styles: ''`.

**Design tokens (full list):**

| Category | Tokens |
|---|---|
| Surface | `bg-surface`, `bg-surface-raised`, `bg-surface-hover`, `bg-bg`, `bg-bg-page` |
| Text | `text-text`, `text-muted`, `text-primary` |
| Border | `border-border`, `border-border-subtle` |
| Shadow | `shadow-card`, `shadow-card-hover`, `shadow-xs`, `shadow-sm`, `shadow-md`, `shadow-lg` |
| Semantic | `text-success`/`bg-success-bg`/`border-success-border`, `text-error`/`bg-error-bg`/`border-error-border`, `text-warning`/`bg-warning-bg`/`border-warning-border`, `text-info`/`bg-info-bg`/`border-info-border` |

**CSS custom properties** (for inline styles): `var(--color-primary)`, `var(--color-muted)`, `var(--color-border)`, `var(--color-surface)`, `var(--color-text)`, `var(--color-bg-page)`, etc.

**Component patterns:**

- **Card**: `bg-surface rounded-xl border border-border-subtle shadow-card p-6`
- **Card hover**: add `hover:shadow-card-hover transition-shadow`
- **Empty state**: `.empty-state` container with `.empty-state-icon`, `.empty-state-title`, `.empty-state-description`
- **Tag pill**: `rounded-full bg-muted/8 border border-border-subtle px-2.5 py-0.5 text-xs`
- **Badge (tinted)**: `color-mix(in srgb, ${color} 15%, transparent)` background with colored text

**Article typography:**

- Title: `text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-4`
- Content separator: `mt-8` (space only, no border)
- Tags footer: `mt-10 pt-6 border-t border-border-subtle`

**Responsive patterns:**

- Sidebar layout: `grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8`
- Card grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`
- ToC hidden: `max-xl:hidden` wrapper
- Breakpoints: `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px)

**Available SVG icons** (import from `@pignal/render/components/icons`):
`IconSun`, `IconMoon`, `IconMonitor`, `IconGitHub`, `IconTwitter`, `IconRSS`, `IconHamburger`, `IconExternalLink`, `IconChevronLeft`, `IconChevronDown`, `IconLogout`, `IconKey`, `IconSettings`, `IconList`, `IconTag`, `IconEmptyInbox`

**Dark mode**: Handled automatically by CSS custom property tokens. Never hardcode hex colors -- if you use tokens, dark mode works with zero extra effort.

**Theme customization**: Source owners can customize 5 accent colors. The theme engine renders `--tw-*` CSS vars that override `@theme {}` defaults.

### Import Patterns

Shared components and lib utilities live in `@pignal/render`:

```tsx
// Shared components
import { PublicLayout } from '@pignal/render/components/public-layout';
import { FeedResults } from '@pignal/render/components/item-feed';
import { FilterBar } from '@pignal/render/components/type-sidebar';
import { Pagination } from '@pignal/render/components/pagination';
import { TypeBadge } from '@pignal/render/components/type-badge';
import { EmptyState } from '@pignal/render/components/empty-state';
import { JsonLd } from '@pignal/render/components/json-ld';
import { SourceActionBar } from '@pignal/render/components/source-action-bar';
import { ItemCard } from '@pignal/render/components/item-card';
import { VisibilityBadge } from '@pignal/render/components/visibility-badge';
import { CtaBlock } from '@pignal/render/components/cta-block';
import { ActionForm } from '@pignal/render/components/action-form';
import { Testimonials } from '@pignal/render/components/testimonials';
import { LanguageSwitcher } from '@pignal/render/components/language-switcher';
import { IconSun, IconMoon, IconEmptyInbox } from '@pignal/render/components/icons';

// Shared lib utilities
import { buildMetaTags, buildSourceJsonLd, buildSourcePostingJsonLd } from '@pignal/render/lib/seo';
import { formatDate, relativeTime, readingTime } from '@pignal/render/lib/time';
import { stripMarkdown } from '@pignal/render/lib/markdown';
import { generateThemeStyles } from '@pignal/render/lib/theme';
import { sanitizeCss } from '@pignal/render/lib/css-sanitize';
import { renderContentWithDirectives } from '@pignal/render/lib/directives';

// Template-local imports (relative within the template folder)
import { shopConfig as config } from './config';
import { ShopSourcePage } from './source-page';

// Types from @pignal/templates
import type { Template, PartialResultsProps, SourcePageProps, ItemPostProps, LayoutProps } from '../types';
import type { TemplateConfig, TemplateProfile } from '../config';
```

### Required HTMX Anchors
Every template MUST include these elements for partial page updates:
- `<div id="source-loading" class="source-loading htmx-indicator">` -- loading spinner
- `<div id="source-results">` -- content container that gets swapped

All filter/sort/tag links MUST include HTMX attributes:
```html
hx-get={url} hx-target="#source-results" hx-swap="innerHTML" hx-push-url="true" hx-indicator="#source-loading"
```

### PartialResults Component

Every template must export a `PartialResults` component in `index.tsx`. This renders the HTMX partial that gets swapped into `#source-results` during filter/sort/search/paginate operations:

```tsx
function MyPartialResults(props: PartialResultsProps) {
  if (props.items.length === 0) {
    return (
      <EmptyState
        icon="search"
        title={`No ${props.vocabulary.itemPlural} found`}
        description="Try adjusting your filters or search terms."
      />
    );
  }

  return (
    <>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {props.items.map((item) => (
          <MyCard item={item} vocabulary={props.vocabulary} />
        ))}
      </div>
      <Pagination
        total={props.total}
        limit={props.limit}
        offset={props.offset}
        baseUrl={props.paginationBase}
        htmxTarget="#source-results"
      />
    </>
  );
}
```

### File Structure
```
templates/src/<name>/
├── config.ts        # TemplateConfig with profile, vocabulary, SEO, MCP
├── index.tsx        # Template definition, exports Template object (styles: '')
├── source-page.tsx  # Source page (feed/list/grid view)
├── item-post.tsx    # Individual item page (detail view)
└── layout.tsx       # Layout wrapper (wraps PublicLayout)
```

---

## Template Creation Workflow

1. Run `pnpm template:create <name>` from the `templates/` directory
2. This scaffolds `templates/src/<name>/` with `config.ts`, `index.tsx`, `source-page.tsx`, `item-post.tsx`, `layout.tsx`
3. The script auto-registers the config in `templates/src/all-configs.ts`
4. The script auto-adds export/config name mappings to `templates/scripts/resolve-template.ts`
5. Fill in the config (profile, vocabulary, SEO, MCP)
6. Implement JSX components (source page, item post, layout)
7. (Optional) Create seed SQL in `templates/seeds/<name>.sql`
8. (Optional) Add catalog entry in `catalog.ts` with status `'shipped'`
9. Run `TEMPLATE=<name> pnpm resolve-template` to generate `_resolved.ts` for local dev
10. Run `pnpm dev:server` to test at `http://localhost:8787`

No manual registry modification is needed -- template resolution is handled at build time by the `resolve-template` script.

---

## Quality Checklist

Before shipping a template, verify:

- [ ] Profile is complete with all fields populated
- [ ] Template ID does not exist in `catalog.ts`
- [ ] No unresolved overlap with existing entries sharing domain/layout/contentType
- [ ] Catalog entry added with `status: 'shipped'`
- [ ] Config has profile, vocabulary, SEO, MCP instructions, schemaDescriptions, responseLabels
- [ ] Seed SQL has 3-5 types with guidance and actions
- [ ] Seed SQL has 3-5 workspaces
- [ ] Seed SQL has settings with quality guidelines and validation limits
- [ ] All `.tsx` files have `/** @jsxRuntime automatic */` and `/** @jsxImportSource hono/jsx */` pragmas
- [ ] JSX source page includes `#source-loading` and `#source-results` divs
- [ ] JSX source page includes HTMX attributes on all filter/sort links
- [ ] `PartialResults` component exported in `index.tsx`
- [ ] Styling uses Tailwind utility classes (no hardcoded colors)
- [ ] Shared components imported from `@pignal/render/components/*`
- [ ] Shared lib imported from `@pignal/render/lib/*`
- [ ] Config registered in `templates/src/all-configs.ts`
- [ ] Export name added to `templates/scripts/resolve-template.ts`
- [ ] `pnpm check-all` passes with no errors
- [ ] Template renders correctly at `http://localhost:8787` after `pnpm dev:server`

---

## Layout x ContentType Matrix

Templates in the same cell MUST justify coexistence via `differentiators`.

| | articles | entries | listings | records | media | profiles |
|---|---|---|---|---|---|---|
| **feed** | **blog**, writing | til, journal | -- | -- | podcast | -- |
| **grid** | -- | flashcards | recipes, bookshelf | -- | **portfolio** | -- |
| **sidebar-grid** | -- | -- | **shop** | -- | -- | -- |
| **table** | -- | glossary | menu | -- | -- | -- |
| **magazine** | **magazine**, case-studies | -- | -- | -- | -- | -- |
| **timeline** | -- | -- | -- | **changelog**, incidents | -- | -- |
| **directory** | **wiki**, course, runbook | -- | services | -- | -- | **directory** |
| **dashboard** | -- | -- | -- | -- | -- | resume |

Bold = Tier 1 priority.
