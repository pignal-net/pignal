import type { Child } from 'hono/jsx';
import type { Item } from '@pignal/core';
import type { ItemTypeWithActions, WorkspaceSelect, SettingsMap } from '@pignal/db';
import type { TemplateVocabulary, TemplateSeoHints, TemplateProfile } from './config';

/** Visitor identity from hub SSO (null if not authenticated). */
export type VisitorContext = {
  id: string;
  login: string;
  name: string;
  role: 'admin' | 'visitor';
} | null;

export type { Item };
export type { TemplateVocabulary, TemplateSeoHints, TemplateProfile } from './config';

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

export interface SourcePageProps extends I18nProps {
  /** Locale URL prefix (e.g., '/vi' or '' for default locale). Prepend to internal links. */
  localePrefix: string;
  items: Item[];
  types: ItemTypeWithActions[];
  workspaces: WorkspaceSelect[];
  counts: {
    total: number;
    byType: Record<string, number>;
    byWorkspace: Record<string, number>;
    byWorkspaceType: Record<string, Record<string, number>>;
  };
  settings: SettingsMap;
  filters: {
    typeId?: string;
    workspaceId?: string;
    tag?: string;
    q?: string;
    sort: 'newest' | 'oldest';
  };
  pagination: { limit: number; offset: number; total: number };
  paginationBase: string;
  sourceUrl: string;
  isHtmxRequest: boolean;
  vocabulary: TemplateVocabulary;
  seo: TemplateSeoHints;
  /** Visitor identity from hub SSO (null if not authenticated). */
  visitor?: VisitorContext;
}

export interface ItemPostProps extends I18nProps {
  /** Locale URL prefix (e.g., '/vi' or '' for default locale). Prepend to internal links. */
  localePrefix: string;
  item: Item;
  settings: SettingsMap;
  renderedContent: string;
  headings: { id: string; text: string; level: number }[];
  sourceUrl: string;
  sourceAuthor: string;
  githubUrl: string;
  vocabulary: TemplateVocabulary;
  seo: TemplateSeoHints;
  /** Visitor identity from hub SSO (null if not authenticated). */
  visitor?: VisitorContext;
}

export interface LayoutProps extends OptionalI18nProps {
  title: string;
  head?: string;
  sourceTitle: string;
  sourceUrl: string;
  settings: SettingsMap;
  children: Child;
  /** Visitor identity from hub SSO (null if not authenticated). */
  visitor?: VisitorContext;
}

export interface ItemCardProps {
  item: Item;
  basePath: string;
  tagBasePath: string;
  useSlug?: boolean;
  showReadingTime?: boolean;
  showVisibility?: boolean;
  isPinned?: boolean;
  vocabulary: TemplateVocabulary;
}

export interface HeaderProps {
  sourceTitle: string;
  sourceUrl: string;
  settings: SettingsMap;
}

export interface FooterProps {
  sourceUrl: string;
  settings: SettingsMap;
}

export interface FilterBarProps {
  types: ItemTypeWithActions[];
  activeTypeId?: string;
  workspaces: WorkspaceSelect[];
  activeWorkspaceId?: string;
  activeTag?: string;
  sort: 'newest' | 'oldest';
  counts: SourcePageProps['counts'];
  query?: string;
  vocabulary: TemplateVocabulary;
}

export interface PartialResultsProps {
  items: Item[];
  total: number;
  limit: number;
  offset: number;
  paginationBase: string;
  sort: 'newest' | 'oldest';
  vocabulary: TemplateVocabulary;
}

export interface Template {
  SourcePage: (props: SourcePageProps) => any;
  ItemPost: (props: ItemPostProps) => any;
  Layout: (props: LayoutProps) => any;

  /** Renders the HTMX partial for filter/sort/search/paginate.
   *  Swapped into #source-results without a full page reload. */
  PartialResults: (props: PartialResultsProps) => any;

  ItemCard?: (props: ItemCardProps) => any;
  Header?: (props: HeaderProps) => any;
  Footer?: (props: FooterProps) => any;
  FilterBar?: (props: FilterBarProps) => any;

  vocabulary: TemplateVocabulary;
  seo: TemplateSeoHints;
  profile: TemplateProfile;
  styles: string;

  /** Optional per-locale translations, keyed by locale code (e.g., { en: {...}, vi: {...} }). */
  i18n?: Record<string, Record<string, string>>;
}
