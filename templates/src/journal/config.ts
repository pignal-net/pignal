import type { TemplateConfig, TemplateProfile } from '../config';

const journalProfile: TemplateProfile = {
  id: 'journal',
  displayName: 'Journal',
  tagline: 'Private-first reflective journal with large date headers and mood tracking',
  description:
    'A personal journal layout designed for daily reflection and introspection. ' +
    'Large date headers anchor each day, mood-based types replace traditional badges, and the aesthetic ' +
    'defaults to private-first with sharing as an intentional opt-in.',
  domain: 'personal',
  contentType: 'entries',
  layout: 'feed',
  audience: ['journalers', 'mindfulness practitioners', 'personal growth enthusiasts', 'writers'],
  useCases: [
    'Maintain a daily reflection practice with mood tracking',
    'Record gratitude, growth moments, and personal milestones',
    'Selectively share meaningful entries while keeping most private',
  ],
  differentiators: [
    'Large date headers as primary navigation anchors',
    'No type badges in the feed (mood is contextual, not categorical)',
    'Private-first aesthetic with sharing as deliberate opt-in',
    'Reflection-oriented validation actions (not accuracy-based)',
  ],
  seedData: {
    types: [
      {
        name: 'Grateful',
        description: 'Appreciation and thankfulness',
        icon: '🙏',
        color: '#F59E0B',
        guidance: {
          pattern: '[What I am grateful for] + [why it matters today]',
          example: 'Grateful for the quiet morning — had time to think before the day started',
          whenToUse: 'Use when something sparks genuine appreciation or thankfulness',
          contentHints: 'Describe the moment or thing you are grateful for. Reflect on why it stood out today specifically.',
        },
        actions: ['Still resonates', 'Took for granted', 'Led to action'],
      },
      {
        name: 'Reflective',
        description: 'Thoughtful observation or realization',
        icon: '🪞',
        color: '#8B5CF6',
        guidance: {
          pattern: '[Observation or realization] + [what prompted it]',
          example: 'Realized I avoid difficult conversations not from fear, but from misplaced kindness',
          whenToUse: 'Use for moments of self-awareness, patterns noticed, or quiet realizations',
          contentHints: 'Explore the thought honestly. What triggered it? What does it reveal? No need to resolve it — just observe.',
        },
        actions: ['Deeper now', 'Surface level', 'Need to revisit', 'Acted on it'],
      },
      {
        name: 'Excited',
        description: 'Anticipation and enthusiasm',
        icon: '✨',
        color: '#10B981',
        guidance: {
          pattern: '[What excites me] + [what I want to do about it]',
          example: 'Excited about the woodworking class starting next week — first hands-on hobby in years',
          whenToUse: 'Use when something ahead fills you with energy or anticipation',
          contentHints: 'Capture the enthusiasm while it is fresh. What are you looking forward to? What might you do next?',
        },
        actions: ['Lived up to it', 'Overblown', 'Even better', 'Never happened'],
      },
      {
        name: 'Challenging',
        description: 'Difficulty or struggle faced',
        icon: '🌊',
        color: '#EF4444',
        guidance: {
          pattern: '[The challenge] + [how I am sitting with it]',
          example: 'Hard conversation with a friend about boundaries — uncomfortable but necessary',
          whenToUse: 'Use for difficulties, setbacks, or emotional struggles worth processing',
          contentHints: 'Be honest about what is hard. You do not need a solution — sometimes naming the challenge is enough.',
        },
        actions: ['Grew from it', 'Still processing', 'Resolved', 'Recurring'],
      },
      {
        name: 'Peaceful',
        description: 'Calm and contentment',
        icon: '🍃',
        color: '#06B6D4',
        guidance: {
          pattern: '[The peaceful moment] + [what made it feel that way]',
          example: 'Sat on the porch after rain — everything smelled clean and the world felt slow',
          whenToUse: 'Use for moments of calm, contentment, or quiet satisfaction',
          contentHints: 'Describe the sensory details. What did you see, hear, feel? Let the entry breathe — short is fine.',
        },
        actions: ['Want more of this', 'Fleeting', 'Grounding'],
      },
    ],
    workspaces: [
      { name: 'Daily', description: 'Everyday reflections', visibility: 'private' },
      { name: 'Travel', description: 'Experiences from trips and adventures', visibility: 'public' },
      { name: 'Growth', description: 'Personal development and milestones', visibility: 'public' },
      { name: 'Dreams', description: 'Dream journal and subconscious patterns', visibility: 'private' },
    ],
    settings: {
      sourceTitle: 'My Journal',
      sourceDescription: 'Personal reflections and daily entries',
      qualityGuidelines: {
        keySummary: { tips: 'Write a single honest sentence about the moment or feeling. No need for structure — just capture the essence.' },
        content: { tips: 'Write freely. This is for you. Be honest, be specific, use sensory details. Short entries are perfectly fine.' },
        formatting: [
          'Paragraphs: the default format for reflective writing',
          'Bullet lists: gratitude items, things noticed, intentions',
          'Bold: emphasize a key realization or feeling',
          'Blockquotes: something someone said that stayed with you',
        ],
        avoid: [
          'Writing for an audience when the entry is private',
          'Judging your own feelings — just observe them',
          'Vague entries like "Today was fine" without detail',
          'Over-structuring what should be freeform reflection',
        ],
      },
      validationLimits: {
        keySummary: { min: 5, max: 100 },
        content: { min: 1, max: 5000 },
      },
    },
  },
};

export const journalConfig: TemplateConfig = {
  profile: journalProfile,
  vocabulary: {
    item: 'entry',
    itemPlural: 'entries',
    type: 'mood',
    typePlural: 'moods',
    workspace: 'journal',
    workspacePlural: 'journals',
    vouch: 'share',
    vouched: 'shared',
  },
  seo: {
    siteSchemaType: 'Blog',
    itemSchemaType: 'BlogPosting',
  },
  mcp: {
    instructions:
      'Pignal is a self-hosted content platform for keeping a personal journal — reflective entries with mood tracking. ' +
      'Each entry has a mood (type), key summary, content in markdown, and optional tags.\n\n' +
      'Available tools:\n' +
      '- save_item: Write a new journal entry from this conversation\n' +
      '- list_items / search_items: Browse and search existing entries\n' +
      '- update_item: Edit an existing entry\n' +
      '- validate_item: Apply a reflection action (e.g., Still resonates, Grew from it)\n' +
      '- vouch_item: Change entry visibility (private/unlisted/shared)\n' +
      '- batch_vouch_items: Change visibility for multiple entries at once\n' +
      '- get_metadata: Get available moods, journals, and quality guidelines\n' +
      '- create_workspace / create_type: Create new journals and moods\n\n' +
      'Always call get_metadata first to learn the available moods and quality guidelines before saving.',
    toolDescriptions: {
      save_item:
        'Write a new journal entry. ALWAYS call get_metadata first — it provides required IDs, current limits, and quality guidelines for writing meaningful entries.',
      list_items:
        "Browse the user's journal entries with optional filters by mood or journal. Use to review past entries or reflect on patterns.",
      search_items:
        'Search entries by keyword across summaries and content. Use to find past reflections on a topic or revisit earlier feelings.',
      get_metadata:
        'Get moods, journals, and quality guidelines. ALWAYS call this first before save_item or validate_item — the response contains required IDs, configurable limits, and instructions.',
      validate_item:
        'Apply a reflection action to an entry (e.g., Still resonates, Grew from it, Need to revisit). Reflection actions help track personal growth over time. Call get_metadata first for valid action IDs.',
      update_item:
        'Update an existing entry. Use to add follow-up thoughts, deepen a reflection, or adjust mood.',
      create_workspace:
        'Create a new journal for organizing entries by theme (e.g., "Meditation", "Relationships"). Call get_metadata first to see existing journals.',
      create_type:
        'Create a new mood with reflection actions (e.g., "Nostalgic", "Determined"). Call get_metadata first to see existing moods and avoid duplicates.',
      vouch_item:
        'Change an entry\'s visibility: "shared" makes it public with a URL slug, "unlisted" creates a share link, "private" keeps it personal. Most entries should stay private.',
      batch_vouch_items:
        'Change visibility for multiple entries at once (max 50). Each entry can have its own visibility and optional slug. Use selectively — sharing is intentional.',
    },
    responseLabels: {
      saved: 'Entry saved!',
      updated: 'Entry updated!',
      validated: 'Entry reflected on!',
      notFound: 'Entry not found.',
      found: 'Found {total} entries (showing {count})',
      visibilityUpdated: 'Entry visibility updated!',
      batchComplete: 'Batch share complete:',
      workspaceCreated: 'Journal created!',
      typeCreated: 'Mood created!',
    },
    schemaDescriptions: {
      'save_item.keySummary':
        'One honest sentence capturing the moment or feeling. Example: "Realized I have been running from stillness, not toward busyness". Check get_metadata for limits.',
      'save_item.content':
        'Free-form reflection in markdown. Be honest and specific. Sensory details bring entries to life. Check get_metadata for current limits.',
      'save_item.typeId':
        'Mood ID (from get_metadata). Choose what fits: Grateful, Reflective, Excited, Challenging, or Peaceful.',
      'save_item.workspaceId':
        'Optional journal ID for organizing entries by theme (from get_metadata). E.g., Daily, Travel, Growth.',
      'save_item.tags':
        'Optional tags. Use lowercase keywords (e.g. ["morning", "gratitude", "family"]).',
      'create_workspace.name':
        'Journal name. Use a clear theme (e.g., "Meditation", "Work Reflections", "Seasonal").',
      'create_type.name':
        'Mood name (e.g., "Nostalgic", "Determined", "Anxious").',
      'create_type.actions':
        'Reflection actions (e.g., "Still resonates", "Grew from it", "Resolved"). At least 1 required.',
    },
  },
};
