import type { TemplateConfig, TemplateProfile } from '../config';

const runbookProfile: TemplateProfile = {
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
    actions: [
      {
        name: 'Suggest Improvement',
        slug: 'suggest-improvement',
        description: 'Suggest an improvement to a procedure',
        fields: [
          { name: 'name', type: 'text', label: 'Name', required: true, placeholder: 'Your name', maxLength: 100 },
          { name: 'email', type: 'email', label: 'Email', required: true, placeholder: 'you@example.com' },
          { name: 'procedure_url', type: 'url', label: 'Procedure URL', required: false, placeholder: 'https://...', maxLength: 500 },
          { name: 'suggestion', type: 'textarea', label: 'Improvement Suggestion', required: true, placeholder: 'Describe the improvement, why the current procedure is insufficient, and your proposed change...', maxLength: 2000 },
        ],
        settings: { success_message: 'Thanks for the suggestion! We\'ll review and update the procedure if appropriate.', require_honeypot: true },
      },
    ],
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
