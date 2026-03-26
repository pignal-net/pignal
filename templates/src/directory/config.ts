import type { TemplateConfig, TemplateProfile } from '../config';

const directoryProfile: TemplateProfile = {
  id: 'directory',
  displayName: 'Resource Directory',
  tagline: 'Curated list of external resources with status badges',
  description:
    'A directory layout for curating external resources with link cards, status badges, and categorical grouping. ' +
    'Designed for short descriptions with external links — not long-form content. ' +
    'Alphabetical or categorical navigation with Active/Archived/New indicators.',
  domain: 'community',
  contentType: 'profiles',
  layout: 'directory',
  audience: ['community maintainers', 'developer advocates', 'educators', 'curators'],
  useCases: [
    'Curate a directory of tools and frameworks for a developer community',
    'Maintain a resource list with status indicators and descriptions',
    'Build a categorized link collection with editorial commentary',
    'Publish a curated guide to external resources in a domain',
  ],
  differentiators: [
    'External link cards with domain/favicon',
    'Status badges (Active/Archived/New)',
    'Alphabetical or categorical grouping',
    'No long content — link + short description',
  ],
  seedData: {
    types: [
      {
        name: 'Framework',
        description: 'Libraries, frameworks, and development tools',
        icon: '🔨',
        color: '#3B82F6',
        guidance: {
          pattern: '[Name] — [What it does in one phrase]',
          example: 'Hono — Ultrafast web framework for Cloudflare Workers and Deno',
          whenToUse: 'Use for development frameworks, libraries, SDKs, and programming tools',
          contentHints:
            'Include the official URL, a 2-3 sentence description of what it does and why it stands out, ' +
            'key features as bullet points, and the license type. Keep it concise — this is a directory entry, not a review.',
        },
        actions: ['Active', 'Archived', 'New', 'Deprecated'],
      },
      {
        name: 'Service',
        description: 'Hosted platforms, APIs, and cloud services',
        icon: '☁️',
        color: '#8B5CF6',
        guidance: {
          pattern: '[Name] — [Service type and key differentiator]',
          example: 'Cloudflare Workers — Edge compute platform with zero cold starts',
          whenToUse: 'Use for hosted services, APIs, SaaS platforms, and cloud providers',
          contentHints:
            'Include the URL, a brief description, pricing model (free tier, paid, open-source), ' +
            'and notable limitations. Mention alternatives where helpful.',
        },
        actions: ['Active', 'Shutting Down', 'New', 'Acquired'],
      },
      {
        name: 'Learning Resource',
        description: 'Tutorials, courses, books, and documentation',
        icon: '📚',
        color: '#10B981',
        guidance: {
          pattern: '[Name] — [Format] for [audience or topic]',
          example: 'The Rust Book — Official guide for learning Rust from scratch',
          whenToUse: 'Use for educational content: tutorials, books, video courses, documentation sites',
          contentHints:
            'Include the URL, format (book, video, interactive), target audience (beginner/advanced), ' +
            'and what makes this resource stand out. Note if it is free or paid.',
        },
        actions: ['Recommended', 'Outdated', 'New', 'Superseded'],
      },
      {
        name: 'Community',
        description: 'Forums, Discord servers, meetups, and organizations',
        icon: '👥',
        color: '#F59E0B',
        guidance: {
          pattern: '[Name] — [Community type] for [focus area]',
          example: 'Reactiflux — Discord community for React developers',
          whenToUse: 'Use for communities, forums, chat groups, meetups, and organizations',
          contentHints:
            'Include the join URL, approximate size or activity level, ' +
            'what topics are covered, and any membership requirements. Note the primary platform (Discord, Slack, etc.).',
        },
        actions: ['Active', 'Inactive', 'New', 'Merged'],
      },
      {
        name: 'Dataset',
        description: 'Open datasets, benchmarks, and research data',
        icon: '📊',
        color: '#EC4899',
        guidance: {
          pattern: '[Name] — [Data type and domain]',
          example: 'Common Crawl — Petabyte-scale web archive for NLP research',
          whenToUse: 'Use for open datasets, benchmarks, research corpora, and data repositories',
          contentHints:
            'Include the URL, data format, size, update frequency, and license. ' +
            'Note any access requirements or usage restrictions. Mention known use cases.',
        },
        actions: ['Active', 'Stale', 'New', 'Deprecated'],
      },
    ],
    workspaces: [
      { name: 'Essential Tools', description: 'Must-know tools and resources', visibility: 'public' },
      { name: 'Rising Stars', description: 'Emerging and noteworthy newcomers', visibility: 'public' },
      { name: 'Historical', description: 'Important but no longer actively maintained', visibility: 'public' },
      { name: 'Specialized', description: 'Niche tools for specific use cases', visibility: 'public' },
    ],
    settings: {
      sourceTitle: 'My Resource Directory',
      sourceDescription: 'A curated collection of tools, services, and resources',
      qualityGuidelines: {
        keySummary: {
          tips:
            'Use the resource name followed by a concise description of what it does. ' +
            'Follow the category-specific pattern. Example: "Vite — Next-generation frontend build tool"',
        },
        content: {
          tips:
            'Keep it short — this is a directory, not a review. Include the URL, a 2-3 sentence description, ' +
            'key highlights as bullet points, and any important caveats. Focus on why this resource matters.',
        },
        formatting: [
          'Bullet lists: key features, highlights, alternatives',
          'Bold: resource name, pricing model, license type',
          'Links: official URL, documentation, GitHub repository',
          'Tables: comparison with alternatives (only when adding multiple related entries)',
        ],
        avoid: [
          'Long reviews — keep entries concise and scannable',
          'Missing URLs — every entry must link to the resource',
          'Stale entries without status updates',
        ],
      },
      validationLimits: {
        keySummary: { min: 10, max: 200 },
        content: { min: 1, max: 3000 },
      },
    },
  },
};

export const directoryConfig: TemplateConfig = {
  profile: directoryProfile,
  vocabulary: {
    item: 'resource',
    itemPlural: 'resources',
    type: 'category',
    typePlural: 'categories',
    workspace: 'collection',
    workspacePlural: 'collections',
    vouch: 'feature',
    vouched: 'featured',
  },
  seo: {
    siteSchemaType: 'WebSite',
    itemSchemaType: 'WebPage',
  },
  mcp: {
    instructions:
      'Pignal is a self-hosted resource directory platform for curating external tools, services, and learning materials — each with a link, short description, and status badge. ' +
      'Each resource has a category, title, brief description in markdown, and optional tags.\n\n' +
      'Available tools:\n' +
      '- save_item: Add a new resource to the directory\n' +
      '- list_items / search_items: Browse and search existing resources\n' +
      '- update_item: Update an existing resource entry\n' +
      '- validate_item: Update a resource status (active, archived, new, deprecated)\n' +
      '- vouch_item: Feature or unfeature a resource (featured/unlisted/private)\n' +
      '- batch_vouch_items: Feature or unfeature multiple resources at once\n' +
      '- get_metadata: Get available categories, collections, and content guidelines\n' +
      '- create_workspace / create_type: Create new collections and categories\n\n' +
      'Always call get_metadata first to learn the available categories and content guidelines before saving.',
    toolDescriptions: {
      save_item:
        'Add a new resource to the directory. ALWAYS call get_metadata first — it provides required IDs, current limits, and content guidelines for writing concise resource entries.',
      list_items:
        'Browse resources with optional filters by category or collection. Use to review the directory or check for duplicates before adding.',
      search_items:
        'Search resources by keyword across titles and descriptions. Use to find related resources before adding or to locate resources for status updates.',
      get_metadata:
        'Get resource categories, collections, and content guidelines. ALWAYS call this first before save_item or validate_item — the response contains required IDs, configurable limits, and detailed instructions for writing effective directory entries.',
      validate_item:
        'Update a resource status (e.g., Active, Archived, Deprecated). Status tracking keeps the directory current and trustworthy. Call get_metadata first for valid action IDs.',
      update_item:
        'Update an existing resource entry. Use to correct links, update descriptions, or recategorize.',
      create_workspace:
        'Create a new collection for grouping related resources. Call get_metadata first to see existing collections.',
      create_type:
        'Create a new resource category with status actions. Call get_metadata first to see existing categories and avoid duplicates.',
      vouch_item:
        'Change a resource\'s visibility: "vouched" features it with a URL slug, "unlisted" creates a share link, "private" hides it. Use to feature resources in the directory.',
      batch_vouch_items:
        'Change visibility for multiple resources at once (max 50). Each resource can have its own visibility and optional slug. Use to feature a batch of resources.',
    },
    responseLabels: {
      saved: 'Resource added!',
      updated: 'Resource updated!',
      validated: 'Resource status updated!',
      notFound: 'Resource not found.',
      found: 'Found {total} resources (showing {count})',
      visibilityUpdated: 'Resource featuring updated!',
      batchComplete: 'Batch featuring complete:',
      workspaceCreated: 'Collection created!',
      typeCreated: 'Category created!',
    },
    schemaDescriptions: {
      'save_item.keySummary':
        'Resource name with concise description. Example: "Drizzle ORM — TypeScript ORM for SQL databases with zero dependencies"',
      'save_item.content':
        'Short resource description in markdown. Include the URL, 2-3 sentence summary, key highlights as bullets, and any caveats. Check get_metadata for current limits.',
      'save_item.typeId':
        'Resource category ID (from get_metadata). Choose the category that best fits: Framework, Service, Learning Resource, Community, or Dataset.',
      'save_item.workspaceId':
        'Optional collection ID for grouping resources (from get_metadata). Examples: "Essential Tools", "Rising Stars", "Specialized".',
      'save_item.tags':
        'Optional tags. Use lowercase keywords (e.g. ["typescript", "orm", "database"]).',
      'create_workspace.name':
        'Collection name (e.g., "AI/ML Tools", "Frontend Ecosystem", "DevOps Essentials").',
      'create_type.name':
        'Resource category name (e.g., "CLI Tool", "Browser Extension", "Newsletter").',
      'create_type.actions':
        'Status actions (e.g., "Active", "Archived", "Deprecated"). At least 1 required.',
    },
  },
};
