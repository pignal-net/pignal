import type { Child } from 'hono/jsx';
import type { Item } from '@pignal/core';
import type { ItemTypeWithActions, WorkspaceSelect, SettingsMap } from '@pignal/db';
import type { TemplateVocabulary, TemplateSeoHints } from './config';

export type { Item };
export type { TemplateVocabulary, TemplateSeoHints } from './config';

export interface SourcePageProps {
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
}

export interface ItemPostProps {
  item: Item;
  settings: SettingsMap;
  renderedContent: string;
  headings: { id: string; text: string; level: number }[];
  sourceUrl: string;
  sourceAuthor: string;
  githubUrl: string;
  vocabulary: TemplateVocabulary;
  seo: TemplateSeoHints;
}

export interface LayoutProps {
  title: string;
  head?: string;
  sourceTitle: string;
  sourceUrl: string;
  settings: SettingsMap;
  children: Child;
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
  meta: { name: string; description: string };
  styles: string;
}
