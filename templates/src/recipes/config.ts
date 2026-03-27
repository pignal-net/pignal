import type { TemplateConfig, TemplateProfile } from '../config';

const recipesProfile: TemplateProfile = {
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
    actions: [
      {
        name: 'Recipe Request',
        slug: 'recipe-request',
        description: 'Request a recipe or suggest a dish',
        fields: [
          { name: 'name', type: 'text', label: 'Name', required: true, placeholder: 'Your name', maxLength: 100 },
          { name: 'email', type: 'email', label: 'Email', required: true, placeholder: 'you@example.com' },
          { name: 'message', type: 'textarea', label: 'Recipe Request', required: true, placeholder: 'What dish would you like to see a recipe for?', maxLength: 2000 },
        ],
        settings: { success_message: 'Thanks for the suggestion! We\'ll consider adding that recipe.', require_honeypot: true },
      },
      {
        name: 'Newsletter',
        slug: 'newsletter',
        description: 'Get new recipes delivered to your inbox',
        fields: [
          { name: 'email', type: 'email', label: 'Email Address', required: true, placeholder: 'you@example.com' },
        ],
        settings: { success_message: 'You\'re subscribed! New recipes will land in your inbox.', require_honeypot: true },
      },
    ],
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
