# @pignal/db

Drizzle ORM schema definitions and TypeScript types for pignal signal storage.

## Tables

| Table | Description |
|-------|-------------|
| `signals` | Captured signals with type, workspace, visibility, slug, shareToken |
| `signalTypes` | Categorization with color, icon, and per-type guidance |
| `typeActions` | Validation actions per type (e.g., Confirmed, Applied) |
| `workspaces` | User-defined groupings (e.g., Work, Personal) |
| `settings` | Key-value runtime config |
| `apiKeys` | API key credentials with scoped permissions |

## Exports

- **Schema tables** — `signals`, `signalTypes`, `typeActions`, `workspaces`, `settings`, `apiKeys`
- **Row types** — `SignalSelect`, `SignalInsert`, `SignalTypeSelect`, `WorkspaceSelect`, `ApiKeyInfo`, etc.
- **Interface types** — `SignalWithMeta`, `SignalStoreRpc`, `ListParams`, `VouchParams`, `StatsResult`, `MetadataResult`, etc.
