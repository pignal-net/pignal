import type { TemplateConfig, TemplateProfile } from '../config';

const glossaryProfile: TemplateProfile = {
  id: 'glossary',
  displayName: 'Glossary / Reference',
  tagline: 'Searchable alphabetical table of terms and definitions',
  description:
    'An alphabetical table layout optimized for term definitions and reference lookups. ' +
    'Terms are displayed in a scannable table with search-first navigation — no feed, no grid, no cards. ' +
    'Built for technical writers, knowledge managers, and teams maintaining shared terminology.',
  domain: 'knowledge',
  contentType: 'entries',
  layout: 'table',
  audience: ['technical writers', 'terminologists', 'knowledge managers', 'onboarding teams'],
  useCases: [
    'Maintain a shared glossary of technical terms and acronyms',
    'Build a reference dictionary for industry-specific terminology',
    'Support onboarding with a searchable jargon guide',
    'Publish a domain-specific knowledge reference',
  ],
  differentiators: [
    'Alphabetical table layout with letter grouping',
    'Term + definition format optimized for scanning',
    'Search-first UI with instant filtering',
    'No feed, no grid — pure tabular reference',
  ],
  seedData: {
    types: [
      {
        name: 'Technical',
        description: 'Software, engineering, and technology terms',
        icon: '⚙️',
        color: '#3B82F6',
        guidance: {
          pattern: '[Term] — [concise definition]',
          example: 'Idempotency — the property of an operation where applying it multiple times produces the same result as applying it once',
          whenToUse: 'Use for software engineering, infrastructure, and technology-specific terms',
          contentHints: 'Start with a one-sentence definition. Then provide context, usage examples, and related terms. Include code examples where relevant.',
        },
        actions: ['Defined', 'Needs Review', 'Deprecated'],
      },
      {
        name: 'Business',
        description: 'Business, strategy, and organizational terms',
        icon: '📊',
        color: '#10B981',
        guidance: {
          pattern: '[Term] — [definition in business context]',
          example: 'Churn Rate — the percentage of customers who stop using a service during a given time period',
          whenToUse: 'Use for business strategy, operations, metrics, and organizational terminology',
          contentHints: 'Define clearly, provide the calculation formula if applicable, and give a concrete business example. Note any industry-specific variations.',
        },
        actions: ['Defined', 'Needs Review', 'Obsolete'],
      },
      {
        name: 'Legal',
        description: 'Legal, compliance, and regulatory terms',
        icon: '⚖️',
        color: '#8B5CF6',
        guidance: {
          pattern: '[Term] — [plain-language definition]',
          example: 'Force Majeure — a contract clause freeing both parties from obligation when an extraordinary event prevents fulfillment',
          whenToUse: 'Use for legal, compliance, regulatory, and contract-related terminology',
          contentHints: 'Provide a plain-language definition first, then the formal legal meaning. Include jurisdiction notes where relevant. Never provide legal advice.',
        },
        actions: ['Defined', 'Needs Legal Review', 'Superseded'],
      },
      {
        name: 'Medical',
        description: 'Healthcare, clinical, and life sciences terms',
        icon: '🩺',
        color: '#EC4899',
        guidance: {
          pattern: '[Term] — [clinical definition in accessible language]',
          example: 'Tachycardia — a heart rate exceeding 100 beats per minute at rest, often a symptom rather than a condition itself',
          whenToUse: 'Use for medical, clinical, pharmaceutical, and life sciences terminology',
          contentHints: 'Start with an accessible definition, then add clinical precision. Include the etymological root if helpful. Note common contexts where the term appears.',
        },
        actions: ['Defined', 'Needs Clinical Review', 'Updated'],
      },
      {
        name: 'Academic',
        description: 'Research methodology and scholarly terms',
        icon: '🎓',
        color: '#F59E0B',
        guidance: {
          pattern: '[Term] — [definition with disciplinary context]',
          example: 'P-value — the probability of observing results at least as extreme as the measured results, assuming the null hypothesis is true',
          whenToUse: 'Use for research methodology, statistics, academic processes, and scholarly terminology',
          contentHints: 'Define precisely but accessibly. Include the field of origin, common misinterpretations to avoid, and a concrete example of usage.',
        },
        actions: ['Defined', 'Contested', 'Revised'],
      },
    ],
    workspaces: [
      { name: 'Core Concepts', description: 'Foundational terms everyone should know', visibility: 'public' },
      { name: 'Acronyms', description: 'Abbreviations and acronym expansions', visibility: 'public' },
      { name: 'Industry Terms', description: 'Domain-specific professional vocabulary', visibility: 'public' },
      { name: 'Internal Jargon', description: 'Team-specific terms and shorthand', visibility: 'private' },
    ],
    settings: {
      sourceTitle: 'My Glossary',
      sourceDescription: 'Searchable reference of terms and definitions',
      qualityGuidelines: {
        keySummary: { tips: 'Use the term name followed by a dash and a concise one-line definition. This appears in the table row — keep it scannable.' },
        content: { tips: 'Start with a clear definition, then expand with context, examples, and related terms. Write for someone encountering this term for the first time.' },
        formatting: [
          'Bold: the term itself on first use in the definition',
          'Bullet lists: related terms, see-also references',
          'Code blocks: technical terms with code examples',
          'Italics: etymological roots or foreign-language origins',
          'Tables: comparison of similar or commonly confused terms',
        ],
        avoid: [
          'Circular definitions that use the term to define itself',
          'Overly academic language when a plain definition suffices',
          'Missing context for domain-specific terms',
        ],
      },
      validationLimits: {
        keySummary: { min: 2, max: 100 },
        content: { min: 10, max: 5000 },
      },
    },
    actions: [
      {
        name: 'Suggest a Term',
        slug: 'suggest-term',
        description: 'Suggest a term to add to the glossary',
        fields: [
          { name: 'name', type: 'text', label: 'Name', required: true, placeholder: 'Your name', maxLength: 100 },
          { name: 'email', type: 'email', label: 'Email', required: true, placeholder: 'you@example.com' },
          { name: 'term', type: 'text', label: 'Term', required: true, placeholder: 'The term to define', maxLength: 200 },
          { name: 'context', type: 'textarea', label: 'Context or Definition', required: true, placeholder: 'Provide a definition or explain why this term should be included...', maxLength: 2000 },
        ],
        settings: { success_message: 'Thanks for the suggestion! We\'ll review and add the term if it fits the glossary.', require_honeypot: true },
      },
    ],
  },
};

export const glossaryConfig: TemplateConfig = {
  profile: glossaryProfile,
  vocabulary: {
    item: 'term',
    itemPlural: 'terms',
    type: 'domain',
    typePlural: 'domains',
    workspace: 'glossary',
    workspacePlural: 'glossaries',
    vouch: 'define',
    vouched: 'defined',
  },
  seo: {
    siteSchemaType: 'WebSite',
    itemSchemaType: 'DefinedTerm',
  },
  mcp: {
    instructions:
      'Pignal is a self-hosted glossary platform for defining and organizing terms, acronyms, and domain-specific vocabulary. ' +
      'Each term has a domain, key summary (term + short definition), detailed content in markdown, and optional tags.\n\n' +
      'Available tools:\n' +
      '- save_item: Define a new term\n' +
      '- list_items / search_items: Browse and search the glossary\n' +
      '- update_item: Update an existing term definition\n' +
      '- validate_item: Mark a term as defined, needs review, or deprecated\n' +
      '- vouch_item: Define a term to the public glossary (defined/unlisted/private)\n' +
      '- batch_vouch_items: Define multiple terms at once\n' +
      '- get_metadata: Get available domains, glossaries, and content guidelines\n' +
      '- create_workspace / create_type: Create new glossaries and domains\n\n' +
      'Always call get_metadata first to learn the available domains and content guidelines before saving.',
    toolDescriptions: {
      save_item:
        'Define a new term. ALWAYS call get_metadata first — it provides required IDs, current limits, and guidelines for writing clear, accurate definitions.',
      list_items:
        'Browse terms with optional filters by domain or glossary. Use to review existing definitions or check for duplicates before defining.',
      search_items:
        'Search terms by keyword across names and definitions. Use to find related terms or check if a term already exists.',
      get_metadata:
        'Get domains, glossaries, and content guidelines. ALWAYS call this first before save_item or validate_item — the response contains required IDs and definition standards.',
      validate_item:
        'Mark a term as defined, needs review, or deprecated. Call get_metadata first for valid action IDs.',
      update_item:
        'Update an existing term definition. Use to refine wording, add examples, or correct inaccuracies.',
      create_workspace:
        'Create a new glossary for grouping related terms. Call get_metadata first to see existing glossaries.',
      create_type:
        'Create a new domain category with review actions. Call get_metadata first to see existing domains and avoid duplicates.',
      vouch_item:
        'Change a term\'s visibility: "vouched" defines it in the public glossary, "unlisted" creates a share link, "private" keeps it internal.',
      batch_vouch_items:
        'Define multiple terms at once (max 50). Each term can have its own visibility and optional slug. Use to publish a batch of definitions.',
    },
    responseLabels: {
      saved: 'Term defined!',
      updated: 'Term updated!',
      validated: 'Term reviewed!',
      notFound: 'Term not found.',
      found: 'Found {total} terms (showing {count})',
      visibilityUpdated: 'Term defined!',
      batchComplete: 'Batch define complete:',
      workspaceCreated: 'Glossary created!',
      typeCreated: 'Domain created!',
    },
    schemaDescriptions: {
      'save_item.keySummary':
        'Term name followed by a concise definition. Example: "Idempotency — applying an operation multiple times produces the same result as once"',
      'save_item.content':
        'Full definition in markdown. Start with a clear definition, then add context, examples, and related terms. Include code examples for technical terms.',
      'save_item.typeId':
        'Domain ID (from get_metadata). Choose Technical, Business, Legal, Medical, or Academic.',
      'save_item.workspaceId':
        'Optional glossary ID to place this term (from get_metadata). Example: Core Concepts, Acronyms, Industry Terms.',
      'save_item.tags':
        'Optional tags. Use lowercase keywords (e.g. ["networking", "protocol", "http", "api"]).',
      'create_workspace.name':
        'Glossary name (e.g., "Core Concepts", "Acronyms", "Platform-Specific Terms").',
      'create_type.name':
        'Domain name (e.g., "Technical", "Legal", "Finance", "Healthcare").',
      'create_type.actions':
        'Review actions (e.g., "Defined", "Needs Review", "Deprecated"). At least 1 required.',
    },
  },
};
