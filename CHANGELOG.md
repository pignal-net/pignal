# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2025-03-11

### Added

- MCP server with 5 tools: `get_metadata`, `save_signal`, `list_signals`, `search_signals`, `validate_signal`
- REST API with full CRUD for signals, types, workspaces, and settings
- Web admin dashboard at `/pignal` with HTMX interactivity
- Public source page at `/` with SEO-optimized signal posts
- Bearer token authentication with API key support and flat permissions
- Signal visibility model: private, unlisted (share links), vouched (public)
- Signal types with configurable validation actions
- Workspaces for organizing signals
- Tags support (JSON array, normalized, filterable)
- Atom feed at `/feed.xml`
- LLMs.txt at `/llms.txt`
- Federation via `/.well-known/pignal` for cross-instance discovery
- D1 storage with Drizzle ORM migrations
- HMAC session cookies + CSRF protection for web UI
