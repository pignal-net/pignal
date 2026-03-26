# Web UI Recipes

Step-by-step guides for common web UI development tasks.

---

## 1. Add a New Admin Page

1. Create `web/src/pages/{name}.tsx`
2. Import `AppLayout` from `../components/app-layout`
3. Add page header:
   ```tsx
   <div class="mb-8">
     <h1 class="text-2xl font-bold tracking-tight">{title}</h1>
     <p class="text-muted text-sm mt-1">{description}</p>
   </div>
   ```
4. Wrap content in cards: `bg-surface rounded-xl border border-border-subtle shadow-card p-6`
5. Add route in `web/src/index.ts`:
   ```tsx
   router.get('/pignal/{name}', sessionMiddleware, csrfMiddleware, async (c) => { ... });
   ```
6. Add to `ALL_NAV` array in `app-layout.tsx` if it should appear in navigation
7. Run `pnpm css:build` to include new Tailwind classes

## 2. Add a New Admin Component

1. Create `web/src/components/{name}.tsx`
2. Define a TypeScript interface for props
3. Export a named function component (not default export)
4. Use design tokens for all colors/shadows/borders — see [design-system.md](./design-system.md)
5. Follow existing patterns:
   - Cards: `bg-surface rounded-xl border border-border-subtle shadow-card`
   - Text: `text-text` for primary, `text-muted` for secondary
   - Interactive: add `transition-colors` or `transition-shadow` on hover
6. If the component needs a CSS class referenced by `app.js`, add it to `@layer components` in `render/src/styles/input.css`
7. Run `pnpm css:build && pnpm type-check`

## 3. Add a New Shared Rendering Component

For components used by both templates and the admin dashboard (e.g., layout shells, pagination, icons, type badges).

1. Create `render/src/components/{name}.tsx`
2. Add JSX pragmas at the top:
   ```tsx
   /** @jsxRuntime automatic */
   /** @jsxImportSource hono/jsx */
   ```
3. Define a TypeScript interface for props
4. Export a named function component (not default export)
5. Use design tokens for all colors/shadows/borders — see [design-system.md](./design-system.md)
6. Import from templates or web via: `import { MyComponent } from '@pignal/render/components/my-component'`
7. Run `pnpm css:build && pnpm type-check`

## 4. Create a New Template

Each template is a self-contained folder in `templates/src/<name>/` with its own config + JSX.

1. Create `templates/src/<name>/config.ts` with the template's `TemplateConfig` (vocabulary, SEO, MCP, schemaDescriptions). Each template has its own config file.
2. Run `pnpm template:create <name>` from `templates/` — scaffolds `index.tsx`, `source-page.tsx`, `item-post.tsx`, `layout.tsx` in `templates/src/<name>/`
3. Add config import/export to `templates/src/all-configs.ts` (hub needs access to all configs)
4. Customize `source-page.tsx`:
   - Container: `max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-16 w-full`
   - Import shared components from `@pignal/render/components/*` (e.g., `FilterBar`, `ItemFeed`, `EmptyState`)
   - Cards: `bg-surface rounded-xl border border-border-subtle shadow-card hover:shadow-card-hover`
   - Empty state: `.empty-state` pattern
   - Preserve HTMX: `id="source-results"`, `id="source-loading"`, `hx-*` attributes
5. Customize `item-post.tsx`:
   - Grid: `grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_200px] gap-12`
   - Title: `text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-4`
   - Content: `mt-8 content` (the `.content` class is needed for code theme support)
   - Tags: `mt-10 pt-6 border-t border-border-subtle`
   - Import shared components from `@pignal/render/components/*`
6. Add JSX pragmas (`/** @jsxRuntime automatic */` and `/** @jsxImportSource hono/jsx */`) to every `.tsx` file
7. Run `pnpm resolve-template` to generate `_resolved.ts` (or use `TEMPLATE=<name> pnpm dev:server`)
8. Test with `TEMPLATE=<name>` in `server/wrangler.toml` under `[vars]`

## 5. Add an SVG Icon

1. Open `render/src/components/icons.tsx`
2. Add a new exported function following the pattern:
   ```tsx
   export function IconNewName(props: IconProps) {
     const a = s(props);
     return (
       <svg {...a} viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
         <path d="..." />
       </svg>
     );
   }
   ```
3. **Conventions:**
   - 16x16 viewBox (use 48x48 for large empty-state icons)
   - Stroke-based with `currentColor` (inherits text color)
   - `stroke-width="1.5"` for 16px, `stroke-width="1.5"` for 48px
   - No `fill` on paths (use `fill="currentColor"` only for solid icons like GitHub/Twitter)
4. Import where needed: `import { IconNewName } from '@pignal/render/components/icons'`
5. Usage: `<IconNewName size={16} class="text-muted" />`

## 6. Add a Design Token

1. Open `render/src/styles/input.css`
2. Add to the `@theme {}` block:
   ```css
   --color-new-token: #hexvalue;
   ```
3. Add dark mode override in BOTH blocks:
   - `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ... } }`
   - `[data-theme="dark"] { ... }`
4. Use in JSX via Tailwind utility: `text-new-token`, `bg-new-token`, `border-new-token`
5. Or in inline styles: `var(--color-new-token)`
6. Run `pnpm css:build` to regenerate output
7. Document in [design-system.md](./design-system.md) token tables

## 7. Add a CSS Component Class

For complex patterns that can't be expressed as Tailwind utilities (e.g., multi-step animations, pseudo-elements, JS-referenced selectors):

1. Open `render/src/styles/input.css`
2. Add to `@layer components { ... }`:
   ```css
   .my-component {
     /* Use design tokens, not hardcoded colors */
     color: var(--color-text);
     background: var(--color-surface);
     border: 1px solid var(--color-border-subtle);
     border-radius: var(--radius-xl);
     transition: all var(--transition-fast);
   }
   ```
3. If referenced by `app.js`, document in the CSS Component Layer table in [design-system.md](./design-system.md)
4. Prefer Tailwind utilities over custom classes whenever possible
5. Run `pnpm css:build`

## 8. Add a User-Customizable Theme Color

1. Open `render/src/lib/theme.ts`
2. Add a new entry to `THEME_TOKENS` array:
   ```typescript
   {
     settingsKey: 'source_color_new',
     label: 'New Color',
     description: 'Description of what it controls.',
     placeholder: '#hexvalue',
     lightVars: (c) => `--tw-new:${c}`,
     darkVars: (c) => `--tw-new:color-mix(in srgb,${c} 85%,white)`,
   },
   ```
3. In `render/src/styles/input.css` `@theme {}`, reference the variable with a fallback:
   ```css
   --color-new: var(--tw-new, #default-hex);
   ```
4. Add the corresponding setting to the settings page (`web/src/pages/settings.tsx`) in the appropriate category
5. Run `pnpm css:build && pnpm type-check`
