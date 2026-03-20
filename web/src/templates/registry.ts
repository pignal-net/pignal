import type { Template } from '@pignal/templates';
import { blogTemplate } from './blog';
import { shopTemplate } from './shop';

const TEMPLATES: Record<string, Template> = {
  blog: blogTemplate,
  shop: shopTemplate,
};

export function getTemplate(templateName: string): Template {
  return TEMPLATES[templateName] || TEMPLATES.blog;
}

export function getAvailableTemplates(): { key: string; name: string; description: string }[] {
  return Object.entries(TEMPLATES).map(([key, t]) => ({ key, name: t.meta.name, description: t.meta.description }));
}
