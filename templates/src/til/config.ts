import type { TemplateConfig, TemplateProfile } from '../config';

const tilProfile: TemplateProfile = {
  id: 'til',
  displayName: 'Today I Learned',
  tagline: 'Ultra-compact daily snippets grouped by date with topic badges',
  description:
    'A micro-learning feed optimized for daily snippets and quick discoveries. ' +
    'Date-grouped headers, compact cards showing only the key summary, and topic-based filtering. ' +
    'Built for developers who capture one small thing every day.',
  domain: 'knowledge',
  contentType: 'entries',
  layout: 'feed',
  audience: ['developers', 'learners', 'technical writers', 'hobbyists'],
  useCases: [
    'Capture one small thing you learned each day',
    'Build a searchable archive of code tricks and tool tips',
    'Share bite-sized technical knowledge publicly',
  ],
  differentiators: [
    'Ultra-compact cards showing keySummary only (no excerpt)',
    'Date-grouped headers for daily browsing',
    'No reading time estimates (snippets are inherently short)',
    'Topic badges instead of type categorization for flat browsing',
  ],
  seedData: {
    types: [
      {
        name: 'Code Trick',
        description: 'A clever technique or shortcut',
        icon: '🧩',
        color: '#8B5CF6',
        guidance: {
          pattern: '[Language/tool]: [what the trick does]',
          example: 'CSS: Use `accent-color` to theme checkboxes and radio buttons natively',
          whenToUse: 'Use when you discover a clever shortcut, one-liner, or non-obvious technique',
          contentHints: 'Show the code snippet or command. Keep it under a few paragraphs. Link to docs if relevant.',
        },
        actions: ['Verified', 'Outdated', 'Platform-specific'],
      },
      {
        name: 'Tool Discovery',
        description: 'A useful tool or utility found',
        icon: '🔧',
        color: '#3B82F6',
        guidance: {
          pattern: '[Tool name]: [what it does and why it is useful]',
          example: 'fnm: A fast Node.js version manager written in Rust — replaces nvm with instant switching',
          whenToUse: 'Use when you find a new tool, CLI utility, library, or service worth remembering',
          contentHints: 'Describe what it does, how to install it, and one example command or usage pattern.',
        },
        actions: ['Still using', 'Replaced', 'Niche use'],
      },
      {
        name: 'Language Quirk',
        description: 'A surprising language behavior',
        icon: '😮',
        color: '#F59E0B',
        guidance: {
          pattern: '[Language]: [the surprising behavior]',
          example: 'JavaScript: `typeof null` returns "object" — a bug from the first implementation, never fixed',
          whenToUse: 'Use when a language does something unexpected, counterintuitive, or poorly documented',
          contentHints: 'Show the surprising behavior with a minimal example. Explain why it happens if you know.',
        },
        actions: ['Confirmed', 'By design', 'Fixed in newer version'],
      },
      {
        name: 'DevOps Tip',
        description: 'Infrastructure or deployment insight',
        icon: '🚀',
        color: '#10B981',
        guidance: {
          pattern: '[Context]: [the tip or technique]',
          example: 'Docker: Multi-stage builds reduce image size by 80% — only copy artifacts from build stage',
          whenToUse: 'Use for deployment tricks, CI/CD insights, infrastructure shortcuts, or cloud tips',
          contentHints: 'Include the command or config snippet. Mention any caveats or platform requirements.',
        },
        actions: ['Works in prod', 'Dev only', 'Deprecated'],
      },
      {
        name: 'API Gotcha',
        description: 'A non-obvious API behavior or pitfall',
        icon: '⚠️',
        color: '#EF4444',
        guidance: {
          pattern: '[API/service]: [the gotcha or pitfall]',
          example: 'Stripe: Webhook signatures expire after 5 minutes — clock skew on your server will reject valid events',
          whenToUse: 'Use when an API behaves unexpectedly, has a hidden limit, or a poorly documented constraint',
          contentHints: 'Describe what you expected vs what happened. Include the workaround or solution.',
        },
        actions: ['Still relevant', 'Fixed', 'Workaround exists'],
      },
    ],
    workspaces: [
      { name: 'Frontend', description: 'HTML, CSS, JavaScript, frameworks', visibility: 'public' },
      { name: 'Backend', description: 'Servers, databases, APIs', visibility: 'public' },
      { name: 'Infrastructure', description: 'DevOps, CI/CD, cloud', visibility: 'public' },
      { name: 'General', description: 'Everything else', visibility: 'public' },
    ],
    settings: {
      sourceTitle: 'My TIL',
      sourceDescription: 'Small things I learn every day',
      qualityGuidelines: {
        keySummary: { tips: 'Lead with the language, tool, or context. Keep it to one sentence. Be specific enough to be searchable later.' },
        content: { tips: 'Keep it short. A code snippet plus one paragraph of explanation is ideal. This is a snippet, not an article.' },
        formatting: [
          'Code blocks: the primary format for snippets and commands',
          'Bullet lists: quick alternatives or gotchas',
          'Bold: highlight the key takeaway in one sentence',
          'Links: reference docs or source material',
        ],
        avoid: [
          'Long-form essays (keep snippets under 500 words)',
          'Vague summaries like "Learned about CSS"',
          'Missing code examples when describing a technique',
          'Repeating the keySummary as the first line of content',
        ],
      },
      validationLimits: {
        keySummary: { min: 10, max: 120 },
        content: { min: 1, max: 2000 },
      },
    },
  },
};

export const tilConfig: TemplateConfig = {
  profile: tilProfile,
  vocabulary: {
    item: 'snippet',
    itemPlural: 'snippets',
    type: 'topic',
    typePlural: 'topics',
    workspace: 'notebook',
    workspacePlural: 'notebooks',
    vouch: 'publish',
    vouched: 'published',
  },
  seo: {
    siteSchemaType: 'WebSite',
    itemSchemaType: 'Article',
  },
  mcp: {
    instructions:
      'Pignal is a self-hosted content platform for publishing TIL snippets — bite-sized things you learn every day. ' +
      'Each snippet has a topic, key summary, optional markdown content, and optional tags.\n\n' +
      'Available tools:\n' +
      '- save_item: Capture a snippet from this conversation\n' +
      '- list_items / search_items: Browse and search existing snippets\n' +
      '- update_item: Edit an existing snippet\n' +
      '- validate_item: Apply a validation action (e.g., Verified, Outdated)\n' +
      '- vouch_item: Change snippet visibility (private/unlisted/published)\n' +
      '- batch_vouch_items: Change visibility for multiple snippets at once\n' +
      '- get_metadata: Get available topics, notebooks, and quality guidelines\n' +
      '- create_workspace / create_type: Create new notebooks and topics\n\n' +
      'Always call get_metadata first to learn the available topics and quality guidelines before saving.',
    toolDescriptions: {
      save_item:
        'Capture a TIL snippet from this conversation. ALWAYS call get_metadata first — it provides required IDs, current limits, and quality guidelines for writing effective snippets.',
      list_items:
        "Browse the user's snippets with optional filters by topic or notebook. Use to review existing snippets or check for duplicates before saving.",
      search_items:
        'Search snippets by keyword across summaries and content. Use to find related knowledge before saving or to locate snippets for validation.',
      get_metadata:
        'Get topics, notebooks, and quality guidelines. ALWAYS call this first before save_item or validate_item — the response contains required IDs, configurable limits, and detailed instructions.',
      validate_item:
        'Apply a validation action to a snippet (e.g., Verified, Outdated, Still relevant). Call get_metadata first for valid action IDs.',
      update_item:
        'Update an existing snippet. Use to correct, expand, or recategorize a previously saved snippet.',
      create_workspace:
        'Create a new notebook for organizing snippets by domain or project. Call get_metadata first to see existing notebooks.',
      create_type:
        'Create a new topic with validation actions. Call get_metadata first to see existing topics and avoid duplicates.',
      vouch_item:
        'Change a snippet\'s visibility: "published" makes it public with a URL slug, "unlisted" creates a share link, "private" hides it. Use to publish snippets to the TIL feed.',
      batch_vouch_items:
        'Change visibility for multiple snippets at once (max 50). Each snippet can have its own visibility and optional slug. Use to publish a batch of snippets.',
    },
    responseLabels: {
      saved: 'Snippet saved!',
      updated: 'Snippet updated!',
      validated: 'Snippet validated!',
      notFound: 'Snippet not found.',
      found: 'Found {total} snippets (showing {count})',
      visibilityUpdated: 'Snippet visibility updated!',
      batchComplete: 'Batch publish complete:',
      workspaceCreated: 'Notebook created!',
      typeCreated: 'Topic created!',
    },
    schemaDescriptions: {
      'save_item.keySummary':
        'One-line summary starting with the language or tool. Example: "CSS: Use container queries for component-level responsive design". Check get_metadata for limits.',
      'save_item.content':
        'Short explanation with a code snippet or example. Keep it concise — this is a TIL, not an article. Check get_metadata for current limits.',
      'save_item.typeId':
        'Topic ID (from get_metadata). Pick the topic that best matches: Code Trick, Tool Discovery, Language Quirk, DevOps Tip, or API Gotcha.',
      'save_item.workspaceId':
        'Optional notebook ID for organizing by domain (from get_metadata). E.g., Frontend, Backend, Infrastructure.',
      'save_item.tags':
        'Optional tags. Use lowercase keywords (e.g. ["css", "container-queries", "responsive"]).',
      'create_workspace.name':
        'Notebook name. Use a clear domain label (e.g., "Frontend", "Databases", "Security").',
      'create_type.name':
        'Topic name (e.g., "Regex Trick", "Config Tip", "Performance Insight").',
      'create_type.actions':
        'Validation actions (e.g., "Verified", "Outdated", "Platform-specific"). At least 1 required.',
    },
  },
};
