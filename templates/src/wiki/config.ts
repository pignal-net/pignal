import type { TemplateConfig, TemplateProfile } from '../config';

const wikiProfile: TemplateProfile = {
  id: 'wiki',
  displayName: 'Wiki / Knowledge Base',
  tagline: 'Tree-structured navigation with interlinked articles',
  description:
    'A knowledge base layout for organizing articles by topic and section. ' +
    'Tree sidebar for categorical navigation, breadcrumb trails for context, ' +
    'and alphabetical listing within sections — no chronological emphasis.',
  domain: 'knowledge',
  contentType: 'articles',
  layout: 'directory',
  audience: ['developers', 'technical writers', 'documentation teams', 'open-source maintainers'],
  useCases: [
    'Build a structured knowledge base for a project or team',
    'Publish technical documentation with categorical navigation',
    'Maintain an interlinked reference wiki for a domain',
    'Organize institutional knowledge by topic and section',
  ],
  differentiators: [
    'Tree sidebar (not filter bar)',
    'No chronology emphasis',
    'Alphabetical/categorical navigation',
    'Breadcrumb navigation',
  ],
  seedData: {
    types: [
      {
        name: 'Concept',
        description: 'Explanation of a core idea or principle',
        icon: '💡',
        color: '#8B5CF6',
        guidance: {
          pattern: '[Topic]: [Core idea or principle explained]',
          example: 'Event Sourcing: Storing state changes as an immutable sequence of events',
          whenToUse: 'Use for explaining foundational ideas, patterns, or mental models',
          contentHints:
            'Open with a concise definition, then expand with context, related concepts, and examples. ' +
            'Use headings to separate Definition, How It Works, and When To Use sections.',
        },
        actions: ['Accurate', 'Outdated', 'Needs Revision', 'Superseded'],
      },
      {
        name: 'How-To Guide',
        description: 'Step-by-step instructions for a specific task',
        icon: '📝',
        color: '#3B82F6',
        guidance: {
          pattern: 'How to [accomplish specific task] + [context or scope]',
          example: 'How to configure CORS headers in Cloudflare Workers',
          whenToUse: 'Use for task-oriented instructions that walk through a specific workflow',
          contentHints:
            'Start with prerequisites, then use numbered steps. Include code blocks for commands ' +
            'and expected output. End with verification steps and troubleshooting tips.',
        },
        actions: ['Verified', 'Broken', 'Needs Update', 'Deprecated'],
      },
      {
        name: 'Reference',
        description: 'Technical specification or API documentation',
        icon: '📖',
        color: '#10B981',
        guidance: {
          pattern: '[Component/API name] — [scope of reference]',
          example: 'Drizzle ORM — Column type reference for SQLite',
          whenToUse: 'Use for lookup-oriented content: API surfaces, config options, type definitions',
          contentHints:
            'Use tables for parameters, options, and return types. Group related items under headings. ' +
            'Include code examples for each entry. Keep descriptions terse — this is a reference, not a tutorial.',
        },
        actions: ['Current', 'Outdated', 'Incomplete', 'Deprecated'],
      },
      {
        name: 'FAQ',
        description: 'Frequently asked questions with answers',
        icon: '❓',
        color: '#F59E0B',
        guidance: {
          pattern: '[Topic area] — Frequently Asked Questions',
          example: 'Authentication — Frequently Asked Questions',
          whenToUse: 'Use for collections of common questions and their answers within a topic',
          contentHints:
            'Use headings for each question (## Question). Keep answers direct — lead with the answer, ' +
            'then provide context. Link to related articles for deeper explanations.',
        },
        actions: ['Helpful', 'Unclear', 'Needs More Questions'],
      },
      {
        name: 'Glossary Entry',
        description: 'Definition of a specific term',
        icon: '🔤',
        color: '#EC4899',
        guidance: {
          pattern: '[Term]: [Brief definition]',
          example: 'Idempotency: An operation that produces the same result when applied multiple times',
          whenToUse: 'Use for defining domain-specific terms, acronyms, or jargon',
          contentHints:
            'Lead with a one-sentence definition. Follow with usage context, related terms, ' +
            'and examples showing the term in practice. Keep it concise — link to concept articles for depth.',
        },
        actions: ['Accurate', 'Misleading', 'Too Broad'],
      },
    ],
    workspaces: [
      { name: 'Getting Started', description: 'Onboarding and introductory articles', visibility: 'public' },
      { name: 'Architecture', description: 'System design and architectural decisions', visibility: 'public' },
      { name: 'API Reference', description: 'Endpoints, types, and configuration', visibility: 'public' },
      { name: 'Troubleshooting', description: 'Common issues and their solutions', visibility: 'public' },
      { name: 'Contributing', description: 'Guidelines for contributors', visibility: 'public' },
    ],
    settings: {
      sourceTitle: 'My Knowledge Base',
      sourceDescription: 'Structured documentation and reference articles',
      qualityGuidelines: {
        keySummary: {
          tips:
            'Write a descriptive title that helps readers find this article. ' +
            'Follow the topic-specific pattern from guidance. Example: "How to set up CI/CD with GitHub Actions"',
        },
        content: {
          tips:
            'Write for someone encountering this topic for the first time. ' +
            'Use headings to create scannable structure. Link to related articles where relevant.',
        },
        formatting: [
          'Headings: create a navigable hierarchy (H2 for sections, H3 for subsections)',
          'Code blocks: commands, config snippets, API examples with language tags',
          'Tables: parameters, options, comparisons, specifications',
          'Numbered lists: sequential steps or procedures',
          'Bullet lists: related items, feature lists, prerequisites',
          'Callouts: important warnings, tips, or notes (use blockquotes)',
        ],
        avoid: [
          'Ambiguous titles that do not indicate content scope',
          'Missing prerequisites or assumed context',
          'Undated references to "current" versions',
          'Duplicate content — link to existing articles instead',
        ],
      },
      validationLimits: {
        keySummary: { min: 10, max: 200 },
        content: { min: 100, max: 30000 },
      },
    },
    actions: [
      {
        name: 'Suggest Edit',
        slug: 'suggest-edit',
        description: 'Suggest an improvement to an article',
        fields: [
          { name: 'name', type: 'text', label: 'Name', required: true, placeholder: 'Your name', maxLength: 100 },
          { name: 'email', type: 'email', label: 'Email', required: true, placeholder: 'you@example.com' },
          { name: 'article_url', type: 'url', label: 'Article URL', required: false, placeholder: 'https://...', maxLength: 500 },
          { name: 'suggestion', type: 'textarea', label: 'Suggested Edit', required: true, placeholder: 'Describe the change you\'d suggest...', maxLength: 2000 },
        ],
        settings: { success_message: 'Thanks for the suggestion! We\'ll review it and update the article if appropriate.', require_honeypot: true },
      },
      {
        name: 'Report Issue',
        slug: 'report-issue',
        description: 'Report an issue with the knowledge base',
        fields: [
          { name: 'name', type: 'text', label: 'Name', required: true, placeholder: 'Your name', maxLength: 100 },
          { name: 'email', type: 'email', label: 'Email', required: true, placeholder: 'you@example.com' },
          { name: 'issue_type', type: 'select', label: 'Issue Type', required: true, options: ['Outdated Information', 'Incorrect Content', 'Broken Link', 'Missing Topic', 'Other'] },
          { name: 'details', type: 'textarea', label: 'Details', required: true, placeholder: 'Describe the issue...', maxLength: 2000 },
        ],
        settings: { success_message: 'Issue reported! We\'ll investigate and make corrections as needed.', require_honeypot: true },
      },
    ],
  },
};

export const wikiConfig: TemplateConfig = {
  profile: wikiProfile,
  vocabulary: {
    item: 'article',
    itemPlural: 'articles',
    type: 'topic',
    typePlural: 'topics',
    workspace: 'section',
    workspacePlural: 'sections',
    vouch: 'publish',
    vouched: 'published',
  },
  seo: {
    siteSchemaType: 'WebSite',
    itemSchemaType: 'Article',
  },
  mcp: {
    instructions:
      'Pignal is a self-hosted knowledge base platform for publishing structured articles — concepts, guides, references, and FAQs. ' +
      'Each article has a topic, title, content in markdown, and optional tags.\n\n' +
      'Available tools:\n' +
      '- save_item: Create a new article in the knowledge base\n' +
      '- list_items / search_items: Browse and search existing articles\n' +
      '- update_item: Edit an existing article\n' +
      '- validate_item: Mark an article as reviewed (accurate, outdated, etc.)\n' +
      '- vouch_item: Publish or unpublish an article (published/unlisted/private)\n' +
      '- batch_vouch_items: Publish or unpublish multiple articles at once\n' +
      '- get_metadata: Get available topics, sections, and quality guidelines\n' +
      '- create_workspace / create_type: Create new sections and topics\n\n' +
      'Always call get_metadata first to learn the available topics and quality guidelines before saving.',
    toolDescriptions: {
      save_item:
        'Create a new article in the knowledge base. ALWAYS call get_metadata first — it provides required IDs, current limits, and quality guidelines for writing well-structured articles.',
      list_items:
        'Browse articles with optional filters by topic or section. Use to review existing articles or check for duplicates before creating.',
      search_items:
        'Search articles by keyword across titles and content. Use to find related articles before creating or to locate articles for review.',
      get_metadata:
        'Get article topics, sections, and quality guidelines. ALWAYS call this first before save_item or validate_item — the response contains required IDs, configurable limits, and detailed instructions for writing high-quality articles.',
      validate_item:
        'Mark an article as reviewed (e.g., Accurate, Outdated, Needs Revision). Validation maintains knowledge base quality over time. Call get_metadata first for valid action IDs.',
      update_item:
        'Update an existing article. Use to correct information, expand coverage, or reclassify under a different topic.',
      create_workspace:
        'Create a new section for organizing articles by area. Call get_metadata first to see existing sections.',
      create_type:
        'Create a new article topic with review actions. Call get_metadata first to see existing topics and avoid duplicates.',
      vouch_item:
        'Change an article\'s visibility: "vouched" publishes it with a URL slug, "unlisted" creates a share link, "private" hides it. Use to publish articles to the knowledge base.',
      batch_vouch_items:
        'Change visibility for multiple articles at once (max 50). Each article can have its own visibility and optional slug. Use to publish a batch of articles to the knowledge base.',
    },
    responseLabels: {
      saved: 'Article saved!',
      updated: 'Article updated!',
      validated: 'Article reviewed!',
      notFound: 'Article not found.',
      found: 'Found {total} articles (showing {count})',
      visibilityUpdated: 'Article visibility updated!',
      batchComplete: 'Batch publish complete:',
      workspaceCreated: 'Section created!',
      typeCreated: 'Topic created!',
    },
    schemaDescriptions: {
      'save_item.keySummary':
        'Descriptive article title. Follow the topic-specific pattern. Example: "How to configure rate limiting in Cloudflare Workers"',
      'save_item.content':
        'Article body in markdown. Use headings for structure, code blocks for examples, tables for specs. Check get_metadata for current limits.',
      'save_item.typeId':
        'Article topic ID (from get_metadata). Choose the topic that best describes the article format: Concept, How-To Guide, Reference, FAQ, or Glossary Entry.',
      'save_item.workspaceId':
        'Optional section ID for organizing articles by area (from get_metadata). Examples: "Getting Started", "API Reference", "Troubleshooting".',
      'save_item.tags':
        'Optional tags. Use lowercase keywords (e.g. ["authentication", "oauth", "cloudflare"]).',
      'create_workspace.name':
        'Section name (e.g., "Deployment", "Security", "Migration Guides").',
      'create_type.name':
        'Article topic name (e.g., "Architecture Decision", "Comparison", "Checklist").',
      'create_type.actions':
        'Review actions (e.g., "Accurate", "Outdated", "Needs Revision"). At least 1 required.',
    },
  },
};
