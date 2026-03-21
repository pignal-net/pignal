import type { TemplateProfile, TemplateConfig } from './config';

// ============================================================================
// 1. PORTFOLIO
// ============================================================================

export const portfolioProfile: TemplateProfile = {
  id: 'portfolio',
  displayName: 'Creative Portfolio',
  tagline: 'Image-first project grid with discipline chips and full-width showcases',
  description:
    'A visual portfolio layout for showcasing creative work. ' +
    'Grid of 4:3 aspect-ratio project cards with horizontal filter chips on the source page, ' +
    'full-width image showcase with project narrative on detail pages.',
  domain: 'creative',
  contentType: 'media',
  layout: 'grid',
  audience: ['designers', 'photographers', 'illustrators', 'creative freelancers'],
  useCases: [
    'Showcase design projects with process breakdowns',
    'Present a photography portfolio organized by discipline',
    'Display illustration work grouped into client and personal series',
    'Build a freelance portfolio with case study narratives',
  ],
  differentiators: [
    'Image-first cards with 4:3 aspect ratio placeholders',
    'Horizontal filter chips instead of sidebar navigation',
    'Full-width item showcase with hero image area',
    'Masonry-optional layout adapting to project thumbnails',
  ],
  seedData: {
    types: [
      {
        name: 'Web Design',
        description: 'Websites, landing pages, and web applications',
        icon: '🖥',
        color: '#3B82F6',
        guidance: {
          pattern: '[Project name] — [client or context]',
          example: 'Bloom Health Rebrand — Responsive Marketing Site',
          whenToUse: 'Use for website designs, landing pages, or web app interfaces',
          contentHints:
            'Describe the brief, your approach, and the outcome. Include sections for Challenge, Process, and Result. Embed image URLs or describe key screens.',
        },
        actions: ['Published', 'In Progress', 'Archived'],
      },
      {
        name: 'Brand Identity',
        description: 'Logos, brand systems, and visual identities',
        icon: '🎨',
        color: '#EC4899',
        guidance: {
          pattern: '[Brand name] — [deliverable scope]',
          example: 'Terraverde Coffee — Logo + Packaging System',
          whenToUse: 'Use for logo design, brand guidelines, or complete identity systems',
          contentHints:
            'Walk through the brand strategy, moodboards, explorations, and final deliverables. Use headings to separate Concept, Execution, and Assets.',
        },
        actions: ['Complete', 'Concept Phase', 'Shelved'],
      },
      {
        name: 'Illustration',
        description: 'Digital and traditional illustrations',
        icon: '🖌',
        color: '#F59E0B',
        guidance: {
          pattern: '[Piece title] — [medium or technique]',
          example: 'Midnight Garden — Digital Painting, Procreate',
          whenToUse: 'Use for standalone illustrations, editorial art, or character design',
          contentHints:
            'Describe the inspiration, tools used, and creative decisions. Include process shots if available. Mention dimensions and medium.',
        },
        actions: ['Finished', 'Work in Progress', 'Abandoned'],
      },
      {
        name: 'Motion Graphics',
        description: 'Animations, video graphics, and motion design',
        icon: '🎬',
        color: '#8B5CF6',
        guidance: {
          pattern: '[Project name] — [format and duration]',
          example: 'Solaris App Promo — 30s Product Walkthrough',
          whenToUse: 'Use for animation, motion design, video intros, or explainer graphics',
          contentHints:
            'Outline the storyboard, tools (After Effects, Cinema 4D, etc.), and deliverable specs. Include frame-by-frame breakdowns or key moments.',
        },
        actions: ['Rendered', 'Animating', 'On Hold'],
      },
      {
        name: 'Photography',
        description: 'Photo series, edits, and commissioned shoots',
        icon: '📷',
        color: '#10B981',
        guidance: {
          pattern: '[Series or subject] — [location or theme]',
          example: 'Urban Geometry — Tokyo Street Architecture',
          whenToUse: 'Use for photo series, individual commissioned shoots, or curated edits',
          contentHints:
            'Describe the concept, gear used, shooting conditions, and post-processing approach. List camera settings for key shots if relevant.',
        },
        actions: ['Final Edit', 'In Post', 'Rejected'],
      },
    ],
    workspaces: [
      { name: 'Client Work', description: 'Commissioned and contracted projects', visibility: 'public' },
      { name: 'Personal Projects', description: 'Self-initiated creative work', visibility: 'public' },
      { name: 'Experiments', description: 'Explorations and skill-building exercises', visibility: 'public' },
      { name: 'Archived', description: 'Older work kept for reference', visibility: 'private' },
    ],
    settings: {
      sourceTitle: 'My Portfolio',
      sourceDescription: 'A curated collection of creative work',
      qualityGuidelines: {
        keySummary: {
          tips: 'Use the project name followed by a dash and the client, medium, or context. Keep it scannable from a grid thumbnail.',
        },
        content: {
          tips: 'Write as a case study: what was the challenge, how did you approach it, and what was the outcome. Structure for skimming.',
        },
        formatting: [
          'Headings: separate Challenge, Process, Result, and Tools sections',
          'Bullet lists: deliverables, tools used, key metrics',
          'Bold: highlight standout outcomes or client quotes',
          'Tables: project specs (timeline, tools, dimensions, file formats)',
          'Paragraphs: narrative context and creative rationale',
        ],
        avoid: [
          'Vague descriptions without specific outcomes',
          'Listing only tools without explaining the creative process',
          'Missing project context or client brief summary',
        ],
      },
      validationLimits: {
        keySummary: { min: 10, max: 150 },
        content: { min: 50, max: 15000 },
      },
    },
  },
};

export const portfolioConfig: TemplateConfig = {
  profile: portfolioProfile,
  vocabulary: {
    item: 'project',
    itemPlural: 'projects',
    type: 'discipline',
    typePlural: 'disciplines',
    workspace: 'series',
    workspacePlural: 'series',
    vouch: 'showcase',
    vouched: 'showcased',
  },
  seo: {
    siteSchemaType: 'WebSite',
    itemSchemaType: 'CreativeWork',
  },
  mcp: {
    instructions:
      'Pignal is a self-hosted creative portfolio platform for showcasing projects across disciplines. ' +
      'Each project has a discipline, title, a case-study narrative in markdown, and optional tags.\n\n' +
      'Available tools:\n' +
      '- save_item: Add a new project to the portfolio\n' +
      '- list_items / search_items: Browse and search existing projects\n' +
      '- update_item: Edit a project\'s details or narrative\n' +
      '- validate_item: Mark a project\'s completion status\n' +
      '- vouch_item: Showcase or hide a project (showcased/unlisted/private)\n' +
      '- batch_vouch_items: Showcase or hide multiple projects at once\n' +
      '- get_metadata: Get disciplines, series, and content guidelines\n' +
      '- create_workspace / create_type: Create new series and disciplines\n\n' +
      'Always call get_metadata first to learn the available disciplines and content guidelines before saving.',
    toolDescriptions: {
      save_item:
        'Add a new project to the portfolio. ALWAYS call get_metadata first — it provides required discipline IDs, current limits, and guidelines for writing effective case studies.',
      list_items:
        'Browse projects with optional filters by discipline or series. Use to review the portfolio or check for duplicate entries.',
      search_items:
        'Search projects by keyword across titles and narratives. Use to find related work before adding a project or to locate projects for status updates.',
      get_metadata:
        'Get disciplines, series, and content guidelines. ALWAYS call this first before save_item — the response contains required IDs, configurable limits, and formatting instructions.',
      validate_item:
        'Update a project\'s completion status (e.g., Published, In Progress, Archived). Call get_metadata first for valid action IDs.',
      update_item:
        'Edit an existing project. Use to refine the narrative, add process details, or recategorize into a different discipline.',
      create_workspace:
        'Create a new series for grouping related projects. Call get_metadata first to see existing series.',
      create_type:
        'Create a new discipline with status actions. Call get_metadata first to see existing disciplines and avoid duplicates.',
      vouch_item:
        'Change a project\'s showcase status: "vouched" showcases it publicly, "unlisted" creates a share link, "private" hides it from the portfolio.',
      batch_vouch_items:
        'Change showcase status for multiple projects at once (max 50). Use to publish a batch of projects to the portfolio.',
    },
    responseLabels: {
      saved: 'Project added!',
      updated: 'Project updated!',
      validated: 'Project status updated!',
      notFound: 'Project not found.',
      found: 'Found {total} projects (showing {count})',
      visibilityUpdated: 'Project showcase status updated!',
      batchComplete: 'Batch showcase complete:',
      workspaceCreated: 'Series created!',
      typeCreated: 'Discipline created!',
    },
    schemaDescriptions: {
      'save_item.keySummary':
        'Project title with client or context. Example: "Bloom Health Rebrand — Responsive Marketing Site"',
      'save_item.content':
        'Project case study in markdown. Structure as Challenge, Process, Result. Include tools, deliverables, and outcomes.',
      'save_item.typeId': 'Discipline ID (from get_metadata). Choose the primary creative discipline.',
      'save_item.workspaceId':
        'Optional series ID for grouping related projects (from get_metadata).',
      'save_item.tags':
        'Optional project tags. Use lowercase keywords (e.g. ["branding", "responsive", "figma"]).',
      'create_workspace.name':
        'Series name (e.g., "Client Work", "Personal Projects", "Experiments").',
      'create_type.name':
        'Discipline name (e.g., "Web Design", "Illustration", "Photography").',
      'create_type.actions':
        'Project status actions (e.g., "Published", "In Progress", "Archived"). At least 1 required.',
    },
  },
};

// ============================================================================
// 2. RECIPES
// ============================================================================

export const recipesProfile: TemplateProfile = {
  id: 'recipes',
  displayName: 'Recipe Collection',
  tagline: 'Recipe grid with prep times, servings, and structured cooking instructions',
  description:
    'A recipe collection layout designed for home cooks and food creators. ' +
    'Grid cards show prep/cook time and servings at a glance, detail pages present ' +
    'ingredients lists and numbered step-by-step instructions.',
  domain: 'personal',
  contentType: 'listings',
  layout: 'grid',
  audience: ['home cooks', 'food bloggers', 'culinary students', 'meal planners'],
  useCases: [
    'Organize family recipes into cuisine-based cookbooks',
    'Publish a food blog with structured recipe cards',
    'Build a meal prep library with difficulty and time estimates',
    'Collect and share holiday and seasonal recipes',
  ],
  differentiators: [
    'Prep time, cook time, and servings displayed on grid cards',
    'Ingredients checklist and numbered instruction steps in detail view',
    'Difficulty indicator derived from validation actions',
    'Food-style warm gradient placeholders on cards without images',
  ],
  seedData: {
    types: [
      {
        name: 'Italian',
        description: 'Pasta, risotto, pizza, and Mediterranean dishes',
        icon: '🍝',
        color: '#DC2626',
        guidance: {
          pattern: '[Dish name] — [key variation or style]',
          example: 'Cacio e Pepe — Classic Roman Pecorino Pasta',
          whenToUse: 'Use for Italian and Mediterranean-inspired dishes',
          contentHints:
            'Start with a brief intro about the dish. List ingredients with quantities, then numbered steps. Include tips for substitutions or make-ahead notes.',
        },
        actions: ['Tested', 'Needs Tweaking', 'Failed'],
      },
      {
        name: 'Japanese',
        description: 'Sushi, ramen, donburi, and izakaya fare',
        icon: '🍣',
        color: '#0EA5E9',
        guidance: {
          pattern: '[Dish name] — [style or region]',
          example: 'Tonkotsu Ramen — Rich Pork Bone Broth, Hakata Style',
          whenToUse: 'Use for Japanese cuisine including sushi, ramen, grilled, and fermented dishes',
          contentHints:
            'Note any special ingredients or equipment needed (dashi, rice cooker). Include timing for multi-component dishes. Mention traditional accompaniments.',
        },
        actions: ['Tested', 'Needs Tweaking', 'Failed'],
      },
      {
        name: 'Mexican',
        description: 'Tacos, mole, salsas, and street food',
        icon: '🌮',
        color: '#F59E0B',
        guidance: {
          pattern: '[Dish name] — [regional style or filling]',
          example: 'Al Pastor Tacos — Pineapple-Marinated Pork, Corn Tortillas',
          whenToUse: 'Use for Mexican and Latin American dishes',
          contentHints:
            'Describe the heat level and chili varieties. List salsa and garnish components separately. Include tortilla or masa preparation if relevant.',
        },
        actions: ['Tested', 'Needs Tweaking', 'Failed'],
      },
      {
        name: 'Indian',
        description: 'Curries, biryanis, dals, and tandoori dishes',
        icon: '🍛',
        color: '#EA580C',
        guidance: {
          pattern: '[Dish name] — [regional origin or spice profile]',
          example: 'Chicken Tikka Masala — Creamy Tomato Sauce, Punjabi Style',
          whenToUse: 'Use for Indian subcontinent dishes including curries, breads, and rice dishes',
          contentHints:
            'List the spice blend with exact measurements. Note when to bloom spices in oil. Separate the base sauce, protein prep, and finishing steps.',
        },
        actions: ['Tested', 'Needs Tweaking', 'Failed'],
      },
      {
        name: 'French',
        description: 'Bistro classics, pastries, and haute cuisine techniques',
        icon: '🥐',
        color: '#8B5CF6',
        guidance: {
          pattern: '[Dish name] — [technique or occasion]',
          example: 'Coq au Vin — Burgundy-Braised Chicken, Sunday Dinner',
          whenToUse: 'Use for French cuisine from rustic bistro fare to pastry and baking',
          contentHints:
            'Emphasize technique and mise en place. Note resting times, temperatures, and visual cues for doneness. Include wine or stock pairing suggestions.',
        },
        actions: ['Tested', 'Needs Tweaking', 'Failed'],
      },
    ],
    workspaces: [
      { name: 'Weeknight Dinners', description: 'Quick meals ready in under an hour', visibility: 'public' },
      { name: 'Baking', description: 'Breads, pastries, and desserts', visibility: 'public' },
      { name: 'Holiday Specials', description: 'Seasonal and celebration recipes', visibility: 'public' },
      { name: 'Meal Prep', description: 'Make-ahead and batch cooking recipes', visibility: 'public' },
    ],
    settings: {
      sourceTitle: 'My Recipes',
      sourceDescription: 'A personal collection of tried-and-tested recipes',
      qualityGuidelines: {
        keySummary: {
          tips: 'Use the dish name followed by the key variation or style. Keep it recognizable at a glance in a recipe grid.',
        },
        content: {
          tips: 'Structure every recipe with Ingredients (bulleted with quantities) and Instructions (numbered steps). Add prep/cook time and servings at the top.',
        },
        formatting: [
          'Headings: separate Ingredients, Instructions, and Notes sections',
          'Bullet lists: ingredients with exact quantities and units',
          'Numbered lists: step-by-step cooking instructions in order',
          'Bold: highlight critical temperatures, times, and visual cues',
          'Tables: nutrition info or variation comparisons',
          'Paragraphs: brief intro about the dish and personal notes',
        ],
        avoid: [
          'Ingredients without quantities or units',
          'Vague instructions like "cook until done"',
          'Mixing ingredients and steps into a single block',
          'Omitting prep time, cook time, or servings',
        ],
      },
      validationLimits: {
        keySummary: { min: 10, max: 150 },
        content: { min: 100, max: 15000 },
      },
    },
  },
};

export const recipesConfig: TemplateConfig = {
  profile: recipesProfile,
  vocabulary: {
    item: 'recipe',
    itemPlural: 'recipes',
    type: 'cuisine',
    typePlural: 'cuisines',
    workspace: 'cookbook',
    workspacePlural: 'cookbooks',
    vouch: 'approve',
    vouched: 'approved',
  },
  seo: {
    siteSchemaType: 'WebSite',
    itemSchemaType: 'Recipe',
  },
  mcp: {
    instructions:
      'Pignal is a self-hosted recipe collection platform for organizing and sharing cooking recipes. ' +
      'Each recipe has a cuisine, title, structured cooking instructions in markdown, and optional tags.\n\n' +
      'Available tools:\n' +
      '- save_item: Add a new recipe to the collection\n' +
      '- list_items / search_items: Browse and search recipes by cuisine or cookbook\n' +
      '- update_item: Edit a recipe\'s ingredients, steps, or details\n' +
      '- validate_item: Mark whether a recipe has been tested or needs tweaking\n' +
      '- vouch_item: Approve or hide a recipe (approved/unlisted/private)\n' +
      '- batch_vouch_items: Approve or hide multiple recipes at once\n' +
      '- get_metadata: Get cuisines, cookbooks, and content guidelines\n' +
      '- create_workspace / create_type: Create new cookbooks and cuisines\n\n' +
      'Always call get_metadata first to learn the available cuisines and content guidelines before saving.',
    toolDescriptions: {
      save_item:
        'Add a new recipe to the collection. ALWAYS call get_metadata first — it provides required cuisine IDs, current limits, and formatting guidelines for structured recipes.',
      list_items:
        'Browse recipes with optional filters by cuisine or cookbook. Use to explore the collection or check for duplicate recipes.',
      search_items:
        'Search recipes by keyword across titles and ingredients. Use to find similar dishes before adding or to locate recipes for review.',
      get_metadata:
        'Get cuisines, cookbooks, and content guidelines. ALWAYS call this first before save_item — the response contains required IDs, limits, and the expected recipe structure.',
      validate_item:
        'Mark a recipe as tested, needing tweaks, or failed. Call get_metadata first for valid action IDs.',
      update_item:
        'Edit an existing recipe. Use to adjust quantities, refine steps, add notes, or recategorize into a different cuisine.',
      create_workspace:
        'Create a new cookbook for grouping related recipes. Call get_metadata first to see existing cookbooks.',
      create_type:
        'Create a new cuisine with testing actions. Call get_metadata first to see existing cuisines and avoid duplicates.',
      vouch_item:
        'Change a recipe\'s approval status: "vouched" approves it publicly, "unlisted" creates a share link, "private" hides it from the collection.',
      batch_vouch_items:
        'Change approval status for multiple recipes at once (max 50). Use to publish a batch of tested recipes to the collection.',
    },
    responseLabels: {
      saved: 'Recipe added!',
      updated: 'Recipe updated!',
      validated: 'Recipe reviewed!',
      notFound: 'Recipe not found.',
      found: 'Found {total} recipes (showing {count})',
      visibilityUpdated: 'Recipe approval updated!',
      batchComplete: 'Batch approval complete:',
      workspaceCreated: 'Cookbook created!',
      typeCreated: 'Cuisine created!',
    },
    schemaDescriptions: {
      'save_item.keySummary':
        'Recipe title with key variation or style. Example: "Cacio e Pepe — Classic Roman Pecorino Pasta"',
      'save_item.content':
        'Full recipe in markdown. MUST include: prep/cook time and servings at top, Ingredients (bulleted with quantities), Instructions (numbered steps). Add Notes section for tips.',
      'save_item.typeId': 'Cuisine ID (from get_metadata). Choose the primary cuisine origin.',
      'save_item.workspaceId':
        'Optional cookbook ID for grouping recipes by occasion or meal type (from get_metadata).',
      'save_item.tags':
        'Optional recipe tags. Use lowercase keywords (e.g. ["vegetarian", "quick", "one-pot"]).',
      'create_workspace.name':
        'Cookbook name (e.g., "Weeknight Dinners", "Baking", "Meal Prep").',
      'create_type.name':
        'Cuisine name (e.g., "Italian", "Japanese", "Mexican").',
      'create_type.actions':
        'Testing actions (e.g., "Tested", "Needs Tweaking", "Failed"). At least 1 required.',
    },
  },
};

// ============================================================================
// 3. BOOKSHELF
// ============================================================================

export const bookshelfProfile: TemplateProfile = {
  id: 'bookshelf',
  displayName: 'Bookshelf',
  tagline: 'Portrait book-cover grid with reading status, ratings, and shelf organization',
  description:
    'A reading tracker and book review layout with portrait-ratio cards evoking book covers. ' +
    'Grid cards show author and reading status at a glance, detail pages present full reviews ' +
    'with ratings, key takeaways, and favorite quotes.',
  domain: 'personal',
  contentType: 'listings',
  layout: 'grid',
  audience: ['avid readers', 'book club members', 'librarians', 'literature students'],
  useCases: [
    'Track reading progress across genres with status labels',
    'Write and publish book reviews with ratings and takeaways',
    'Organize a personal library into themed shelves',
    'Share recommended reading lists with friends or a book club',
  ],
  differentiators: [
    'Portrait aspect-ratio cards evoking book cover proportions',
    'Read / reading / want-to-read status via validation actions',
    'Author and page count metadata displayed on cards',
    'Shelves as workspaces for thematic book grouping',
  ],
  seedData: {
    types: [
      {
        name: 'Fiction',
        description: 'Novels, short stories, and literary fiction',
        icon: '📖',
        color: '#8B5CF6',
        guidance: {
          pattern: '[Book title] — [Author name]',
          example: 'The Remains of the Day — Kazuo Ishiguro',
          whenToUse: 'Use for novels, novellas, short story collections, and literary fiction',
          contentHints:
            'Write a spoiler-free review. Cover what the book is about, your experience reading it, and who would enjoy it. Include a rating and favorite quotes.',
        },
        actions: ['Read', 'Currently Reading', 'Want to Read', 'Abandoned'],
      },
      {
        name: 'Non-Fiction',
        description: 'Essays, journalism, history, and general non-fiction',
        icon: '📰',
        color: '#3B82F6',
        guidance: {
          pattern: '[Book title] — [Author name]',
          example: 'Sapiens: A Brief History of Humankind — Yuval Noah Harari',
          whenToUse: 'Use for non-fiction books including history, science, essays, and journalism',
          contentHints:
            'Summarize the central thesis. List 3-5 key takeaways. Note whether the arguments are well-supported and who the target audience is.',
        },
        actions: ['Read', 'Currently Reading', 'Want to Read', 'Abandoned'],
      },
      {
        name: 'Science Fiction',
        description: 'Sci-fi, speculative fiction, and futurism',
        icon: '🚀',
        color: '#0EA5E9',
        guidance: {
          pattern: '[Book title] — [Author name]',
          example: 'Project Hail Mary — Andy Weir',
          whenToUse: 'Use for science fiction, speculative fiction, space opera, and cyberpunk',
          contentHints:
            'Describe the premise and world-building without major spoilers. Discuss the scientific concepts explored and how they drive the story.',
        },
        actions: ['Read', 'Currently Reading', 'Want to Read', 'Abandoned'],
      },
      {
        name: 'Biography',
        description: 'Biographies, memoirs, and autobiographies',
        icon: '👤',
        color: '#10B981',
        guidance: {
          pattern: '[Book title] — [Author or Subject name]',
          example: 'Steve Jobs — Walter Isaacson',
          whenToUse: 'Use for biographies, autobiographies, and memoir',
          contentHints:
            'Discuss what makes the subject compelling. Note the author\'s access and perspective. Highlight the most memorable episodes or revelations.',
        },
        actions: ['Read', 'Currently Reading', 'Want to Read', 'Abandoned'],
      },
      {
        name: 'Self-Help',
        description: 'Personal development, productivity, and wellness',
        icon: '🧠',
        color: '#F59E0B',
        guidance: {
          pattern: '[Book title] — [Author name]',
          example: 'Atomic Habits — James Clear',
          whenToUse: 'Use for self-help, personal development, productivity, and wellness books',
          contentHints:
            'Summarize the core framework or system. List actionable takeaways you plan to apply. Note whether the advice is evidence-based or anecdotal.',
        },
        actions: ['Read', 'Currently Reading', 'Want to Read', 'Abandoned'],
      },
    ],
    workspaces: [
      { name: 'Currently Reading', description: 'Books in progress right now', visibility: 'public' },
      { name: 'Finished', description: 'Completed books with reviews', visibility: 'public' },
      { name: 'Want to Read', description: 'Reading list and recommendations queue', visibility: 'public' },
      { name: 'All-Time Favorites', description: 'The best books worth rereading', visibility: 'public' },
    ],
    settings: {
      sourceTitle: 'My Bookshelf',
      sourceDescription: 'Books read, reviewed, and recommended',
      qualityGuidelines: {
        keySummary: {
          tips: 'Use the book title followed by the author name. Example: "The Remains of the Day — Kazuo Ishiguro". Keep it consistent for easy scanning.',
        },
        content: {
          tips: 'Write a review that helps someone decide whether to read this book. Include a brief summary, your reaction, key takeaways, and a rating.',
        },
        formatting: [
          'Headings: separate Summary, Review, Key Takeaways, and Favorite Quotes sections',
          'Bullet lists: key takeaways, themes, or discussion questions',
          'Blockquotes: favorite passages and memorable quotes',
          'Bold: highlight rating, page count, and publication year',
          'Paragraphs: personal reaction and recommendation context',
        ],
        avoid: [
          'Major plot spoilers without warning',
          'Reviews without a clear recommendation or rating',
          'Omitting the author name from the title',
          'Copy-pasting publisher blurbs instead of personal review',
        ],
      },
      validationLimits: {
        keySummary: { min: 10, max: 200 },
        content: { min: 50, max: 10000 },
      },
    },
  },
};

export const bookshelfConfig: TemplateConfig = {
  profile: bookshelfProfile,
  vocabulary: {
    item: 'book',
    itemPlural: 'books',
    type: 'genre',
    typePlural: 'genres',
    workspace: 'shelf',
    workspacePlural: 'shelves',
    vouch: 'recommend',
    vouched: 'recommended',
  },
  seo: {
    siteSchemaType: 'WebSite',
    itemSchemaType: 'Review',
  },
  mcp: {
    instructions:
      'Pignal is a self-hosted bookshelf platform for tracking reading and sharing book reviews. ' +
      'Each book has a genre, title with author, a review in markdown, and optional tags.\n\n' +
      'Available tools:\n' +
      '- save_item: Add a book to the shelf with a review\n' +
      '- list_items / search_items: Browse and search books by genre or shelf\n' +
      '- update_item: Edit a book review or update its details\n' +
      '- validate_item: Update reading status (Read, Currently Reading, Want to Read)\n' +
      '- vouch_item: Recommend or hide a book (recommended/unlisted/private)\n' +
      '- batch_vouch_items: Recommend or hide multiple books at once\n' +
      '- get_metadata: Get genres, shelves, and content guidelines\n' +
      '- create_workspace / create_type: Create new shelves and genres\n\n' +
      'Always call get_metadata first to learn the available genres and content guidelines before saving.',
    toolDescriptions: {
      save_item:
        'Add a book to the shelf with a review. ALWAYS call get_metadata first — it provides required genre IDs, current limits, and guidelines for writing useful reviews.',
      list_items:
        'Browse books with optional filters by genre or shelf. Use to review your reading history or check if a book is already tracked.',
      search_items:
        'Search books by keyword across titles and reviews. Use to find a specific book or discover related reads.',
      get_metadata:
        'Get genres, shelves, and content guidelines. ALWAYS call this first before save_item — the response contains required IDs, limits, and review formatting expectations.',
      validate_item:
        'Update a book\'s reading status (e.g., Read, Currently Reading, Want to Read, Abandoned). Call get_metadata first for valid action IDs.',
      update_item:
        'Edit an existing book entry. Use to add a review after finishing, update your rating, or recategorize into a different genre.',
      create_workspace:
        'Create a new shelf for grouping books thematically. Call get_metadata first to see existing shelves.',
      create_type:
        'Create a new genre with reading status actions. Call get_metadata first to see existing genres and avoid duplicates.',
      vouch_item:
        'Change a book\'s recommendation status: "vouched" recommends it publicly, "unlisted" creates a share link, "private" keeps it personal.',
      batch_vouch_items:
        'Change recommendation status for multiple books at once (max 50). Use to publish a curated reading list to the shelf.',
    },
    responseLabels: {
      saved: 'Book added!',
      updated: 'Book updated!',
      validated: 'Reading status updated!',
      notFound: 'Book not found.',
      found: 'Found {total} books (showing {count})',
      visibilityUpdated: 'Book recommendation updated!',
      batchComplete: 'Batch recommendation complete:',
      workspaceCreated: 'Shelf created!',
      typeCreated: 'Genre created!',
    },
    schemaDescriptions: {
      'save_item.keySummary':
        'Book title with author. Example: "Project Hail Mary — Andy Weir"',
      'save_item.content':
        'Book review in markdown. Include a brief summary (no spoilers), your reaction, key takeaways, and a rating. Use blockquotes for favorite passages.',
      'save_item.typeId': 'Genre ID (from get_metadata). Choose the primary literary genre.',
      'save_item.workspaceId':
        'Optional shelf ID for organizing books by reading status or theme (from get_metadata).',
      'save_item.tags':
        'Optional book tags. Use lowercase keywords (e.g. ["fiction", "dystopian", "award-winner"]).',
      'create_workspace.name':
        'Shelf name (e.g., "Currently Reading", "All-Time Favorites", "Book Club Picks").',
      'create_type.name':
        'Genre name (e.g., "Fiction", "Science Fiction", "Biography").',
      'create_type.actions':
        'Reading status actions (e.g., "Read", "Currently Reading", "Want to Read", "Abandoned"). At least 1 required.',
    },
  },
};

// ============================================================================
// 4. FLASHCARDS
// ============================================================================

export const flashcardsProfile: TemplateProfile = {
  id: 'flashcards',
  displayName: 'Study Cards',
  tagline: 'Compact card grid with flip interaction, decks, and spaced repetition actions',
  description:
    'A flashcard-based study platform with compact square cards and a flip interaction. ' +
    'Grid view shows card fronts organized by deck, detail view reveals the full answer ' +
    'with difficulty-based review actions for spaced repetition workflows.',
  domain: 'education',
  contentType: 'entries',
  layout: 'grid',
  audience: ['students', 'language learners', 'exam preppers', 'lifelong learners'],
  useCases: [
    'Build vocabulary decks for language learning',
    'Create concept review cards for exam preparation',
    'Memorize formulas, dates, and key facts with spaced repetition',
    'Share study decks with classmates or study groups',
  ],
  differentiators: [
    'Card-flip UI with distinct front (question) and back (answer) sections',
    'Compact square card grid optimized for dense card browsing',
    'Easy / Medium / Hard / Again review actions for spaced repetition',
    'Deck-based organization with subject grouping',
  ],
  seedData: {
    types: [
      {
        name: 'Vocabulary',
        description: 'Words, definitions, and translations',
        icon: '🔤',
        color: '#3B82F6',
        guidance: {
          pattern: '[Term] — [brief definition or translation]',
          example: 'Ephemeral — lasting for a very short time',
          whenToUse: 'Use for vocabulary words, definitions, translations, or terminology',
          contentHints:
            'Put the full definition on the back. Include pronunciation, part of speech, example sentence, and etymology if helpful. Use bold for the target word in examples.',
        },
        actions: ['Easy', 'Medium', 'Hard', 'Again'],
      },
      {
        name: 'Concepts',
        description: 'Ideas, theories, and principles to understand',
        icon: '💡',
        color: '#8B5CF6',
        guidance: {
          pattern: '[Concept name] — [one-line summary]',
          example: 'Opportunity Cost — the value of the next best alternative foregone',
          whenToUse: 'Use for abstract concepts, theories, mental models, or principles',
          contentHints:
            'State the concept clearly on the back. Include a real-world example, why it matters, and common misconceptions. Keep explanations concise for quick review.',
        },
        actions: ['Easy', 'Medium', 'Hard', 'Again'],
      },
      {
        name: 'Formulas',
        description: 'Equations, laws, and mathematical expressions',
        icon: '📐',
        color: '#10B981',
        guidance: {
          pattern: '[Formula name] — [field or context]',
          example: 'Pythagorean Theorem — right triangle geometry',
          whenToUse: 'Use for mathematical formulas, physics laws, chemical equations, or any symbolic expression',
          contentHints:
            'Write the formula using code blocks for readability. Define each variable. Include a worked example and note when to apply it.',
        },
        actions: ['Easy', 'Medium', 'Hard', 'Again'],
      },
      {
        name: 'Dates & Events',
        description: 'Historical dates, timelines, and milestones',
        icon: '📅',
        color: '#F59E0B',
        guidance: {
          pattern: '[Event name] — [date or period]',
          example: 'Fall of the Berlin Wall — November 9, 1989',
          whenToUse: 'Use for historical dates, events, timelines, or chronological milestones',
          contentHints:
            'State the date and event clearly. Add context: what caused it, what happened, and why it mattered. Keep it to 2-3 sentences for quick recall.',
        },
        actions: ['Easy', 'Medium', 'Hard', 'Again'],
      },
      {
        name: 'Diagrams',
        description: 'Visual processes, cycles, and system descriptions',
        icon: '🗺',
        color: '#EC4899',
        guidance: {
          pattern: '[Diagram subject] — [system or process name]',
          example: 'Krebs Cycle — cellular respiration energy production',
          whenToUse: 'Use for processes, cycles, system architectures, or anything best understood visually',
          contentHints:
            'Describe the diagram step by step using numbered lists. Label each stage or component. Include inputs, outputs, and key transitions. ASCII diagrams or tables can help.',
        },
        actions: ['Easy', 'Medium', 'Hard', 'Again'],
      },
    ],
    workspaces: [
      { name: 'Mathematics', description: 'Math concepts, formulas, and proofs', visibility: 'public' },
      { name: 'History', description: 'Historical events, dates, and figures', visibility: 'public' },
      { name: 'Language', description: 'Vocabulary, grammar, and phrases', visibility: 'public' },
      { name: 'Science', description: 'Biology, chemistry, physics, and earth science', visibility: 'public' },
    ],
    settings: {
      sourceTitle: 'My Study Cards',
      sourceDescription: 'Flashcards for active recall and spaced repetition',
      qualityGuidelines: {
        keySummary: {
          tips: 'Write the question or prompt on the front. Keep it short enough to read at a glance in the card grid. Use the pattern: [Term] — [brief hint].',
        },
        content: {
          tips: 'Write the answer for the back of the card. Be concise but complete. One clear idea per card works best for retention.',
        },
        formatting: [
          'Bold: highlight the key term or answer within the explanation',
          'Code blocks: formulas, equations, and code snippets',
          'Numbered lists: step-by-step processes or sequences',
          'Bullet lists: multiple related facts or properties',
          'Tables: comparisons between similar concepts',
          'Blockquotes: mnemonics or memory aids',
        ],
        avoid: [
          'Cramming multiple concepts onto a single card',
          'Vague fronts that could match many answers',
          'Walls of text that defeat quick-recall purpose',
        ],
      },
      validationLimits: {
        keySummary: { min: 5, max: 200 },
        content: { min: 1, max: 5000 },
      },
    },
  },
};

export const flashcardsConfig: TemplateConfig = {
  profile: flashcardsProfile,
  vocabulary: {
    item: 'card',
    itemPlural: 'cards',
    type: 'deck',
    typePlural: 'decks',
    workspace: 'subject',
    workspacePlural: 'subjects',
    vouch: 'master',
    vouched: 'mastered',
  },
  seo: {
    siteSchemaType: 'WebSite',
    itemSchemaType: 'LearningResource',
  },
  mcp: {
    instructions:
      'Pignal is a self-hosted flashcard platform for active recall and spaced repetition study. ' +
      'Each card has a deck, a front (question/prompt in the title), a back (answer in markdown content), and optional tags.\n\n' +
      'Available tools:\n' +
      '- save_item: Create a new study card\n' +
      '- list_items / search_items: Browse and search cards by deck or subject\n' +
      '- update_item: Edit a card\'s front or back content\n' +
      '- validate_item: Rate recall difficulty (Easy, Medium, Hard, Again)\n' +
      '- vouch_item: Master or hide a card (mastered/unlisted/private)\n' +
      '- batch_vouch_items: Master or hide multiple cards at once\n' +
      '- get_metadata: Get decks, subjects, and content guidelines\n' +
      '- create_workspace / create_type: Create new subjects and decks\n\n' +
      'Always call get_metadata first to learn the available decks and content guidelines before saving.',
    toolDescriptions: {
      save_item:
        'Create a new study card. ALWAYS call get_metadata first — it provides required deck IDs, current limits, and guidelines for writing effective flashcards.',
      list_items:
        'Browse cards with optional filters by deck or subject. Use to review a study set or check for duplicate cards.',
      search_items:
        'Search cards by keyword across fronts and backs. Use to find related cards before creating or to locate cards for difficulty rating.',
      get_metadata:
        'Get decks, subjects, and content guidelines. ALWAYS call this first before save_item — the response contains required IDs, limits, and card formatting expectations.',
      validate_item:
        'Rate a card\'s recall difficulty (Easy, Medium, Hard, Again) for spaced repetition tracking. Call get_metadata first for valid action IDs.',
      update_item:
        'Edit an existing card. Use to clarify the question, improve the answer, or move it to a different deck.',
      create_workspace:
        'Create a new subject for grouping related decks. Call get_metadata first to see existing subjects.',
      create_type:
        'Create a new deck with difficulty rating actions. Call get_metadata first to see existing decks and avoid duplicates.',
      vouch_item:
        'Change a card\'s mastery status: "vouched" marks it as mastered publicly, "unlisted" creates a share link, "private" keeps it in personal study.',
      batch_vouch_items:
        'Change mastery status for multiple cards at once (max 50). Use to mark a batch of well-known cards as mastered.',
    },
    responseLabels: {
      saved: 'Card created!',
      updated: 'Card updated!',
      validated: 'Difficulty rated!',
      notFound: 'Card not found.',
      found: 'Found {total} cards (showing {count})',
      visibilityUpdated: 'Card mastery status updated!',
      batchComplete: 'Batch mastery update complete:',
      workspaceCreated: 'Subject created!',
      typeCreated: 'Deck created!',
    },
    schemaDescriptions: {
      'save_item.keySummary':
        'Card front: the question or prompt. Example: "Ephemeral — lasting for a very short time" or "What is the Pythagorean Theorem?"',
      'save_item.content':
        'Card back: the answer in markdown. Be concise but complete. Include examples, mnemonics, or worked solutions as needed.',
      'save_item.typeId': 'Deck ID (from get_metadata). Choose the deck that matches the card type.',
      'save_item.workspaceId':
        'Optional subject ID for grouping cards by study area (from get_metadata).',
      'save_item.tags':
        'Optional card tags. Use lowercase keywords (e.g. ["calculus", "derivatives", "chain-rule"]).',
      'create_workspace.name':
        'Subject name (e.g., "Mathematics", "History", "Language").',
      'create_type.name':
        'Deck name (e.g., "Vocabulary", "Formulas", "Dates & Events").',
      'create_type.actions':
        'Difficulty rating actions (e.g., "Easy", "Medium", "Hard", "Again"). At least 1 required.',
    },
  },
};
