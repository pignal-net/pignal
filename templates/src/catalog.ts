import { TEMPLATE_REGISTRY } from './template-registry';
import type { TemplateRegistryEntry } from './template-registry';

export type CatalogStatus = 'shipped' | 'planned' | 'rejected';

export type CatalogEntry = TemplateRegistryEntry;

export const TEMPLATE_CATALOG: CatalogEntry[] = TEMPLATE_REGISTRY;
