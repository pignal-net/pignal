import type { TemplateConfig, TemplateProfile } from '../config';

const flashcardsProfile: TemplateProfile = {
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
