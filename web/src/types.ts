import type { Context } from 'hono';

import type { ItemStoreRpc } from '@pignal/db';
import type { ApiKeyStore } from '@pignal/core/store/api-keys';
import type { Locale, TFunction } from './i18n/types';

export type WebEnv = {
  SERVER_TOKEN: string;
  /** Per-site visitor secret for hub SSO (managed sites only). */
  VISITOR_SITE_SECRET?: string;
};

/** Visitor identity from hub SSO (set by dispatch → verified by OSS). */
export type VisitorContext = {
  id: string;
  login: string;
  name: string;
  role: 'admin' | 'visitor';
} | null;

export type WebVars = {
  store: ItemStoreRpc;
  apiKeyStore?: ApiKeyStore;
  templateName: string;
  locale: Locale;
  defaultLocale: Locale;
  t: TFunction;
  /** Visitor identity from hub SSO (null if not authenticated). */
  visitor: VisitorContext;
};

export interface WebRouteConfig {
  getStore: (c: Context) => ItemStoreRpc;
  getApiKeyStore?: (c: Context) => ApiKeyStore;
  getTemplateName: (c: Context) => string;
}
