import { Hono } from 'hono';

import type { RouteFactoryConfig } from '../types';
import { getSettingsRegistryByGroup } from '../validation/schemas';

/**
 * Create stats and metadata routes with configurable store resolution and middleware.
 */
export function createStatsRoutes(config: RouteFactoryConfig) {
  const router = new Hono();

  if (config.middleware) {
    for (const mw of config.middleware) {
      router.use('*', mw);
    }
  }

  // GET /stats
  router.get('/stats', async (c) => {
    const store = config.getStore(c);
    const stats = await store.stats();
    return c.json(stats);
  });

  // GET /metadata — supports ?sections=types,workspaces,settings,guidelines (comma-separated)
  router.get('/metadata', async (c) => {
    const store = config.getStore(c);
    const sectionsParam = c.req.query('sections');

    // No sections = full metadata (backward compatible)
    if (!sectionsParam) {
      const metadata = await store.getMetadata();
      return c.json(metadata);
    }

    const validSections = new Set(['types', 'workspaces', 'settings', 'guidelines']);
    const requested = sectionsParam.split(',').map(s => s.trim()).filter(Boolean);
    const invalid = requested.filter(s => !validSections.has(s));
    if (invalid.length > 0) {
      return c.json({ error: `Unknown sections: ${invalid.join(', ')}. Valid: types, workspaces, settings, guidelines` }, 400);
    }

    const sections = new Set(requested);
    const result: Record<string, unknown> = {};

    if (sections.has('types')) {
      result.types = await store.listTypes();
    }

    if (sections.has('workspaces')) {
      result.workspaces = await store.listWorkspaces();
    }

    if (sections.has('settings') || sections.has('guidelines')) {
      const settings = await store.getSettings();

      if (sections.has('settings')) {
        const registry = getSettingsRegistryByGroup();
        const groups: Record<string, Array<{ key: string; description: string; valueType: string; options?: string[]; value: string | undefined }>> = {};
        for (const [group, entries] of Object.entries(registry)) {
          groups[group] = entries.map(e => ({
            key: e.key,
            description: e.description,
            valueType: e.valueType,
            ...(e.options ? { options: e.options } : {}),
            value: settings[e.key],
          }));
        }
        result.settings = groups;
      }

      if (sections.has('guidelines')) {
        result.quality_guidelines = settings.quality_guidelines;
        result.validation_limits = settings.validation_limits;
      }
    }

    return c.json(result);
  });

  return router;
}
