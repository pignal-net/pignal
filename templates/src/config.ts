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

// --- Template configs ---

const blogProfile: TemplateProfile = {
  id: 'blog',
  displayName: 'Blog / Signals',
  tagline: 'Chronological feed with type badges, reading time, and table of contents',
  description:
    'A classic blog layout for publishing structured insights, decisions, and techniques. ' +
    'Timeline-grouped feed on the source page, full article view with table of contents on post pages.',
  domain: 'knowledge',
  contentType: 'articles',
  layout: 'feed',
  audience: ['developers', 'writers', 'researchers', 'knowledge workers'],
  useCases: [
    'Publish technical insights from AI conversations',
    'Maintain a public knowledge base of decisions and learnings',
    'Share structured signals with reading time and type categorization',
  ],
  differentiators: [
    'Timeline-grouped feed with date headers',
    'Reading time estimates on cards and post pages',
    'Type-specific guidance patterns for content creation',
    'Table of contents sidebar on post pages',
  ],
  seedData: {
    types: [
      {
        name: 'Insight',
        description: 'New understanding',
        icon: '💡',
        color: '#8B5CF6',
        guidance: {
          pattern: '[I learned/discovered] + [specific finding] + [implication]',
          example: 'Learned PKCE is required for mobile OAuth — our auth flow needs refactoring',
          whenToUse: 'Use for new understanding, discoveries, or learning moments',
          contentHints: 'Explain what you learned, why it matters, and how it changes your thinking.',
        },
        actions: ['Confirmed', 'Wrong', 'Uncertain', 'Evolved'],
      },
      {
        name: 'Decision',
        description: 'Choice + reasoning',
        icon: '⚡',
        color: '#3B82F6',
        guidance: {
          pattern: '[Decided/Chose] + [specific action] + [because reason]',
          example: 'Chose Postgres over MySQL because our app needs complex join queries',
          whenToUse: 'Use for choices made with reasoning',
          contentHints: 'List the options considered, the criteria, and why the chosen option won. A comparison table works well here.',
        },
        actions: ['Good call', 'Regret', 'Mixed', 'Too early'],
      },
      {
        name: 'Problem Solution',
        description: 'Challenge resolved',
        icon: '✓',
        color: '#10B981',
        guidance: {
          pattern: '[Problem] → [Specific solution]',
          example: 'Memory leak in useEffect → Add cleanup function returning clearInterval',
          whenToUse: 'Use for challenges that were resolved',
          contentHints: 'Describe the symptoms, root cause, solution steps, and how to verify the fix. Code blocks for any commands or snippets.',
        },
        actions: ['Worked', 'Failed', 'Partial'],
      },
      {
        name: 'Core Point',
        description: 'Reference fact',
        icon: '📌',
        color: '#F59E0B',
        guidance: {
          pattern: '[Topic]: [Key fact or principle]',
          example: 'React Server Components: Use for data fetching, client components for interactivity',
          whenToUse: 'Use for reference facts, principles, or key information',
          contentHints: 'Structure as a reference card — use tables for specs/comparisons, lists for rules, headings to separate sections.',
        },
        actions: ['Accurate', 'Outdated', 'Incomplete'],
      },
    ],
    workspaces: [
      { name: 'Docs', description: 'Documentation and references', visibility: 'public' },
      { name: 'Study', description: 'Learning and research', visibility: 'public' },
      { name: 'Work', description: 'Professional and projects', visibility: 'public' },
      { name: 'Personal', description: 'Personal development and life', visibility: 'public' },
    ],
    settings: {
      sourceTitle: 'My Signals',
      sourceDescription: 'Insights captured from AI conversations',
      qualityGuidelines: {
        keySummary: { tips: 'Use first-person I/My framing for better recall. Follow the type-specific pattern from guidance.' },
        content: { tips: 'Write for your future self reviewing this days later. ALWAYS restructure raw data into proper markdown.' },
        formatting: [
          'Tables: structured/comparative data',
          'Bullet lists: grouped items, options, non-sequential points',
          'Numbered lists: sequential steps, ranked items, procedures',
          'Headings: separate distinct sections within longer content',
          'Code blocks: commands, snippets, config, error messages',
          'Paragraphs: reasoning, context, narrative explanation',
        ],
        avoid: [
          'Bold-only pseudo-structure',
          'Flat text walls without hierarchy',
          'Raw copy-paste without restructuring',
          'Repeating the keySummary in the content',
        ],
      },
      validationLimits: {
        keySummary: { min: 20, max: 140 },
        content: { min: 1, max: 10000 },
      },
    },
  },
};

const shopProfile: TemplateProfile = {
  id: 'shop',
  displayName: 'Product Catalog',
  tagline: 'Sidebar categories with grid product cards and search',
  description:
    'A grid-based product catalog with persistent category sidebar. ' +
    'Cards show product titles with hover effects, detail pages display full descriptions with specs.',
  domain: 'commerce',
  contentType: 'listings',
  layout: 'sidebar-grid',
  audience: ['small businesses', 'creators selling digital products', 'service providers'],
  useCases: [
    'List physical or digital products with categories',
    'Showcase services with pricing and availability',
    'Maintain a product catalog with collection grouping',
  ],
  differentiators: [
    'Category sidebar with item counts',
    'Product grid with hover effects',
    'Image placeholder with type initial',
    'Excerpt preview on cards',
  ],
  seedData: {
    types: [
      {
        name: 'Physical Product',
        description: 'Tangible goods and merchandise',
        icon: '📦',
        color: '#10B981',
        guidance: {
          pattern: '[Product name] — [key feature or variant]',
          example: 'Wireless Bluetooth Headphones — Active Noise Cancelling',
          whenToUse: 'Use for physical items that can be shipped',
          contentHints: 'Include specifications, materials, dimensions, and care instructions. Use tables for specs.',
        },
        actions: ['In Stock', 'Out of Stock', 'Discontinued'],
      },
      {
        name: 'Digital Product',
        description: 'Downloads, licenses, and digital goods',
        icon: '💾',
        color: '#3B82F6',
        guidance: {
          pattern: '[Product name] — [format or edition]',
          example: 'UI Kit Pro — Figma + Sketch Bundle',
          whenToUse: 'Use for downloadable or digital-only products',
          contentHints: 'Include file formats, compatibility, license terms, and what is included.',
        },
        actions: ['Available', 'Updated', 'Deprecated'],
      },
      {
        name: 'Service',
        description: 'Professional services and subscriptions',
        icon: '🔧',
        color: '#8B5CF6',
        guidance: {
          pattern: '[Service name] — [scope or tier]',
          example: 'Website Audit — Full SEO + Performance Review',
          whenToUse: 'Use for services, consultations, or subscription offerings',
          contentHints: 'Describe what is included, deliverables, timeline, and any prerequisites.',
        },
        actions: ['Accepting Clients', 'Fully Booked', 'Paused'],
      },
    ],
    workspaces: [
      { name: 'New Arrivals', description: 'Recently added products', visibility: 'public' },
      { name: 'Featured', description: 'Hand-picked highlights', visibility: 'public' },
      { name: 'Sale', description: 'Discounted items', visibility: 'public' },
    ],
    settings: {
      sourceTitle: 'My Shop',
      sourceDescription: 'Browse our product catalog',
      qualityGuidelines: {
        keySummary: { tips: 'Use clear product name with key variant or feature. Example: Wireless Headphones — Active Noise Cancelling, Black' },
        content: { tips: 'Write for shoppers scanning quickly. Lead with what the product does, then specs and details.' },
        formatting: [
          'Tables: specifications, dimensions, compatibility',
          'Bullet lists: features, what is included, requirements',
          'Numbered lists: setup steps, usage instructions',
          'Headings: separate Description, Specifications, What is Included sections',
          'Bold: highlight key specs or standout features',
        ],
        avoid: [
          'Vague descriptions without specifics',
          'Marketing fluff without substance',
          'Missing key specs (size, weight, compatibility)',
          'Repeating the product name in the description body',
        ],
      },
      validationLimits: {
        keySummary: { min: 10, max: 200 },
        content: { min: 1, max: 20000 },
      },
    },
  },
};

const blogConfig: TemplateConfig = {
  profile: blogProfile,
  vocabulary: {
    item: 'signal',
    itemPlural: 'signals',
    type: 'type',
    typePlural: 'types',
    workspace: 'workspace',
    workspacePlural: 'workspaces',
    vouch: 'vouch',
    vouched: 'vouched',
  },
  seo: {
    siteSchemaType: 'Blog',
    itemSchemaType: 'BlogPosting',
  },
  mcp: {
    instructions:
      'Pignal is a self-hosted content platform for publishing signals — structured insights, decisions, and techniques. ' +
      'Each signal has a type, key summary, content in markdown, and optional tags.\n\n' +
      'Available tools:\n' +
      '- save_item: Capture a signal from this conversation\n' +
      '- list_items / search_items: Browse and search existing signals\n' +
      '- update_item: Edit an existing signal\n' +
      '- validate_item: Apply a validation action (vouch, archive, etc.)\n' +
      '- vouch_item: Change signal visibility (private/unlisted/vouched)\n' +
      '- batch_vouch_items: Change visibility for multiple signals at once\n' +
      '- get_metadata: Get available types, workspaces, and quality guidelines\n' +
      '- create_workspace / create_type: Organize your signals\n\n' +
      'Always call get_metadata first to learn the available types and quality guidelines before saving.',
    toolDescriptions: {
      save_item:
        'Capture a structured signal from this conversation. ALWAYS call get_metadata first — it provides required IDs, current limits, and quality guidelines for writing effective signals.',
      list_items:
        "Browse the user's signals with optional filters. Use to review existing signals or check for duplicates before saving.",
      search_items:
        'Search signals by keyword across summaries and content. Use to find related knowledge before saving or to locate signals for validation.',
      get_metadata:
        'Get signal types, workspaces, and quality guidelines. ALWAYS call this first before save_item or validate_item — the response contains required IDs, configurable limits, and detailed instructions for writing high-quality signals.',
      validate_item:
        'Apply a validation action to a signal (e.g., Confirmed, Worked, Good call). Validation strengthens retention by forcing accuracy evaluation. Call get_metadata first for valid action IDs.',
      update_item:
        'Update an existing signal. Use to correct, expand, or reclassify a previously saved signal.',
      create_workspace:
        'Create a new workspace for organizing signals by project or context. Call get_metadata first to see existing workspaces.',
      create_type:
        'Create a new signal type with validation actions. Call get_metadata first to see existing types and avoid duplicates.',
      vouch_item:
        'Change a signal\'s visibility: "vouched" makes it public with a URL slug, "unlisted" creates a share link, "private" hides it. Use to publish signals to the source page.',
      batch_vouch_items:
        'Change visibility for multiple signals at once (max 50). Each signal can have its own visibility and optional slug. Use to publish a batch of signals to the source page.',
    },
    responseLabels: {
      saved: 'Signal saved!',
      updated: 'Signal updated!',
      validated: 'Signal validated!',
      notFound: 'Signal not found.',
      found: 'Found {total} signals (showing {count})',
      visibilityUpdated: 'Signal visibility updated!',
      batchComplete: 'Batch vouch complete:',
      workspaceCreated: 'Workspace created!',
      typeCreated: 'Type created!',
    },
    schemaDescriptions: {
      'save_item.keySummary':
        'Concise first-person summary. Use I/My framing. Check get_metadata for current length limits and type-specific patterns.',
      'save_item.content':
        'Full explanation in markdown for future review. Include context, reasoning, and examples. Check get_metadata for current limits.',
      'save_item.typeId':
        'Signal type ID (from get_metadata). Choose the most specific type that fits.',
      'save_item.workspaceId':
        'Optional workspace ID for organizing by project context (from get_metadata).',
      'save_item.tags':
        'Optional tags. Use lowercase keywords (e.g. ["react", "performance", "hooks"]).',
      'create_workspace.name':
        'Workspace name. Use a clear name for the project or context.',
      'create_type.name':
        'Signal type name (e.g., "Bug Fix", "Architecture Decision").',
      'create_type.actions':
        'Validation actions (e.g., "Confirmed", "Worked", "Good call"). At least 1 required.',
    },
  },
};

const shopConfig: TemplateConfig = {
  profile: shopProfile,
  vocabulary: {
    item: 'product',
    itemPlural: 'products',
    type: 'category',
    typePlural: 'categories',
    workspace: 'collection',
    workspacePlural: 'collections',
    vouch: 'list',
    vouched: 'listed',
  },
  seo: {
    siteSchemaType: 'WebSite',
    itemSchemaType: 'Product',
  },
  mcp: {
    instructions:
      'Pignal is a self-hosted product catalog platform. ' +
      'Each product has a category, title, description in markdown, and optional tags.\n\n' +
      'Available tools:\n' +
      '- save_item: Create a new product listing\n' +
      '- list_items / search_items: Browse and search the product catalog\n' +
      '- update_item: Update a product listing\n' +
      '- validate_item: Mark a product as reviewed or verified\n' +
      '- vouch_item: Publish or unlist a product (listed/unlisted/private)\n' +
      '- batch_vouch_items: Publish or unlist multiple products at once\n' +
      '- get_metadata: Get available categories, collections, and content guidelines\n' +
      '- create_workspace / create_type: Create new collections and categories\n\n' +
      'Always call get_metadata first to learn the available categories and content guidelines.',
    toolDescriptions: {
      save_item:
        'Create a new product listing. ALWAYS call get_metadata first — it provides required IDs, current limits, and content guidelines.',
      list_items:
        'Browse products with optional filters by category or collection. Use to review the catalog or check for duplicates.',
      search_items:
        'Search products by keyword across titles and descriptions. Use to find related products before creating or to locate products for review.',
      get_metadata:
        'Get product categories, collections, and content guidelines. ALWAYS call this first before save_item — the response contains required IDs and formatting guidelines.',
      validate_item:
        'Mark a product as reviewed or verified. Call get_metadata first for valid review action IDs.',
      update_item:
        'Update an existing product listing. Use to correct details, expand descriptions, or recategorize.',
      create_workspace:
        'Create a new collection for grouping related products. Call get_metadata first to see existing collections.',
      create_type:
        'Create a new product category with review actions. Call get_metadata first to see existing categories and avoid duplicates.',
      vouch_item:
        'Change a product\'s listing status: "vouched" lists it publicly, "unlisted" creates a share link, "private" hides it from the catalog.',
      batch_vouch_items:
        'Change listing status for multiple products at once (max 50). Use to publish a batch of products to the catalog.',
    },
    responseLabels: {
      saved: 'Product created!',
      updated: 'Product updated!',
      validated: 'Product reviewed!',
      notFound: 'Product not found.',
      found: 'Found {total} products (showing {count})',
      visibilityUpdated: 'Product listing updated!',
      batchComplete: 'Batch listing complete:',
      workspaceCreated: 'Collection created!',
      typeCreated: 'Category created!',
    },
    schemaDescriptions: {
      'save_item.keySummary':
        'Product title with key variant or feature. Example: "Wireless Headphones — ANC, Black"',
      'save_item.content':
        'Product description in markdown. Include specs, features, what is included. Use tables for specifications.',
      'save_item.typeId': 'Product category ID (from get_metadata).',
      'save_item.workspaceId':
        'Optional collection ID for grouping products (from get_metadata).',
      'save_item.tags':
        'Optional product tags. Use lowercase keywords (e.g. ["electronics", "wireless"]).',
      'create_workspace.name':
        'Collection name (e.g., "Summer Sale", "New Arrivals").',
      'create_type.name':
        'Product category name (e.g., "Electronics", "Clothing").',
      'create_type.actions':
        'Review actions (e.g., "In Stock", "Out of Stock", "Discontinued"). At least 1 required.',
    },
  },
};

// --- Batch imports ---

import { tilConfig, reviewsConfig, journalConfig, writingConfig, awesomeConfig, podcastConfig } from './configs-feed';
import { portfolioConfig, recipesConfig, bookshelfConfig, flashcardsConfig } from './configs-grid';
import { wikiConfig, courseConfig, runbookConfig, servicesConfig, directoryConfig } from './configs-directory';
import { changelogConfig, incidentsConfig, magazineConfig, caseStudiesConfig, menuConfig, glossaryConfig, resumeConfig } from './configs-remaining';

// --- Registry ---

const TEMPLATE_CONFIGS: Record<string, TemplateConfig> = {
  blog: blogConfig,
  shop: shopConfig,
  til: tilConfig,
  reviews: reviewsConfig,
  journal: journalConfig,
  writing: writingConfig,
  'awesome-list': awesomeConfig,
  podcast: podcastConfig,
  portfolio: portfolioConfig,
  recipes: recipesConfig,
  bookshelf: bookshelfConfig,
  flashcards: flashcardsConfig,
  wiki: wikiConfig,
  course: courseConfig,
  runbook: runbookConfig,
  services: servicesConfig,
  directory: directoryConfig,
  changelog: changelogConfig,
  incidents: incidentsConfig,
  magazine: magazineConfig,
  'case-studies': caseStudiesConfig,
  menu: menuConfig,
  glossary: glossaryConfig,
  resume: resumeConfig,
};

export const DEFAULT_TEMPLATE_CONFIG: TemplateConfig = blogConfig;

/** Get template config by name. Falls back to blog. */
export function getTemplateConfig(templateName: string): TemplateConfig {
  return TEMPLATE_CONFIGS[templateName] ?? DEFAULT_TEMPLATE_CONFIG;
}

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
