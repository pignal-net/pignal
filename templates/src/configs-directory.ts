import type { TemplateProfile, TemplateConfig } from './config';

// =============================================================================
// 1. Wiki / Knowledge Base
// =============================================================================

export const wikiProfile: TemplateProfile = {
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

// =============================================================================
// 2. Course / Tutorial Series
// =============================================================================

export const courseProfile: TemplateProfile = {
  id: 'course',
  displayName: 'Course / Tutorial Series',
  tagline: 'Sequential lessons with chapter navigation and progress',
  description:
    'A structured course layout for publishing ordered lesson sequences. ' +
    'Module-based sidebar navigation with numbered lessons, next/previous controls, ' +
    'and track-based grouping for multi-course sites.',
  domain: 'education',
  contentType: 'articles',
  layout: 'directory',
  audience: ['educators', 'course creators', 'bootcamp instructors', 'tutorial authors'],
  useCases: [
    'Publish a structured tutorial series with sequential lessons',
    'Organize educational content into modules and learning tracks',
    'Create a self-paced course with chapter-based navigation',
    'Build a training curriculum with progressive difficulty',
  ],
  differentiators: [
    'Ordered lesson sequence (numbered)',
    'Next/previous navigation',
    'Chapter/module grouping',
    'Progress-oriented sidebar',
  ],
  seedData: {
    types: [
      {
        name: 'Fundamentals',
        description: 'Core concepts and foundational knowledge',
        icon: '🧱',
        color: '#3B82F6',
        guidance: {
          pattern: '[Lesson number]. [Topic] — [What the learner will understand]',
          example: '1. Variables and Types — Understanding how JavaScript stores data',
          whenToUse: 'Use for introductory lessons that establish foundational knowledge',
          contentHints:
            'Start with learning objectives. Introduce one concept at a time with clear examples. ' +
            'Include practice exercises at the end. Use code blocks for all code samples.',
        },
        actions: ['Clear', 'Confusing', 'Needs Examples', 'Too Advanced'],
      },
      {
        name: 'Intermediate',
        description: 'Building on fundamentals with practical applications',
        icon: '🔧',
        color: '#10B981',
        guidance: {
          pattern: '[Lesson number]. [Topic] — [Practical skill or technique]',
          example: '5. State Management — Building a shopping cart with React hooks',
          whenToUse: 'Use for lessons that apply foundational knowledge to practical scenarios',
          contentHints:
            'Reference prerequisite lessons. Build on previous examples where possible. ' +
            'Include a hands-on project or exercise. Show common mistakes and how to avoid them.',
        },
        actions: ['Effective', 'Too Easy', 'Missing Context', 'Needs Practice'],
      },
      {
        name: 'Advanced',
        description: 'Deep dives and expert-level techniques',
        icon: '🚀',
        color: '#8B5CF6',
        guidance: {
          pattern: '[Lesson number]. [Topic] — [Advanced technique or deep dive]',
          example: '12. Performance Optimization — Profiling and fixing React re-renders',
          whenToUse: 'Use for expert-level content that assumes solid intermediate knowledge',
          contentHints:
            'State prerequisites clearly. Dive deep into internals or edge cases. ' +
            'Include benchmarks or real-world scenarios. Link to reference documentation for further reading.',
        },
        actions: ['Insightful', 'Too Dense', 'Needs Prerequisites', 'Outdated'],
      },
      {
        name: 'Workshop',
        description: 'Guided hands-on project or exercise',
        icon: '🛠️',
        color: '#F59E0B',
        guidance: {
          pattern: 'Workshop: [Project name] — [What you will build]',
          example: 'Workshop: Task Tracker — Build a full-stack CRUD app with authentication',
          whenToUse: 'Use for project-based lessons where the learner builds something end-to-end',
          contentHints:
            'Provide a project overview and final result upfront. Break into numbered steps. ' +
            'Include starter code and expected output at each checkpoint. End with extension ideas.',
        },
        actions: ['Completed', 'Stuck', 'Too Long', 'Missing Steps'],
      },
      {
        name: 'Assessment',
        description: 'Quiz, challenge, or knowledge check',
        icon: '✅',
        color: '#EC4899',
        guidance: {
          pattern: 'Assessment: [Topic area] — [What is being tested]',
          example: 'Assessment: JavaScript Basics — Variables, functions, and control flow',
          whenToUse: 'Use for knowledge checks, quizzes, or coding challenges after a module',
          contentHints:
            'List questions or challenges with clear instructions. Provide hints for harder items. ' +
            'Include an answer key or solution section at the bottom (use a details/summary block).',
        },
        actions: ['Fair', 'Too Easy', 'Too Hard', 'Unclear'],
      },
    ],
    workspaces: [
      { name: 'Web Development', description: 'Frontend and backend web technologies', visibility: 'public' },
      { name: 'Data Science', description: 'Data analysis, ML, and statistics', visibility: 'public' },
      { name: 'DevOps', description: 'Infrastructure, CI/CD, and deployment', visibility: 'public' },
      { name: 'Mobile', description: 'iOS, Android, and cross-platform development', visibility: 'public' },
    ],
    settings: {
      sourceTitle: 'My Course',
      sourceDescription: 'Structured lessons and tutorials',
      qualityGuidelines: {
        keySummary: {
          tips:
            'Use a numbered lesson title that previews the learning outcome. ' +
            'Follow the module-specific pattern. Example: "3. Routing — Building multi-page apps with Next.js"',
        },
        content: {
          tips:
            'Write for a learner progressing sequentially. Start with objectives, build incrementally, ' +
            'and end with a summary and next steps. Reference previous lessons when building on them.',
        },
        formatting: [
          'Headings: Learning Objectives, Prerequisites, main topic sections, Summary, Exercises',
          'Code blocks: all code samples with language tags and inline comments',
          'Numbered lists: sequential steps, procedures, exercise instructions',
          'Bullet lists: learning objectives, key takeaways, prerequisites',
          'Tables: comparison of approaches, API reference within lessons',
          'Blockquotes: tips, warnings, or important notes for learners',
        ],
        avoid: [
          'Jumping between topics without clear transitions',
          'Assuming knowledge not covered in prerequisite lessons',
          'Code samples without explanation or context',
          'Missing exercises or practice opportunities',
        ],
      },
      validationLimits: {
        keySummary: { min: 10, max: 200 },
        content: { min: 200, max: 30000 },
      },
    },
  },
};

export const courseConfig: TemplateConfig = {
  profile: courseProfile,
  vocabulary: {
    item: 'lesson',
    itemPlural: 'lessons',
    type: 'module',
    typePlural: 'modules',
    workspace: 'track',
    workspacePlural: 'tracks',
    vouch: 'release',
    vouched: 'released',
  },
  seo: {
    siteSchemaType: 'Course',
    itemSchemaType: 'LearningResource',
  },
  mcp: {
    instructions:
      'Pignal is a self-hosted course platform for publishing structured lessons — fundamentals, workshops, and assessments organized into modules and tracks. ' +
      'Each lesson has a module, title, content in markdown, and optional tags.\n\n' +
      'Available tools:\n' +
      '- save_item: Create a new lesson in the course\n' +
      '- list_items / search_items: Browse and search existing lessons\n' +
      '- update_item: Edit an existing lesson\n' +
      '- validate_item: Review a lesson (clear, confusing, needs examples, etc.)\n' +
      '- vouch_item: Release or unrelease a lesson (released/unlisted/private)\n' +
      '- batch_vouch_items: Release or unrelease multiple lessons at once\n' +
      '- get_metadata: Get available modules, tracks, and quality guidelines\n' +
      '- create_workspace / create_type: Create new tracks and modules\n\n' +
      'Always call get_metadata first to learn the available modules and quality guidelines before saving.',
    toolDescriptions: {
      save_item:
        'Create a new lesson in the course. ALWAYS call get_metadata first — it provides required IDs, current limits, and quality guidelines for writing effective lessons.',
      list_items:
        'Browse lessons with optional filters by module or track. Use to review the course structure or check for duplicates before creating.',
      search_items:
        'Search lessons by keyword across titles and content. Use to find related lessons before creating or to locate lessons for review.',
      get_metadata:
        'Get lesson modules, tracks, and quality guidelines. ALWAYS call this first before save_item or validate_item — the response contains required IDs, configurable limits, and detailed instructions for writing high-quality lessons.',
      validate_item:
        'Review a lesson (e.g., Clear, Confusing, Needs Examples). Review feedback helps improve lesson quality over time. Call get_metadata first for valid action IDs.',
      update_item:
        'Update an existing lesson. Use to improve explanations, add exercises, or reclassify under a different module.',
      create_workspace:
        'Create a new track for organizing lessons by subject area. Call get_metadata first to see existing tracks.',
      create_type:
        'Create a new lesson module with review actions. Call get_metadata first to see existing modules and avoid duplicates.',
      vouch_item:
        'Change a lesson\'s visibility: "vouched" releases it with a URL slug, "unlisted" creates a share link, "private" hides it. Use to release lessons to learners.',
      batch_vouch_items:
        'Change visibility for multiple lessons at once (max 50). Each lesson can have its own visibility and optional slug. Use to release a batch of lessons.',
    },
    responseLabels: {
      saved: 'Lesson saved!',
      updated: 'Lesson updated!',
      validated: 'Lesson reviewed!',
      notFound: 'Lesson not found.',
      found: 'Found {total} lessons (showing {count})',
      visibilityUpdated: 'Lesson visibility updated!',
      batchComplete: 'Batch release complete:',
      workspaceCreated: 'Track created!',
      typeCreated: 'Module created!',
    },
    schemaDescriptions: {
      'save_item.keySummary':
        'Numbered lesson title with learning outcome. Example: "4. Authentication — Implementing JWT login with refresh tokens"',
      'save_item.content':
        'Lesson body in markdown. Include learning objectives, step-by-step instruction, code examples, and exercises. Check get_metadata for current limits.',
      'save_item.typeId':
        'Lesson module ID (from get_metadata). Choose the difficulty level: Fundamentals, Intermediate, Advanced, Workshop, or Assessment.',
      'save_item.workspaceId':
        'Optional track ID for organizing lessons by subject area (from get_metadata). Examples: "Web Development", "Data Science".',
      'save_item.tags':
        'Optional tags. Use lowercase keywords (e.g. ["react", "hooks", "state-management"]).',
      'create_workspace.name':
        'Track name (e.g., "Backend Engineering", "Machine Learning", "System Design").',
      'create_type.name':
        'Module name (e.g., "Deep Dive", "Mini Project", "Review Session").',
      'create_type.actions':
        'Review actions (e.g., "Clear", "Confusing", "Needs Examples"). At least 1 required.',
    },
  },
};

// =============================================================================
// 3. Runbook / SOP
// =============================================================================

export const runbookProfile: TemplateProfile = {
  id: 'runbook',
  displayName: 'Runbook / SOP',
  tagline: 'Step-by-step procedures organized by system',
  description:
    'An operational runbook layout for documenting standard operating procedures. ' +
    'System-based sidebar navigation, always-visible table of contents, ' +
    'and sequential step emphasis with prerequisites — built for on-call clarity.',
  domain: 'operations',
  contentType: 'articles',
  layout: 'directory',
  audience: ['SREs', 'DevOps engineers', 'system administrators', 'on-call responders'],
  useCases: [
    'Document incident response procedures for on-call teams',
    'Maintain standard operating procedures for system maintenance',
    'Build an operational knowledge base organized by service or system',
    'Create onboarding runbooks for new team members',
  ],
  differentiators: [
    'System/service sidebar',
    'Sequential step emphasis',
    'Prerequisites section',
    'Always-visible ToC',
  ],
  seedData: {
    types: [
      {
        name: 'Database',
        description: 'Database operations, migrations, and troubleshooting',
        icon: '🗄️',
        color: '#3B82F6',
        guidance: {
          pattern: '[Action verb] + [database/table/operation] + [condition or scope]',
          example: 'Restore PostgreSQL database from S3 backup after data corruption',
          whenToUse: 'Use for database-related procedures: backups, restores, migrations, performance',
          contentHints:
            'Start with prerequisites (access, tools, permissions). List exact commands with expected output. ' +
            'Include rollback steps. Add verification queries to confirm success.',
        },
        actions: ['Verified', 'Failed', 'Needs Update', 'Dangerous'],
      },
      {
        name: 'Networking',
        description: 'Network configuration, DNS, and connectivity',
        icon: '🌐',
        color: '#10B981',
        guidance: {
          pattern: '[Action verb] + [network component] + [scope or environment]',
          example: 'Update DNS records for domain migration to new load balancer',
          whenToUse: 'Use for network-related procedures: DNS changes, firewall rules, VPN, load balancers',
          contentHints:
            'Include current state and target state. List all affected services. ' +
            'Provide diagnostic commands for verification. Note propagation delays where applicable.',
        },
        actions: ['Verified', 'Incomplete', 'Outdated', 'Risky'],
      },
      {
        name: 'Deployment',
        description: 'Release, rollback, and deployment procedures',
        icon: '🚀',
        color: '#8B5CF6',
        guidance: {
          pattern: '[Deploy/Rollback/Release] + [service name] + [to environment]',
          example: 'Deploy API service v2.4.0 to production with zero-downtime',
          whenToUse: 'Use for deployment, release, and rollback procedures',
          contentHints:
            'Include pre-deployment checklist, deployment steps, smoke test commands, ' +
            'and rollback procedure. Specify the expected duration and any maintenance windows.',
        },
        actions: ['Tested', 'Failed', 'Needs Dry Run', 'Deprecated'],
      },
      {
        name: 'Monitoring',
        description: 'Alerting, observability, and health checks',
        icon: '📊',
        color: '#F59E0B',
        guidance: {
          pattern: '[Investigate/Resolve/Configure] + [alert or metric] + [context]',
          example: 'Investigate high CPU usage alert on worker nodes during peak traffic',
          whenToUse: 'Use for monitoring setup, alert response, and observability procedures',
          contentHints:
            'Include alert thresholds and escalation criteria. List diagnostic commands and dashboard links. ' +
            'Provide decision trees for common scenarios. Note SLA implications.',
        },
        actions: ['Effective', 'Noisy', 'Missing Alerts', 'Outdated'],
      },
      {
        name: 'Security',
        description: 'Access control, secrets rotation, and compliance',
        icon: '🔒',
        color: '#EF4444',
        guidance: {
          pattern: '[Action verb] + [security concern] + [scope or trigger]',
          example: 'Rotate API keys and secrets after suspected credential leak',
          whenToUse: 'Use for security-related procedures: key rotation, access audits, incident response',
          contentHints:
            'Mark sensitive steps clearly. Include who needs to be notified. ' +
            'List all affected services and downstream dependencies. Add a post-incident checklist.',
        },
        actions: ['Secure', 'Vulnerable', 'Needs Audit', 'Emergency'],
      },
    ],
    workspaces: [
      { name: 'Incident Response', description: 'Procedures for responding to active incidents', visibility: 'public' },
      { name: 'Maintenance', description: 'Routine maintenance and upkeep procedures', visibility: 'public' },
      { name: 'Onboarding', description: 'Setup and access provisioning for new team members', visibility: 'public' },
      { name: 'Disaster Recovery', description: 'Business continuity and disaster recovery plans', visibility: 'private' },
    ],
    settings: {
      sourceTitle: 'My Runbook',
      sourceDescription: 'Standard operating procedures and operational playbooks',
      qualityGuidelines: {
        keySummary: {
          tips:
            'Write an action-oriented title that a stressed on-call engineer can scan in seconds. ' +
            'Follow the system-specific pattern. Example: "Restart Kafka consumer group after lag spike"',
        },
        content: {
          tips:
            'Write for someone executing this at 3 AM during an incident. ' +
            'Every step must be copy-pasteable. Include expected output for verification. ' +
            'Start with prerequisites and end with a verification checklist.',
        },
        formatting: [
          'Numbered lists: every procedural step must be numbered sequentially',
          'Code blocks: exact commands with expected output, always include shell type',
          'Tables: environment variables, service endpoints, escalation contacts',
          'Headings: Prerequisites, Procedure, Verification, Rollback, Escalation',
          'Bold: critical warnings, irreversible steps, and timeout values',
          'Blockquotes: caution notes for steps that can cause downtime',
        ],
        avoid: [
          'Vague steps like "check the logs" without specifying which logs or commands',
          'Missing rollback procedures for destructive operations',
          'Outdated hostnames, endpoints, or commands',
          'Prose paragraphs where a numbered checklist would be clearer',
        ],
      },
      validationLimits: {
        keySummary: { min: 15, max: 200 },
        content: { min: 200, max: 20000 },
      },
    },
  },
};

export const runbookConfig: TemplateConfig = {
  profile: runbookProfile,
  vocabulary: {
    item: 'procedure',
    itemPlural: 'procedures',
    type: 'system',
    typePlural: 'systems',
    workspace: 'playbook',
    workspacePlural: 'playbooks',
    vouch: 'certify',
    vouched: 'certified',
  },
  seo: {
    siteSchemaType: 'WebSite',
    itemSchemaType: 'HowTo',
  },
  mcp: {
    instructions:
      'Pignal is a self-hosted runbook platform for documenting standard operating procedures — database operations, deployment steps, incident response, and security protocols. ' +
      'Each procedure has a system classification, title, step-by-step content in markdown, and optional tags.\n\n' +
      'Available tools:\n' +
      '- save_item: Document a new procedure\n' +
      '- list_items / search_items: Browse and search existing procedures\n' +
      '- update_item: Update an existing procedure\n' +
      '- validate_item: Certify a procedure as verified or flag it (verified, failed, outdated, etc.)\n' +
      '- vouch_item: Certify or decertify a procedure (certified/unlisted/private)\n' +
      '- batch_vouch_items: Certify or decertify multiple procedures at once\n' +
      '- get_metadata: Get available systems, playbooks, and quality guidelines\n' +
      '- create_workspace / create_type: Create new playbooks and system classifications\n\n' +
      'Always call get_metadata first to learn the available systems and quality guidelines before saving.',
    toolDescriptions: {
      save_item:
        'Document a new procedure. ALWAYS call get_metadata first — it provides required IDs, current limits, and quality guidelines for writing clear, actionable procedures.',
      list_items:
        'Browse procedures with optional filters by system or playbook. Use to review existing procedures or check for duplicates before documenting.',
      search_items:
        'Search procedures by keyword across titles and content. Use to find related procedures before documenting or to locate procedures for certification.',
      get_metadata:
        'Get system classifications, playbooks, and quality guidelines. ALWAYS call this first before save_item or validate_item — the response contains required IDs, configurable limits, and detailed instructions for writing effective procedures.',
      validate_item:
        'Certify a procedure or flag issues (e.g., Verified, Failed, Needs Update). Certification tracks whether procedures have been tested and are current. Call get_metadata first for valid action IDs.',
      update_item:
        'Update an existing procedure. Use to correct commands, update endpoints, or add missing rollback steps.',
      create_workspace:
        'Create a new playbook for organizing procedures by operational area. Call get_metadata first to see existing playbooks.',
      create_type:
        'Create a new system classification with certification actions. Call get_metadata first to see existing systems and avoid duplicates.',
      vouch_item:
        'Change a procedure\'s visibility: "vouched" certifies it with a URL slug, "unlisted" creates a share link, "private" hides it. Use to certify procedures for the team.',
      batch_vouch_items:
        'Change visibility for multiple procedures at once (max 50). Each procedure can have its own visibility and optional slug. Use to certify a batch of procedures.',
    },
    responseLabels: {
      saved: 'Procedure documented!',
      updated: 'Procedure updated!',
      validated: 'Procedure certified!',
      notFound: 'Procedure not found.',
      found: 'Found {total} procedures (showing {count})',
      visibilityUpdated: 'Procedure certification updated!',
      batchComplete: 'Batch certification complete:',
      workspaceCreated: 'Playbook created!',
      typeCreated: 'System created!',
    },
    schemaDescriptions: {
      'save_item.keySummary':
        'Action-oriented procedure title. Example: "Restore PostgreSQL database from S3 backup after data corruption"',
      'save_item.content':
        'Step-by-step procedure in markdown. Include Prerequisites, numbered Procedure steps, Verification commands, and Rollback plan. Check get_metadata for current limits.',
      'save_item.typeId':
        'System classification ID (from get_metadata). Choose the system this procedure covers: Database, Networking, Deployment, Monitoring, or Security.',
      'save_item.workspaceId':
        'Optional playbook ID for organizing procedures by operational area (from get_metadata). Examples: "Incident Response", "Maintenance", "Onboarding".',
      'save_item.tags':
        'Optional tags. Use lowercase keywords (e.g. ["postgresql", "backup", "disaster-recovery"]).',
      'create_workspace.name':
        'Playbook name (e.g., "Scaling Operations", "Compliance Audits", "Migration Procedures").',
      'create_type.name':
        'System classification name (e.g., "Load Balancer", "Message Queue", "CDN").',
      'create_type.actions':
        'Certification actions (e.g., "Verified", "Failed", "Needs Update"). At least 1 required.',
    },
  },
};

// =============================================================================
// 4. Service Directory
// =============================================================================

export const servicesProfile: TemplateProfile = {
  id: 'services',
  displayName: 'Service Directory',
  tagline: 'Service tiers with availability status and deliverables',
  description:
    'A directory layout for listing professional services with tier-based organization. ' +
    'Text-focused cards with availability badges, deliverables lists, ' +
    'and package-based grouping — designed for consultants and agencies.',
  domain: 'commerce',
  contentType: 'listings',
  layout: 'directory',
  audience: ['freelance consultants', 'agencies', 'SaaS providers', 'professional service firms'],
  useCases: [
    'List consulting services with scope and availability',
    'Present service tiers with deliverables and pricing',
    'Showcase agency capabilities organized by service package',
    'Maintain a service catalog with availability status',
  ],
  differentiators: [
    'Tier/package display',
    'Availability status badges',
    'Deliverables list',
    'Text-focused, no images',
  ],
  seedData: {
    types: [
      {
        name: 'Starter',
        description: 'Entry-level services for new clients',
        icon: '🌱',
        color: '#10B981',
        guidance: {
          pattern: '[Service name] — [Scope and key deliverable]',
          example: 'Website Audit — 5-page SEO analysis with actionable recommendations',
          whenToUse: 'Use for introductory or low-commitment service offerings',
          contentHints:
            'Lead with what the client gets. List deliverables as bullet points. ' +
            'Specify timeline, number of revisions, and any prerequisites. Keep the scope well-defined.',
        },
        actions: ['Accepting Clients', 'Fully Booked', 'Paused'],
      },
      {
        name: 'Professional',
        description: 'Standard service offerings for established clients',
        icon: '⭐',
        color: '#3B82F6',
        guidance: {
          pattern: '[Service name] — [Comprehensive scope]',
          example: 'Full-Stack Development — MVP build with API, frontend, and deployment',
          whenToUse: 'Use for standard service offerings that represent your core business',
          contentHints:
            'Detail the full scope, process phases, and deliverables. Include timeline estimates ' +
            'and what is included versus out-of-scope. Add a "What to Expect" section.',
        },
        actions: ['Accepting Clients', 'Waitlist', 'Fully Booked', 'Retired'],
      },
      {
        name: 'Enterprise',
        description: 'High-touch services for large or complex engagements',
        icon: '🏢',
        color: '#8B5CF6',
        guidance: {
          pattern: '[Service name] — [Enterprise scope and commitment level]',
          example: 'Platform Architecture — Multi-team system design with ongoing advisory',
          whenToUse: 'Use for premium, high-touch engagements requiring significant commitment',
          contentHints:
            'Emphasize the strategic value and long-term relationship. Describe the engagement model, ' +
            'team involvement, and escalation path. Include SLA commitments where applicable.',
        },
        actions: ['Available', 'Limited Availability', 'By Referral Only', 'Not Available'],
      },
      {
        name: 'Custom',
        description: 'Tailored engagements with negotiated scope',
        icon: '🎯',
        color: '#F59E0B',
        guidance: {
          pattern: '[Service area] — Custom [engagement type]',
          example: 'Data Engineering — Custom pipeline design and implementation',
          whenToUse: 'Use for bespoke services where scope is negotiated per client',
          contentHints:
            'Describe the general capability area and example engagements. ' +
            'List typical deliverables without committing to fixed scope. Include a "Start a Conversation" call to action.',
        },
        actions: ['Open to Inquiries', 'Currently Unavailable', 'Booked Q1'],
      },
    ],
    workspaces: [
      { name: 'Core Services', description: 'Primary service offerings', visibility: 'public' },
      { name: 'Add-Ons', description: 'Supplementary services and extensions', visibility: 'public' },
      { name: 'Consulting', description: 'Advisory and strategy engagements', visibility: 'public' },
      { name: 'Support Plans', description: 'Ongoing maintenance and support', visibility: 'public' },
    ],
    settings: {
      sourceTitle: 'My Services',
      sourceDescription: 'Professional services and consulting offerings',
      qualityGuidelines: {
        keySummary: {
          tips:
            'Use a clear service name with scope indicator. ' +
            'Follow the tier-specific pattern. Example: "Code Review — In-depth security and performance audit"',
        },
        content: {
          tips:
            'Write for a prospective client evaluating your services. Lead with the outcome they get, ' +
            'then explain the process and deliverables. Be specific about what is included.',
        },
        formatting: [
          'Bullet lists: deliverables, what is included, prerequisites',
          'Headings: Overview, Deliverables, Process, Timeline, Pricing',
          'Bold: key terms, deliverable names, and availability status',
          'Tables: tier comparisons, feature matrices, pricing breakdowns',
          'Numbered lists: engagement phases or process steps',
        ],
        avoid: [
          'Vague service descriptions without concrete deliverables',
          'Missing timeline or availability information',
          'Jargon that clients outside your field would not understand',
        ],
      },
      validationLimits: {
        keySummary: { min: 10, max: 200 },
        content: { min: 50, max: 15000 },
      },
    },
  },
};

export const servicesConfig: TemplateConfig = {
  profile: servicesProfile,
  vocabulary: {
    item: 'service',
    itemPlural: 'services',
    type: 'tier',
    typePlural: 'tiers',
    workspace: 'package',
    workspacePlural: 'packages',
    vouch: 'activate',
    vouched: 'activated',
  },
  seo: {
    siteSchemaType: 'WebSite',
    itemSchemaType: 'Service',
  },
  mcp: {
    instructions:
      'Pignal is a self-hosted service directory platform for listing professional services — consulting engagements, support plans, and custom offerings organized by tier and package. ' +
      'Each service has a tier classification, title, description in markdown, and optional tags.\n\n' +
      'Available tools:\n' +
      '- save_item: Create a new service listing\n' +
      '- list_items / search_items: Browse and search existing services\n' +
      '- update_item: Update an existing service listing\n' +
      '- validate_item: Mark a service status (accepting clients, fully booked, etc.)\n' +
      '- vouch_item: Activate or deactivate a service (activated/unlisted/private)\n' +
      '- batch_vouch_items: Activate or deactivate multiple services at once\n' +
      '- get_metadata: Get available tiers, packages, and content guidelines\n' +
      '- create_workspace / create_type: Create new packages and service tiers\n\n' +
      'Always call get_metadata first to learn the available tiers and content guidelines before saving.',
    toolDescriptions: {
      save_item:
        'Create a new service listing. ALWAYS call get_metadata first — it provides required IDs, current limits, and content guidelines for writing clear service descriptions.',
      list_items:
        'Browse services with optional filters by tier or package. Use to review the service directory or check for duplicates before creating.',
      search_items:
        'Search services by keyword across titles and descriptions. Use to find related services before creating or to locate services for status updates.',
      get_metadata:
        'Get service tiers, packages, and content guidelines. ALWAYS call this first before save_item or validate_item — the response contains required IDs, configurable limits, and detailed instructions for writing effective service listings.',
      validate_item:
        'Update a service status (e.g., Accepting Clients, Fully Booked, Paused). Status tracking keeps the directory current. Call get_metadata first for valid action IDs.',
      update_item:
        'Update an existing service listing. Use to revise scope, update deliverables, or change pricing details.',
      create_workspace:
        'Create a new package for grouping related services. Call get_metadata first to see existing packages.',
      create_type:
        'Create a new service tier with status actions. Call get_metadata first to see existing tiers and avoid duplicates.',
      vouch_item:
        'Change a service\'s visibility: "vouched" activates it with a URL slug, "unlisted" creates a share link, "private" hides it. Use to activate services in the directory.',
      batch_vouch_items:
        'Change visibility for multiple services at once (max 50). Each service can have its own visibility and optional slug. Use to activate a batch of services.',
    },
    responseLabels: {
      saved: 'Service created!',
      updated: 'Service updated!',
      validated: 'Service status updated!',
      notFound: 'Service not found.',
      found: 'Found {total} services (showing {count})',
      visibilityUpdated: 'Service activation updated!',
      batchComplete: 'Batch activation complete:',
      workspaceCreated: 'Package created!',
      typeCreated: 'Tier created!',
    },
    schemaDescriptions: {
      'save_item.keySummary':
        'Service name with scope indicator. Example: "Code Review — In-depth security and performance audit for Node.js applications"',
      'save_item.content':
        'Service description in markdown. Include Overview, Deliverables, Process, and Timeline sections. Check get_metadata for current limits.',
      'save_item.typeId':
        'Service tier ID (from get_metadata). Choose the engagement level: Starter, Professional, Enterprise, or Custom.',
      'save_item.workspaceId':
        'Optional package ID for grouping services (from get_metadata). Examples: "Core Services", "Add-Ons", "Consulting".',
      'save_item.tags':
        'Optional tags. Use lowercase keywords (e.g. ["consulting", "architecture", "nodejs"]).',
      'create_workspace.name':
        'Package name (e.g., "Growth Services", "Technical Audits", "Retainer Plans").',
      'create_type.name':
        'Service tier name (e.g., "One-Time", "Retainer", "Advisory").',
      'create_type.actions':
        'Status actions (e.g., "Accepting Clients", "Fully Booked", "Paused"). At least 1 required.',
    },
  },
};

// =============================================================================
// 5. Resource Directory
// =============================================================================

export const directoryProfile: TemplateProfile = {
  id: 'directory',
  displayName: 'Resource Directory',
  tagline: 'Curated list of external resources with status badges',
  description:
    'A directory layout for curating external resources with link cards, status badges, and categorical grouping. ' +
    'Designed for short descriptions with external links — not long-form content. ' +
    'Alphabetical or categorical navigation with Active/Archived/New indicators.',
  domain: 'community',
  contentType: 'profiles',
  layout: 'directory',
  audience: ['community maintainers', 'developer advocates', 'educators', 'curators'],
  useCases: [
    'Curate a directory of tools and frameworks for a developer community',
    'Maintain a resource list with status indicators and descriptions',
    'Build a categorized link collection with editorial commentary',
    'Publish a curated guide to external resources in a domain',
  ],
  differentiators: [
    'External link cards with domain/favicon',
    'Status badges (Active/Archived/New)',
    'Alphabetical or categorical grouping',
    'No long content — link + short description',
  ],
  seedData: {
    types: [
      {
        name: 'Framework',
        description: 'Libraries, frameworks, and development tools',
        icon: '🔨',
        color: '#3B82F6',
        guidance: {
          pattern: '[Name] — [What it does in one phrase]',
          example: 'Hono — Ultrafast web framework for Cloudflare Workers and Deno',
          whenToUse: 'Use for development frameworks, libraries, SDKs, and programming tools',
          contentHints:
            'Include the official URL, a 2-3 sentence description of what it does and why it stands out, ' +
            'key features as bullet points, and the license type. Keep it concise — this is a directory entry, not a review.',
        },
        actions: ['Active', 'Archived', 'New', 'Deprecated'],
      },
      {
        name: 'Service',
        description: 'Hosted platforms, APIs, and cloud services',
        icon: '☁️',
        color: '#8B5CF6',
        guidance: {
          pattern: '[Name] — [Service type and key differentiator]',
          example: 'Cloudflare Workers — Edge compute platform with zero cold starts',
          whenToUse: 'Use for hosted services, APIs, SaaS platforms, and cloud providers',
          contentHints:
            'Include the URL, a brief description, pricing model (free tier, paid, open-source), ' +
            'and notable limitations. Mention alternatives where helpful.',
        },
        actions: ['Active', 'Shutting Down', 'New', 'Acquired'],
      },
      {
        name: 'Learning Resource',
        description: 'Tutorials, courses, books, and documentation',
        icon: '📚',
        color: '#10B981',
        guidance: {
          pattern: '[Name] — [Format] for [audience or topic]',
          example: 'The Rust Book — Official guide for learning Rust from scratch',
          whenToUse: 'Use for educational content: tutorials, books, video courses, documentation sites',
          contentHints:
            'Include the URL, format (book, video, interactive), target audience (beginner/advanced), ' +
            'and what makes this resource stand out. Note if it is free or paid.',
        },
        actions: ['Recommended', 'Outdated', 'New', 'Superseded'],
      },
      {
        name: 'Community',
        description: 'Forums, Discord servers, meetups, and organizations',
        icon: '👥',
        color: '#F59E0B',
        guidance: {
          pattern: '[Name] — [Community type] for [focus area]',
          example: 'Reactiflux — Discord community for React developers',
          whenToUse: 'Use for communities, forums, chat groups, meetups, and organizations',
          contentHints:
            'Include the join URL, approximate size or activity level, ' +
            'what topics are covered, and any membership requirements. Note the primary platform (Discord, Slack, etc.).',
        },
        actions: ['Active', 'Inactive', 'New', 'Merged'],
      },
      {
        name: 'Dataset',
        description: 'Open datasets, benchmarks, and research data',
        icon: '📊',
        color: '#EC4899',
        guidance: {
          pattern: '[Name] — [Data type and domain]',
          example: 'Common Crawl — Petabyte-scale web archive for NLP research',
          whenToUse: 'Use for open datasets, benchmarks, research corpora, and data repositories',
          contentHints:
            'Include the URL, data format, size, update frequency, and license. ' +
            'Note any access requirements or usage restrictions. Mention known use cases.',
        },
        actions: ['Active', 'Stale', 'New', 'Deprecated'],
      },
    ],
    workspaces: [
      { name: 'Essential Tools', description: 'Must-know tools and resources', visibility: 'public' },
      { name: 'Rising Stars', description: 'Emerging and noteworthy newcomers', visibility: 'public' },
      { name: 'Historical', description: 'Important but no longer actively maintained', visibility: 'public' },
      { name: 'Specialized', description: 'Niche tools for specific use cases', visibility: 'public' },
    ],
    settings: {
      sourceTitle: 'My Resource Directory',
      sourceDescription: 'A curated collection of tools, services, and resources',
      qualityGuidelines: {
        keySummary: {
          tips:
            'Use the resource name followed by a concise description of what it does. ' +
            'Follow the category-specific pattern. Example: "Vite — Next-generation frontend build tool"',
        },
        content: {
          tips:
            'Keep it short — this is a directory, not a review. Include the URL, a 2-3 sentence description, ' +
            'key highlights as bullet points, and any important caveats. Focus on why this resource matters.',
        },
        formatting: [
          'Bullet lists: key features, highlights, alternatives',
          'Bold: resource name, pricing model, license type',
          'Links: official URL, documentation, GitHub repository',
          'Tables: comparison with alternatives (only when adding multiple related entries)',
        ],
        avoid: [
          'Long reviews — keep entries concise and scannable',
          'Missing URLs — every entry must link to the resource',
          'Stale entries without status updates',
        ],
      },
      validationLimits: {
        keySummary: { min: 10, max: 200 },
        content: { min: 1, max: 3000 },
      },
    },
  },
};

export const directoryConfig: TemplateConfig = {
  profile: directoryProfile,
  vocabulary: {
    item: 'resource',
    itemPlural: 'resources',
    type: 'category',
    typePlural: 'categories',
    workspace: 'collection',
    workspacePlural: 'collections',
    vouch: 'feature',
    vouched: 'featured',
  },
  seo: {
    siteSchemaType: 'WebSite',
    itemSchemaType: 'WebPage',
  },
  mcp: {
    instructions:
      'Pignal is a self-hosted resource directory platform for curating external tools, services, and learning materials — each with a link, short description, and status badge. ' +
      'Each resource has a category, title, brief description in markdown, and optional tags.\n\n' +
      'Available tools:\n' +
      '- save_item: Add a new resource to the directory\n' +
      '- list_items / search_items: Browse and search existing resources\n' +
      '- update_item: Update an existing resource entry\n' +
      '- validate_item: Update a resource status (active, archived, new, deprecated)\n' +
      '- vouch_item: Feature or unfeature a resource (featured/unlisted/private)\n' +
      '- batch_vouch_items: Feature or unfeature multiple resources at once\n' +
      '- get_metadata: Get available categories, collections, and content guidelines\n' +
      '- create_workspace / create_type: Create new collections and categories\n\n' +
      'Always call get_metadata first to learn the available categories and content guidelines before saving.',
    toolDescriptions: {
      save_item:
        'Add a new resource to the directory. ALWAYS call get_metadata first — it provides required IDs, current limits, and content guidelines for writing concise resource entries.',
      list_items:
        'Browse resources with optional filters by category or collection. Use to review the directory or check for duplicates before adding.',
      search_items:
        'Search resources by keyword across titles and descriptions. Use to find related resources before adding or to locate resources for status updates.',
      get_metadata:
        'Get resource categories, collections, and content guidelines. ALWAYS call this first before save_item or validate_item — the response contains required IDs, configurable limits, and detailed instructions for writing effective directory entries.',
      validate_item:
        'Update a resource status (e.g., Active, Archived, Deprecated). Status tracking keeps the directory current and trustworthy. Call get_metadata first for valid action IDs.',
      update_item:
        'Update an existing resource entry. Use to correct links, update descriptions, or recategorize.',
      create_workspace:
        'Create a new collection for grouping related resources. Call get_metadata first to see existing collections.',
      create_type:
        'Create a new resource category with status actions. Call get_metadata first to see existing categories and avoid duplicates.',
      vouch_item:
        'Change a resource\'s visibility: "vouched" features it with a URL slug, "unlisted" creates a share link, "private" hides it. Use to feature resources in the directory.',
      batch_vouch_items:
        'Change visibility for multiple resources at once (max 50). Each resource can have its own visibility and optional slug. Use to feature a batch of resources.',
    },
    responseLabels: {
      saved: 'Resource added!',
      updated: 'Resource updated!',
      validated: 'Resource status updated!',
      notFound: 'Resource not found.',
      found: 'Found {total} resources (showing {count})',
      visibilityUpdated: 'Resource featuring updated!',
      batchComplete: 'Batch featuring complete:',
      workspaceCreated: 'Collection created!',
      typeCreated: 'Category created!',
    },
    schemaDescriptions: {
      'save_item.keySummary':
        'Resource name with concise description. Example: "Drizzle ORM — TypeScript ORM for SQL databases with zero dependencies"',
      'save_item.content':
        'Short resource description in markdown. Include the URL, 2-3 sentence summary, key highlights as bullets, and any caveats. Check get_metadata for current limits.',
      'save_item.typeId':
        'Resource category ID (from get_metadata). Choose the category that best fits: Framework, Service, Learning Resource, Community, or Dataset.',
      'save_item.workspaceId':
        'Optional collection ID for grouping resources (from get_metadata). Examples: "Essential Tools", "Rising Stars", "Specialized".',
      'save_item.tags':
        'Optional tags. Use lowercase keywords (e.g. ["typescript", "orm", "database"]).',
      'create_workspace.name':
        'Collection name (e.g., "AI/ML Tools", "Frontend Ecosystem", "DevOps Essentials").',
      'create_type.name':
        'Resource category name (e.g., "CLI Tool", "Browser Extension", "Newsletter").',
      'create_type.actions':
        'Status actions (e.g., "Active", "Archived", "Deprecated"). At least 1 required.',
    },
  },
};
