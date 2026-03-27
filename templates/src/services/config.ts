import type { TemplateConfig, TemplateProfile } from '../config';

const servicesProfile: TemplateProfile = {
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
    actions: [
      {
        name: 'Get a Quote',
        slug: 'get-quote',
        description: 'Request a quote for our services',
        fields: [
          { name: 'name', type: 'text', label: 'Name', required: true, placeholder: 'Your name', maxLength: 100 },
          { name: 'email', type: 'email', label: 'Email', required: true, placeholder: 'you@example.com' },
          { name: 'phone', type: 'tel', label: 'Phone', required: false, placeholder: '+1 (555) 000-0000' },
          { name: 'service_type', type: 'select', label: 'Service Type', required: true, options: ['Starter', 'Professional', 'Enterprise', 'Custom'] },
          { name: 'details', type: 'textarea', label: 'Project Details', required: true, placeholder: 'Describe what you need and any relevant context...', maxLength: 2000 },
        ],
        settings: { success_message: 'Thanks for your request! We\'ll send you a quote within 2 business days.', require_honeypot: true },
      },
      {
        name: 'Book a Consultation',
        slug: 'book-consultation',
        description: 'Schedule a free consultation call',
        fields: [
          { name: 'name', type: 'text', label: 'Name', required: true, placeholder: 'Your name', maxLength: 100 },
          { name: 'email', type: 'email', label: 'Email', required: true, placeholder: 'you@example.com' },
          { name: 'phone', type: 'tel', label: 'Phone', required: false, placeholder: '+1 (555) 000-0000' },
          { name: 'preferred_time', type: 'select', label: 'Preferred Time', required: true, options: ['Morning', 'Afternoon', 'Evening'] },
        ],
        settings: { success_message: 'Consultation request received! We\'ll confirm your time slot shortly.', require_honeypot: true },
      },
    ],
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
