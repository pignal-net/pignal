<p align="center">
  <img src="web/src/static/logo.svg" alt="pignal" width="80" height="80" />
</p>

<h1 align="center">Pignal - A personal knowledge ledger, built from your AI conversations. Built for humans.</h1>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-AGPL--3.0-blue.svg" alt="License: AGPL-3.0" /></a>
  <a href="https://developers.cloudflare.com/workers/"><img src="https://img.shields.io/badge/Runs%20on-Cloudflare%20Workers-F38020.svg" alt="Cloudflare Workers" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-strict-3178C6.svg" alt="TypeScript" /></a>
  <a href="https://modelcontextprotocol.io/"><img src="https://img.shields.io/badge/MCP-compatible-8A2BE2.svg" alt="MCP" /></a>
</p>

Every insight you reach, decision you land, technique that clicks — pignal lets you capture it as a signal, verify it over time, and share the ones worth standing behind.

Not AI memory. Not a chat log. **Yours** — structured, searchable, and permanent.

In an era where AI does the thinking, pignal makes sure **you** keep the knowledge.

Self-hosted on Cloudflare. Free forever. **Your data never leaves your account**.

---

<p align="center">
  <img src="document/flow.drawio.png" alt="Architecture — MCP clients connect to your self-hosted Pignal on Cloudflare, storing private signals and syncing public ones to pignal.net" width="720" />
</p>

---

## What's Inside

- **MCP server** — capture signals directly from Claude, mid-conversation
- **REST API** — full CRUD at `/api/*` with bearer token auth
- **Web dashboard** — manage signals, types, and workspaces at `/pignal`
- **Public source page** — vouch for a signal and it becomes your shared record

---

<p align="center">
  <img src="document/web.png" alt="Pignal source page — browsing vouched signals by category" width="720" />
</p>

<p align="center">
  <sub>Live at <a href="https://developers.pignal.net">developers.pignal.net</a></sub>
</p>

### Lighthouse scores (Desktop)

<p align="center">
  <img src="document/web-performance.png" alt="Lighthouse scores — Performance 100, Accessibility 100, Best Practices 100, SEO 100" width="480" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Performance-100-brightgreen" alt="Performance: 100" />
  <img src="https://img.shields.io/badge/Accessibility-100-brightgreen" alt="Accessibility: 100" />
  <img src="https://img.shields.io/badge/Best%20Practices-100-brightgreen" alt="Best Practices: 100" />
  <img src="https://img.shields.io/badge/SEO-100-brightgreen" alt="SEO: 100" />
</p>

---

## Deploy

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A free [Cloudflare account](https://dash.cloudflare.com/sign-up)

### 1. Clone and install

```bash
git clone https://github.com/pignal-net/pignal.git
cd pignal
pnpm install
```

### 2. Authenticate with Cloudflare

```bash
npx wrangler login
```

### 3. Create D1 database

```bash
cd server
npx wrangler d1 create pignal-server-db
```

Copy the `database_id` from the output.

### 4. Configure

```bash
cp wrangler.toml.example wrangler.toml
```

Edit `wrangler.toml` and replace the placeholder `database_id` with the value from step 3.

### 5. Set your secret token

```bash
openssl rand -hex 32
# Copy the output, then:
npx wrangler secret put SERVER_TOKEN
# Paste the token when prompted
```

### 6. Apply migrations

```bash
pnpm db:migrate:prod         # Create tables and seed data in production D1
```

### 7. Deploy

```bash
pnpm run deploy              # Deploy the Worker
```

### 8. Verify

```bash
curl https://pignal-server.<your-subdomain>.workers.dev/health
```

---

## Connect Claude

### Claude Code (CLI)

```bash
claude mcp add --transport sse pignal \
  https://pignal-server.<your-subdomain>.workers.dev/mcp \
  --header "Authorization: Bearer <your-token>"
```

### Claude Desktop

Add to `claude_desktop_config.json` (requires [`mcp-remote`](https://github.com/geelen/mcp-remote)):

```json
{
  "mcpServers": {
    "pignal": {
      "command": "npx",
      "args": [
        "mcp-remote@latest",
        "https://pignal-server.<your-subdomain>.workers.dev/mcp",
        "--header",
        "Authorization: Bearer ${SERVER_TOKEN}"
      ],
      "env": {
        "SERVER_TOKEN": "<your-token>"
      }
    }
  }
}
```

### Project `.mcp.json`

```json
{
  "mcpServers": {
    "pignal": {
      "type": "sse",
      "url": "https://pignal-server.<your-subdomain>.workers.dev/mcp",
      "headers": {
        "Authorization": "Bearer ${SERVER_TOKEN}"
      }
    }
  }
}
```

---

## MCP Tools

| Tool | Description |
|------|-------------|
| `get_metadata` | Get types, workspaces, settings, and quality guidelines — **call first** |
| `save_signal` | Capture a signal from the current conversation |
| `list_signals` | Browse signals with filters (type, workspace, archived, visibility) |
| `search_signals` | Full-text search across all signals |
| `validate_signal` | Record that you confirmed, applied, or revisited a signal |

---

## Web UI

Admin dashboard at `/pignal` and public source page at `/`. See [CUSTOMIZATION.md](./docs/CUSTOMIZATION.md) for theming and layout options.

| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/pignal` | Stats overview + recent signals |
| Signals | `/pignal/signals` | Search, filter, paginate with HTMX |
| Detail | `/pignal/signals/:id` | View signal, validate, archive, set visibility |
| Types | `/pignal/types` | Manage signal types + actions |
| Workspaces | `/pignal/workspaces` | Manage workspaces |
| Settings | `/pignal/settings` | Source page config, runtime settings |
| Source Page | `/` | Vouched signals with JSON-LD, OG tags, pagination |
| Signal Post | `/source/:slug` | Individual signal with semantic HTML |
| Atom Feed | `/feed.xml` | Atom feed |
| LLMs | `/llms.txt` | Source guide for LLMs ([llmstxt.org](https://llmstxt.org)) |

---

## REST API

All `/api/*` endpoints require `Authorization: Bearer <SERVER_TOKEN>`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check (no auth) |
| GET/POST | `/api/signals` | List / Create signals |
| GET/PATCH/DELETE | `/api/signals/:id` | Get / Update / Delete signal |
| POST | `/api/signals/:id/validate` | Validate a signal |
| POST | `/api/signals/:id/archive` | Archive a signal |
| POST | `/api/signals/:id/unarchive` | Unarchive a signal |
| POST | `/api/signals/:id/vouch` | Vouch for a signal (set visibility) |
| GET/POST | `/api/types` | List / Create types |
| GET/PATCH/DELETE | `/api/types/:id` | Type CRUD |
| POST | `/api/types/:id/actions` | Add action to type |
| GET/POST | `/api/workspaces` | List / Create workspaces |
| GET/PATCH/DELETE | `/api/workspaces/:id` | Workspace CRUD |
| GET/PUT | `/api/settings` | Get / Update settings |
| GET | `/api/stats` | Usage statistics |
| * | `/mcp` | MCP endpoint (SSE transport) |
| GET | `/api/public/signals` | Vouched signals (no auth) |
| GET | `/api/public/signals/:slug` | Signal by slug (no auth) |
| GET | `/api/public/shared/:token` | Unlisted signal (no auth) |
| GET | `/.well-known/pignal` | Federation discovery |

---

```
pignal/
├── db/       @pignal/db      Drizzle ORM schemas + TypeScript types
├── core/     @pignal/core    SignalStore, route factories, MCP tools, validation, federation
├── web/      @pignal/web     Hono JSX SSR (admin dashboard + source page)
└── server/   @pignal/server  Hono Worker with D1 storage + token auth
```

```
Request → Worker → Token Auth → Store Middleware → Route Handler → SignalStore → D1
```

- **@pignal/db** defines schemas: signals (with visibility), signal_types, type_actions, workspaces, settings
- **@pignal/core** implements `SignalStore` (pure business logic), route factories, Zod validation, MCP tools, and federation (`/.well-known/pignal`)
- **@pignal/web** provides admin dashboard (HTMX) and SEO-optimized source page (JSON-LD, OG tags, semantic HTML)
- **@pignal/server** wires everything: D1 storage, token auth, REST at `/api/*`, MCP at `/mcp`, web UI at `/`

## Federation

Every instance serves `/.well-known/pignal` with owner info, capabilities, and stats. Optionally register with [pignal.net](https://pignal.net) for directory listing and cross-instance discovery.

---

## Local Development

```bash
cd server
cp .dev.vars.example .dev.vars   # set SERVER_TOKEN
pnpm db:migrate                  # create tables and seed data in local D1
pnpm dev                         # http://localhost:8787
```

After a fresh clone or when migrations are added, always run `pnpm db:migrate` before starting the dev server.

## Resource Usage

Runs within Cloudflare's free tier: 100K requests/day (Workers), 10 GB D1 storage, no egress charges.

## License

AGPL-3.0 — see [LICENSE](./LICENSE).
