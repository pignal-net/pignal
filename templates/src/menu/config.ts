import type { TemplateConfig, TemplateProfile } from '../config';

const menuProfile: TemplateProfile = {
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
