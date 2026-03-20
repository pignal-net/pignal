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

export interface TemplateConfig {
  vocabulary: TemplateVocabulary;
  seo: TemplateSeoHints;
  mcp: TemplateMcpConfig;
}

// --- Template configs ---

const blogConfig: TemplateConfig = {
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

// --- Registry ---

const TEMPLATE_CONFIGS: Record<string, TemplateConfig> = {
  blog: blogConfig,
  shop: shopConfig,
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
