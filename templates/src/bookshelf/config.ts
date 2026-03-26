import type { TemplateConfig, TemplateProfile } from '../config';

const bookshelfProfile: TemplateProfile = {
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
