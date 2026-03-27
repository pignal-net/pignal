import type { TemplateConfig, TemplateProfile } from '../config';

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
    actions: [
      {
        name: 'Product Inquiry',
        slug: 'product-inquiry',
        description: 'Ask a question about a product',
        fields: [
          { name: 'name', type: 'text', label: 'Name', required: true, placeholder: 'Your name', maxLength: 100 },
          { name: 'email', type: 'email', label: 'Email', required: true, placeholder: 'you@example.com' },
          { name: 'product_type', type: 'select', label: 'Product Type', required: true, options: ['Physical Product', 'Digital Product', 'Service', 'Other'] },
          { name: 'message', type: 'textarea', label: 'Your Question', required: true, placeholder: 'What would you like to know?', maxLength: 2000 },
        ],
        settings: { success_message: 'Thanks for your inquiry! We\'ll get back to you shortly.', require_honeypot: true },
      },
      {
        name: 'Newsletter',
        slug: 'newsletter',
        description: 'Subscribe to product updates and offers',
        fields: [
          { name: 'email', type: 'email', label: 'Email Address', required: true, placeholder: 'you@example.com' },
        ],
        settings: { success_message: 'You\'re subscribed! Watch your inbox for product updates and special offers.', require_honeypot: true },
      },
    ],
  },
};

export const shopConfig: TemplateConfig = {
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
