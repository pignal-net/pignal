// Template config (vocabulary, SEO hints, MCP content, schema descriptions)
export type {
  TemplateVocabulary,
  TemplateSeoHints,
  TemplateMcpConfig,
  TemplateConfig,
} from './config';
export {
  getTemplateConfig,
  formatResponseLabel,
  DEFAULT_TEMPLATE_CONFIG,
} from './config';

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
} from './types';
