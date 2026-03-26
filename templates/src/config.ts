// --- Type definitions ---

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

export interface TemplateMcpConfig {
  /** Server-level instructions shown to AI clients on connect */
  instructions: string;
  /** Per-tool description overrides (tool name -> description) */
  toolDescriptions: Record<string, string>;
  /** Per-tool response text overrides */
  responseLabels: {
    saved: string;
    updated: string;
    validated: string;
    notFound: string;
    /** Use {total} and {count} as placeholders */
    found: string;
    visibilityUpdated: string;
    batchComplete: string;
    workspaceCreated: string;
    typeCreated: string;
  };
  /** Per-tool input field description overrides. Keyed by toolName.fieldName */
  schemaDescriptions: Record<string, string>;
}

// --- Classification enums (constrained to prevent sprawl) ---

export type TemplateDomain =
  | 'knowledge'    // blogs, wikis, docs, research, TILs
  | 'commerce'     // products, services, menus, pricing
  | 'creative'     // portfolios, galleries, writing, music
  | 'professional' // resumes, case studies, consulting
  | 'community'    // directories, curated lists, resources
  | 'education'    // courses, tutorials, study notes
  | 'operations'   // changelogs, runbooks, incidents
  | 'media'        // news, reviews, podcasts
  | 'personal'     // journals, recipes, reading lists
  | 'data';        // datasets, research papers, benchmarks

export type TemplateContentType =
  | 'articles'     // long-form written content
  | 'entries'      // short structured entries
  | 'listings'     // items with structured metadata
  | 'records'      // data-oriented records
  | 'media'        // visual/audio-first content
  | 'profiles';    // entity-oriented (people, resources, tools)

export type TemplateLayout =
  | 'feed'         // vertical chronological stream
  | 'grid'         // card grid, auto-fill columns
  | 'sidebar-grid' // persistent sidebar + grid main
  | 'table'        // tabular with sortable columns
  | 'magazine'     // featured hero + mixed card sizes
  | 'timeline'     // time-based vertical with markers
  | 'directory'    // alphabetical/categorized listing
  | 'kanban'       // column-based board
  | 'dashboard';   // metrics/stats overview

// --- Seed data specification (drives SQL generation) ---

export interface TemplateTypeSeed {
  name: string;
  description: string;
  icon: string;
  color: string;   // hex
  guidance: {
    pattern: string;
    example: string;
    whenToUse: string;
    contentHints: string;
  };
  actions: string[];  // validation action labels
}

export interface TemplateWorkspaceSeed {
  name: string;
  description: string;
  visibility: 'public' | 'private';
}

export interface TemplateSettingsSeed {
  sourceTitle: string;
  sourceDescription: string;
  qualityGuidelines: {
    keySummary: { tips: string };
    content: { tips: string };
    formatting: string[];
    avoid: string[];
  };
  validationLimits: {
    keySummary: { min: number; max: number };
    content: { min: number; max: number };
  };
}

export interface TemplateSeedData {
  types: TemplateTypeSeed[];
  workspaces: TemplateWorkspaceSeed[];
  settings: TemplateSettingsSeed;
}

// --- The Profile: identity + generation spec ---

export interface TemplateProfile {
  /** Machine-readable ID. Must match registry key. Lowercase alphanumeric + hyphens. */
  id: string;
  /** Human-readable name for UI display. */
  displayName: string;
  /** One-line tagline, max ~80 chars. For directory listings. */
  tagline: string;
  /** 2-3 sentence description of what this template is for and who uses it. */
  description: string;

  // --- Classification (governance: prevents duplicates) ---
  domain: TemplateDomain;
  contentType: TemplateContentType;
  layout: TemplateLayout;

  /** Who would deploy this template? */
  audience: string[];
  /** "Deploy this if you want to..." — concrete use cases. */
  useCases: string[];
  /** What makes this template structurally different from others in the same domain.
   *  MUST describe layout/content/workflow differences, not just vocabulary. */
  differentiators: string[];

  // --- Generation spec (drives config + seed + visual generation) ---
  /** Seed data specification. Used to generate the SQL seed file. */
  seedData: TemplateSeedData;
}

export interface TemplateConfig {
  profile: TemplateProfile;
  vocabulary: TemplateVocabulary;
  seo: TemplateSeoHints;
  mcp: TemplateMcpConfig;
}

// --- Default template config ---

import { blogConfig } from './blog/config';

export const DEFAULT_TEMPLATE_CONFIG: TemplateConfig = blogConfig;

/** Format a response label, replacing {total} and {count} placeholders. */
export function formatResponseLabel(
  label: string,
  replacements: Record<string, string | number>
): string {
  let result = label;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(`{${key}}`, String(value));
  }
  return result;
}
