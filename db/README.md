# @pignal/db

Drizzle ORM schema definitions and TypeScript types for pignal item storage.

## Tables

| Table | Description |
|-------|-------------|
| `items` | Captured items with type, workspace, visibility, slug, shareToken |
| `itemTypes` | Categorization with color, icon, and per-type guidance |
| `typeActions` | Validation actions per type (e.g., Confirmed, Applied) |
| `workspaces` | User-defined groupings (e.g., Work, Personal) |
| `settings` | Key-value runtime config |
| `apiKeys` | API key credentials with scoped permissions |

## Exports

- **Schema tables** — `items`, `itemTypes`, `typeActions`, `workspaces`, `settings`, `apiKeys`
- **Row types** — `ItemSelect`, `ItemInsert`, `ItemTypeSelect`, `WorkspaceSelect`, `ApiKeyInfo`, etc.
- **Interface types** — `ItemWithMeta`, `ItemStoreRpc`, `ListParams`, `VouchParams`, `StatsResult`, `MetadataResult`, etc.
