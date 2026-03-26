import type { TemplateConfig, TemplateProfile } from '../config';

const reviewsProfile: TemplateProfile = {
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
