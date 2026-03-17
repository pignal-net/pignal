import type { Context } from 'hono';

import type { SignalStoreRpc } from '@pignal/db';
import type { ApiKeyStore } from '@pignal/core/store/api-keys';

export type WebEnv = {
  SERVER_TOKEN: string;
};

export interface WebRouteConfig {
  getStore: (c: Context) => SignalStoreRpc;
  getApiKeyStore?: (c: Context) => ApiKeyStore;
}
