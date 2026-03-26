import type { TemplateConfig, TemplateProfile } from '../config';

const podcastProfile: TemplateProfile = {
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
