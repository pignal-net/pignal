# Template Generation Guide

This document is the prompt context for AI-driven template generation. Read this **before** generating any template.

## What a Template Generation Produces

Every template generates exactly 4 artifacts:

1. **Config** in `templates/src/config.ts` — `TemplateProfile` + vocabulary, SEO, MCP instructions, schemaDescriptions
2. **Visual JSX** in `web/src/templates/<name>/` — 5 files: `index.tsx`, `source-page.tsx`, `item-post.tsx`, `layout.tsx`, `styles.css`
3. **Seed SQL** in `templates/seeds/<name>.sql` — types, actions, workspaces, settings, quality guidelines
4. **Registry entry** in `web/src/templates/registry.ts`

---

## Differentiation Rules

Before creating a new template, determine whether it is truly a **new template** or just **different seed data** for an existing one.

### Create a new template when:
- The **layout** is structurally different (e.g., feed vs grid vs timeline vs table)
- The **content structure** requires different card/post components (e.g., rating scores, episode numbers, book covers)
- The **validation workflow** is fundamentally different (e.g., spaced repetition vs binary vouch)

### Do NOT create a new template when:
- Only the **vocabulary** changes (e.g., "tech blog" vs "personal blog" — both are feed + articles)
- Only the **seed data** differs (e.g., "photography portfolio" vs "design portfolio" — both are grid + media)
- The difference is **cosmetic** (colors, fonts) — that's CSS theming, not a template

### Always check the catalog first:
1. Read `templates/src/catalog.ts` — scan every entry for your proposed ID, domain, layout, and contentType
2. If an entry with your ID exists and is `rejected`, read `rejectionReason` — do not re-propose it
3. If entries share your domain+layout or layout+contentType combo, read their differentiators and justify how yours is structurally different

---

## The Template Catalog

The catalog at `templates/src/catalog.ts` is the single source of truth for all templates — shipped, planned, and rejected. Before generating:

1. Read the full `TEMPLATE_CATALOG` array in `catalog.ts`
2. Scan for ID conflicts — if your proposed ID already exists, stop
3. Scan for structural overlap — look at entries with the same domain, layout, or contentType
4. If your proposed template was previously rejected, read the `rejectionReason` and do NOT re-propose it

---

## Profile-First Workflow

**Always write the profile FIRST**, validate against the catalog, then generate.

1. Read `templates/src/catalog.ts` — understand the full landscape of existing, planned, and rejected templates
2. Draft the `TemplateProfile` with all fields (id, displayName, tagline, description, domain, contentType, layout, audience, useCases, differentiators, seedData)
3. Verify the ID does not appear in the catalog
4. Verify no existing entry shares the same domain+layout+contentType without clear structural differentiation
5. Add the profile to the `TemplateConfig` in `config.ts`
6. Add a catalog entry in `catalog.ts` with status `'shipped'`
7. Generate the remaining artifacts (JSX, seed SQL, registry)

---

## Config Generation Rules

### Vocabulary
- Map all 8 generic terms to domain-specific language
- `item` → the primary content unit (e.g., "signal", "product", "recipe", "episode")
- `type` → the categorization system (e.g., "type", "category", "cuisine", "genre")
- `workspace` → the grouping mechanism (e.g., "workspace", "collection", "shelf", "season")
- `vouch`/`vouched` → the publishing action (e.g., "vouch"/"vouched", "list"/"listed", "publish"/"published")

### MCP Instructions
- 2-3 sentences describing the domain
- List all 10 tools with domain-specific names:
  - `save_item`, `list_items`, `search_items`, `update_item`, `validate_item`
  - `vouch_item`, `batch_vouch_items`, `get_metadata`, `create_workspace`, `create_type`
- End with "Always call get_metadata first..."

### Schema Descriptions
- Must be domain-specific, not generic
- `save_item.keySummary` — describe what a good title/summary looks like for this domain
- `save_item.content` — describe what the content body should contain
- `save_item.typeId` — use domain vocabulary for the type system
- `save_item.workspaceId` — use domain vocabulary for grouping
- `save_item.tags` — give domain-relevant tag examples
- `create_workspace.name` — domain-specific workspace naming
- `create_type.name` — domain-specific type naming
- `create_type.actions` — domain-specific validation actions

### Response Labels
- All labels must use domain vocabulary
- `saved` → "Recipe saved!" not "Item saved!"
- `found` → "Found {total} recipes (showing {count})"
- `workspaceCreated` → "Shelf created!" or "Collection created!"

---

## Seed Generation Rules

### Types (3-5 per template)
- Each type needs: `name`, `description`, `icon` (emoji), `color` (hex), `guidance`, `actions`
- `guidance.pattern` — a fill-in-the-blank pattern for the keySummary
- `guidance.example` — a concrete example following the pattern
- `guidance.whenToUse` — one sentence explaining when to choose this type
- `guidance.contentHints` — formatting guidance specific to this type's content

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
- `sourceTitle` — sensible default for the domain
- `sourceDescription` — one-line description
- `qualityGuidelines` — tailored to the content type:
  - `keySummary.tips` — how to write a good title for this domain
  - `content.tips` — how to write good content for this domain
  - `formatting` — 4-6 markdown formatting tips relevant to the content
  - `avoid` — 3-4 common mistakes for this content type
- `validationLimits` — appropriate min/max for keySummary and content

### Generating SQL from Seed Data
Run `pnpm seed:generate <name>` to convert the `TemplateSeedData` from the profile into a SQL file. This ensures UUIDs are generated consistently and the SQL matches the schema exactly.

---

## Visual Generation Rules

### Layout Patterns
Reference existing templates as starting points:
- **feed** → `blog/` (vertical chronological stream)
- **sidebar-grid** → `shop/` (persistent sidebar + grid main)
- **grid** → adapt from shop without sidebar
- **timeline** → vertical with date/version markers
- **table** → HTML table with sortable headers
- **magazine** → hero card + mixed grid below
- **directory** → categorized listing with alphabetical sections
- **dashboard** → metrics/stats cards

### CSS Conventions
- Prefix ALL classes with `<template-name>-` (e.g., `wiki-sidebar`, `wiki-breadcrumb`)
- Use Pico CSS variables for colors: `var(--pico-color)`, `var(--pico-primary)`, `var(--pico-muted-color)`
- Use Pico CSS variables for borders: `var(--pico-muted-border-color)`
- Use Pico CSS variables for backgrounds: `var(--pico-card-background-color)`
- Responsive breakpoints: `600px` (mobile), `900px` (tablet)

### Required HTMX Anchors
Every template MUST include these elements for partial page updates:
- `<div id="source-loading" class="source-loading htmx-indicator">` — loading spinner
- `<div id="source-results">` — content container that gets swapped

All filter/sort/tag links MUST include HTMX attributes:
```html
hx-get={url} hx-target="#source-results" hx-swap="innerHTML" hx-push-url="true" hx-indicator="#source-loading"
```

### File Structure
```
web/src/templates/<name>/
├── index.tsx         # Template definition, exports Template object
├── source-page.tsx   # Source page (feed/list/grid view)
├── item-post.tsx     # Individual item page (detail view)
├── layout.tsx        # Layout wrapper (wraps PublicLayout)
└── styles.css        # Template-scoped CSS
```

---

## Quality Checklist

Before shipping a template, verify:

- [ ] Profile is complete with all fields populated
- [ ] Template ID does not exist in `catalog.ts`
- [ ] No unresolved overlap with existing entries sharing domain/layout/contentType
- [ ] Catalog entry added with `status: 'shipped'`
- [ ] Config has vocabulary, SEO, MCP instructions, schemaDescriptions, responseLabels
- [ ] Seed SQL has 3-5 types with guidance and actions
- [ ] Seed SQL has 3-5 workspaces
- [ ] Seed SQL has settings with quality guidelines and validation limits
- [ ] JSX source page includes `#source-loading` and `#source-results` divs
- [ ] JSX source page includes HTMX attributes on all filter/sort links
- [ ] CSS classes are prefixed with `<template-name>-`
- [ ] Registry entry added in `web/src/templates/registry.ts`
- [ ] `pnpm check-all` passes with no errors
- [ ] Template renders correctly at `http://localhost:8787` after `pnpm dev:server`

---

## Layout × ContentType Matrix

Templates in the same cell MUST justify coexistence via `differentiators`.

| | articles | entries | listings | records | media | profiles |
|---|---|---|---|---|---|---|
| **feed** | **blog**, writing | til, journal | — | — | podcast | — |
| **grid** | — | flashcards | recipes, bookshelf | — | **portfolio** | — |
| **sidebar-grid** | — | — | **shop** | — | — | — |
| **table** | — | glossary | menu | — | — | — |
| **magazine** | **magazine**, case-studies | — | — | — | — | — |
| **timeline** | — | — | — | **changelog**, incidents | — | — |
| **directory** | **wiki**, course, runbook | — | services | — | — | **directory** |
| **dashboard** | — | — | — | — | — | resume |

Bold = Tier 1 priority.
