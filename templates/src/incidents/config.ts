import type { TemplateConfig, TemplateProfile } from '../config';

const incidentsProfile: TemplateProfile = {
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
