# Web UI Pitfalls

Common mistakes when developing UI for Pignal OSS and how to fix them.

| Mistake | Why It Happens | Fix |
|---------|---------------|-----|
| Hardcoded hex colors | Copying from designs instead of using tokens | Use `text-primary`, `bg-surface`, `border-border-subtle` — never `#1095C1` in JSX |
| `border-border` on cards | Mixing up structural vs subtle borders | Cards use `border-border-subtle` (12% opacity). `border-border` (20%) is for nav, form inputs, structural separators |
| Missing `shadow-card` on cards | Old habit of flat border-only cards | Every card: `bg-surface rounded-xl border border-border-subtle shadow-card p-6` |
| `hover:-translate-y-*` on cards | Dated Material Design pattern | Use `hover:shadow-card-hover transition-shadow` instead (exception: shop product cards keep translate) |
| `rounded-lg` on cards | Using the wrong radius | Cards use `rounded-xl`. Only form inputs and small buttons use `rounded-lg` |
| `py-6 pb-12` page padding | Old cramped spacing | Use `py-8 pb-16` for more breathing room |
| `gap-4` in grids | Too tight | Use `gap-6` for card grids, `gap-8` for sidebar+content |
| `text-[0.7rem]` or smaller | Custom font sizes that break the scale | Use `text-xs` (0.75rem) minimum for badges, `text-sm` for meta |
| `<p class="text-muted py-12">` empty state | Missing the empty state pattern | Use `.empty-state` with `.empty-state-icon`, `.empty-state-title`, `.empty-state-description` |
| Emoji icons | Quick placeholder that never gets replaced | Use SVG icons from `render/src/components/icons.tsx` |
| Creating a `styles.css` per template | Old pattern | All templates set `styles: ''`. Use Tailwind utilities directly in JSX |
| Forgetting `pnpm css:build` | Tailwind requires a build step | Run before `pnpm dev:server` or deploy. Add to CI. |
| Stale `tailwind.css` in production | Deploying without rebuilding CSS | `deploy:server` script already chains `css:build` — verify yours does too |
| Hardcoded `data-theme="light"` | Old layout pattern | No default `data-theme` on `<html>`. Inline `<script>` reads localStorage before first paint |
| `dark:` utilities not working | Custom variant covers both explicit and auto modes | Verify `@custom-variant dark` in `input.css` — should match both `[data-theme="dark"]` and `@media (prefers-color-scheme: dark)` |
| Theme toggle shows nothing | Button content injected by app.js | Button must be `<button class="theme-toggle">` with empty content. `app.js` injects SVG |
| Breaking save bar JS | Renaming `data-*` attributes or IDs | Never rename: `data-setting-key`, `data-original`, `data-ws-id`, `data-ws-field`, `data-reset-keys`, `data-sync` |
| Breaking HTMX | Renaming swap targets or changing swap modes | Preserve all `id` attributes, `hx-target`, `hx-swap` exactly |
| Filter chip too small on mobile | Missing touch target minimum | `.filter-chip` has `min-height: 44px` in CSS — don't override it |
| Article title too small | Using `text-2xl` instead of responsive | Use `text-3xl sm:text-4xl font-bold tracking-tight leading-tight` |
| Content border after article | Old `border-t border-border` separator | Use `mt-8` (just space, no border) between article header and content |
| Tags footer cramped | Old `mt-6 pt-3` pattern | Use `mt-10 pt-6 border-t border-border-subtle` |
| Sidebar active item too loud | Using `bg-primary text-white` | Use `bg-primary/10 text-primary font-semibold` for subtler active state |
| Create form buried at bottom | Users can't find it | Put create sections at TOP with `border-2 border-dashed` pattern |
| No page header on admin pages | Jumping straight to content | Every admin page needs the page header pattern: `h1` + `p` in `mb-8` div |
| Inline styles with old vars | Using `var(--pico-*)` or `var(--app-*)` | Use `var(--color-primary)`, `var(--color-muted)`, `var(--color-border)`, etc. |
| Adding shared components to `web/` | Components needed by templates belong in render | Shared components go in `render/src/components/`. Only admin-specific components go in `web/src/components/` |
| Adding shared libs to `web/` | Libs like theme, seo, markdown belong in render | These live in `render/src/lib/`. Only admin-only utils (cookie, htmx, slug) stay in `web/src/lib/` |
| Importing icons from `web/` | Icons moved to render package | Import from `@pignal/render/components/icons`, not from web |
| Missing JSX pragmas in render/template files | Hono JSX requires explicit pragma | Add `/** @jsxRuntime automatic */` and `/** @jsxImportSource hono/jsx */` at top of every TSX file in render and templates |
| Creating template JSX in `web/src/templates/` | Old location | Template JSX now lives in `templates/src/<name>/` alongside its config |
| Editing `input.css` in `web/` | Styles moved to render | Edit `render/src/styles/input.css` instead |
