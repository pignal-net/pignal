// Template config (vocabulary, SEO hints, MCP content, schema descriptions, profiles)
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
  getTemplateConfig,
  formatResponseLabel,
  DEFAULT_TEMPLATE_CONFIG,
} from './config';

// Template catalog (governance registry — read by LLMs before generating new templates)
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
