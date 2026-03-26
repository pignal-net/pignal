// Shared rendering types — used by render components and consumed by templates.
// These live in @pignal/render to avoid circular deps (render ← templates ← web).

/** Visitor identity from hub SSO (null if not authenticated). */
export type VisitorContext = {
  id: string;
  login: string;
  name: string;
  role: 'admin' | 'visitor';
} | null;

export interface TemplateVocabulary {
  item: string;
  itemPlural: string;
  type: string;
  typePlural: string;
  workspace: string;
  workspacePlural: string;
  vouch: string;
  vouched: string;
}

export interface TemplateSeoHints {
  /** Schema.org @type for source page (e.g. 'Blog', 'WebSite') */
  siteSchemaType: string;
  /** Schema.org @type for individual items (e.g. 'BlogPosting', 'Product') */
  itemSchemaType: string;
}

/** i18n props passed to template components. */
export interface I18nProps {
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: string;
  defaultLocale: string;
}

/** Optional i18n props for components that may not have i18n wired yet. */
export interface OptionalI18nProps {
  t?: (key: string, params?: Record<string, string | number>) => string;
  locale?: string;
  defaultLocale?: string;
}
