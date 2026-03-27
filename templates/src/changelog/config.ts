import type { TemplateConfig, TemplateProfile } from '../config';

const changelogProfile: TemplateProfile = {
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
    actions: [
      {
        name: 'Feature Request',
        slug: 'feature-request',
        description: 'Request a new feature or enhancement',
        fields: [
          { name: 'name', type: 'text', label: 'Name', required: true, placeholder: 'Your name', maxLength: 100 },
          { name: 'email', type: 'email', label: 'Email', required: true, placeholder: 'you@example.com' },
          { name: 'request', type: 'textarea', label: 'Feature Request', required: true, placeholder: 'Describe the feature you\'d like and how it would help...', maxLength: 2000 },
        ],
        settings: { success_message: 'Feature request received! We\'ll add it to our roadmap for consideration.', require_honeypot: true },
      },
      {
        name: 'Bug Report',
        slug: 'bug-report',
        description: 'Report a bug or unexpected behavior',
        fields: [
          { name: 'name', type: 'text', label: 'Name', required: true, placeholder: 'Your name', maxLength: 100 },
          { name: 'email', type: 'email', label: 'Email', required: true, placeholder: 'you@example.com' },
          { name: 'severity', type: 'select', label: 'Severity', required: true, options: ['Low', 'Medium', 'High', 'Critical'] },
          { name: 'description', type: 'textarea', label: 'Bug Description', required: true, placeholder: 'Describe the bug, steps to reproduce, and expected vs actual behavior...', maxLength: 2000 },
        ],
        settings: { success_message: 'Bug report received! We\'ll investigate and include a fix in an upcoming release.', require_honeypot: true },
      },
    ],
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
