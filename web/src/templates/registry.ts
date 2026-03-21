import type { Template } from '@pignal/templates';
import { blogTemplate } from './blog';
import { shopTemplate } from './shop';
import { awesomelistTemplate } from './awesome-list';
import { bookshelfTemplate } from './bookshelf';
import { casestudiesTemplate } from './case-studies';
import { changelogTemplate } from './changelog';
import { courseTemplate } from './course';
import { directoryTemplate } from './directory';
import { flashcardsTemplate } from './flashcards';
import { glossaryTemplate } from './glossary';
import { incidentsTemplate } from './incidents';
import { journalTemplate } from './journal';
import { magazineTemplate } from './magazine';
import { menuTemplate } from './menu';
import { podcastTemplate } from './podcast';
import { portfolioTemplate } from './portfolio';
import { recipesTemplate } from './recipes';
import { resumeTemplate } from './resume';
import { reviewsTemplate } from './reviews';
import { runbookTemplate } from './runbook';
import { servicesTemplate } from './services';
import { tilTemplate } from './til';
import { wikiTemplate } from './wiki';
import { writingTemplate } from './writing';

const TEMPLATES: Record<string, Template> = {
  blog: blogTemplate,
  shop: shopTemplate,
  'awesome-list': awesomelistTemplate,
  bookshelf: bookshelfTemplate,
  'case-studies': casestudiesTemplate,
  changelog: changelogTemplate,
  course: courseTemplate,
  directory: directoryTemplate,
  flashcards: flashcardsTemplate,
  glossary: glossaryTemplate,
  incidents: incidentsTemplate,
  journal: journalTemplate,
  magazine: magazineTemplate,
  menu: menuTemplate,
  podcast: podcastTemplate,
  portfolio: portfolioTemplate,
  recipes: recipesTemplate,
  resume: resumeTemplate,
  reviews: reviewsTemplate,
  runbook: runbookTemplate,
  services: servicesTemplate,
  til: tilTemplate,
  wiki: wikiTemplate,
  writing: writingTemplate,
};

export function getTemplate(templateName: string): Template {
  return TEMPLATES[templateName] || TEMPLATES.blog;
}

export function getAvailableTemplates(): { key: string; name: string; description: string }[] {
  return Object.entries(TEMPLATES).map(([key, t]) => ({ key, name: t.profile.displayName, description: t.profile.tagline }));
}
