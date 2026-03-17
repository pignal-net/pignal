# @pignal/web

Lightweight web interface: admin dashboard + SEO-optimized public source page, rendered with Hono JSX SSR.

## Stack

- **Rendering** — Hono JSX (server-side, 0 KB client framework)
- **Interactivity** — HTMX v2 (vendored, ~14 KB)
- **Styling** — Pico CSS v2 (vendored, ~10 KB) + custom app.css

No bundler. No build step. Total client payload ~27 KB.

## Pages

**Admin** (session cookie required): Dashboard, Signals (list + detail), Types, Workspaces, Settings, API Keys, Login.

**Public** (no auth, SEO-optimized): Source page, signal posts, raw markdown, shared links, Atom feed, sitemap, llms.txt.

## Security

HMAC-SHA256 signed session cookies, CSRF double-submit pattern, CSP/HSTS/X-Frame-Options headers, safe markdown rendering with HTML escaping.

## Customization

Source page appearance is settings-driven (accent color, logo, custom CSS, card layout, social links, footer) — no redeployment needed.

## Dependencies

- `@pignal/core` — SignalStore access
- `@pignal/db` — Type definitions
- `hono` — HTTP framework + JSX SSR
- `marked` — Markdown rendering

See the root [README](../README.md) for project overview. License: AGPL-3.0 (see root [LICENSE](../LICENSE)).
