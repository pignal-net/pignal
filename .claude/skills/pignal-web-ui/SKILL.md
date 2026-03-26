---
name: pignal-web-ui
description: Use when creating or modifying UI components, pages, templates, or styling in the Pignal OSS render, templates, or web packages — designing layouts, adding icons, styling cards, building responsive templates, or working with the Tailwind design system
---

# Pignal Web UI Development

Tailwind v4 design system with Hono JSX SSR. All styling uses utility classes in JSX — no separate CSS files per component or template. Single compiled CSS from `render/src/styles/input.css`.

Three packages handle UI:
- **`@pignal/render`** (`render/`) — Shared rendering: components, lib, i18n, static assets, styles
- **`@pignal/templates`** (`templates/`) — Self-contained template folders with config + JSX
- **`@pignal/web`** (`web/`) — Admin dashboard pages and admin-only components

## Quick Reference

| Task | File(s) | Guide |
|------|---------|-------|
| New admin page | `web/src/pages/*.tsx` | [recipes.md](./recipes.md) #1 |
| New admin component | `web/src/components/*.tsx` | [recipes.md](./recipes.md) #2 |
| New shared rendering component | `render/src/components/*.tsx` | [recipes.md](./recipes.md) #3 |
| New template | `templates/src/<name>/` | [recipes.md](./recipes.md) #4 |
| Add SVG icon | `render/src/components/icons.tsx` | [recipes.md](./recipes.md) #5 |
| Add design token | `render/src/styles/input.css` | [recipes.md](./recipes.md) #6 |
| Add CSS component class | `render/src/styles/input.css` | [recipes.md](./recipes.md) #7 |
| Update theme colors | `render/src/lib/theme.ts` | [recipes.md](./recipes.md) #8 |
| Style with dark mode | Any `.tsx` file | [design-system.md](./design-system.md) |

## Design Principles

1. **Generous whitespace** — `py-8 pb-16` pages, `p-6` cards, `gap-6` grids
2. **Elevated surfaces** — cards use `shadow-card`, not flat `border` only
3. **Subtle borders** — `border-border-subtle` (12% opacity) for cards, `border-border` (20%) for structural elements
4. **Obvious interactions** — hover shadows, focus rings, button lift on hover
5. **Mobile-first** — default styles for 320px, breakpoints add for larger screens
6. **No hardcoded colors** — always use design tokens (Tailwind utilities or CSS vars)
7. **No per-component CSS files** — all styling via Tailwind utility classes in JSX

## Key Files

| File | Purpose |
|------|---------|
| `render/src/styles/input.css` | Design tokens (`@theme`), base styles, `@layer components` |
| `render/src/components/icons.tsx` | Shared SVG icon components |
| `render/src/lib/theme.ts` | Theme engine — `--tw-*` CSS vars from settings |
| `render/src/lib/static-versions.ts` | Cache-busted URLs for `tailwind.css`, `app.js` |
| `render/src/static/app.js` | Client JS: theme toggle, toasts, save bar, scroll spy |
| `render/src/components/layout.tsx` | Base HTML shell |
| `render/src/components/public-layout.tsx` | Public layout (sticky nav, footer) |
| `web/src/components/app-layout.tsx` | Admin layout (sticky nav, footer) |

## Build

```bash
pnpm css:build   # Build Tailwind → render/src/static/tailwind.css
pnpm css:watch   # Watch mode during development
pnpm dev:server  # Start local dev server (auto-runs resolve-template)
```

## Detailed Guides

- [design-system.md](./design-system.md) — Full design token reference, component patterns, typography, responsive, dark mode
- [recipes.md](./recipes.md) — Step-by-step for 8 common web UI tasks
- [pitfalls.md](./pitfalls.md) — Common UI mistakes and fixes
