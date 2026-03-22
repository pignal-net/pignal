# Design System Reference

Complete reference for the Pignal OSS Tailwind v4 design system. All tokens are defined in `web/src/styles/input.css`.

---

## Color Tokens

### Surface & Background

| Token | Utility | Light | Dark | When to use |
|-------|---------|-------|------|-------------|
| `--color-bg` | `bg-bg` | `#ffffff` | `#0d1117` | Rare — use `bg-page` or `bg-surface` instead |
| `--color-bg-page` | `bg-bg-page` | `#f8f9fa` | `#010409` | Page background (body default) |
| `--color-surface` | `bg-surface` | `#ffffff` | `#161b22` | Cards, panels, modals |
| `--color-surface-raised` | `bg-surface-raised` | `#ffffff` | `#21262d` | Elevated cards, popovers |
| `--color-surface-hover` | `bg-surface-hover` | `#f8f9fa` | `#1c2128` | Interactive surface hover/active |

### Text

| Token | Utility | Light | Dark | When to use |
|-------|---------|-------|------|-------------|
| `--color-text` | `text-text` | `#373C44` | `#e6edf3` | Primary body text |
| `--color-muted` | `text-muted` | `#646B79` | `#8b949e` | Secondary text, captions, timestamps |
| `--color-primary` | `text-primary` | `#1095C1` | user-set | Links, buttons, accents |

### Border

| Token | Utility | Light | Dark | When to use |
|-------|---------|-------|------|-------------|
| `--color-border` | `border-border` | 20% muted | `rgba(255,255,255,0.1)` | Structural borders (nav, separators, form inputs) |
| `--color-border-subtle` | `border-border-subtle` | 12% muted | `rgba(255,255,255,0.06)` | Card borders, soft dividers |

**Rule:** Cards always use `border-border-subtle`. Structural elements (nav, filter bar, save bar) use `border-border`.

### Semantic

| Token | Text | Background | Border |
|-------|------|------------|--------|
| Success | `text-success` | `bg-success-bg` | `border-success-border` |
| Error | `text-error` | `bg-error-bg` | `border-error-border` |
| Warning | `text-warning` | `bg-warning-bg` | `border-warning-border` |
| Info | `text-info` | `bg-info-bg` | `border-info-border` |

### Type Badge Colors

| Token | Usage |
|-------|-------|
| `--color-type-insight` | Insight type (purple) |
| `--color-type-decision` | Decision type (blue) |
| `--color-type-solution` | Solution type (green) |
| `--color-type-core` | Core type (amber) |
| `--color-type-default` | Fallback (gray) |

---

## Shadow Tokens

| Token | Utility | When to use |
|-------|---------|-------------|
| `--shadow-xs` | `shadow-xs` | Button resting state |
| `--shadow-sm` | `shadow-sm` | Button hover, flash messages |
| `--shadow-card` | `shadow-card` | Card resting state |
| `--shadow-card-hover` | `shadow-card-hover` | Card hover state |
| `--shadow-md` | `shadow-md` | Dropdowns, mobile menus |
| `--shadow-lg` | `shadow-lg` | Modals, popovers, toasts |
| `--shadow-xl` | `shadow-xl` | Login card, hero elements |

---

## Component Patterns

### Page Header (every admin page)
```tsx
<div class="mb-8">
  <h1 class="text-2xl font-bold tracking-tight">{title}</h1>
  <p class="text-muted text-sm mt-1">{description}</p>
</div>
```

### Card
```tsx
<div class="bg-surface rounded-xl border border-border-subtle shadow-card p-6">
  {children}
</div>
```

### Card with hover
```tsx
<div class="bg-surface rounded-xl border border-border-subtle shadow-card hover:shadow-card-hover transition-shadow p-6">
  {children}
</div>
```

### Create section (dashed border — discoverable CTA)
```tsx
<div class="bg-surface rounded-xl border-2 border-dashed border-border hover:border-primary/30 transition-colors p-6 mb-8">
  <h2 class="text-base font-semibold mb-4">{title}</h2>
  {form}
</div>
```

### Empty state
```tsx
<div class="empty-state">
  <svg class="empty-state-icon" width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="6" y="10" width="36" height="28" rx="3"/><path d="M6 22h12l3 4h6l3-4h12"/><path d="M20 18h8M22 14h4"/>
  </svg>
  <p class="empty-state-title">No items found</p>
  <p class="empty-state-description">Try adjusting your filters or create a new item.</p>
</div>
```

### Tinted badge (TypeBadge pattern)
```tsx
<span
  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap"
  style={`background-color: color-mix(in srgb, ${color} 15%, transparent); color: ${color}; border: 1px solid color-mix(in srgb, ${color} 25%, transparent);`}
>
  {label}
</span>
```

### Tag pill
```tsx
<a href={url} class="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium text-muted bg-muted/8 border border-border-subtle no-underline hover:text-primary hover:bg-primary/8 transition-colors">
  #{tag}
</a>
```

### Sidebar panel with accent border
```tsx
<div class="bg-surface rounded-xl border border-border-subtle shadow-card p-5 border-l-4 border-l-success">
  <h3 class="text-sm font-semibold text-text mb-3">{title}</h3>
  {children}
</div>
```

---

## Button Variants

| Variant | Class pattern | When to use |
|---------|--------------|-------------|
| Primary | Default `<button>` — `bg-primary text-white shadow-xs` | Main actions |
| Secondary | `class="secondary"` — `bg-transparent border-border text-secondary` | Secondary actions |
| Outline | `class="outline"` — `bg-transparent border-primary text-primary` | Tertiary actions |
| Ghost | `class="ghost"` — `bg-transparent text-muted no-border` | Subtle actions |
| Destructive | `class="btn-danger"` — `bg-error text-white` | Delete, revoke |

All buttons have: `font-weight: 600`, `rounded-lg`, `shadow-xs`, hover lift `translateY(-1px)`.

---

## Typography Scale

| Element | Tailwind Classes | Size | Usage |
|---------|-----------------|------|-------|
| Page title | `text-2xl font-bold tracking-tight` | 1.5rem | Admin page headings |
| Article title | `text-3xl sm:text-4xl font-bold tracking-tight leading-tight` | 1.875→2.25rem | Blog/template post titles |
| Section heading | `text-lg font-semibold` | 1.125rem | Card headings |
| Section label | `text-sm font-semibold uppercase tracking-wider text-muted` | 0.875rem | Category/group labels |
| Body | `text-base` | 1rem | Default text |
| Small/meta | `text-sm text-muted` | 0.875rem | Timestamps, descriptions |
| Badge/label | `text-xs font-medium` | 0.75rem | Badges, chip labels |

---

## SVG Icons

Import from `../../components/icons` (or `../components/icons` depending on depth):

| Icon | Component | Usage |
|------|-----------|-------|
| Sun | `IconSun` | Theme toggle (light mode) |
| Moon | `IconMoon` | Theme toggle (dark mode) |
| Monitor | `IconMonitor` | Theme toggle (auto mode) |
| GitHub | `IconGitHub` | Social link |
| Twitter | `IconTwitter` | Social link |
| RSS | `IconRSS` | Feed link |
| Hamburger | `IconHamburger` | Mobile menu toggle |
| External link | `IconExternalLink` | "View site" links |
| Chevron left | `IconChevronLeft` | Back navigation |
| Chevron down | `IconChevronDown` | Expand/collapse |
| Logout | `IconLogout` | Logout action |
| Key | `IconKey` | API keys |
| Settings | `IconSettings` | Settings |
| List | `IconList` | Items/browse |
| Tag | `IconTag` | Types/categories |
| Empty inbox | `IconEmptyInbox` | Empty states (48×48) |

**Usage:** `<IconName size={16} class="text-muted" />`. Default: 16×16, stroke-based, inherits `currentColor`.

**Adding a new icon:** Add to `web/src/components/icons.tsx`. Follow the pattern: 16×16 viewBox, `fill="none" stroke="currentColor" stroke-width="1.5"`, return `<svg {...s(props)}>`.

---

## Dark Mode

**Three modes:** light → dark → auto (system preference). Controlled by `data-theme` attribute on `<html>`.

**How it works:**
1. `app.js` reads `localStorage('pignal-theme')`, sets `data-theme` attribute
2. `input.css` defines `@custom-variant dark` that covers both `[data-theme="dark"]` and `@media (prefers-color-scheme: dark)`
3. All `--color-*` tokens have dark mode overrides in both CSS blocks

**Rules:**
- Never hardcode colors — always use design tokens
- `dark:` Tailwind utilities work in both forced dark and auto dark
- Test by cycling theme toggle: light → dark → auto
- For inline styles, use CSS custom properties: `var(--color-primary)`, `var(--color-muted)`, etc.

---

## Responsive Design

**Breakpoints (mobile-first):**

| Prefix | Min-width | Usage |
|--------|-----------|-------|
| (none) | 0px | Default mobile styles |
| `sm:` | 640px | Large phones, small tablets |
| `md:` | 768px | Tablets, admin nav visibility |
| `lg:` | 1024px | Sidebar layouts activate |
| `xl:` | 1280px | ToC sidebar visible, max grid columns |

**Common patterns:**

Sidebar + content:
```tsx
<div class="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
  <aside class="lg:sticky lg:top-20 max-lg:hidden">{sidebar}</aside>
  <main>{content}</main>
</div>
```

Card grid:
```tsx
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
```

Hide on mobile:
```tsx
<div class="hidden md:flex">Desktop only</div>
<div class="md:hidden">Mobile only</div>
```

ToC sidebar (hidden below xl):
```tsx
<div class="max-xl:hidden"><TableOfContents headings={headings} /></div>
```

**Touch targets:** All interactive elements must have minimum 44px hit area. Use `min-h-[44px]` on chips, small buttons, and filter controls.

---

## Theme Customization

5 user-customizable colors (stored in D1 settings, rendered by `theme.ts`):

| Setting | CSS Variable | Default |
|---------|-------------|---------|
| `source_color_primary` | `--tw-primary` | `#1095C1` |
| `source_color_secondary` | `--tw-secondary` | `#596B7C` |
| `source_color_background` | `--tw-bg` / `--tw-bg-page` | `#ffffff` / `#f8f9fa` |
| `source_color_text` | `--tw-text` | `#373C44` |
| `source_color_muted` | `--tw-muted` / `--tw-border` | `#646B79` |

The `@theme {}` block references these with `var(--tw-*, fallback)`. When a setting is set, `theme.ts` generates a `<style>` tag that overrides the defaults.

---

## HTMX Integration

All interactivity uses HTMX — no React, no client-side state (except `app.js` for theme/toast/save bar).

**Key patterns:**
- FilterBar: `hx-get` with `hx-target="#source-results"` and `hx-swap="innerHTML"`
- CRUD panels: `hx-post` with `hx-target="#panel-id"` and `hx-swap="outerHTML"`
- Create actions: `hx-post` with `hx-target="#list-id"` and `hx-swap="beforeend"`
- Delete: `hx-post` with `hx-confirm` returns empty HTML to remove element

**Loading indicators:**
```tsx
<div id="source-loading" class="source-loading htmx-indicator">
  <span class="app-spinner" />
</div>
```

**CSS classes referenced by app.js (do NOT rename):**
`theme-toggle`, `flash`, `flash-success`, `flash-error`, `toast-container`, `toast`, `back-to-top`, `reading-progress`, `source-toc`, `save-bar`, `app-spinner`, `htmx-indicator`, `filter-chip`, `feed-tab`, `feed-tab-active`, `ws-dropdown`, `ws-dropdown-menu`

---

## CSS Component Layer

Classes in `@layer components` (in `input.css`) that are used by JavaScript or have complex styling:

| Class | Purpose | Used by |
|-------|---------|---------|
| `.theme-toggle` | Theme toggle button | `app.js` |
| `.flash`, `.flash-success`, `.flash-error` | Alert messages | `app.js` |
| `.toast`, `.toast-container` | Toast notifications | `app.js` |
| `.empty-state`, `.empty-state-icon`, `.empty-state-title`, `.empty-state-description` | Empty state pattern | Components |
| `.reading-progress` | Reading progress bar | `app.js` |
| `.back-to-top` | Scroll-to-top button | `app.js` |
| `.source-toc` | Table of contents sidebar | `app.js` scroll spy |
| `.save-bar` | Batch save bar | `app.js` settings/workspaces |
| `.filter-chip` | Filter chip buttons | `app.js`, HTMX |
| `.feed-tab`, `.feed-tab-active` | Sort tabs | `app.js` |
| `.ws-dropdown`, `.ws-dropdown-menu` | Workspace dropdown | CSS hover |
| `.htmx-indicator`, `.source-loading`, `.search-loading` | HTMX loading states | HTMX |
| `.app-spinner` | Loading spinner | Multiple |
| `details.dropdown` | Dropdown menu pattern | Admin nav, action bar |
