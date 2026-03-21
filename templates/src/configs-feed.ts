import type { TemplateProfile, TemplateConfig } from './config';

// =============================================================================
// 1. TIL (Today I Learned)
// =============================================================================

export const tilProfile: TemplateProfile = {
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

// =============================================================================
// 2. Reviews
// =============================================================================

export const reviewsProfile: TemplateProfile = {
  id: 'reviews',
  displayName: 'Reviews',
  tagline: 'Media reviews with ratings, pros/cons, and comparison tables',
  description:
    'A review-focused feed for rating and analyzing books, films, games, and other media. ' +
    'Cards display star ratings in headers, post pages support structured pros/cons sections and comparison tables. ' +
    'Sort and filter by media type or shelf.',
  domain: 'media',
  contentType: 'entries',
  layout: 'feed',
  audience: ['readers', 'cinephiles', 'gamers', 'music enthusiasts', 'critics'],
  useCases: [
    'Rate and review books, films, games, and albums',
    'Track what you have consumed with structured opinions',
    'Share curated reviews with star ratings and comparisons',
  ],
  differentiators: [
    'Star or score display in card headers',
    'Structured pros/cons sections in review content',
    'Comparison tables for side-by-side evaluations',
    'Media-type badges for filtering by medium',
  ],
  seedData: {
    types: [
      {
        name: 'Book',
        description: 'Book or audiobook review',
        icon: '📚',
        color: '#8B5CF6',
        guidance: {
          pattern: '[Title] by [Author] — [one-line verdict]',
          example: 'Designing Data-Intensive Applications by Martin Kleppmann — The best systems design reference, period',
          whenToUse: 'Use for fiction, non-fiction, technical books, or audiobooks',
          contentHints: 'Include a brief summary (no spoilers for fiction), what you liked/disliked, who should read it, and a rating. Use a pros/cons list.',
        },
        actions: ['Recommend', 'Mixed feelings', 'Would not recommend', 'Re-read worthy'],
      },
      {
        name: 'Film',
        description: 'Movie or documentary review',
        icon: '🎬',
        color: '#3B82F6',
        guidance: {
          pattern: '[Title] ([Year]) — [one-line verdict]',
          example: 'Oppenheimer (2023) — A masterclass in tension that demands IMAX',
          whenToUse: 'Use for feature films, documentaries, or short films',
          contentHints: 'Cover direction, performances, pacing, and themes. Avoid spoilers in the first paragraph. Use a rating scale.',
        },
        actions: ['Must watch', 'Worth seeing', 'Skippable', 'Rewatchable'],
      },
      {
        name: 'TV Series',
        description: 'Television or streaming series review',
        icon: '📺',
        color: '#10B981',
        guidance: {
          pattern: '[Title] (Season [N]) — [one-line verdict]',
          example: 'Severance (Season 1) — The best sci-fi thriller on streaming right now',
          whenToUse: 'Use for reviewing a full season or complete series',
          contentHints: 'Mention the premise briefly, highlight standout episodes, and note whether it sticks the landing. Avoid major spoilers.',
        },
        actions: ['Binged it', 'Worth watching', 'Dropped it', 'Awaiting next season'],
      },
      {
        name: 'Game',
        description: 'Video game or board game review',
        icon: '🎮',
        color: '#F59E0B',
        guidance: {
          pattern: '[Title] ([Platform]) — [one-line verdict]',
          example: 'Baldur\'s Gate 3 (PC) — 200 hours in and I am still finding new paths',
          whenToUse: 'Use for video games, board games, or tabletop RPGs',
          contentHints: 'Cover gameplay mechanics, story (spoiler-free), performance, and value. Use a pros/cons table. Mention playtime.',
        },
        actions: ['Platinum-worthy', 'Solid play', 'Flawed gem', 'Avoid'],
      },
      {
        name: 'Album',
        description: 'Music album or EP review',
        icon: '🎵',
        color: '#EF4444',
        guidance: {
          pattern: '[Artist] — [Album Title] ([Year]): [one-line verdict]',
          example: 'Radiohead — In Rainbows (2007): Their most emotionally generous album',
          whenToUse: 'Use for studio albums, EPs, live albums, or compilations',
          contentHints: 'Discuss the sound, standout tracks, production quality, and how it fits in the artist discography. Mention 2-3 highlight tracks.',
        },
        actions: ['On repeat', 'Good listen', 'Background music', 'Disappointing'],
      },
    ],
    workspaces: [
      { name: 'Favorites', description: 'All-time favorites across media', visibility: 'public' },
      { name: 'Currently Consuming', description: 'In progress right now', visibility: 'public' },
      { name: 'Backlog', description: 'Want to get to eventually', visibility: 'public' },
      { name: 'Archive', description: 'Finished and filed away', visibility: 'private' },
    ],
    settings: {
      sourceTitle: 'My Reviews',
      sourceDescription: 'Honest reviews of books, films, games, and more',
      qualityGuidelines: {
        keySummary: { tips: 'Use the format: Title by Author/Creator — one-line verdict. Be opinionated, not vague.' },
        content: { tips: 'Structure reviews with a brief overview, what worked, what did not, and a final verdict. Use pros/cons lists for clarity.' },
        formatting: [
          'Tables: comparison between similar works or specs',
          'Bullet lists: pros/cons, standout moments, highlights',
          'Numbered lists: ranked tracks, top episodes, best moments',
          'Headings: separate Overview, Pros, Cons, Verdict sections',
          'Bold: emphasize ratings or key judgments',
          'Blockquotes: memorable quotes from the work',
        ],
        avoid: [
          'Spoilers without warning (mark them clearly)',
          'Vague opinions like "it was good" without reasoning',
          'Pure plot summary with no personal analysis',
          'Repeating the keySummary verdict in the content opening',
        ],
      },
      validationLimits: {
        keySummary: { min: 10, max: 200 },
        content: { min: 50, max: 10000 },
      },
    },
  },
};

export const reviewsConfig: TemplateConfig = {
  profile: reviewsProfile,
  vocabulary: {
    item: 'review',
    itemPlural: 'reviews',
    type: 'medium',
    typePlural: 'media',
    workspace: 'shelf',
    workspacePlural: 'shelves',
    vouch: 'publish',
    vouched: 'published',
  },
  seo: {
    siteSchemaType: 'WebSite',
    itemSchemaType: 'Review',
  },
  mcp: {
    instructions:
      'Pignal is a self-hosted content platform for publishing reviews — structured opinions on books, films, games, and other media. ' +
      'Each review has a medium (type), key summary with verdict, detailed content in markdown, and optional tags.\n\n' +
      'Available tools:\n' +
      '- save_item: Write a new review from this conversation\n' +
      '- list_items / search_items: Browse and search existing reviews\n' +
      '- update_item: Edit an existing review\n' +
      '- validate_item: Apply a validation action (e.g., Recommend, Skippable)\n' +
      '- vouch_item: Change review visibility (private/unlisted/published)\n' +
      '- batch_vouch_items: Change visibility for multiple reviews at once\n' +
      '- get_metadata: Get available media types, shelves, and quality guidelines\n' +
      '- create_workspace / create_type: Create new shelves and media types\n\n' +
      'Always call get_metadata first to learn the available media types and quality guidelines before saving.',
    toolDescriptions: {
      save_item:
        'Write a new review. ALWAYS call get_metadata first — it provides required IDs, current limits, and quality guidelines for writing effective reviews.',
      list_items:
        "Browse the user's reviews with optional filters by medium or shelf. Use to review existing reviews or check for duplicates before saving.",
      search_items:
        'Search reviews by keyword across summaries and content. Use to find related reviews before saving or to locate reviews for validation.',
      get_metadata:
        'Get media types, shelves, and quality guidelines. ALWAYS call this first before save_item or validate_item — the response contains required IDs, configurable limits, and detailed instructions for writing high-quality reviews.',
      validate_item:
        'Apply a validation action to a review (e.g., Recommend, Must watch, On repeat). Validation captures your final verdict. Call get_metadata first for valid action IDs.',
      update_item:
        'Update an existing review. Use to revise opinions, add details after a rewatch/reread, or recategorize.',
      create_workspace:
        'Create a new shelf for organizing reviews (e.g., "2024 Favorites", "Comfort Rewatches"). Call get_metadata first to see existing shelves.',
      create_type:
        'Create a new medium type with validation actions (e.g., "Podcast", "Manga"). Call get_metadata first to see existing media types and avoid duplicates.',
      vouch_item:
        'Change a review\'s visibility: "published" makes it public with a URL slug, "unlisted" creates a share link, "private" hides it. Use to publish reviews to the feed.',
      batch_vouch_items:
        'Change visibility for multiple reviews at once (max 50). Each review can have its own visibility and optional slug. Use to publish a batch of reviews.',
    },
    responseLabels: {
      saved: 'Review saved!',
      updated: 'Review updated!',
      validated: 'Review validated!',
      notFound: 'Review not found.',
      found: 'Found {total} reviews (showing {count})',
      visibilityUpdated: 'Review visibility updated!',
      batchComplete: 'Batch publish complete:',
      workspaceCreated: 'Shelf created!',
      typeCreated: 'Medium created!',
    },
    schemaDescriptions: {
      'save_item.keySummary':
        'Title + creator + one-line verdict. Example: "Dune by Frank Herbert — The foundation of modern sci-fi worldbuilding". Check get_metadata for length limits.',
      'save_item.content':
        'Full review in markdown. Include overview, pros/cons, and a verdict. Use tables for comparisons. Check get_metadata for current limits.',
      'save_item.typeId':
        'Medium type ID (from get_metadata). Choose: Book, Film, TV Series, Game, or Album.',
      'save_item.workspaceId':
        'Optional shelf ID for organizing reviews (from get_metadata). E.g., Favorites, Backlog, Currently Consuming.',
      'save_item.tags':
        'Optional tags. Use lowercase keywords (e.g. ["sci-fi", "hard-science", "classic"]).',
      'create_workspace.name':
        'Shelf name. Use a clear label (e.g., "2024 Reads", "Comfort Rewatches", "Guilty Pleasures").',
      'create_type.name':
        'Medium type name (e.g., "Podcast", "Manga", "Live Performance").',
      'create_type.actions':
        'Verdict actions (e.g., "Must read", "Worth it", "Skip"). At least 1 required.',
    },
  },
};

// =============================================================================
// 3. Journal
// =============================================================================

export const journalProfile: TemplateProfile = {
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

// =============================================================================
// 4. Writing / Fiction
// =============================================================================

export const writingProfile: TemplateProfile = {
  id: 'writing',
  displayName: 'Writing / Fiction',
  tagline: 'Distraction-free reading experience with large serif typography and drop caps',
  description:
    'A minimalist literary layout for publishing short stories, essays, poetry, and creative writing. ' +
    'No sidebar, no badges in the feed — just titles and opening lines. Post pages feature large serif typography, ' +
    'drop caps, and generous whitespace for a pure reading experience.',
  domain: 'creative',
  contentType: 'articles',
  layout: 'feed',
  audience: ['fiction writers', 'essayists', 'poets', 'memoirists', 'creative writing students'],
  useCases: [
    'Publish short stories, flash fiction, and creative essays',
    'Share poetry and experimental writing with minimal chrome',
    'Build a public portfolio of literary work',
  ],
  differentiators: [
    'No sidebar or type badges — pure content-first feed',
    'Large serif typography with drop caps on post pages',
    'Pull quote support for highlighted passages',
    'Generous whitespace and line height for immersive reading',
  ],
  seedData: {
    types: [
      {
        name: 'Short Story',
        description: 'Narrative fiction, typically 1,000-10,000 words',
        icon: '📖',
        color: '#8B5CF6',
        guidance: {
          pattern: '[Title] — a story about [central tension or theme]',
          example: 'The Lighthouse Keeper — a story about a woman who starts receiving letters from her future self',
          whenToUse: 'Use for complete narrative fiction with plot, characters, and resolution',
          contentHints: 'Write the full story. Use scene breaks (---) between sections. Focus on character, conflict, and sensory detail.',
        },
        actions: ['Polished', 'Needs revision', 'Abandoned', 'Submitted'],
      },
      {
        name: 'Essay',
        description: 'Personal or persuasive non-fiction',
        icon: '✍️',
        color: '#3B82F6',
        guidance: {
          pattern: '[Title] — [core argument or observation in one line]',
          example: 'On Walking Slowly — why efficiency culture is hostile to thought',
          whenToUse: 'Use for personal essays, op-eds, or persuasive long-form non-fiction',
          contentHints: 'Open with a compelling hook. Build your argument through examples and personal experience. End with resonance, not summary.',
        },
        actions: ['Polished', 'Needs revision', 'Published elsewhere', 'Abandoned'],
      },
      {
        name: 'Poetry',
        description: 'Verse, free or formal',
        icon: '🌙',
        color: '#EC4899',
        guidance: {
          pattern: '[Title]',
          example: 'Tide Table',
          whenToUse: 'Use for poems of any form — free verse, sonnets, haiku, prose poetry',
          contentHints: 'Use line breaks intentionally. Markdown line breaks require two trailing spaces or a blank line. Less is more.',
        },
        actions: ['Final', 'Draft', 'Fragment', 'Published elsewhere'],
      },
      {
        name: 'Flash Fiction',
        description: 'Very short fiction, under 1,000 words',
        icon: '⚡',
        color: '#F59E0B',
        guidance: {
          pattern: '[Title] — [a hint at the twist or mood]',
          example: 'Last Customer — the barista who serves people their final cup',
          whenToUse: 'Use for complete stories under 1,000 words, often with a twist or concentrated image',
          contentHints: 'Every word counts. Start in the middle of the action. End with impact, not explanation.',
        },
        actions: ['Final', 'Needs tightening', 'Submitted', 'Abandoned'],
      },
      {
        name: 'Memoir',
        description: 'True personal narrative',
        icon: '📝',
        color: '#10B981',
        guidance: {
          pattern: '[Title] — [the memory or period in one line]',
          example: 'The Summer of the Blue Bicycle — learning to ride at thirty-two',
          whenToUse: 'Use for true stories from your life, family histories, or personal remembrances',
          contentHints: 'Ground the reader in time and place. Use specific details — names, smells, textures. Reflection can follow, but scene comes first.',
        },
        actions: ['Polished', 'Needs revision', 'Too raw to share', 'Published elsewhere'],
      },
    ],
    workspaces: [
      { name: 'Published Works', description: 'Finished and polished pieces', visibility: 'public' },
      { name: 'Drafts', description: 'Work in progress', visibility: 'private' },
      { name: 'Experiments', description: 'Trying new forms and voices', visibility: 'public' },
      { name: 'Series', description: 'Connected pieces and sequences', visibility: 'public' },
    ],
    settings: {
      sourceTitle: 'My Writing',
      sourceDescription: 'Stories, essays, and creative work',
      qualityGuidelines: {
        keySummary: { tips: 'Use the title of the piece. For stories and essays, add a brief thematic hint after a dash. For poetry, the title alone is fine.' },
        content: { tips: 'Write the complete piece. Use markdown for scene breaks (---), emphasis, and structure. Let the writing breathe.' },
        formatting: [
          'Paragraphs: the primary unit of prose',
          'Horizontal rules (---): scene breaks in fiction',
          'Blockquotes: pull quotes or epigraphs',
          'Italic: internal thought, emphasis, titles of other works',
          'Headings: section titles in essays (use sparingly in fiction)',
          'Line breaks: critical for poetry (two trailing spaces or blank line)',
        ],
        avoid: [
          'Bullet lists in fiction (prose should flow naturally)',
          'Bold text for emphasis (use italics or sentence structure)',
          'Tables or code blocks in creative writing',
          'Explaining the piece — let the writing speak for itself',
        ],
      },
      validationLimits: {
        keySummary: { min: 5, max: 150 },
        content: { min: 100, max: 50000 },
      },
    },
  },
};

export const writingConfig: TemplateConfig = {
  profile: writingProfile,
  vocabulary: {
    item: 'piece',
    itemPlural: 'pieces',
    type: 'genre',
    typePlural: 'genres',
    workspace: 'collection',
    workspacePlural: 'collections',
    vouch: 'publish',
    vouched: 'published',
  },
  seo: {
    siteSchemaType: 'WebSite',
    itemSchemaType: 'CreativeWork',
  },
  mcp: {
    instructions:
      'Pignal is a self-hosted content platform for publishing creative writing — short stories, essays, poetry, and more. ' +
      'Each piece has a genre (type), title, full text in markdown, and optional tags.\n\n' +
      'Available tools:\n' +
      '- save_item: Save a new piece of writing from this conversation\n' +
      '- list_items / search_items: Browse and search existing pieces\n' +
      '- update_item: Edit an existing piece\n' +
      '- validate_item: Apply a status action (e.g., Polished, Needs revision)\n' +
      '- vouch_item: Change piece visibility (private/unlisted/published)\n' +
      '- batch_vouch_items: Change visibility for multiple pieces at once\n' +
      '- get_metadata: Get available genres, collections, and quality guidelines\n' +
      '- create_workspace / create_type: Create new collections and genres\n\n' +
      'Always call get_metadata first to learn the available genres and quality guidelines before saving.',
    toolDescriptions: {
      save_item:
        'Save a new piece of writing. ALWAYS call get_metadata first — it provides required IDs, current limits, and quality guidelines for each genre.',
      list_items:
        "Browse the user's writing with optional filters by genre or collection. Use to review existing pieces or check for duplicates.",
      search_items:
        'Search pieces by keyword across titles and content. Use to find related work before saving or to locate pieces for revision.',
      get_metadata:
        'Get genres, collections, and quality guidelines. ALWAYS call this first before save_item or validate_item — the response contains required IDs, configurable limits, and genre-specific instructions.',
      validate_item:
        'Apply a status action to a piece (e.g., Polished, Needs revision, Submitted). Use to track the editorial lifecycle. Call get_metadata first for valid action IDs.',
      update_item:
        'Update an existing piece. Use to revise, expand, or polish previously saved writing.',
      create_workspace:
        'Create a new collection for grouping related pieces (e.g., "Autumn Sequence", "Flash Collection"). Call get_metadata first to see existing collections.',
      create_type:
        'Create a new genre with status actions (e.g., "Monologue", "Fable"). Call get_metadata first to see existing genres and avoid duplicates.',
      vouch_item:
        'Change a piece\'s visibility: "published" makes it public with a URL slug, "unlisted" creates a share link, "private" keeps it in drafts. Use to publish finished work.',
      batch_vouch_items:
        'Change visibility for multiple pieces at once (max 50). Each piece can have its own visibility and optional slug. Use to publish a collection at once.',
    },
    responseLabels: {
      saved: 'Piece saved!',
      updated: 'Piece updated!',
      validated: 'Piece status updated!',
      notFound: 'Piece not found.',
      found: 'Found {total} pieces (showing {count})',
      visibilityUpdated: 'Piece visibility updated!',
      batchComplete: 'Batch publish complete:',
      workspaceCreated: 'Collection created!',
      typeCreated: 'Genre created!',
    },
    schemaDescriptions: {
      'save_item.keySummary':
        'Title of the piece with an optional thematic hint. Example: "The Lighthouse Keeper — a story about letters from the future". Check get_metadata for limits.',
      'save_item.content':
        'The complete text of the piece in markdown. Use --- for scene breaks, italics for emphasis, blockquotes for epigraphs. Check get_metadata for current limits.',
      'save_item.typeId':
        'Genre ID (from get_metadata). Choose: Short Story, Essay, Poetry, Flash Fiction, or Memoir.',
      'save_item.workspaceId':
        'Optional collection ID for grouping pieces (from get_metadata). E.g., Published Works, Experiments, Series.',
      'save_item.tags':
        'Optional tags. Use lowercase keywords (e.g. ["literary-fiction", "magical-realism", "identity"]).',
      'create_workspace.name':
        'Collection name (e.g., "Autumn Sequence", "City Stories", "Workshop Drafts").',
      'create_type.name':
        'Genre name (e.g., "Monologue", "Fable", "Prose Poetry").',
      'create_type.actions':
        'Status actions (e.g., "Polished", "Needs revision", "Submitted"). At least 1 required.',
    },
  },
};

// =============================================================================
// 5. Awesome List (Curated Links)
// =============================================================================

export const awesomeProfile: TemplateProfile = {
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

// =============================================================================
// 6. Podcast
// =============================================================================

export const podcastProfile: TemplateProfile = {
  id: 'podcast',
  displayName: 'Podcast',
  tagline: 'Episode feed with show notes, timestamps, and sequential numbering',
  description:
    'A podcast-oriented feed for publishing episode show notes with timestamps, guest info, and sequential numbering. ' +
    'Cards display episode number and duration instead of reading time. Post pages feature structured show notes ' +
    'with clickable timestamp markers and audio player placeholder.',
  domain: 'media',
  contentType: 'media',
  layout: 'feed',
  audience: ['podcasters', 'interviewers', 'audio creators', 'show hosts'],
  useCases: [
    'Publish structured show notes for each podcast episode',
    'Maintain a searchable archive of episodes with timestamps',
    'Share episodes publicly with guest info and topic breakdowns',
  ],
  differentiators: [
    'Episode number and duration displayed instead of reading time',
    'Timestamped show notes with structured topic markers',
    'Sequential numbering for chronological episode ordering',
    'Audio player placeholder area on post pages',
  ],
  seedData: {
    types: [
      {
        name: 'Interview',
        description: 'Conversation with a guest',
        icon: '🎙️',
        color: '#8B5CF6',
        guidance: {
          pattern: 'Ep. [N]: [Guest Name] on [Topic]',
          example: 'Ep. 12: Sarah Chen on building developer tools at scale',
          whenToUse: 'Use for episodes featuring a guest conversation or Q&A',
          contentHints: 'Include guest bio, key topics with timestamps, notable quotes, and links mentioned. Use ## headings for major topic shifts.',
        },
        actions: ['Published', 'Editing', 'Scheduled', 'Bonus'],
      },
      {
        name: 'Solo',
        description: 'Host-only episode or monologue',
        icon: '🎤',
        color: '#3B82F6',
        guidance: {
          pattern: 'Ep. [N]: [Topic or Title]',
          example: 'Ep. 15: Why I stopped using frameworks for side projects',
          whenToUse: 'Use for solo episodes where the host discusses a topic without guests',
          contentHints: 'Structure with timestamps for each section. Include key points, recommendations, and any resources mentioned.',
        },
        actions: ['Published', 'Editing', 'Scheduled', 'Bonus'],
      },
      {
        name: 'Panel Discussion',
        description: 'Multi-guest roundtable conversation',
        icon: '👥',
        color: '#10B981',
        guidance: {
          pattern: 'Ep. [N]: [Topic] with [Guest 1], [Guest 2], ...',
          example: 'Ep. 20: The future of AI coding tools with Alex, Jamie, and Priya',
          whenToUse: 'Use for episodes with multiple guests discussing a shared topic',
          contentHints: 'List all panelists with short bios. Use timestamps for each discussion segment. Note key disagreements and consensus points.',
        },
        actions: ['Published', 'Editing', 'Scheduled', 'Bonus'],
      },
      {
        name: 'Miniseries',
        description: 'Part of a multi-episode arc',
        icon: '📚',
        color: '#F59E0B',
        guidance: {
          pattern: 'Ep. [N]: [Series Name], Part [M] — [Subtitle]',
          example: 'Ep. 25: Building in Public, Part 3 — The first 1,000 users',
          whenToUse: 'Use for episodes that are part of a themed multi-episode series',
          contentHints: 'Reference previous parts with episode numbers. Include a brief recap for new listeners. Timestamps for this episode specifically.',
        },
        actions: ['Published', 'Editing', 'Scheduled', 'Series complete'],
      },
    ],
    workspaces: [
      { name: 'Season 1', description: 'First season episodes', visibility: 'public' },
      { name: 'Season 2', description: 'Second season episodes', visibility: 'public' },
      { name: 'Bonus Episodes', description: 'Extra content outside regular seasons', visibility: 'public' },
      { name: 'Trailers', description: 'Preview and promotional episodes', visibility: 'public' },
    ],
    settings: {
      sourceTitle: 'My Podcast',
      sourceDescription: 'Episode show notes and archive',
      qualityGuidelines: {
        keySummary: { tips: 'Use the format: Ep. [Number]: [Title or Guest — Topic]. Include the episode number for chronological ordering.' },
        content: { tips: 'Write structured show notes. Lead with a one-paragraph summary, then timestamps, then links and resources mentioned.' },
        formatting: [
          'Timestamps: use [00:00] format at the start of lines for topic markers',
          'Headings: separate Guest Bio, Topics, Links, and Timestamps sections',
          'Bullet lists: links mentioned, resources, guest social handles',
          'Numbered lists: key takeaways or episode highlights',
          'Blockquotes: notable quotes from guests',
          'Bold: guest names and topic labels within show notes',
        ],
        avoid: [
          'Full transcripts in show notes (link to them instead)',
          'Missing episode numbers (chronological ordering matters)',
          'Show notes without timestamps (listeners need navigation)',
          'Vague summaries like "Great conversation about tech"',
        ],
      },
      validationLimits: {
        keySummary: { min: 10, max: 200 },
        content: { min: 50, max: 15000 },
      },
    },
  },
};

export const podcastConfig: TemplateConfig = {
  profile: podcastProfile,
  vocabulary: {
    item: 'episode',
    itemPlural: 'episodes',
    type: 'show',
    typePlural: 'shows',
    workspace: 'season',
    workspacePlural: 'seasons',
    vouch: 'publish',
    vouched: 'published',
  },
  seo: {
    siteSchemaType: 'WebSite',
    itemSchemaType: 'PodcastEpisode',
  },
  mcp: {
    instructions:
      'Pignal is a self-hosted content platform for publishing podcast show notes — structured episode notes with timestamps and guest info. ' +
      'Each episode has a show type, key summary with episode number, show notes in markdown, and optional tags.\n\n' +
      'Available tools:\n' +
      '- save_item: Save show notes for a new episode\n' +
      '- list_items / search_items: Browse and search existing episodes\n' +
      '- update_item: Edit existing episode show notes\n' +
      '- validate_item: Apply a status action (e.g., Published, Editing)\n' +
      '- vouch_item: Change episode visibility (private/unlisted/published)\n' +
      '- batch_vouch_items: Change visibility for multiple episodes at once\n' +
      '- get_metadata: Get available show types, seasons, and quality guidelines\n' +
      '- create_workspace / create_type: Create new seasons and show types\n\n' +
      'Always call get_metadata first to learn the available show types and quality guidelines before saving.',
    toolDescriptions: {
      save_item:
        'Save show notes for a new episode. ALWAYS call get_metadata first — it provides required IDs, current limits, and quality guidelines for writing effective show notes.',
      list_items:
        "Browse the user's episodes with optional filters by show type or season. Use to review the episode archive or check episode numbers before saving.",
      search_items:
        'Search episodes by keyword across summaries and show notes. Use to find episodes on a specific topic or with a particular guest.',
      get_metadata:
        'Get show types, seasons, and quality guidelines. ALWAYS call this first before save_item or validate_item — the response contains required IDs, configurable limits, and detailed instructions for writing structured show notes.',
      validate_item:
        'Apply a status action to an episode (e.g., Published, Editing, Scheduled). Use to track production status. Call get_metadata first for valid action IDs.',
      update_item:
        'Update existing episode show notes. Use to add timestamps, fix links, or expand notes after post-production.',
      create_workspace:
        'Create a new season for organizing episodes (e.g., "Season 3", "Summer Special"). Call get_metadata first to see existing seasons.',
      create_type:
        'Create a new show type with status actions (e.g., "AMA", "Live Recording"). Call get_metadata first to see existing show types and avoid duplicates.',
      vouch_item:
        'Change an episode\'s visibility: "published" makes it public with a URL slug, "unlisted" creates a share link, "private" keeps it in production. Use to publish completed episode notes.',
      batch_vouch_items:
        'Change visibility for multiple episodes at once (max 50). Each episode can have its own visibility and optional slug. Use to publish a batch of episodes for a new season.',
    },
    responseLabels: {
      saved: 'Episode saved!',
      updated: 'Episode updated!',
      validated: 'Episode status updated!',
      notFound: 'Episode not found.',
      found: 'Found {total} episodes (showing {count})',
      visibilityUpdated: 'Episode visibility updated!',
      batchComplete: 'Batch publish complete:',
      workspaceCreated: 'Season created!',
      typeCreated: 'Show type created!',
    },
    schemaDescriptions: {
      'save_item.keySummary':
        'Episode title with number. Example: "Ep. 12: Sarah Chen on building developer tools at scale". Check get_metadata for limits.',
      'save_item.content':
        'Structured show notes in markdown. Include summary paragraph, [00:00] timestamps, guest bio, and links mentioned. Check get_metadata for current limits.',
      'save_item.typeId':
        'Show type ID (from get_metadata). Choose: Interview, Solo, Panel Discussion, or Miniseries.',
      'save_item.workspaceId':
        'Optional season ID for organizing episodes (from get_metadata). E.g., Season 1, Season 2, Bonus Episodes.',
      'save_item.tags':
        'Optional tags. Use lowercase keywords (e.g. ["ai", "developer-tools", "interview"]).',
      'create_workspace.name':
        'Season name (e.g., "Season 3", "Summer 2025 Special", "Behind the Scenes").',
      'create_type.name':
        'Show type name (e.g., "AMA", "Live Recording", "Crossover").',
      'create_type.actions':
        'Status actions (e.g., "Published", "Editing", "Scheduled"). At least 1 required.',
    },
  },
};
