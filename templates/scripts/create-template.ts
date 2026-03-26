/**
 * Scaffolding script for creating new Pignal web templates.
 *
 * Usage: pnpm template:create <name>
 *
 * Creates a self-contained template folder at templates/src/<name>/ with
 * config + JSX files. Templates use Tailwind v4 utility classes and import
 * shared components from @pignal/render.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toPascalCase(str: string): string {
  return str
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function die(message: string): never {
  process.stderr.write(`Error: ${message}\n`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const name = process.argv[2];

if (!name) {
  die('Template name required.\n\nUsage: pnpm template:create <name>\nExample: pnpm template:create news');
}

if (!/^[a-z][a-z0-9-]*$/.test(name)) {
  die('Template name must be lowercase alphanumeric with hyphens (e.g. "news", "wiki-docs").');
}

const TEMPLATES_SRC = path.resolve(import.meta.dirname, '..', 'src');
const templateDir = path.join(TEMPLATES_SRC, name);

if (fs.existsSync(templateDir)) {
  die(`Template "${name}" already exists at ${templateDir}`);
}

// ---------------------------------------------------------------------------
// Generated file contents
// ---------------------------------------------------------------------------

const pascal = toPascalCase(name);
const exportName = `${name.replace(/-/g, '')}Template`;
const configName = `${name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())}Config`;

const configTs = `import type { TemplateConfig, TemplateProfile } from '../config';

const ${name.replace(/-/g, '')}Profile: TemplateProfile = {
  id: '${name}',
  displayName: '${pascal}',
  tagline: 'TODO: Add a one-line tagline',
  description: 'TODO: Add a 2-3 sentence description.',
  domain: 'knowledge',
  contentType: 'articles',
  layout: 'feed',
  audience: ['TODO'],
  useCases: ['TODO'],
  differentiators: ['TODO'],
  seedData: {
    types: [
      {
        name: 'Default',
        description: 'Default type',
        icon: '📝',
        color: '#6B7280',
        guidance: {
          pattern: '[Subject] + [Details]',
          example: 'Example item',
          whenToUse: 'Use for general content',
          contentHints: 'Add your content here.',
        },
        actions: ['Reviewed', 'Draft'],
      },
    ],
    workspaces: [],
    settings: {
      sourceTitle: '${pascal}',
      sourceDescription: 'A ${pascal} site powered by Pignal',
      qualityGuidelines: {
        keySummary: { tips: 'Write a clear, descriptive title' },
        content: { tips: 'Write detailed content in markdown' },
        formatting: ['Use markdown formatting'],
        avoid: ['Vague titles'],
      },
      validationLimits: {
        keySummary: { min: 10, max: 140 },
        content: { min: 50, max: 10000 },
      },
    },
  },
};

export const ${configName}: TemplateConfig = {
  profile: ${name.replace(/-/g, '')}Profile,
  vocabulary: {
    item: 'item',
    itemPlural: 'items',
    type: 'type',
    typePlural: 'types',
    workspace: 'collection',
    workspacePlural: 'collections',
    vouch: 'publish',
    vouched: 'published',
  },
  seo: {
    siteSchemaType: 'WebSite',
    itemSchemaType: 'Article',
  },
  mcp: {
    instructions: 'You are managing a ${pascal} site. Create and manage items with clear titles and detailed content.',
    toolDescriptions: {},
    responseLabels: {
      saved: 'Item saved.',
      updated: 'Item updated.',
      validated: 'Item validated.',
      notFound: 'Item not found.',
      found: 'Found {count} of {total} items.',
      visibilityUpdated: 'Visibility updated.',
      batchComplete: 'Batch operation complete.',
      workspaceCreated: 'Collection created.',
      typeCreated: 'Type created.',
    },
    schemaDescriptions: {},
  },
};
`;

const indexTs = `import type { Template, PartialResultsProps } from '../types';
import { ${configName} as config } from './config';
import { ${pascal}SourcePage } from './source-page';
import { ${pascal}ItemPost } from './item-post';
import { ${pascal}Layout } from './layout';
import { FeedResults } from '@pignal/render/components/item-feed';

function ${pascal}PartialResults(props: PartialResultsProps) {
  return (
    <FeedResults
      items={props.items}
      total={props.total}
      limit={props.limit}
      offset={props.offset}
      paginationBase={props.paginationBase}
      sort={props.sort}
      basePath="/item"
      tagBasePath="/"
      showReadingTime={true}
      emptyMessage={\`No \${config.vocabulary.vouched} \${config.vocabulary.itemPlural} matching this filter.\`}
    />
  );
}

export const ${exportName}: Template = {
  SourcePage: ${pascal}SourcePage,
  ItemPost: ${pascal}ItemPost,
  Layout: ${pascal}Layout,
  PartialResults: ${pascal}PartialResults,
  vocabulary: config.vocabulary,
  seo: config.seo,
  profile: config.profile,
  styles: '',
};
`;

const sourcePageTsx = `import type { SourcePageProps } from '../types';
import { FilterBar } from '@pignal/render/components/type-sidebar';
import { FeedResults } from '@pignal/render/components/item-feed';
import { JsonLd } from '@pignal/render/components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr, resolveOgImage } from '@pignal/render/lib/seo';
import { ${pascal}Layout } from './layout';

export function ${pascal}SourcePage(props: SourcePageProps) {
  const {
    items, types, workspaces, counts, settings, filters,
    pagination, paginationBase, sourceUrl,
  } = props;

  const showReadingTime = settings.source_show_reading_time !== 'false';
  const sourceTitle = settings.source_title || '${pascal}';
  const sourceDescription = settings.source_description || '';

  const activeType = filters.typeId ? types.find((t) => t.id === filters.typeId) : undefined;
  const activeWorkspace = filters.workspaceId ? workspaces.find((w) => w.id === filters.workspaceId) : undefined;

  let pageTitle = sourceTitle;
  if (activeType) pageTitle = \`\${activeType.name} | \${sourceTitle}\`;
  else if (activeWorkspace) pageTitle = \`\${activeWorkspace.name} | \${sourceTitle}\`;
  else if (filters.tag) pageTitle = \`#\${filters.tag} | \${sourceTitle}\`;

  const ogImage = resolveOgImage(settings, sourceUrl);
  const jsonLd = buildSourceJsonLd(settings, sourceUrl);
  const metaTags = buildMetaTags({
    title: pageTitle, description: sourceDescription,
    canonicalUrl: sourceUrl || '/', ogType: 'website',
    feedUrl: \`\${sourceUrl}/feed.xml\`, imageUrl: ogImage,
  });

  const filterParams = new URLSearchParams();
  if (filters.typeId) filterParams.set('type', filters.typeId);
  if (filters.workspaceId) filterParams.set('workspace', filters.workspaceId);
  if (filters.tag) filterParams.set('tag', filters.tag);
  if (filters.q) filterParams.set('q', filters.q);
  if (filters.sort === 'oldest') filterParams.set('sort', 'oldest');
  const filterQs = filterParams.toString();

  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  let relLinks = '';
  const safeSourceUrl = escapeHtmlAttr(sourceUrl);
  const baseUrl = filterQs ? \`\${safeSourceUrl}/?\${escapeHtmlAttr(filterQs)}\` : \`\${safeSourceUrl}/\`;
  const sep = filterQs ? '&amp;' : '?';
  if (currentPage > 1) relLinks += \`\\n    <link rel="prev" href="\${baseUrl}\${sep}offset=\${(currentPage - 2) * pagination.limit}">\`;
  if (currentPage < totalPages) relLinks += \`\\n    <link rel="next" href="\${baseUrl}\${sep}offset=\${currentPage * pagination.limit}">\`;

  return (
    <${pascal}Layout title={sourceTitle} head={\`\${metaTags}\${relLinks}\`} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-12 w-full flex flex-col">
        <FilterBar types={types} activeTypeId={filters.typeId} workspaces={workspaces} activeWorkspaceId={filters.workspaceId} activeTag={filters.tag} sort={filters.sort} counts={counts} query={filters.q} />
        <div id="source-loading" class="source-loading htmx-indicator"><span class="app-spinner" /></div>
        <div id="source-results">
          <FeedResults items={items} total={pagination.total} limit={pagination.limit} offset={pagination.offset} paginationBase={paginationBase} sort={filters.sort} basePath="/item" tagBasePath="/" showReadingTime={showReadingTime} emptyMessage="No items matching this filter." />
        </div>
      </div>
    </${pascal}Layout>
  );
}
`;

const itemPostTsx = `import type { ItemPostProps } from '../types';
import { TypeBadge } from '@pignal/render/components/type-badge';
import { SourceActionBar } from '@pignal/render/components/source-action-bar';
import { JsonLd } from '@pignal/render/components/json-ld';
import { buildSourcePostingJsonLd, buildMetaTags, resolveOgImage } from '@pignal/render/lib/seo';
import { stripMarkdown } from '@pignal/render/lib/markdown';
import { formatDate, readingTime } from '@pignal/render/lib/time';
import { raw } from 'hono/html';
import { ${pascal}Layout } from './layout';

export function ${pascal}ItemPost(props: ItemPostProps) {
  const { item, settings, renderedContent, sourceUrl, sourceAuthor, githubUrl } = props;

  const sourceTitle = settings.source_title || '${pascal}';
  const showReadingTime = settings.source_show_reading_time !== 'false';
  const ogImage = resolveOgImage(settings, sourceUrl);
  const description = stripMarkdown(item.content).slice(0, 160);
  const jsonLd = buildSourcePostingJsonLd(item, settings, sourceUrl, description);
  const metaTags = buildMetaTags({
    title: \`\${item.keySummary} | \${sourceTitle}\`, description,
    canonicalUrl: \`\${sourceUrl}/item/\${item.slug}\`, ogType: 'article',
    feedUrl: \`\${sourceUrl}/feed.xml\`, imageUrl: ogImage,
  });

  return (
    <${pascal}Layout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />
      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-12 w-full">
        <main>
          <SourceActionBar slug={item.slug ?? undefined} sourceUrl={sourceUrl} />
          <article>
            <header>
              <div class="mb-3"><TypeBadge typeName={item.typeName} /></div>
              <h1 class="text-2xl sm:text-3xl font-bold tracking-tight mb-3">{item.keySummary}</h1>
              <div class="flex items-center gap-2.5 flex-wrap text-sm text-muted">
                {githubUrl ? <a href={githubUrl} target="_blank" rel="noopener" class="font-medium text-muted hover:text-primary transition-colors">{sourceAuthor}</a> : <span>{sourceAuthor}</span>}
                <time datetime={item.vouchedAt || item.createdAt}>{formatDate(item.vouchedAt || item.createdAt)}</time>
                {showReadingTime && <span>{readingTime(item.content)}</span>}
              </div>
            </header>
            <div class="content mt-6 pt-6 border-t border-border">{raw(renderedContent)}</div>
            {item.tags && item.tags.length > 0 && (
              <footer class="mt-6 pt-3 border-t border-border">
                <div class="flex items-center gap-1.5 flex-wrap">
                  {item.tags.map((t) => <a href={\`/?tag=\${encodeURIComponent(t)}\`} class="inline-block px-2 py-0.5 rounded text-xs font-medium text-muted/70 bg-border no-underline whitespace-nowrap hover:text-primary hover:bg-primary-focus transition-colors">#{t}</a>)}
                </div>
              </footer>
            )}
          </article>
        </main>
      </div>
    </${pascal}Layout>
  );
}
`;

const layoutTsx = `import type { LayoutProps } from '../types';
import { PublicLayout } from '@pignal/render/components/public-layout';

export function ${pascal}Layout({ title, head, sourceTitle, sourceUrl, settings, children, visitor, t, locale, defaultLocale }: LayoutProps) {
  return (
    <PublicLayout title={title} head={head || ''} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings} visitor={visitor} t={t} locale={locale} defaultLocale={defaultLocale}>
      {children}
    </PublicLayout>
  );
}
`;

// ---------------------------------------------------------------------------
// Write template files
// ---------------------------------------------------------------------------

fs.mkdirSync(templateDir, { recursive: true });

fs.writeFileSync(path.join(templateDir, 'config.ts'), configTs);
fs.writeFileSync(path.join(templateDir, 'index.tsx'), indexTs);
fs.writeFileSync(path.join(templateDir, 'source-page.tsx'), sourcePageTsx);
fs.writeFileSync(path.join(templateDir, 'item-post.tsx'), itemPostTsx);
fs.writeFileSync(path.join(templateDir, 'layout.tsx'), layoutTsx);

// ---------------------------------------------------------------------------
// Auto-register in all-configs.ts
// ---------------------------------------------------------------------------

const allConfigsPath = path.join(TEMPLATES_SRC, 'all-configs.ts');
let allConfigs = fs.readFileSync(allConfigsPath, 'utf-8');

// Add import
const importLine = `import { ${configName} } from './${name}/config';`;
const lastImportMatch = allConfigs.match(/^import .+ from '\.\/.+\/config';$/gm);
if (lastImportMatch) {
  const lastImport = lastImportMatch[lastImportMatch.length - 1];
  allConfigs = allConfigs.replace(lastImport, `${lastImport}\n${importLine}`);
}

// Add to TEMPLATE_CONFIGS record
allConfigs = allConfigs.replace(
  /^(export const TEMPLATE_CONFIGS[^}]*)(};)/m,
  `$1  '${name}': ${configName},\n$2`,
);

// Add to re-exports
const reExportMatch = allConfigs.match(/^export \{[^}]+\} from '\.\/all-configs';/m);
if (!reExportMatch) {
  // Add re-export at the end
  allConfigs += `\nexport { ${configName} };\n`;
}

fs.writeFileSync(allConfigsPath, allConfigs);

// ---------------------------------------------------------------------------
// Auto-register in templates.json
// ---------------------------------------------------------------------------

const catalogPath = path.resolve(import.meta.dirname, '../templates.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
const maxIndex = Math.max(0, ...catalog.map((t: { index: number }) => t.index));

catalog.push({
  index: maxIndex + 1,
  id: name,
  exportName,
  configName,
  displayName: pascal,
  tagline: `TODO: Add a one-line tagline for ${pascal}`,
  group: 'Other',
  domain: 'knowledge',
  contentType: 'articles',
  layout: 'feed',
  status: 'shipped',
  differentiators: [],
});

fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n', 'utf-8');

// ---------------------------------------------------------------------------
// Success output
// ---------------------------------------------------------------------------

process.stdout.write(`
Template "${name}" created successfully!

Files created:
  ${templateDir}/
    config.ts         Template configuration (vocabulary, SEO, MCP)
    index.tsx         Template definition and exports
    source-page.tsx   Source page (feed/list view)
    item-post.tsx     Item post page (detail view)
    layout.tsx        Layout wrapper (uses PublicLayout from @pignal/render)

Registry updated:
  ${allConfigsPath}

Next steps:
  1. Customize the config in ${name}/config.ts (vocabulary, SEO, MCP instructions)
  2. Customize the source-page.tsx layout (use Tailwind utility classes)
  3. Adjust the article layout in item-post.tsx
  4. (Optional) Add seed data in templates/seeds/${name}.sql
  5. Set TEMPLATE = "${name}" in server/wrangler.toml
  6. Run: pnpm resolve-template && pnpm css:build && pnpm dev:server
  7. Preview at http://localhost:8787

See templates/TEMPLATE_GUIDE.md for full documentation.
`);
