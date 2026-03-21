import type { TemplateProfile, TemplateConfig } from './config';

// =============================================================================
// 1. CHANGELOG — Timeline Group
// =============================================================================

export const changelogProfile: TemplateProfile = {
  id: 'changelog',
  displayName: 'Changelog',
  tagline: 'Version-grouped timeline with semver markers and type badges',
  description:
    'A release-oriented timeline for communicating what shipped and when. ' +
    'Releases are grouped by version or date, with breaking/feature/fix badges and horizontal bar cards. ' +
    'Ideal for keeping users and stakeholders informed about changes.',
  domain: 'operations',
  contentType: 'records',
  layout: 'timeline',
  audience: ['product managers', 'developer relations', 'open-source maintainers', 'release managers'],
  useCases: [
    'Communicate shipped features and fixes to users',
    'Maintain a public record of breaking changes by version',
    'Track release cadence across multiple products',
  ],
  differentiators: [
    'Version/date markers on timeline rail',
    'Breaking/feature/fix badges with distinct colors',
    'Horizontal bar cards (not square grid)',
    'Grouped by release version, not chronological feed',
  ],
  seedData: {
    types: [
      {
        name: 'Feature',
        description: 'New capability or enhancement',
        icon: '✨',
        color: '#10B981',
        guidance: {
          pattern: '[Added/Introduced] + [capability] + [for whom or why]',
          example: 'Added dark mode toggle to the settings page for improved accessibility',
          whenToUse: 'Use when shipping a new capability, UI addition, or user-facing enhancement',
          contentHints: 'Describe what changed, how users access it, and any migration steps. Screenshots or before/after comparisons work well.',
        },
        actions: ['Shipped', 'Reverted', 'Partial'],
      },
      {
        name: 'Bug Fix',
        description: 'Correction of incorrect behavior',
        icon: '🐛',
        color: '#F59E0B',
        guidance: {
          pattern: '[Fixed] + [what was broken] + [root cause]',
          example: 'Fixed login timeout on slow connections caused by missing retry logic',
          whenToUse: 'Use when correcting a defect, regression, or incorrect behavior',
          contentHints: 'Describe the symptom, root cause, and what was changed. Reference issue numbers if applicable.',
        },
        actions: ['Verified', 'Regressed', 'Workaround'],
      },
      {
        name: 'Breaking Change',
        description: 'Incompatible change requiring user action',
        icon: '💥',
        color: '#EF4444',
        guidance: {
          pattern: '[Breaking] + [what changed] + [migration path]',
          example: 'Breaking: Renamed /api/v1/users to /api/v2/accounts — update all client references',
          whenToUse: 'Use when a change requires users to update their code, config, or workflow',
          contentHints: 'Clearly state what breaks, who is affected, the migration path, and a deadline if applicable. Use a diff block for code changes.',
        },
        actions: ['Migrated', 'Blocked', 'Deferred'],
      },
      {
        name: 'Improvement',
        description: 'Enhancement to existing functionality',
        icon: '📈',
        color: '#3B82F6',
        guidance: {
          pattern: '[Improved/Optimized] + [what] + [measurable outcome]',
          example: 'Improved dashboard load time by 40% through query batching',
          whenToUse: 'Use for performance gains, UX polish, or quality-of-life refinements to existing features',
          contentHints: 'Include before/after metrics where possible. Describe the approach and any tradeoffs.',
        },
        actions: ['Confirmed', 'Negligible', 'Mixed'],
      },
      {
        name: 'Deprecation',
        description: 'Feature scheduled for removal',
        icon: '⚠️',
        color: '#8B5CF6',
        guidance: {
          pattern: '[Deprecated] + [what] + [replacement and timeline]',
          example: 'Deprecated legacy webhook format — switch to v2 events by March 2026',
          whenToUse: 'Use when a feature or API is being phased out with a defined timeline',
          contentHints: 'State what is deprecated, the replacement, the removal date, and migration steps. Link to migration docs.',
        },
        actions: ['Acknowledged', 'Blocked', 'Extended'],
      },
    ],
    workspaces: [
      { name: 'Core Platform', description: 'Core application and infrastructure', visibility: 'public' },
      { name: 'API', description: 'Public API and integrations', visibility: 'public' },
      { name: 'Dashboard', description: 'Web dashboard and admin UI', visibility: 'public' },
      { name: 'Mobile App', description: 'iOS and Android applications', visibility: 'public' },
    ],
    settings: {
      sourceTitle: 'My Changelog',
      sourceDescription: 'Release notes and change history',
      qualityGuidelines: {
        keySummary: { tips: 'Lead with the action verb (Added, Fixed, Breaking, Improved, Deprecated). Be specific about what changed.' },
        content: { tips: 'Write for users who need to know if this change affects them. Include migration steps for breaking changes.' },
        formatting: [
          'Bullet lists: group related sub-changes within a release',
          'Code blocks: API changes, config diffs, migration commands',
          'Tables: before/after comparisons for breaking changes',
          'Bold: highlight the action verb and affected component',
          'Headings: separate Description, Migration, and Impact sections',
        ],
        avoid: [
          'Internal jargon that users cannot act on',
          'Vague descriptions like "various improvements"',
          'Missing migration steps for breaking changes',
        ],
      },
      validationLimits: {
        keySummary: { min: 10, max: 200 },
        content: { min: 50, max: 10000 },
      },
    },
  },
};

export const changelogConfig: TemplateConfig = {
  profile: changelogProfile,
  vocabulary: {
    item: 'release',
    itemPlural: 'releases',
    type: 'change type',
    typePlural: 'change types',
    workspace: 'product',
    workspacePlural: 'products',
    vouch: 'ship',
    vouched: 'shipped',
  },
  seo: {
    siteSchemaType: 'WebSite',
    itemSchemaType: 'TechArticle',
  },
  mcp: {
    instructions:
      'Pignal is a self-hosted changelog platform for publishing release notes — shipped features, fixes, breaking changes, and deprecations. ' +
      'Each release has a change type, key summary, content in markdown, and optional tags.\n\n' +
      'Available tools:\n' +
      '- save_item: Record a new release entry\n' +
      '- list_items / search_items: Browse and search the changelog\n' +
      '- update_item: Edit an existing release entry\n' +
      '- validate_item: Mark a release as verified or regressed\n' +
      '- vouch_item: Ship a release to the public changelog (shipped/unlisted/private)\n' +
      '- batch_vouch_items: Ship multiple releases at once\n' +
      '- get_metadata: Get available change types, products, and quality guidelines\n' +
      '- create_workspace / create_type: Create new products and change types\n\n' +
      'Always call get_metadata first to learn the available change types and quality guidelines before saving.',
    toolDescriptions: {
      save_item:
        'Record a new release entry in the changelog. ALWAYS call get_metadata first — it provides required IDs, current limits, and quality guidelines for writing effective release notes.',
      list_items:
        'Browse changelog releases with optional filters by change type or product. Use to review the release history or check for duplicates.',
      search_items:
        'Search releases by keyword across summaries and content. Use to find related changes or locate releases for validation.',
      get_metadata:
        'Get change types, products, and quality guidelines. ALWAYS call this first before save_item or validate_item — the response contains required IDs, configurable limits, and detailed instructions.',
      validate_item:
        'Apply a validation action to a release (e.g., Verified, Regressed, Migrated). Call get_metadata first for valid action IDs.',
      update_item:
        'Update an existing release entry. Use to correct details, add migration steps, or reclassify a change type.',
      create_workspace:
        'Create a new product for organizing releases. Call get_metadata first to see existing products.',
      create_type:
        'Create a new change type with validation actions. Call get_metadata first to see existing types and avoid duplicates.',
      vouch_item:
        'Change a release\'s visibility: "vouched" ships it to the public changelog, "unlisted" creates a share link, "private" hides it.',
      batch_vouch_items:
        'Ship multiple releases at once (max 50). Each release can have its own visibility and optional slug. Use to publish a batch of release notes.',
    },
    responseLabels: {
      saved: 'Release recorded!',
      updated: 'Release updated!',
      validated: 'Release validated!',
      notFound: 'Release not found.',
      found: 'Found {total} releases (showing {count})',
      visibilityUpdated: 'Release shipped!',
      batchComplete: 'Batch ship complete:',
      workspaceCreated: 'Product created!',
      typeCreated: 'Change type created!',
    },
    schemaDescriptions: {
      'save_item.keySummary':
        'Release summary starting with an action verb. Example: "Added dark mode toggle to settings" or "Fixed timeout on slow connections"',
      'save_item.content':
        'Full release note in markdown. Include what changed, why, who is affected, and migration steps for breaking changes.',
      'save_item.typeId':
        'Change type ID (from get_metadata). Choose Feature, Bug Fix, Breaking Change, Improvement, or Deprecation.',
      'save_item.workspaceId':
        'Optional product ID to scope this release (from get_metadata). Example: Core Platform, API, Dashboard.',
      'save_item.tags':
        'Optional tags. Use lowercase keywords (e.g. ["v2.1", "api", "security", "performance"]).',
      'create_workspace.name':
        'Product name (e.g., "Core Platform", "Mobile App", "Developer Tools").',
      'create_type.name':
        'Change type name (e.g., "Feature", "Bug Fix", "Security Patch").',
      'create_type.actions':
        'Validation actions (e.g., "Shipped", "Reverted", "Migrated"). At least 1 required.',
    },
  },
};

// =============================================================================
// 2. INCIDENTS — Timeline Group
// =============================================================================

export const incidentsProfile: TemplateProfile = {
  id: 'incidents',
  displayName: 'Incident Log',
  tagline: 'Reverse-chronological timeline with severity coloring and status badges',
  description:
    'A severity-based incident timeline for recording outages, degradations, and near-misses. ' +
    'Incidents are organized by service with P0-P3 severity coloring on the timeline rail. ' +
    'Built for teams that need a permanent, searchable record of what went wrong and how it was resolved.',
  domain: 'operations',
  contentType: 'records',
  layout: 'timeline',
  audience: ['SREs', 'incident commanders', 'engineering managers', 'status page administrators'],
  useCases: [
    'Record and track production incidents with severity and impact',
    'Maintain a searchable incident history by service',
    'Publish post-incident reviews with root cause and remediation',
    'Communicate real-time status updates during active incidents',
  ],
  differentiators: [
    'Severity-colored rail (P0 red through P3 gray)',
    'Duration and impact metadata on cards',
    'Status badges (Resolved/Investigating/Monitoring)',
    'Per-day timeline markers for incident clustering',
  ],
  seedData: {
    types: [
      {
        name: 'P0 — Critical',
        description: 'Total outage or data loss affecting all users',
        icon: '🔴',
        color: '#DC2626',
        guidance: {
          pattern: '[Service] + [impact] + [duration or status]',
          example: 'API Gateway — complete outage, all requests returning 503 for 45 minutes',
          whenToUse: 'Use for total service outages, data loss, or security breaches affecting all users',
          contentHints: 'Include timeline (detected, escalated, resolved), impact scope, root cause, and remediation. Use headings for each phase.',
        },
        actions: ['Resolved', 'Escalated', 'False Alarm'],
      },
      {
        name: 'P1 — Major',
        description: 'Significant degradation affecting many users',
        icon: '🟠',
        color: '#EA580C',
        guidance: {
          pattern: '[Service] + [degradation type] + [user impact]',
          example: 'Authentication — elevated error rate (30%), users unable to log in intermittently',
          whenToUse: 'Use for significant degradation, partial outages, or issues affecting a large user segment',
          contentHints: 'Describe the scope of impact, affected user percentage, workaround if any, and resolution steps.',
        },
        actions: ['Resolved', 'Downgraded', 'Escalated'],
      },
      {
        name: 'P2 — Minor',
        description: 'Limited impact affecting some users or features',
        icon: '🟡',
        color: '#CA8A04',
        guidance: {
          pattern: '[Service/Feature] + [issue] + [limited impact]',
          example: 'Dashboard — chart rendering broken on Safari, workaround available via Chrome',
          whenToUse: 'Use for issues with limited blast radius, single-feature failures, or degraded non-critical paths',
          contentHints: 'Note the affected feature, browser or platform specifics, workaround, and planned fix timeline.',
        },
        actions: ['Resolved', 'Accepted Risk', 'Upgraded'],
      },
      {
        name: 'P3 — Low',
        description: 'Minimal impact, cosmetic or edge-case issues',
        icon: '⚪',
        color: '#6B7280',
        guidance: {
          pattern: '[Component] + [minor issue] + [edge case or condition]',
          example: 'Email notifications — duplicate delivery for accounts with multiple aliases',
          whenToUse: 'Use for cosmetic bugs, edge cases, or near-misses worth recording for pattern detection',
          contentHints: 'Document the condition that triggers the issue, affected count, and whether a fix is planned or deferred.',
        },
        actions: ['Resolved', 'Deferred', 'Won\'t Fix'],
      },
    ],
    workspaces: [
      { name: 'API Gateway', description: 'API routing and rate limiting', visibility: 'public' },
      { name: 'Database', description: 'Primary and replica databases', visibility: 'public' },
      { name: 'Authentication', description: 'Login, SSO, and session management', visibility: 'public' },
      { name: 'CDN', description: 'Content delivery and edge caching', visibility: 'public' },
    ],
    settings: {
      sourceTitle: 'My Incident Log',
      sourceDescription: 'Production incident history and post-mortems',
      qualityGuidelines: {
        keySummary: { tips: 'Lead with the affected service, then the impact. Be specific about scope (all users, 10% of requests, single region).' },
        content: { tips: 'Structure as a timeline: detection, investigation, mitigation, resolution, root cause. Write for someone reviewing this incident months later.' },
        formatting: [
          'Headings: separate Timeline, Impact, Root Cause, Remediation, Lessons Learned',
          'Bullet lists: action items, affected services, contributing factors',
          'Bold: highlight timestamps, severity changes, and key decisions',
          'Code blocks: error messages, log snippets, commands run during mitigation',
          'Tables: impact metrics (requests affected, error rate, duration)',
        ],
        avoid: [
          'Blame-oriented language targeting individuals',
          'Vague impact descriptions like "some users affected"',
          'Missing timeline of key events',
          'Omitting remediation steps or follow-up actions',
        ],
      },
      validationLimits: {
        keySummary: { min: 15, max: 200 },
        content: { min: 100, max: 15000 },
      },
    },
  },
};

export const incidentsConfig: TemplateConfig = {
  profile: incidentsProfile,
  vocabulary: {
    item: 'incident',
    itemPlural: 'incidents',
    type: 'severity',
    typePlural: 'severities',
    workspace: 'service',
    workspacePlural: 'services',
    vouch: 'resolve',
    vouched: 'resolved',
  },
  seo: {
    siteSchemaType: 'WebSite',
    itemSchemaType: 'TechArticle',
  },
  mcp: {
    instructions:
      'Pignal is a self-hosted incident logging platform for recording outages, degradations, and post-incident reviews. ' +
      'Each incident has a severity level, key summary, detailed content in markdown, and optional tags.\n\n' +
      'Available tools:\n' +
      '- save_item: Record a new incident\n' +
      '- list_items / search_items: Browse and search incident history\n' +
      '- update_item: Update an incident with new findings or status changes\n' +
      '- validate_item: Apply a resolution action (Resolved, Escalated, etc.)\n' +
      '- vouch_item: Resolve an incident to the public log (resolved/unlisted/private)\n' +
      '- batch_vouch_items: Resolve multiple incidents at once\n' +
      '- get_metadata: Get available severities, services, and documentation guidelines\n' +
      '- create_workspace / create_type: Add new services and severity levels\n\n' +
      'Always call get_metadata first to learn the available severities and documentation guidelines before saving.',
    toolDescriptions: {
      save_item:
        'Record a new incident. ALWAYS call get_metadata first — it provides required IDs, current limits, and guidelines for writing effective incident reports.',
      list_items:
        'Browse incidents with optional filters by severity or service. Use to review incident history or identify patterns.',
      search_items:
        'Search incidents by keyword across summaries and content. Use to find similar past incidents or locate an incident for status updates.',
      get_metadata:
        'Get severity levels, services, and documentation guidelines. ALWAYS call this first before save_item or validate_item — the response contains required IDs and formatting instructions.',
      validate_item:
        'Apply a resolution action to an incident (e.g., Resolved, Escalated, Deferred). Call get_metadata first for valid action IDs.',
      update_item:
        'Update an existing incident with new timeline entries, root cause findings, or status changes.',
      create_workspace:
        'Create a new service for organizing incidents. Call get_metadata first to see existing services.',
      create_type:
        'Create a new severity level with resolution actions. Call get_metadata first to see existing severities and avoid duplicates.',
      vouch_item:
        'Change an incident\'s visibility: "vouched" resolves it to the public log, "unlisted" creates a share link, "private" keeps it internal.',
      batch_vouch_items:
        'Resolve multiple incidents at once (max 50). Each incident can have its own visibility and optional slug. Use to publish a batch of resolved incidents.',
    },
    responseLabels: {
      saved: 'Incident recorded!',
      updated: 'Incident updated!',
      validated: 'Incident validated!',
      notFound: 'Incident not found.',
      found: 'Found {total} incidents (showing {count})',
      visibilityUpdated: 'Incident resolved!',
      batchComplete: 'Batch resolve complete:',
      workspaceCreated: 'Service created!',
      typeCreated: 'Severity created!',
    },
    schemaDescriptions: {
      'save_item.keySummary':
        'Incident summary: service + impact + scope. Example: "API Gateway — complete outage, all requests returning 503 for 45 minutes"',
      'save_item.content':
        'Full incident report in markdown. Structure as Timeline, Impact, Root Cause, Remediation, Lessons Learned. Include timestamps and metrics.',
      'save_item.typeId':
        'Severity level ID (from get_metadata). Choose P0 (Critical), P1 (Major), P2 (Minor), or P3 (Low).',
      'save_item.workspaceId':
        'Optional service ID to scope this incident (from get_metadata). Example: API Gateway, Database, Authentication.',
      'save_item.tags':
        'Optional tags. Use lowercase keywords (e.g. ["outage", "database", "latency", "us-east-1"]).',
      'create_workspace.name':
        'Service name (e.g., "API Gateway", "Payment Processing", "Search Cluster").',
      'create_type.name':
        'Severity level name (e.g., "P0 — Critical", "P1 — Major").',
      'create_type.actions':
        'Resolution actions (e.g., "Resolved", "Escalated", "Deferred"). At least 1 required.',
    },
  },
};

// =============================================================================
// 3. MAGAZINE — Magazine Group
// =============================================================================

export const magazineProfile: TemplateProfile = {
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

// =============================================================================
// 4. CASE STUDIES — Magazine Group
// =============================================================================

export const caseStudiesProfile: TemplateProfile = {
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

// =============================================================================
// 5. MENU — Table Group
// =============================================================================

export const menuProfile: TemplateProfile = {
  id: 'menu',
  displayName: 'Menu / Price List',
  tagline: 'Table layout with section headers and itemized pricing',
  description:
    'A clean table layout for menus and price lists with section group headers, short descriptions, and a pricing column. ' +
    'No card grid — items are displayed as scannable rows organized by section. ' +
    'Built for restaurants, caterers, and service providers who need a clear, browsable price list.',
  domain: 'commerce',
  contentType: 'listings',
  layout: 'table',
  audience: ['restaurant owners', 'caterers', 'food truck operators', 'cafe managers'],
  useCases: [
    'Publish a restaurant menu with sections and pricing',
    'Maintain a catering price list with seasonal updates',
    'Display a service menu with tiered pricing',
  ],
  differentiators: [
    'Table layout with section group headers',
    'Short descriptions inline with item rows',
    'Pricing column aligned for easy scanning',
    'No card grid — clean tabular presentation',
  ],
  seedData: {
    types: [
      {
        name: 'Appetizers',
        description: 'Starters and small plates',
        icon: '🥗',
        color: '#10B981',
        guidance: {
          pattern: '[Dish name] — [key ingredients or style]',
          example: 'Crispy Calamari — lightly battered with lemon aioli and marinara',
          whenToUse: 'Use for starters, small plates, and shared appetizers',
          contentHints: 'List key ingredients, preparation style, and any dietary notes (GF, V, etc.). Keep descriptions concise — one to two sentences.',
        },
        actions: ['Available', 'Sold Out', '86\'d'],
      },
      {
        name: 'Mains',
        description: 'Entrees and main courses',
        icon: '🍽️',
        color: '#3B82F6',
        guidance: {
          pattern: '[Dish name] — [protein or base] + [preparation] + [accompaniments]',
          example: 'Pan-Seared Salmon — Atlantic salmon with dill cream sauce, roasted asparagus, and wild rice',
          whenToUse: 'Use for entrees, main courses, and full-plate dishes',
          contentHints: 'Describe the protein or base, cooking method, sauce, and sides. Note portion size if relevant. Include dietary labels.',
        },
        actions: ['Available', 'Sold Out', 'Seasonal'],
      },
      {
        name: 'Desserts',
        description: 'Sweet courses and pastries',
        icon: '🍰',
        color: '#EC4899',
        guidance: {
          pattern: '[Dessert name] — [flavor profile or key ingredient]',
          example: 'Dark Chocolate Lava Cake — molten center with vanilla bean ice cream and raspberry coulis',
          whenToUse: 'Use for desserts, pastries, and sweet courses',
          contentHints: 'Highlight the flavor profile, texture, and any notable preparation. Mention allergens (nuts, dairy, gluten).',
        },
        actions: ['Available', 'Sold Out', 'Seasonal'],
      },
      {
        name: 'Beverages',
        description: 'Drinks, cocktails, and refreshments',
        icon: '🥤',
        color: '#F59E0B',
        guidance: {
          pattern: '[Drink name] — [base spirit or ingredient] + [flavor notes]',
          example: 'Lavender Collins — gin, fresh lavender syrup, lemon, and sparkling water',
          whenToUse: 'Use for cocktails, non-alcoholic drinks, coffee, tea, and other beverages',
          contentHints: 'List the base ingredients and flavor profile. Note if non-alcoholic, caffeine-free, or seasonal. Include size options if applicable.',
        },
        actions: ['Available', 'Sold Out', 'Limited'],
      },
    ],
    workspaces: [
      { name: 'Dinner Menu', description: 'Full dinner service offerings', visibility: 'public' },
      { name: 'Lunch Special', description: 'Weekday lunch specials and prix fixe', visibility: 'public' },
      { name: 'Catering', description: 'Catering packages and platters', visibility: 'public' },
      { name: 'Kids Menu', description: 'Family-friendly options', visibility: 'public' },
    ],
    settings: {
      sourceTitle: 'My Menu',
      sourceDescription: 'Browse our full menu and pricing',
      qualityGuidelines: {
        keySummary: { tips: 'Use the dish or drink name followed by a dash and key ingredients or style. Keep it scannable — this appears in the table row.' },
        content: { tips: 'Write a short, appetizing description. Focus on ingredients, preparation, and dietary information. Keep it under a few sentences.' },
        formatting: [
          'Bold: dish name and price-relevant details',
          'Bullet lists: ingredients, dietary labels (GF, V, VG, DF)',
          'Italics: preparation notes or chef recommendations',
          'Paragraphs: keep to 1-2 short paragraphs max',
        ],
        avoid: [
          'Long-form content — menus should be scannable',
          'Missing allergen or dietary information',
          'Vague descriptions without specific ingredients',
        ],
      },
      validationLimits: {
        keySummary: { min: 5, max: 100 },
        content: { min: 1, max: 2000 },
      },
    },
  },
};

export const menuConfig: TemplateConfig = {
  profile: menuProfile,
  vocabulary: {
    item: 'item',
    itemPlural: 'items',
    type: 'section',
    typePlural: 'sections',
    workspace: 'menu',
    workspacePlural: 'menus',
    vouch: 'list',
    vouched: 'listed',
  },
  seo: {
    siteSchemaType: 'FoodEstablishment',
    itemSchemaType: 'MenuItem',
  },
  mcp: {
    instructions:
      'Pignal is a self-hosted menu and price list platform for publishing dishes, drinks, and services with pricing. ' +
      'Each menu item has a section, name with description, detailed content in markdown, and optional tags.\n\n' +
      'Available tools:\n' +
      '- save_item: Add a new menu item\n' +
      '- list_items / search_items: Browse and search the menu\n' +
      '- update_item: Update an existing menu item\n' +
      '- validate_item: Mark an item as available, sold out, or seasonal\n' +
      '- vouch_item: List an item on the public menu (listed/unlisted/private)\n' +
      '- batch_vouch_items: List multiple items at once\n' +
      '- get_metadata: Get available sections, menus, and content guidelines\n' +
      '- create_workspace / create_type: Create new menus and sections\n\n' +
      'Always call get_metadata first to learn the available sections and content guidelines before saving.',
    toolDescriptions: {
      save_item:
        'Add a new menu item. ALWAYS call get_metadata first — it provides required IDs, current limits, and guidelines for writing clear menu descriptions.',
      list_items:
        'Browse menu items with optional filters by section or menu. Use to review the current menu or check for duplicates.',
      search_items:
        'Search menu items by keyword across names and descriptions. Use to find items by ingredient, dietary label, or style.',
      get_metadata:
        'Get sections, menus, and content guidelines. ALWAYS call this first before save_item or validate_item — the response contains required IDs and formatting guidelines.',
      validate_item:
        'Mark a menu item as available, sold out, or seasonal. Call get_metadata first for valid action IDs.',
      update_item:
        'Update an existing menu item. Use to change pricing, ingredients, or availability.',
      create_workspace:
        'Create a new menu for grouping items. Call get_metadata first to see existing menus.',
      create_type:
        'Create a new menu section with availability actions. Call get_metadata first to see existing sections and avoid duplicates.',
      vouch_item:
        'Change a menu item\'s visibility: "vouched" lists it on the public menu, "unlisted" creates a share link, "private" hides it.',
      batch_vouch_items:
        'List multiple menu items at once (max 50). Each item can have its own visibility and optional slug. Use to publish a full menu section.',
    },
    responseLabels: {
      saved: 'Menu item added!',
      updated: 'Menu item updated!',
      validated: 'Menu item reviewed!',
      notFound: 'Menu item not found.',
      found: 'Found {total} items (showing {count})',
      visibilityUpdated: 'Menu item listed!',
      batchComplete: 'Batch listing complete:',
      workspaceCreated: 'Menu created!',
      typeCreated: 'Section created!',
    },
    schemaDescriptions: {
      'save_item.keySummary':
        'Dish or drink name with key descriptor. Example: "Pan-Seared Salmon — dill cream sauce, asparagus, wild rice" or "Lavender Collins — gin, lavender syrup, lemon"',
      'save_item.content':
        'Short description in markdown. Include ingredients, preparation notes, and dietary labels (GF, V, VG). Keep concise — this is a menu, not an article.',
      'save_item.typeId':
        'Menu section ID (from get_metadata). Choose Appetizers, Mains, Desserts, or Beverages.',
      'save_item.workspaceId':
        'Optional menu ID to place this item (from get_metadata). Example: Dinner Menu, Lunch Special, Catering.',
      'save_item.tags':
        'Optional tags. Use lowercase keywords (e.g. ["gluten-free", "vegan", "spicy", "seasonal"]).',
      'create_workspace.name':
        'Menu name (e.g., "Dinner Menu", "Brunch", "Wine List", "Catering Packages").',
      'create_type.name':
        'Section name (e.g., "Appetizers", "Mains", "Sides", "Cocktails").',
      'create_type.actions':
        'Availability actions (e.g., "Available", "Sold Out", "Seasonal"). At least 1 required.',
    },
  },
};

// =============================================================================
// 6. GLOSSARY — Table Group
// =============================================================================

export const glossaryProfile: TemplateProfile = {
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

// =============================================================================
// 7. RESUME — Dashboard Group
// =============================================================================

export const resumeProfile: TemplateProfile = {
  id: 'resume',
  displayName: 'Resume / CV',
  tagline: 'Single-page personal profile with experience timeline and skills grid',
  description:
    'A structured dashboard layout for presenting professional credentials as a single-page profile. ' +
    'Sections serve as credential categories (Experience, Education, Certification), with items as individual credentials. ' +
    'Not a feed — a structured, at-a-glance professional overview with hero bio, skills grid, and experience timeline.',
  domain: 'professional',
  contentType: 'profiles',
  layout: 'dashboard',
  audience: ['job seekers', 'freelancers', 'academics', 'career changers'],
  useCases: [
    'Present a structured professional profile with credentials and skills',
    'Maintain a living resume that updates as you earn new credentials',
    'Showcase experience, education, and certifications in one view',
    'Create multiple profile variations for different career focuses',
  ],
  differentiators: [
    'Hero bio section with summary and contact info',
    'Skills grid using types as categories',
    'Experience timeline using items as credentials',
    'Not a feed — structured single-page dashboard layout',
  ],
  seedData: {
    types: [
      {
        name: 'Experience',
        description: 'Professional roles and employment',
        icon: '💼',
        color: '#3B82F6',
        guidance: {
          pattern: '[Role title] at [Organization] — [duration or dates]',
          example: 'Senior Software Engineer at Stripe — 2022 to Present',
          whenToUse: 'Use for professional employment, contract roles, and significant volunteer positions',
          contentHints: 'Describe responsibilities, key achievements, and technologies used. Use bullet points for accomplishments. Quantify impact where possible.',
        },
        actions: ['Current', 'Completed', 'Notable'],
      },
      {
        name: 'Education',
        description: 'Degrees, diplomas, and formal education',
        icon: '🎓',
        color: '#10B981',
        guidance: {
          pattern: '[Degree] in [Field] — [Institution], [Year]',
          example: 'M.S. in Computer Science — Stanford University, 2020',
          whenToUse: 'Use for degrees, diplomas, and formal educational programs',
          contentHints: 'Include the degree type, field of study, institution, graduation year, and any honors. Mention relevant coursework or thesis if notable.',
        },
        actions: ['Completed', 'In Progress', 'With Honors'],
      },
      {
        name: 'Certification',
        description: 'Professional certifications and licenses',
        icon: '📜',
        color: '#8B5CF6',
        guidance: {
          pattern: '[Certification name] — [Issuing body], [Year]',
          example: 'AWS Solutions Architect Professional — Amazon Web Services, 2024',
          whenToUse: 'Use for professional certifications, licenses, and accreditations',
          contentHints: 'Include the certification name, issuing organization, date earned, and expiration if applicable. Note the credential ID if public.',
        },
        actions: ['Active', 'Expired', 'Renewed'],
      },
      {
        name: 'Project',
        description: 'Notable projects and accomplishments',
        icon: '🚀',
        color: '#F59E0B',
        guidance: {
          pattern: '[Project name] — [role and outcome]',
          example: 'Open-source CLI tool — built and maintained, 2,000+ GitHub stars',
          whenToUse: 'Use for notable projects, side projects, open-source contributions, and portfolio pieces',
          contentHints: 'Describe the project, your role, technologies used, and measurable outcomes (users, stars, revenue, impact). Link to the project if public.',
        },
        actions: ['Active', 'Completed', 'Archived'],
      },
      {
        name: 'Publication',
        description: 'Papers, talks, and published works',
        icon: '📝',
        color: '#EC4899',
        guidance: {
          pattern: '[Title] — [venue/publisher], [Year]',
          example: 'Scaling Real-Time Search at Petabyte Scale — ACM SIGMOD 2024',
          whenToUse: 'Use for academic papers, conference talks, published articles, and books',
          contentHints: 'Include title, co-authors, venue or publisher, year, and a brief abstract. Link to the full text if available.',
        },
        actions: ['Published', 'Accepted', 'Preprint'],
      },
    ],
    workspaces: [
      { name: 'Full Resume', description: 'Complete professional profile', visibility: 'public' },
      { name: 'Technical Focus', description: 'Engineering and technical credentials', visibility: 'public' },
      { name: 'Leadership Focus', description: 'Management and leadership credentials', visibility: 'public' },
      { name: 'Academic', description: 'Research and academic credentials', visibility: 'private' },
    ],
    settings: {
      sourceTitle: 'My Resume',
      sourceDescription: 'Professional credentials and experience',
      qualityGuidelines: {
        keySummary: { tips: 'Use the credential title followed by organization and dates. Be specific — this is the headline that appears in the profile view.' },
        content: { tips: 'Write for recruiters and hiring managers scanning quickly. Lead with impact and achievements. Quantify results wherever possible.' },
        formatting: [
          'Bullet lists: key achievements and responsibilities',
          'Bold: job titles, organization names, and key metrics',
          'Tables: skills proficiency, technology stack',
          'Numbered lists: ranked accomplishments or sequential milestones',
          'Links: project URLs, publication DOIs, credential verification',
        ],
        avoid: [
          'Vague responsibility descriptions without outcomes',
          'Unexplained employment gaps (address them proactively)',
          'Listing every technology without indicating proficiency level',
          'Dense paragraphs instead of scannable bullet points',
        ],
      },
      validationLimits: {
        keySummary: { min: 10, max: 200 },
        content: { min: 20, max: 10000 },
      },
    },
  },
};

export const resumeConfig: TemplateConfig = {
  profile: resumeProfile,
  vocabulary: {
    item: 'credential',
    itemPlural: 'credentials',
    type: 'section',
    typePlural: 'sections',
    workspace: 'profile',
    workspacePlural: 'profiles',
    vouch: 'highlight',
    vouched: 'highlighted',
  },
  seo: {
    siteSchemaType: 'ProfilePage',
    itemSchemaType: 'Article',
  },
  mcp: {
    instructions:
      'Pignal is a self-hosted resume platform for organizing professional credentials — experience, education, certifications, projects, and publications. ' +
      'Each credential has a section, title summary, detailed content in markdown, and optional tags.\n\n' +
      'Available tools:\n' +
      '- save_item: Add a new credential\n' +
      '- list_items / search_items: Browse and search credentials\n' +
      '- update_item: Update an existing credential\n' +
      '- validate_item: Mark a credential as current, completed, or notable\n' +
      '- vouch_item: Highlight a credential on the public profile (highlighted/unlisted/private)\n' +
      '- batch_vouch_items: Highlight multiple credentials at once\n' +
      '- get_metadata: Get available sections, profiles, and content guidelines\n' +
      '- create_workspace / create_type: Create new profiles and sections\n\n' +
      'Always call get_metadata first to learn the available sections and content guidelines before saving.',
    toolDescriptions: {
      save_item:
        'Add a new credential to the resume. ALWAYS call get_metadata first — it provides required IDs, current limits, and guidelines for writing effective credential entries.',
      list_items:
        'Browse credentials with optional filters by section or profile. Use to review existing entries or check for gaps in the resume.',
      search_items:
        'Search credentials by keyword across titles and content. Use to find specific roles, skills, or achievements.',
      get_metadata:
        'Get sections, profiles, and content guidelines. ALWAYS call this first before save_item or validate_item — the response contains required IDs and formatting standards.',
      validate_item:
        'Mark a credential as current, completed, or notable. Call get_metadata first for valid action IDs.',
      update_item:
        'Update an existing credential. Use to add recent achievements, update dates, or refine descriptions.',
      create_workspace:
        'Create a new profile variation for targeting different roles. Call get_metadata first to see existing profiles.',
      create_type:
        'Create a new credential section with status actions. Call get_metadata first to see existing sections and avoid duplicates.',
      vouch_item:
        'Change a credential\'s visibility: "vouched" highlights it on the public profile, "unlisted" creates a share link, "private" keeps it hidden.',
      batch_vouch_items:
        'Highlight multiple credentials at once (max 50). Each credential can have its own visibility and optional slug. Use to publish a complete profile section.',
    },
    responseLabels: {
      saved: 'Credential added!',
      updated: 'Credential updated!',
      validated: 'Credential reviewed!',
      notFound: 'Credential not found.',
      found: 'Found {total} credentials (showing {count})',
      visibilityUpdated: 'Credential highlighted!',
      batchComplete: 'Batch highlight complete:',
      workspaceCreated: 'Profile created!',
      typeCreated: 'Section created!',
    },
    schemaDescriptions: {
      'save_item.keySummary':
        'Credential title with organization and dates. Example: "Senior Software Engineer at Stripe — 2022 to Present" or "AWS Solutions Architect — Amazon Web Services, 2024"',
      'save_item.content':
        'Credential details in markdown. For roles: achievements, responsibilities, tech stack. For education: coursework, thesis, honors. Quantify impact with metrics.',
      'save_item.typeId':
        'Section ID (from get_metadata). Choose Experience, Education, Certification, Project, or Publication.',
      'save_item.workspaceId':
        'Optional profile ID to include this credential in a specific resume variation (from get_metadata). Example: Full Resume, Technical Focus.',
      'save_item.tags':
        'Optional tags. Use lowercase keywords (e.g. ["typescript", "leadership", "aws", "distributed-systems"]).',
      'create_workspace.name':
        'Profile name (e.g., "Full Resume", "Engineering Focus", "Management Track").',
      'create_type.name':
        'Section name (e.g., "Experience", "Education", "Certification", "Volunteer Work").',
      'create_type.actions':
        'Status actions (e.g., "Current", "Completed", "Notable"). At least 1 required.',
    },
  },
};
