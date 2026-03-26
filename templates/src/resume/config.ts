import type { TemplateConfig, TemplateProfile } from '../config';

const resumeProfile: TemplateProfile = {
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
