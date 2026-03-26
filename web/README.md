# @pignal/web

Admin dashboard + routing layer for the Pignal platform, rendered with Hono JSX SSR.

## Stack

- **Rendering** — Hono JSX (server-side, 0 KB client framework)
- **Interactivity** — HTMX v2 (vendored, ~14 KB)
- **Styling** — Tailwind v4 (built at deploy time via `pnpm css:build` in `@pignal/render`)

## Pages

**Admin** (session cookie required): Dashboard, Items (list + detail), Types, Workspaces, Settings, API Keys, Login.

**Public** (no auth, SEO-optimized): Source page, item posts, raw markdown, shared links, Atom feed, sitemap, llms.txt. Public pages are rendered by the resolved template from `@pignal/templates`.

## Security

HMAC-SHA256 signed session cookies, CSRF double-submit pattern, CSP/HSTS/X-Frame-Options headers, safe markdown rendering with HTML escaping.

## Architecture

This package is the **admin + routing** layer. Shared rendering (components, utilities, i18n, static assets) lives in `@pignal/render`. Template JSX + configs live in `@pignal/templates`. Only the build-time resolved template is bundled per deployment.

## Dependencies

- `@pignal/render` — Shared rendering components, utilities, i18n, static assets
- `@pignal/templates` — Resolved template for public page rendering
- `@pignal/core` — ItemStore, ActionStore access
- `@pignal/db` — Type definitions
- `hono` — HTTP framework + JSX SSR

See the root [README](../README.md) for project overview. License: AGPL-3.0 (see root [LICENSE](../LICENSE)).
