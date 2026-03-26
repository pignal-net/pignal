/**
 * Template registry — typed re-export of templates.json (single source of truth).
 * Use this for TypeScript imports instead of importing the JSON directly.
 */
import catalog from '../templates.json';

export interface TemplateRegistryEntry {
  index: number;
  id: string;
  exportName: string;
  configName: string;
  displayName: string;
  tagline: string;
  group: string;
  domain: string;
  contentType: string;
  layout: string;
  status: 'shipped' | 'planned' | 'rejected';
  differentiators: string[];
}

export const TEMPLATE_REGISTRY: TemplateRegistryEntry[] = catalog as TemplateRegistryEntry[];

/** Only shipped templates */
export const SHIPPED_TEMPLATES = TEMPLATE_REGISTRY.filter(t => t.status === 'shipped');
