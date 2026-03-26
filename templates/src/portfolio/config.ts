import type { TemplateConfig, TemplateProfile } from '../config';

const portfolioProfile: TemplateProfile = {
  id: 'portfolio',
  displayName: 'Creative Portfolio',
  tagline: 'Image-first project grid with discipline chips and full-width showcases',
  description:
    'A visual portfolio layout for showcasing creative work. ' +
    'Grid of 4:3 aspect-ratio project cards with horizontal filter chips on the source page, ' +
    'full-width image showcase with project narrative on detail pages.',
  domain: 'creative',
  contentType: 'media',
  layout: 'grid',
  audience: ['designers', 'photographers', 'illustrators', 'creative freelancers'],
  useCases: [
    'Showcase design projects with process breakdowns',
    'Present a photography portfolio organized by discipline',
    'Display illustration work grouped into client and personal series',
    'Build a freelance portfolio with case study narratives',
  ],
  differentiators: [
    'Image-first cards with 4:3 aspect ratio placeholders',
    'Horizontal filter chips instead of sidebar navigation',
    'Full-width item showcase with hero image area',
    'Masonry-optional layout adapting to project thumbnails',
  ],
  seedData: {
    types: [
      {
        name: 'Web Design',
        description: 'Websites, landing pages, and web applications',
        icon: '🖥',
        color: '#3B82F6',
        guidance: {
          pattern: '[Project name] — [client or context]',
          example: 'Bloom Health Rebrand — Responsive Marketing Site',
          whenToUse: 'Use for website designs, landing pages, or web app interfaces',
          contentHints:
            'Describe the brief, your approach, and the outcome. Include sections for Challenge, Process, and Result. Embed image URLs or describe key screens.',
        },
        actions: ['Published', 'In Progress', 'Archived'],
      },
      {
        name: 'Brand Identity',
        description: 'Logos, brand systems, and visual identities',
        icon: '🎨',
        color: '#EC4899',
        guidance: {
          pattern: '[Brand name] — [deliverable scope]',
          example: 'Terraverde Coffee — Logo + Packaging System',
          whenToUse: 'Use for logo design, brand guidelines, or complete identity systems',
          contentHints:
            'Walk through the brand strategy, moodboards, explorations, and final deliverables. Use headings to separate Concept, Execution, and Assets.',
        },
        actions: ['Complete', 'Concept Phase', 'Shelved'],
      },
      {
        name: 'Illustration',
        description: 'Digital and traditional illustrations',
        icon: '🖌',
        color: '#F59E0B',
        guidance: {
          pattern: '[Piece title] — [medium or technique]',
          example: 'Midnight Garden — Digital Painting, Procreate',
          whenToUse: 'Use for standalone illustrations, editorial art, or character design',
          contentHints:
            'Describe the inspiration, tools used, and creative decisions. Include process shots if available. Mention dimensions and medium.',
        },
        actions: ['Finished', 'Work in Progress', 'Abandoned'],
      },
      {
        name: 'Motion Graphics',
        description: 'Animations, video graphics, and motion design',
        icon: '🎬',
        color: '#8B5CF6',
        guidance: {
          pattern: '[Project name] — [format and duration]',
          example: 'Solaris App Promo — 30s Product Walkthrough',
          whenToUse: 'Use for animation, motion design, video intros, or explainer graphics',
          contentHints:
            'Outline the storyboard, tools (After Effects, Cinema 4D, etc.), and deliverable specs. Include frame-by-frame breakdowns or key moments.',
        },
        actions: ['Rendered', 'Animating', 'On Hold'],
      },
      {
        name: 'Photography',
        description: 'Photo series, edits, and commissioned shoots',
        icon: '📷',
        color: '#10B981',
        guidance: {
          pattern: '[Series or subject] — [location or theme]',
          example: 'Urban Geometry — Tokyo Street Architecture',
          whenToUse: 'Use for photo series, individual commissioned shoots, or curated edits',
          contentHints:
            'Describe the concept, gear used, shooting conditions, and post-processing approach. List camera settings for key shots if relevant.',
        },
        actions: ['Final Edit', 'In Post', 'Rejected'],
      },
    ],
    workspaces: [
      { name: 'Client Work', description: 'Commissioned and contracted projects', visibility: 'public' },
      { name: 'Personal Projects', description: 'Self-initiated creative work', visibility: 'public' },
      { name: 'Experiments', description: 'Explorations and skill-building exercises', visibility: 'public' },
      { name: 'Archived', description: 'Older work kept for reference', visibility: 'private' },
    ],
    settings: {
      sourceTitle: 'My Portfolio',
      sourceDescription: 'A curated collection of creative work',
      qualityGuidelines: {
        keySummary: {
          tips: 'Use the project name followed by a dash and the client, medium, or context. Keep it scannable from a grid thumbnail.',
        },
        content: {
          tips: 'Write as a case study: what was the challenge, how did you approach it, and what was the outcome. Structure for skimming.',
        },
        formatting: [
          'Headings: separate Challenge, Process, Result, and Tools sections',
          'Bullet lists: deliverables, tools used, key metrics',
          'Bold: highlight standout outcomes or client quotes',
          'Tables: project specs (timeline, tools, dimensions, file formats)',
          'Paragraphs: narrative context and creative rationale',
        ],
        avoid: [
          'Vague descriptions without specific outcomes',
          'Listing only tools without explaining the creative process',
          'Missing project context or client brief summary',
        ],
      },
      validationLimits: {
        keySummary: { min: 10, max: 150 },
        content: { min: 50, max: 15000 },
      },
    },
  },
};

export const portfolioConfig: TemplateConfig = {
  profile: portfolioProfile,
  vocabulary: {
    item: 'project',
    itemPlural: 'projects',
    type: 'discipline',
    typePlural: 'disciplines',
    workspace: 'series',
    workspacePlural: 'series',
    vouch: 'showcase',
    vouched: 'showcased',
  },
  seo: {
    siteSchemaType: 'WebSite',
    itemSchemaType: 'CreativeWork',
  },
  mcp: {
    instructions:
      'Pignal is a self-hosted creative portfolio platform for showcasing projects across disciplines. ' +
      'Each project has a discipline, title, a case-study narrative in markdown, and optional tags.\n\n' +
      'Available tools:\n' +
      '- save_item: Add a new project to the portfolio\n' +
      '- list_items / search_items: Browse and search existing projects\n' +
      '- update_item: Edit a project\'s details or narrative\n' +
      '- validate_item: Mark a project\'s completion status\n' +
      '- vouch_item: Showcase or hide a project (showcased/unlisted/private)\n' +
      '- batch_vouch_items: Showcase or hide multiple projects at once\n' +
      '- get_metadata: Get disciplines, series, and content guidelines\n' +
      '- create_workspace / create_type: Create new series and disciplines\n\n' +
      'Always call get_metadata first to learn the available disciplines and content guidelines before saving.',
    toolDescriptions: {
      save_item:
        'Add a new project to the portfolio. ALWAYS call get_metadata first — it provides required discipline IDs, current limits, and guidelines for writing effective case studies.',
      list_items:
        'Browse projects with optional filters by discipline or series. Use to review the portfolio or check for duplicate entries.',
      search_items:
        'Search projects by keyword across titles and narratives. Use to find related work before adding a project or to locate projects for status updates.',
      get_metadata:
        'Get disciplines, series, and content guidelines. ALWAYS call this first before save_item — the response contains required IDs, configurable limits, and formatting instructions.',
      validate_item:
        'Update a project\'s completion status (e.g., Published, In Progress, Archived). Call get_metadata first for valid action IDs.',
      update_item:
        'Edit an existing project. Use to refine the narrative, add process details, or recategorize into a different discipline.',
      create_workspace:
        'Create a new series for grouping related projects. Call get_metadata first to see existing series.',
      create_type:
        'Create a new discipline with status actions. Call get_metadata first to see existing disciplines and avoid duplicates.',
      vouch_item:
        'Change a project\'s showcase status: "vouched" showcases it publicly, "unlisted" creates a share link, "private" hides it from the portfolio.',
      batch_vouch_items:
        'Change showcase status for multiple projects at once (max 50). Use to publish a batch of projects to the portfolio.',
    },
    responseLabels: {
      saved: 'Project added!',
      updated: 'Project updated!',
      validated: 'Project status updated!',
      notFound: 'Project not found.',
      found: 'Found {total} projects (showing {count})',
      visibilityUpdated: 'Project showcase status updated!',
      batchComplete: 'Batch showcase complete:',
      workspaceCreated: 'Series created!',
      typeCreated: 'Discipline created!',
    },
    schemaDescriptions: {
      'save_item.keySummary':
        'Project title with client or context. Example: "Bloom Health Rebrand — Responsive Marketing Site"',
      'save_item.content':
        'Project case study in markdown. Structure as Challenge, Process, Result. Include tools, deliverables, and outcomes.',
      'save_item.typeId': 'Discipline ID (from get_metadata). Choose the primary creative discipline.',
      'save_item.workspaceId':
        'Optional series ID for grouping related projects (from get_metadata).',
      'save_item.tags':
        'Optional project tags. Use lowercase keywords (e.g. ["branding", "responsive", "figma"]).',
      'create_workspace.name':
        'Series name (e.g., "Client Work", "Personal Projects", "Experiments").',
      'create_type.name':
        'Discipline name (e.g., "Web Design", "Illustration", "Photography").',
      'create_type.actions':
        'Project status actions (e.g., "Published", "In Progress", "Archived"). At least 1 required.',
    },
  },
};
