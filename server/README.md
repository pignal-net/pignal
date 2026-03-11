# @pignal/server

Self-hosted Cloudflare Worker providing REST API, MCP endpoint, and web UI for managing signals. Deploys to Cloudflare's free tier ($0/month).

## Setup

See the root [README](../README.md) for deployment instructions and MCP client configuration.

## Local Development

1. Copy `.dev.vars.example` to `.dev.vars` and set `SERVER_TOKEN`
2. Run `pnpm db:migrate` to create tables and seed data
3. Run `pnpm dev` to start at http://localhost:8787

## Architecture

Request flow: Worker -> Token Auth -> Store Middleware -> Route Handler -> SignalStore -> D1

| Component | Description |
|-----------|-------------|
| REST API | Full CRUD at `/api/*` with bearer token auth |
| MCP Server | SSE endpoint at `/mcp` with 5 signal tools |
| Web UI | Public source page at `/`, admin dashboard at `/pignal` |
| Federation | `/.well-known/pignal` for cross-instance discovery |
| Auth | Bearer token (API), HMAC session cookies (web UI) |

## Database Migrations

Migrations live in `migrations/`. Run `pnpm db:migrate` for local, `pnpm db:migrate:prod` for production.

## Dependencies

- `@pignal/core` — Business logic (SignalStore, route factories, MCP tools)
- `@pignal/web` — Web UI components
- `@pignal/db` — Schema and types