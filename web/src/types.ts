import type { Context } from 'hono';

import type { ItemStoreRpc } from '@pignal/db';
import type { ApiKeyStore } from '@pignal/core/store/api-keys';

export type WebEnv = {
  SERVER_TOKEN: string;
};

export interface WebRouteConfig {
  getStore: (c: Context) => ItemStoreRpc;
  getApiKeyStore?: (c: Context) => ApiKeyStore;
  getTemplateName: (c: Context) => string;
}
