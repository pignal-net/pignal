// Template config types + utilities (NO config data — lightweight)
export type {
  TemplateVocabulary,
  TemplateSeoHints,
  TemplateMcpConfig,
  TemplateConfig,
  TemplateDomain,
  TemplateContentType,
  TemplateLayout,
  TemplateTypeSeed,
  TemplateWorkspaceSeed,
  TemplateSettingsSeed,
  TemplateSeedData,
  TemplateProfile,
} from './config';
export {
  formatResponseLabel,
  DEFAULT_TEMPLATE_CONFIG,
} from './config';

// Template catalog (governance registry — lightweight metadata, no config objects)
export type { CatalogStatus, CatalogEntry } from './catalog';
export { TEMPLATE_CATALOG } from './catalog';

// Template types (component interfaces, prop types)
export type {
  Item,
  Template,
  SourcePageProps,
  ItemPostProps,
  LayoutProps,
  ItemCardProps,
  HeaderProps,
  FooterProps,
  FilterBarProps,
  PartialResultsProps,
  VisitorContext,
} from './types';

// Template JSX registry (returns the build-time resolved template)
export { getTemplate } from './registry';

// Build-time resolved template (single template per deployment)
export { resolvedTemplate, resolvedConfig } from './_resolved';

// NOTE: All 24 template configs are available via '@pignal/templates/all-configs'
// but NOT re-exported here to avoid bundling all configs in the server build.
// Only the hub (separate Worker) should import from all-configs.
