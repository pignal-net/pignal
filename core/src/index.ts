// Item Store (pure business logic)
export { ItemStore } from './store/item-store';

// Route factories
export {
  createItemRoutes,
  createTypeRoutes,
  createWorkspaceRoutes,
  createStatsRoutes,
  createSettingsRoutes,
  createPublicRoutes,
} from './routes';

// Types
export type { RouteFactoryConfig, Item, ItemListResponse, PublicItemField } from './types';
export { PUBLIC_ITEM_FIELDS } from './types';

// Validation schemas
export * from './validation/schemas';

// MCP tools
export {
  formatItem,
  toIncludeSet,
  buildMetadataText,
  saveItem,
  listItems,
  searchItems,
  validateItem,
  getMetadata,
  METADATA_FIELDS,
  type MetadataField,
  saveItemToolSchema,
  listItemsToolSchema,
  searchItemsToolSchema,
  validateItemToolSchema,
  type SaveItemToolInput,
  type ListItemsToolInput,
  type SearchItemsToolInput,
  type ValidateItemToolInput,
} from './mcp/tools';

// Federation
export type {
  WellKnownResponse,
  WellKnownOwner,
  WellKnownCapabilities,
  WellKnownStats,
  WellKnownEndpoints,
  FederationScope,
  FederationTokenPayload,
} from './federation/types';
