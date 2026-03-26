import type { TemplateConfig, TemplateProfile } from '../config';

const writingProfile: TemplateProfile = {
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
