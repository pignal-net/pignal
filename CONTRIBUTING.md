# Contributing to Pignal

Thanks for your interest in contributing! This guide will help you get started.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) 9+
- A free [Cloudflare account](https://dash.cloudflare.com/sign-up) (for local D1)

## Local Development Setup

```bash
git clone https://github.com/pignal-net/pignal.git
cd pignal
pnpm install
cd server
cp .dev.vars.example .dev.vars   # Set SERVER_TOKEN to any random string
pnpm db:migrate                  # Create tables and seed data in local D1
pnpm dev                         # http://localhost:8787
```

After a fresh clone or when new migrations are added, always run `pnpm db:migrate` before starting the dev server.

## Reporting Bugs

Use the [bug report template](https://github.com/pignal-net/pignal/issues/new?template=bug_report.yml). Include:

- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node.js version, OS)
- Relevant logs or error messages

## Requesting Features

Use the [feature request template](https://github.com/pignal-net/pignal/issues/new?template=feature_request.yml). Describe:

- The problem you're trying to solve
- Your proposed solution
- Alternatives you've considered

## Pull Request Process

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Run checks:
   ```bash
   pnpm type-check    # TypeScript strict mode
   pnpm lint           # ESLint
   ```
4. Submit a PR against `main`
5. Fill out the PR template checklist

## Code Conventions

- **TypeScript strict mode** across all packages
- **`import type`** for type-only imports (`consistent-type-imports: error`)
- **No `console.log`** — only `console.error` and `console.warn`
- **`prefer-const`**, **`no-var`**, **`eqeqeq: always`**
- **ES2022** target, **`moduleResolution: bundler`**
- Hono JSX (`jsxImportSource: hono/jsx`) for web packages

## Architecture

See the [README](./README.md#architecture) for package structure and data flow. The four packages are:

- **@pignal/db** — Drizzle schemas + types
- **@pignal/core** — SignalStore, route factories, validation, MCP tools
- **@pignal/web** — Hono JSX SSR (admin + public pages)
- **@pignal/server** — Cloudflare Worker entry point

## Tests

No test framework is currently configured. If you'd like to help set one up, open an issue to discuss the approach first.

## Questions?

Use [GitHub Discussions](https://github.com/pignal-net/pignal/discussions) for questions that aren't bug reports or feature requests.
