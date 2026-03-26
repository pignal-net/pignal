import type { TemplateConfig, TemplateProfile } from '../config';

const courseProfile: TemplateProfile = {
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
