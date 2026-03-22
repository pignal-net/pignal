# @pignal/web

Lightweight web interface: admin dashboard + SEO-optimized public source page with pluggable templates, rendered with Hono JSX SSR.

## Stack

- **Rendering** — Hono JSX (server-side, 0 KB client framework)
- **Interactivity** — HTMX v2 (vendored, ~14 KB)
- **Styling** — Tailwind v4 (built at deploy time via `pnpm css:build`)

Build step: `pnpm css:build` compiles `src/styles/input.css` → `src/static/tailwind.css`. Total client payload ~14 KB (HTMX) + compiled CSS.

## Pages

**Admin** (session cookie required): Dashboard, Items (list + detail), Types, Workspaces, Settings, API Keys, Login.

**Public** (no auth, SEO-optimized): Source page (template-driven), item posts, raw markdown, shared links, Atom feed, sitemap, llms.txt.

## Security

HMAC-SHA256 signed session cookies, CSRF double-submit pattern, CSP/HSTS/X-Frame-Options headers, safe markdown rendering with HTML escaping.

## Templates

The public source page uses a pluggable template system (`src/templates/`). Templates define `SourcePage`, `ItemPost`, `Layout`, and `PartialResults` components. Template config (vocabulary, SEO, MCP) lives in `@pignal/templates`. Available templates: `blog` (default, vertical feed) and `shop` (grid catalog). Selected via the `TEMPLATE` env var in `wrangler.toml`. See `templates/TEMPLATE_GUIDE.md` for the full contract and how to create new templates.

## Customization

Source page appearance is settings-driven (accent color, logo, custom CSS, card layout, social links, footer, template selection) — no redeployment needed.

## Dependencies

- `@pignal/core` — ItemStore access
- `@pignal/db` — Type definitions
- `hono` — HTTP framework + JSX SSR
- `marked` — Markdown rendering

See the root [README](../README.md) for project overview. License: AGPL-3.0 (see root [LICENSE](../LICENSE)).
