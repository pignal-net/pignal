import type { TemplateConfig } from './config';

import { blogConfig } from './blog/config';
import { shopConfig } from './shop/config';
import { tilConfig } from './til/config';
import { reviewsConfig } from './reviews/config';
import { journalConfig } from './journal/config';
import { writingConfig } from './writing/config';
import { awesomeConfig } from './awesome-list/config';
import { podcastConfig } from './podcast/config';
import { portfolioConfig } from './portfolio/config';
import { recipesConfig } from './recipes/config';
import { bookshelfConfig } from './bookshelf/config';
import { flashcardsConfig } from './flashcards/config';
import { wikiConfig } from './wiki/config';
import { courseConfig } from './course/config';
import { runbookConfig } from './runbook/config';
import { servicesConfig } from './services/config';
import { directoryConfig } from './directory/config';
import { changelogConfig } from './changelog/config';
import { incidentsConfig } from './incidents/config';
import { magazineConfig } from './magazine/config';
import { caseStudiesConfig } from './case-studies/config';
import { menuConfig } from './menu/config';
import { glossaryConfig } from './glossary/config';
import { resumeConfig } from './resume/config';

export const TEMPLATE_CONFIGS: Record<string, TemplateConfig> = {
  blog: blogConfig,
  shop: shopConfig,
  til: tilConfig,
  reviews: reviewsConfig,
  journal: journalConfig,
  writing: writingConfig,
  'awesome-list': awesomeConfig,
  podcast: podcastConfig,
  portfolio: portfolioConfig,
  recipes: recipesConfig,
  bookshelf: bookshelfConfig,
  flashcards: flashcardsConfig,
  wiki: wikiConfig,
  course: courseConfig,
  runbook: runbookConfig,
  services: servicesConfig,
  directory: directoryConfig,
  changelog: changelogConfig,
  incidents: incidentsConfig,
  magazine: magazineConfig,
  'case-studies': caseStudiesConfig,
  menu: menuConfig,
  glossary: glossaryConfig,
  resume: resumeConfig,
};

/** Get template config by name. Falls back to blog. */
export function getTemplateConfig(templateName: string): TemplateConfig {
  return TEMPLATE_CONFIGS[templateName] ?? blogConfig;
}

// Re-export individual configs
export {
  blogConfig,
  shopConfig,
  tilConfig,
  reviewsConfig,
  journalConfig,
  writingConfig,
  awesomeConfig,
  podcastConfig,
  portfolioConfig,
  recipesConfig,
  bookshelfConfig,
  flashcardsConfig,
  wikiConfig,
  courseConfig,
  runbookConfig,
  servicesConfig,
  directoryConfig,
  changelogConfig,
  incidentsConfig,
  magazineConfig,
  caseStudiesConfig,
  menuConfig,
  glossaryConfig,
  resumeConfig,
};
