/**
 * Federation protocol types for pignal instance discovery and communication.
 */

export interface WellKnownOwner {
  github_login: string;
  name: string;
}

export interface WellKnownCapabilities {
  items: boolean;
  mcp: boolean;
  web_ui: boolean;
  federation: boolean;
}

export interface WellKnownStats {
  public_item_count: number;
  item_type_count: number;
  last_item_at: string | null;
}

export interface WellKnownEndpoints {
  api: string;
  mcp: string;
  public_items: string;
}

export interface WellKnownResponse {
  version: string;
  api_version: string;
  owner: WellKnownOwner;
  capabilities: WellKnownCapabilities;
  stats: WellKnownStats;
  endpoints: WellKnownEndpoints;
  tools?: ToolDefinition[];
}

export type FederationScope = 'items:read' | 'items:write' | 'profile:read' | 'admin';

export interface FederationTokenPayload {
  sub: string; // source ID
  instanceId: string;
  scopes: FederationScope[];
  iat: number;
  exp: number;
}

// --- Tool manifest types for dynamic MCP tool discovery ---

export interface ToolEndpointMapping {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string; // e.g., "/api/items", "/api/items/{itemId}/validate"
  pathParams?: string[]; // input params that map to {path} segments
  queryParams?: string[]; // input params mapped to query string (for GET)
  bodyParams?: string[]; // explicit body params (if omitted on POST/PATCH, all non-path/query params go to body)
}

export interface ToolAnnotations {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>; // JSON Schema object
  annotations?: ToolAnnotations;
  endpoint: ToolEndpointMapping;
  requiredScopes?: string[]; // Federation scopes needed (e.g., ["items:write"])
  responseFormat?: 'item' | 'item_list' | 'metadata' | 'raw';
}
