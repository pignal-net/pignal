import type { TemplateConfig, TemplateProfile } from '../config';

const magazineProfile: TemplateProfile = {
  id: 'magazine',
  displayName: 'Magazine / News',
  tagline: 'Featured hero article with mixed-size card grid below',
  description:
    'A news-oriented layout with a large hero featured story at the top and a mixed-size card grid below. ' +
    'Stories are organized by editorial section with recency emphasis and byline attribution. ' +
    'Built for editorial teams publishing news, opinion, and long-form investigations.',
  domain: 'media',
  contentType: 'articles',
  layout: 'magazine',
  audience: ['editors', 'journalists', 'content strategists', 'newsletter operators'],
  useCases: [
    'Publish editorial content with featured hero placement',
    'Organize stories by editorial section with mixed card sizes',
    'Run a news site with recency emphasis and section badges',
    'Curate editor\'s picks and deep-dive collections',
  ],
  differentiators: [
    'Hero featured article at top with large image area',
    '2-column mixed card sizes below the hero',
    'Recency emphasis with relative timestamps ("2h ago")',
    'Editorial section badges on each card',
  ],
  seedData: {
    types: [
      {
        name: 'Breaking News',
        description: 'Time-sensitive developing stories',
        icon: '🔥',
        color: '#DC2626',
        guidance: {
          pattern: '[What happened] + [where/who] + [significance]',
          example: 'EU passes landmark AI regulation requiring model transparency for all consumer applications',
          whenToUse: 'Use for time-sensitive stories with immediate impact that require urgent publication',
          contentHints: 'Lead with the most important fact. Use inverted pyramid structure. Include quotes, sourcing, and context for significance.',
        },
        actions: ['Published', 'Retracted', 'Updated', 'Developing'],
      },
      {
        name: 'Opinion',
        description: 'Analysis, commentary, and editorial perspectives',
        icon: '💬',
        color: '#8B5CF6',
        guidance: {
          pattern: '[Thesis/position] + [on what topic] + [why it matters]',
          example: 'Remote work mandates are killing innovation — here is what the data actually shows',
          whenToUse: 'Use for editorial commentary, analysis pieces, and opinion columns with a clear thesis',
          contentHints: 'State the thesis upfront. Support with evidence, data, or expert quotes. Acknowledge counterarguments. End with a call to action or forward-looking statement.',
        },
        actions: ['Published', 'Withdrawn', 'Correction Issued'],
      },
      {
        name: 'Feature',
        description: 'In-depth narrative stories and long-form reporting',
        icon: '📰',
        color: '#3B82F6',
        guidance: {
          pattern: '[Narrative hook] + [subject] + [angle or revelation]',
          example: 'Inside the lab where engineers are teaching robots to feel — and why it could change elder care',
          whenToUse: 'Use for long-form narrative journalism, in-depth profiles, or investigative features',
          contentHints: 'Open with a compelling scene or anecdote. Weave narrative with reporting. Use subheadings to break up long sections. Include sidebars for context.',
        },
        actions: ['Featured', 'Archived', 'Award Nominated'],
      },
      {
        name: 'Investigation',
        description: 'Deep-dive investigative reporting',
        icon: '🔍',
        color: '#059669',
        guidance: {
          pattern: '[Discovery/revelation] + [about whom/what] + [sourcing]',
          example: 'Internal documents reveal major bank knew about security flaw six months before breach',
          whenToUse: 'Use for investigative pieces backed by documents, data analysis, or whistleblower sources',
          contentHints: 'Structure with clear evidence trail. Cite specific documents or data points. Include the subject\'s response. Explain the methodology.',
        },
        actions: ['Published', 'Under Review', 'Legal Hold', 'Follow-Up Needed'],
      },
      {
        name: 'Profile',
        description: 'Person or organization profiles',
        icon: '👤',
        color: '#F59E0B',
        guidance: {
          pattern: '[Who] + [what makes them notable] + [timeliness]',
          example: 'The architect behind the city\'s first net-zero skyscraper on why green building is finally profitable',
          whenToUse: 'Use for profiles of individuals, organizations, or movements with a timely news hook',
          contentHints: 'Combine biography with narrative. Include direct quotes from the subject. Provide context for why this profile matters now.',
        },
        actions: ['Published', 'Corrections Made', 'Archived'],
      },
    ],
    workspaces: [
      { name: 'This Week', description: 'Current week stories', visibility: 'public' },
      { name: 'Editor\'s Picks', description: 'Curated standout stories', visibility: 'public' },
      { name: 'Deep Dives', description: 'Long-form and investigative work', visibility: 'public' },
      { name: 'Archives', description: 'Past stories and back catalog', visibility: 'public' },
    ],
    settings: {
      sourceTitle: 'My Magazine',
      sourceDescription: 'News, features, and in-depth reporting',
      qualityGuidelines: {
        keySummary: { tips: 'Write a compelling headline. Lead with the most newsworthy element. Avoid clickbait — be specific about the story.' },
        content: { tips: 'Use inverted pyramid for news, narrative structure for features. Always attribute sources. Include context for why the story matters now.' },
        formatting: [
          'Headings: break long features into sections with subheads',
          'Block quotes: direct quotes from sources and subjects',
          'Bold: key facts, names on first mention, and data points',
          'Bullet lists: key takeaways, timeline of events',
          'Paragraphs: narrative flow with short, punchy paragraphs',
          'Horizontal rules: separate major sections in long features',
        ],
        avoid: [
          'Clickbait headlines that overpromise',
          'Unattributed claims or anonymous sourcing without explanation',
          'Burying the lede below background context',
          'Editorializing in news stories (save for Opinion type)',
        ],
      },
      validationLimits: {
        keySummary: { min: 15, max: 200 },
        content: { min: 200, max: 30000 },
      },
    },
    actions: [
      {
        name: 'Newsletter',
        slug: 'newsletter',
        description: 'Subscribe to get the latest stories delivered',
        fields: [
          { name: 'email', type: 'email', label: 'Email Address', required: true, placeholder: 'you@example.com' },
        ],
        settings: { success_message: 'You\'re subscribed! The latest stories will arrive in your inbox.', require_honeypot: true },
      },
      {
        name: 'Pitch a Story',
        slug: 'pitch-story',
        description: 'Pitch a story idea to our editorial team',
        fields: [
          { name: 'name', type: 'text', label: 'Name', required: true, placeholder: 'Your name', maxLength: 100 },
          { name: 'email', type: 'email', label: 'Email', required: true, placeholder: 'you@example.com' },
          { name: 'pitch', type: 'textarea', label: 'Story Pitch', required: true, placeholder: 'Describe your story idea, angle, and why it matters now...', maxLength: 2000 },
        ],
        settings: { success_message: 'Thanks for the pitch! Our editorial team will review it and follow up if interested.', require_honeypot: true },
      },
    ],
  },
};

export const magazineConfig: TemplateConfig = {
  profile: magazineProfile,
  vocabulary: {
    item: 'story',
    itemPlural: 'stories',
    type: 'section',
    typePlural: 'sections',
    workspace: 'issue',
    workspacePlural: 'issues',
    vouch: 'feature',
    vouched: 'featured',
  },
  seo: {
    siteSchemaType: 'WebSite',
    itemSchemaType: 'NewsArticle',
  },
  mcp: {
    instructions:
      'Pignal is a self-hosted magazine platform for publishing news, features, opinion, and investigative stories. ' +
      'Each story has a section, headline, content in markdown, and optional tags.\n\n' +
      'Available tools:\n' +
      '- save_item: Publish a new story\n' +
      '- list_items / search_items: Browse and search the story archive\n' +
      '- update_item: Edit an existing story\n' +
      '- validate_item: Apply an editorial action (Published, Retracted, etc.)\n' +
      '- vouch_item: Feature a story on the front page (featured/unlisted/private)\n' +
      '- batch_vouch_items: Feature multiple stories at once\n' +
      '- get_metadata: Get available sections, issues, and editorial guidelines\n' +
      '- create_workspace / create_type: Create new issues and sections\n\n' +
      'Always call get_metadata first to learn the available sections and editorial guidelines before saving.',
    toolDescriptions: {
      save_item:
        'Publish a new story. ALWAYS call get_metadata first — it provides required IDs, current limits, and editorial guidelines for writing effective stories.',
      list_items:
        'Browse stories with optional filters by section or issue. Use to review the archive or check for duplicate coverage.',
      search_items:
        'Search stories by keyword across headlines and content. Use to find related coverage or locate stories for editorial review.',
      get_metadata:
        'Get editorial sections, issues, and guidelines. ALWAYS call this first before save_item or validate_item — the response contains required IDs and editorial standards.',
      validate_item:
        'Apply an editorial action to a story (e.g., Published, Retracted, Correction Issued). Call get_metadata first for valid action IDs.',
      update_item:
        'Update an existing story. Use to issue corrections, add follow-up reporting, or reclassify the section.',
      create_workspace:
        'Create a new issue for grouping related stories. Call get_metadata first to see existing issues.',
      create_type:
        'Create a new editorial section with review actions. Call get_metadata first to see existing sections and avoid duplicates.',
      vouch_item:
        'Change a story\'s visibility: "vouched" features it on the front page, "unlisted" creates a share link, "private" keeps it in drafts.',
      batch_vouch_items:
        'Feature multiple stories at once (max 50). Each story can have its own visibility and optional slug. Use to publish a batch of stories to the front page.',
    },
    responseLabels: {
      saved: 'Story published!',
      updated: 'Story updated!',
      validated: 'Story reviewed!',
      notFound: 'Story not found.',
      found: 'Found {total} stories (showing {count})',
      visibilityUpdated: 'Story featured!',
      batchComplete: 'Batch feature complete:',
      workspaceCreated: 'Issue created!',
      typeCreated: 'Section created!',
    },
    schemaDescriptions: {
      'save_item.keySummary':
        'Story headline. Be specific and newsworthy. Example: "EU passes landmark AI regulation requiring model transparency for all consumer applications"',
      'save_item.content':
        'Full story in markdown. Use inverted pyramid for news, narrative structure for features. Attribute all sources. Include context for significance.',
      'save_item.typeId':
        'Editorial section ID (from get_metadata). Choose Breaking News, Opinion, Feature, Investigation, or Profile.',
      'save_item.workspaceId':
        'Optional issue ID to group this story (from get_metadata). Example: This Week, Editor\'s Picks, Deep Dives.',
      'save_item.tags':
        'Optional tags. Use lowercase keywords (e.g. ["politics", "ai", "regulation", "eu"]).',
      'create_workspace.name':
        'Issue name (e.g., "This Week", "Special Report: Climate", "Year in Review 2026").',
      'create_type.name':
        'Editorial section name (e.g., "Breaking News", "Opinion", "Investigation").',
      'create_type.actions':
        'Editorial actions (e.g., "Published", "Retracted", "Correction Issued"). At least 1 required.',
    },
  },
};
