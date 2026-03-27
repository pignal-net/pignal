import type { TemplateConfig, TemplateProfile } from '../config';

const caseStudiesProfile: TemplateProfile = {
  id: 'case-studies',
  displayName: 'Case Studies',
  tagline: 'Featured case study hero with outcome metrics and client attribution',
  description:
    'A magazine-style layout optimized for professional case studies with outcome metrics callouts and client attribution. ' +
    'Features a hero card for the most impactful study, a grid of industry-tagged entries below, and before/after structure in detail pages. ' +
    'Built for consultants, agencies, and B2B teams showcasing their work.',
  domain: 'professional',
  contentType: 'articles',
  layout: 'magazine',
  audience: ['consultants', 'agencies', 'B2B marketers', 'sales engineers'],
  useCases: [
    'Showcase client outcomes with measurable results',
    'Build a portfolio of case studies organized by industry',
    'Support sales conversations with relevant proof points',
    'Publish before/after transformation narratives',
  ],
  differentiators: [
    'Outcome metrics callouts (e.g., "40% cost reduction")',
    'Client attribution with industry tagging',
    'Before/after structure in detail pages',
    'Magazine hero card for featured study with grid below',
  ],
  seedData: {
    types: [
      {
        name: 'Technology',
        description: 'Software, SaaS, and IT infrastructure engagements',
        icon: '💻',
        color: '#3B82F6',
        guidance: {
          pattern: '[Client/context] + [challenge] + [headline outcome]',
          example: 'Series B SaaS startup reduced API latency by 70% with edge caching architecture',
          whenToUse: 'Use for technology, software, or IT infrastructure case studies',
          contentHints: 'Structure as Challenge, Approach, Solution, Results. Include specific metrics, tech stack details, and timeline. Use tables for before/after comparisons.',
        },
        actions: ['Published', 'Needs Update', 'Client Declined'],
      },
      {
        name: 'Healthcare',
        description: 'Clinical, health-tech, and life sciences engagements',
        icon: '🏥',
        color: '#10B981',
        guidance: {
          pattern: '[Organization type] + [problem domain] + [outcome metric]',
          example: 'Regional hospital network cut patient wait times by 35% with automated triage scheduling',
          whenToUse: 'Use for healthcare, health-tech, clinical, or life sciences case studies',
          contentHints: 'Include compliance considerations (HIPAA, etc.), patient impact metrics, and implementation timeline. Anonymize patient data.',
        },
        actions: ['Published', 'Under Review', 'Compliance Hold'],
      },
      {
        name: 'Finance',
        description: 'Banking, fintech, and financial services engagements',
        icon: '🏦',
        color: '#8B5CF6',
        guidance: {
          pattern: '[Institution type] + [challenge area] + [financial outcome]',
          example: 'Mid-market bank automated 80% of loan underwriting, reducing approval time from 5 days to 4 hours',
          whenToUse: 'Use for banking, fintech, insurance, or financial services case studies',
          contentHints: 'Quantify ROI, cost savings, and time-to-value. Include regulatory context. Use tables for financial comparisons.',
        },
        actions: ['Published', 'Needs Update', 'NDA Restricted'],
      },
      {
        name: 'Retail',
        description: 'E-commerce, brick-and-mortar, and consumer brand engagements',
        icon: '🛒',
        color: '#F59E0B',
        guidance: {
          pattern: '[Brand/retailer type] + [challenge] + [revenue or conversion outcome]',
          example: 'DTC fashion brand increased repeat purchase rate by 25% with personalized email sequences',
          whenToUse: 'Use for retail, e-commerce, consumer brand, or marketplace case studies',
          contentHints: 'Include conversion metrics, revenue impact, and seasonal context. Show the customer journey. Use charts or tables for performance data.',
        },
        actions: ['Published', 'Seasonal Update Needed', 'Archived'],
      },
      {
        name: 'Education',
        description: 'EdTech, institutional, and training engagements',
        icon: '🎓',
        color: '#EC4899',
        guidance: {
          pattern: '[Institution type] + [problem] + [learning outcome]',
          example: 'State university improved course completion rates by 18% with adaptive learning platform',
          whenToUse: 'Use for education, training, or institutional learning case studies',
          contentHints: 'Include enrollment data, completion metrics, and learner feedback. Describe the pedagogical approach and technology used.',
        },
        actions: ['Published', 'Pending Approval', 'Data Refresh Needed'],
      },
    ],
    workspaces: [
      { name: 'Enterprise', description: 'Large enterprise engagements', visibility: 'public' },
      { name: 'Startups', description: 'Startup and scale-up engagements', visibility: 'public' },
      { name: 'Non-Profit', description: 'Non-profit and NGO engagements', visibility: 'public' },
      { name: 'Government', description: 'Public sector and government engagements', visibility: 'public' },
    ],
    settings: {
      sourceTitle: 'My Case Studies',
      sourceDescription: 'Client outcomes and transformation stories',
      qualityGuidelines: {
        keySummary: { tips: 'Lead with the client context (anonymized if needed), then the headline outcome with a specific metric. Avoid vague claims.' },
        content: { tips: 'Structure every case study as: Challenge, Approach, Solution, Results. Quantify outcomes with real metrics. Include a client quote if possible.' },
        formatting: [
          'Headings: Challenge, Approach, Solution, Results (standard structure)',
          'Tables: before/after metrics, ROI breakdown, timeline',
          'Block quotes: client testimonials and stakeholder quotes',
          'Bold: headline metrics and key outcomes',
          'Bullet lists: deliverables, technologies used, team composition',
          'Numbered lists: implementation phases or milestones',
        ],
        avoid: [
          'Vague claims without specific metrics',
          'Naming clients without permission',
          'Missing the Challenge section (context is essential)',
          'Omitting timeline or implementation details',
        ],
      },
      validationLimits: {
        keySummary: { min: 15, max: 200 },
        content: { min: 200, max: 20000 },
      },
    },
    actions: [
      {
        name: 'Contact',
        slug: 'contact',
        description: 'Get in touch about working together',
        fields: [
          { name: 'name', type: 'text', label: 'Name', required: true, placeholder: 'Your name', maxLength: 100 },
          { name: 'email', type: 'email', label: 'Email', required: true, placeholder: 'you@example.com' },
          { name: 'message', type: 'textarea', label: 'Message', required: true, placeholder: 'Tell us about your challenge and how we can help...', maxLength: 2000 },
        ],
        settings: { success_message: 'Thanks for reaching out! We\'ll review your message and respond within 2 business days.', require_honeypot: true },
      },
    ],
  },
};

export const caseStudiesConfig: TemplateConfig = {
  profile: caseStudiesProfile,
  vocabulary: {
    item: 'case study',
    itemPlural: 'case studies',
    type: 'industry',
    typePlural: 'industries',
    workspace: 'portfolio',
    workspacePlural: 'portfolios',
    vouch: 'publish',
    vouched: 'published',
  },
  seo: {
    siteSchemaType: 'WebSite',
    itemSchemaType: 'Article',
  },
  mcp: {
    instructions:
      'Pignal is a self-hosted case study platform for publishing client outcomes, transformation stories, and professional proof points. ' +
      'Each case study has an industry, headline summary, detailed content in markdown, and optional tags.\n\n' +
      'Available tools:\n' +
      '- save_item: Create a new case study\n' +
      '- list_items / search_items: Browse and search the case study library\n' +
      '- update_item: Edit an existing case study\n' +
      '- validate_item: Apply a review action (Published, Needs Update, etc.)\n' +
      '- vouch_item: Publish a case study to the public portfolio (published/unlisted/private)\n' +
      '- batch_vouch_items: Publish multiple case studies at once\n' +
      '- get_metadata: Get available industries, portfolios, and content guidelines\n' +
      '- create_workspace / create_type: Create new portfolios and industries\n\n' +
      'Always call get_metadata first to learn the available industries and content guidelines before saving.',
    toolDescriptions: {
      save_item:
        'Create a new case study. ALWAYS call get_metadata first — it provides required IDs, current limits, and guidelines for writing effective case studies with measurable outcomes.',
      list_items:
        'Browse case studies with optional filters by industry or portfolio. Use to review existing studies or find proof points for a specific vertical.',
      search_items:
        'Search case studies by keyword across summaries and content. Use to find relevant case studies by outcome, technology, or client type.',
      get_metadata:
        'Get industries, portfolios, and content guidelines. ALWAYS call this first before save_item or validate_item — the response contains required IDs and the Challenge/Approach/Solution/Results structure.',
      validate_item:
        'Apply a review action to a case study (e.g., Published, Needs Update, NDA Restricted). Call get_metadata first for valid action IDs.',
      update_item:
        'Update an existing case study. Use to refresh metrics, add follow-up results, or update client attribution.',
      create_workspace:
        'Create a new portfolio for grouping case studies. Call get_metadata first to see existing portfolios.',
      create_type:
        'Create a new industry category with review actions. Call get_metadata first to see existing industries and avoid duplicates.',
      vouch_item:
        'Change a case study\'s visibility: "vouched" publishes it to the public portfolio, "unlisted" creates a share link, "private" keeps it internal.',
      batch_vouch_items:
        'Publish multiple case studies at once (max 50). Each case study can have its own visibility and optional slug. Use to launch a portfolio section.',
    },
    responseLabels: {
      saved: 'Case study created!',
      updated: 'Case study updated!',
      validated: 'Case study reviewed!',
      notFound: 'Case study not found.',
      found: 'Found {total} case studies (showing {count})',
      visibilityUpdated: 'Case study published!',
      batchComplete: 'Batch publish complete:',
      workspaceCreated: 'Portfolio created!',
      typeCreated: 'Industry created!',
    },
    schemaDescriptions: {
      'save_item.keySummary':
        'Case study headline with client context and outcome metric. Example: "Series B SaaS startup reduced API latency by 70% with edge caching architecture"',
      'save_item.content':
        'Full case study in markdown. Structure as Challenge, Approach, Solution, Results. Quantify outcomes with specific metrics. Include client quotes if available.',
      'save_item.typeId':
        'Industry ID (from get_metadata). Choose Technology, Healthcare, Finance, Retail, or Education.',
      'save_item.workspaceId':
        'Optional portfolio ID to group this case study (from get_metadata). Example: Enterprise, Startups, Non-Profit.',
      'save_item.tags':
        'Optional tags. Use lowercase keywords (e.g. ["saas", "migration", "cost-reduction", "cloud"]).',
      'create_workspace.name':
        'Portfolio name (e.g., "Enterprise", "Public Sector", "Growth Stage").',
      'create_type.name':
        'Industry name (e.g., "Technology", "Healthcare", "Financial Services").',
      'create_type.actions':
        'Review actions (e.g., "Published", "Needs Update", "NDA Restricted"). At least 1 required.',
    },
  },
};
