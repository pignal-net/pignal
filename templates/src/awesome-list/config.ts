import type { TemplateConfig, TemplateProfile } from '../config';

const awesomeProfile: TemplateProfile = {
  id: 'awesome-list',
  displayName: 'Curated List',
  tagline: 'Curated link directory with category sections and anchor navigation',
  description:
    'A curated link directory inspired by awesome-lists. Category-grouped sections with anchor navigation, ' +
    'compact one-line link format, and no card chrome. Built for maintaining and sharing curated resource collections.',
  domain: 'community',
  contentType: 'entries',
  layout: 'feed',
  audience: ['curators', 'developers', 'educators', 'community builders', 'researchers'],
  useCases: [
    'Curate and share the best resources on a topic',
    'Maintain a living directory of tools, libraries, and tutorials',
    'Build a community-oriented resource list with categories',
  ],
  differentiators: [
    'Category-grouped sections with anchor navigation sidebar',
    'Compact link + one-line description format (no card borders)',
    'No grid or card layout — flat directory aesthetic',
    'Built for scanning and reference, not reading',
  ],
  seedData: {
    types: [
      {
        name: 'Library',
        description: 'Reusable code library or framework',
        icon: '📦',
        color: '#8B5CF6',
        guidance: {
          pattern: '[Library name] — [what it does in one line]',
          example: 'Zod — TypeScript-first schema validation with static type inference',
          whenToUse: 'Use for code libraries, frameworks, SDKs, or packages that developers install',
          contentHints: 'Include install command, key features (3-5 bullets), and a link to the repo or docs. Mention language/platform.',
        },
        actions: ['Active', 'Unmaintained', 'Superseded', 'Niche'],
      },
      {
        name: 'Tool',
        description: 'Standalone application or utility',
        icon: '🔧',
        color: '#3B82F6',
        guidance: {
          pattern: '[Tool name] — [what it does and key benefit]',
          example: 'Raycast — Spotlight replacement with extensions for dev workflows',
          whenToUse: 'Use for standalone apps, CLI tools, browser extensions, or online utilities',
          contentHints: 'Describe what it replaces or improves. Include platform availability and pricing (free/paid/freemium).',
        },
        actions: ['Essential', 'Useful', 'Niche', 'Deprecated'],
      },
      {
        name: 'Tutorial',
        description: 'Learning resource or guide',
        icon: '📚',
        color: '#10B981',
        guidance: {
          pattern: '[Title or topic] — [what you will learn]',
          example: 'The Missing Semester of CS Education — command-line tools every developer should know',
          whenToUse: 'Use for tutorials, courses, guides, documentation sites, or learning paths',
          contentHints: 'Mention the target audience (beginner/intermediate/advanced), format (video/text/interactive), and estimated time.',
        },
        actions: ['Still current', 'Outdated', 'Best in class', 'Beginner-only'],
      },
      {
        name: 'Article',
        description: 'Blog post, paper, or in-depth write-up',
        icon: '📄',
        color: '#F59E0B',
        guidance: {
          pattern: '[Title] by [Author] — [why it is worth reading]',
          example: 'Choose Boring Technology by Dan McKinley — the case for proven tools over shiny new ones',
          whenToUse: 'Use for blog posts, research papers, essays, or long-form write-ups worth bookmarking',
          contentHints: 'Summarize the key argument or takeaway in 2-3 sentences. Mention why this particular piece stands out.',
        },
        actions: ['Timeless', 'Dated but useful', 'Controversial', 'Foundational'],
      },
      {
        name: 'Community',
        description: 'Forum, Discord, meetup, or collective',
        icon: '👥',
        color: '#EC4899',
        guidance: {
          pattern: '[Community name] — [what it is for and where it lives]',
          example: 'Reactiflux — The largest React community on Discord with 200k+ members',
          whenToUse: 'Use for forums, Discord servers, Slack groups, meetups, or open-source collectives',
          contentHints: 'Describe the community focus, size (if notable), platform, and how to join.',
        },
        actions: ['Active', 'Slowing down', 'Invite-only', 'Archived'],
      },
    ],
    workspaces: [
      { name: 'Essential', description: 'Must-know resources for anyone in the field', visibility: 'public' },
      { name: 'Advanced', description: 'Deep dives and expert-level material', visibility: 'public' },
      { name: 'Experimental', description: 'Cutting-edge and emerging resources', visibility: 'public' },
      { name: 'Archive', description: 'Historical or superseded resources', visibility: 'public' },
    ],
    settings: {
      sourceTitle: 'My Awesome List',
      sourceDescription: 'A curated collection of the best resources',
      qualityGuidelines: {
        keySummary: { tips: 'Use the format: Name — one-line description. Be specific about what makes this resource worth including.' },
        content: { tips: 'Keep it brief. A short paragraph or a few bullets explaining why this resource is featured. Include a link.' },
        formatting: [
          'Links: always include the primary URL',
          'Bullet lists: key features, highlights, or reasons to use it',
          'Bold: highlight the resource name at the start',
          'Code blocks: install commands or quick-start snippets',
        ],
        avoid: [
          'Long reviews (this is a directory, not a review site)',
          'Resources without a clear reason for inclusion',
          'Dead links or abandoned projects without noting it',
          'Duplicating the keySummary in the content body',
        ],
      },
      validationLimits: {
        keySummary: { min: 10, max: 200 },
        content: { min: 1, max: 3000 },
      },
    },
    actions: [
      {
        name: 'Submit Resource',
        slug: 'submit-resource',
        description: 'Submit a resource for inclusion in the list',
        fields: [
          { name: 'name', type: 'text', label: 'Your Name', required: true, placeholder: 'Your name', maxLength: 100 },
          { name: 'email', type: 'email', label: 'Email', required: true, placeholder: 'you@example.com' },
          { name: 'resource_url', type: 'url', label: 'Resource URL', required: true, placeholder: 'https://...', maxLength: 500 },
          { name: 'resource_title', type: 'text', label: 'Resource Title', required: true, placeholder: 'Name of the resource', maxLength: 200 },
          { name: 'why', type: 'textarea', label: 'Why should this be included?', required: true, placeholder: 'Describe the resource and why it deserves a spot on the list...', maxLength: 2000 },
        ],
        settings: { success_message: 'Thanks for the submission! We\'ll review the resource and add it if it meets our curation standards.', require_honeypot: true },
      },
    ],
  },
};

export const awesomeConfig: TemplateConfig = {
  profile: awesomeProfile,
  vocabulary: {
    item: 'link',
    itemPlural: 'links',
    type: 'category',
    typePlural: 'categories',
    workspace: 'list',
    workspacePlural: 'lists',
    vouch: 'feature',
    vouched: 'featured',
  },
  seo: {
    siteSchemaType: 'WebSite',
    itemSchemaType: 'WebPage',
  },
  mcp: {
    instructions:
      'Pignal is a self-hosted content platform for curating awesome lists — categorized collections of the best resources on a topic. ' +
      'Each link has a category (type), key summary with name and description, optional markdown content, and optional tags.\n\n' +
      'Available tools:\n' +
      '- save_item: Add a new link to the list\n' +
      '- list_items / search_items: Browse and search existing links\n' +
      '- update_item: Edit an existing link\n' +
      '- validate_item: Apply a status action (e.g., Active, Unmaintained)\n' +
      '- vouch_item: Change link visibility (private/unlisted/featured)\n' +
      '- batch_vouch_items: Change visibility for multiple links at once\n' +
      '- get_metadata: Get available categories, lists, and quality guidelines\n' +
      '- create_workspace / create_type: Create new lists and categories\n\n' +
      'Always call get_metadata first to learn the available categories and quality guidelines before saving.',
    toolDescriptions: {
      save_item:
        'Add a new link to the awesome list. ALWAYS call get_metadata first — it provides required IDs, current limits, and quality guidelines for writing effective link entries.',
      list_items:
        "Browse the user's links with optional filters by category or list. Use to review existing links or check for duplicates before adding.",
      search_items:
        'Search links by keyword across summaries and content. Use to find related resources before adding or to locate links for review.',
      get_metadata:
        'Get categories, lists, and quality guidelines. ALWAYS call this first before save_item or validate_item — the response contains required IDs, configurable limits, and detailed instructions.',
      validate_item:
        'Apply a status action to a link (e.g., Active, Unmaintained, Essential). Use to maintain list quality over time. Call get_metadata first for valid action IDs.',
      update_item:
        'Update an existing link. Use to fix URLs, update descriptions, or recategorize resources.',
      create_workspace:
        'Create a new list for grouping related links (e.g., "React Ecosystem", "DevOps Essentials"). Call get_metadata first to see existing lists.',
      create_type:
        'Create a new category with status actions (e.g., "Podcast", "Newsletter"). Call get_metadata first to see existing categories and avoid duplicates.',
      vouch_item:
        'Change a link\'s visibility: "featured" makes it public on the list, "unlisted" creates a share link, "private" hides it. Use to feature vetted resources.',
      batch_vouch_items:
        'Change visibility for multiple links at once (max 50). Each link can have its own visibility and optional slug. Use to feature a batch of curated links.',
    },
    responseLabels: {
      saved: 'Link added!',
      updated: 'Link updated!',
      validated: 'Link status updated!',
      notFound: 'Link not found.',
      found: 'Found {total} links (showing {count})',
      visibilityUpdated: 'Link visibility updated!',
      batchComplete: 'Batch feature complete:',
      workspaceCreated: 'List created!',
      typeCreated: 'Category created!',
    },
    schemaDescriptions: {
      'save_item.keySummary':
        'Resource name + one-line description. Example: "Zod — TypeScript-first schema validation with static type inference". Check get_metadata for limits.',
      'save_item.content':
        'Brief explanation of why this resource is featured. Include the URL, key highlights, and install command if applicable. Check get_metadata for current limits.',
      'save_item.typeId':
        'Category ID (from get_metadata). Choose: Library, Tool, Tutorial, Article, or Community.',
      'save_item.workspaceId':
        'Optional list ID for grouping resources (from get_metadata). E.g., Essential, Advanced, Experimental.',
      'save_item.tags':
        'Optional tags. Use lowercase keywords (e.g. ["typescript", "validation", "runtime"]).',
      'create_workspace.name':
        'List name (e.g., "React Ecosystem", "Rust Tools", "Design Systems").',
      'create_type.name':
        'Category name (e.g., "Podcast", "Newsletter", "Specification").',
      'create_type.actions':
        'Status actions (e.g., "Active", "Unmaintained", "Best in class"). At least 1 required.',
    },
  },
};
