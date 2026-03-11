// Signal Store (pure business logic)
export { SignalStore } from './store/signal-store';

// Route factories
export {
  createSignalRoutes,
  createTypeRoutes,
  createWorkspaceRoutes,
  createStatsRoutes,
  createSettingsRoutes,
  createPublicRoutes,
} from './routes';

// Types
export type { RouteFactoryConfig, Signal, SignalListResponse, PublicSignalField } from './types';
export { PUBLIC_SIGNAL_FIELDS } from './types';

// Validation schemas
export * from './validation/schemas';

// MCP tools
export {
  formatSignal,
  toIncludeSet,
  buildMetadataText,
  saveSignal,
  listSignals,
  searchSignals,
  validateSignal,
  getMetadata,
  METADATA_FIELDS,
  type MetadataField,
  saveSignalToolSchema,
  listSignalsToolSchema,
  searchSignalsToolSchema,
  validateSignalToolSchema,
  type SaveSignalToolInput,
  type ListSignalsToolInput,
  type SearchSignalsToolInput,
  type ValidateSignalToolInput,
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
