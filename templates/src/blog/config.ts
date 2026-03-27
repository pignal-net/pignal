import type { TemplateConfig, TemplateProfile } from '../config';

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
    actions: [
      {
        name: 'Newsletter Signup',
        slug: 'newsletter',
        description: 'Subscribe to receive new posts via email',
        fields: [
          { name: 'email', type: 'email', label: 'Email Address', required: true, placeholder: 'you@example.com' },
        ],
        settings: { success_message: 'Thanks for subscribing! You\'ll receive new posts in your inbox.', require_honeypot: true },
      },
      {
        name: 'Feedback',
        slug: 'feedback',
        description: 'Share your thoughts or suggestions',
        fields: [
          { name: 'name', type: 'text', label: 'Name', required: true, placeholder: 'Your name', maxLength: 100 },
          { name: 'email', type: 'email', label: 'Email', required: true, placeholder: 'you@example.com' },
          { name: 'message', type: 'textarea', label: 'Message', required: true, placeholder: 'Your feedback...', maxLength: 2000 },
        ],
        settings: { success_message: 'Thanks for your feedback!', require_honeypot: true },
      },
    ],
  },
};

export const blogConfig: TemplateConfig = {
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
