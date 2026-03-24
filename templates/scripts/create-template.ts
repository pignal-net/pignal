/**
 * Scaffolding script for creating new Pignal web templates.
 *
 * Usage: pnpm template:create <name>
 *
 * Creates a complete template folder at web/src/templates/<name>/ and
 * registers it in the template registry. Templates use Tailwind v4 utility
 * classes — no separate styles.css files.
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

const WEB_TEMPLATES_DIR = path.resolve(import.meta.dirname, '..', '..', 'web', 'src', 'templates');
const templateDir = path.join(WEB_TEMPLATES_DIR, name);

if (fs.existsSync(templateDir)) {
  die(`Template "${name}" already exists at ${templateDir}`);
}

// ---------------------------------------------------------------------------
// Generated file contents
// ---------------------------------------------------------------------------

const pascal = toPascalCase(name);
const exportName = `${name.replace(/-/g, '')}Template`;

const indexTs = `import type { Template, PartialResultsProps } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { ${pascal}SourcePage } from './source-page';
import { ${pascal}ItemPost } from './item-post';
import { ${pascal}Layout } from './layout';
import { FeedResults } from '../../components/item-feed';

const config = getTemplateConfig('${name}');

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

const sourcePageTsx = `import type { SourcePageProps } from '@pignal/templates';
import { FilterBar } from '../../components/type-sidebar';
import { FeedResults } from '../../components/item-feed';
import { JsonLd } from '../../components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr, resolveOgImage } from '../../lib/seo';
import { ${pascal}Layout } from './layout';

export function ${pascal}SourcePage(props: SourcePageProps) {
  const {
    items,
    types,
    workspaces,
    counts,
    settings,
    filters,
    pagination,
    paginationBase,
    sourceUrl,
  } = props;

  const showReadingTime = settings.source_show_reading_time !== 'false';
  // TODO: Customize default title and description for your template.
  const sourceTitle = settings.source_title || 'My Items';
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
    title: pageTitle,
    description: sourceDescription,
    canonicalUrl: sourceUrl || '/',
    ogType: 'website',
    feedUrl: \`\${sourceUrl}/feed.xml\`,
    imageUrl: ogImage,
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
  if (currentPage > 1) {
    relLinks += \`\\n    <link rel="prev" href="\${baseUrl}\${sep}offset=\${(currentPage - 2) * pagination.limit}">\`;
  }
  if (currentPage < totalPages) {
    relLinks += \`\\n    <link rel="next" href="\${baseUrl}\${sep}offset=\${currentPage * pagination.limit}">\`;
  }

  const headContent = \`\${metaTags}\${relLinks}\`;

  // TODO: Customize the layout below. The default uses the shared FilterBar + FeedResults
  // components which include all HTMX attributes for smooth partial-page updates.
  // Styling uses Tailwind v4 utility classes — see web/src/styles/input.css for design tokens.
  // Available color utilities: text-text, text-muted, text-primary, bg-surface, bg-bg-page,
  // bg-surface-raised, border-border, text-success, text-error, shadow-sm, shadow-md, etc.

  return (
    <${pascal}Layout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-12 w-full flex flex-col">
        <FilterBar types={types} activeTypeId={filters.typeId} workspaces={workspaces} activeWorkspaceId={filters.workspaceId} activeTag={filters.tag} sort={filters.sort} counts={counts} query={filters.q} />

        <div id="source-loading" class="source-loading htmx-indicator">
          <span class="app-spinner" />
        </div>
        <div id="source-results">
          <FeedResults
            items={items}
            total={pagination.total}
            limit={pagination.limit}
            offset={pagination.offset}
            paginationBase={paginationBase}
            sort={filters.sort}
            basePath="/item"
            tagBasePath="/"
            showReadingTime={showReadingTime}
            emptyMessage="No items matching this filter."
          />
        </div>
      </div>
    </${pascal}Layout>
  );
}
`;

const itemPostTsx = `import type { ItemPostProps } from '@pignal/templates';
import { TypeBadge } from '../../components/type-badge';
import { TableOfContents } from '../../components/table-of-contents';
import { SourceActionBar } from '../../components/source-action-bar';
import { JsonLd } from '../../components/json-ld';
import { buildSourcePostingJsonLd, buildMetaTags, resolveOgImage } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { formatDate, readingTime } from '../../lib/time';
import { raw } from 'hono/html';
import { ${pascal}Layout } from './layout';

export function ${pascal}ItemPost(props: ItemPostProps) {
  const {
    item,
    settings,
    renderedContent,
    headings,
    sourceUrl,
    sourceAuthor,
    githubUrl,
  } = props;

  const sourceTitle = settings.source_title || 'My Pignal';
  const showToc = settings.source_show_toc !== 'false';
  const showReadingTime = settings.source_show_reading_time !== 'false';

  const ogImage = resolveOgImage(settings, sourceUrl);

  const description = stripMarkdown(item.content).slice(0, 160);
  const jsonLd = buildSourcePostingJsonLd(item, settings, sourceUrl, description);
  const metaTags = buildMetaTags({
    title: \`\${item.keySummary} | \${sourceTitle}\`,
    description,
    canonicalUrl: \`\${sourceUrl}/item/\${item.slug}\`,
    ogType: 'article',
    feedUrl: \`\${sourceUrl}/feed.xml\`,
    imageUrl: ogImage,
  });

  return (
    <${pascal}Layout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_200px] gap-10 items-start max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-12 w-full">
        <main class="min-w-0 max-w-full break-words">
          <SourceActionBar slug={item.slug ?? undefined} sourceUrl={sourceUrl} />

          {/* TODO: Customize the article layout for your template. */}
          <article class="min-w-0 max-w-full">
            <header>
              <div class="mb-3">
                <TypeBadge typeName={item.typeName} />
                {item.workspaceName && (
                  <a href={\`/?workspace=\${item.workspaceId}\`} class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[0.7rem] font-medium text-muted/70 bg-muted/15 no-underline hover:text-primary transition-colors">{item.workspaceName}</a>
                )}
              </div>
              <h1 class="text-2xl sm:text-3xl font-bold tracking-tight mb-3">{item.keySummary}</h1>
              <div class="flex items-center gap-2.5 flex-wrap text-sm text-muted">
                {githubUrl ? (
                  <a href={githubUrl} target="_blank" rel="noopener" class="font-medium text-muted hover:text-primary transition-colors">
                    {sourceAuthor}
                  </a>
                ) : (
                  <span>{sourceAuthor}</span>
                )}
                <time datetime={item.vouchedAt || item.createdAt}>
                  {formatDate(item.vouchedAt || item.createdAt)}
                </time>
                {showReadingTime && <span>{readingTime(item.content)}</span>}
                {item.validationActionLabel && (
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-success/80 bg-success-bg">
                    {item.validationActionLabel} by {sourceAuthor}
                  </span>
                )}
              </div>
            </header>
            <div class="content mt-6 pt-6 border-t border-border">
              {raw(renderedContent)}
            </div>
            {item.tags && item.tags.length > 0 && (
              <footer class="mt-6 pt-3 border-t border-border">
                <div class="flex items-center gap-1.5 flex-wrap">
                  {item.tags.map((t) => (
                    <a href={\`/?tag=\${encodeURIComponent(t)}\`} class="inline-block px-2 py-0.5 rounded text-xs font-medium text-muted/70 bg-border no-underline whitespace-nowrap hover:text-primary hover:bg-primary-focus transition-colors">#{t}</a>
                  ))}
                </div>
              </footer>
            )}
          </article>
        </main>

        {showToc && (
          <div class="max-xl:hidden">
            <TableOfContents headings={headings} />
          </div>
        )}
      </div>
    </${pascal}Layout>
  );
}
`;

const layoutTsx = `import type { LayoutProps } from '@pignal/templates';
import { PublicLayout } from '../../components/public-layout';

// TODO: If your template needs a custom header/footer or extra wrapping elements,
// add them here around the {children}. Otherwise the default PublicLayout works out of the box.
export function ${pascal}Layout({ title, head, sourceTitle, sourceUrl, settings, children }: LayoutProps) {
  return (
    <PublicLayout
      title={title}
      head={head || ''}
      sourceTitle={sourceTitle}
      sourceUrl={sourceUrl}
      settings={settings}
    >
      {children}
    </PublicLayout>
  );
}
`;

// ---------------------------------------------------------------------------
// Write template files
// ---------------------------------------------------------------------------

fs.mkdirSync(templateDir, { recursive: true });

fs.writeFileSync(path.join(templateDir, 'index.tsx'), indexTs);
fs.writeFileSync(path.join(templateDir, 'source-page.tsx'), sourcePageTsx);
fs.writeFileSync(path.join(templateDir, 'item-post.tsx'), itemPostTsx);
fs.writeFileSync(path.join(templateDir, 'layout.tsx'), layoutTsx);

// ---------------------------------------------------------------------------
// Auto-register in registry.ts
// ---------------------------------------------------------------------------

const registryPath = path.join(WEB_TEMPLATES_DIR, 'registry.ts');
let registry = fs.readFileSync(registryPath, 'utf-8');

// Add import line after existing template imports
const importLine = `import { ${exportName} } from './${name}';`;
const lastImportMatch = registry.match(/^import .+ from '\.\/.+';$/gm);
if (lastImportMatch) {
  const lastImport = lastImportMatch[lastImportMatch.length - 1];
  registry = registry.replace(lastImport, `${lastImport}\n${importLine}`);
} else {
  // Fallback: insert after type imports
  registry = registry.replace(
    /^(import type .+;\n)/m,
    `$1${importLine}\n`,
  );
}

// Add to TEMPLATES record — insert before the closing brace
registry = registry.replace(
  /^(const TEMPLATES: Record<string, Template> = \{[^}]*)(};)/m,
  `$1  ${name}: ${exportName},\n$2`,
);

fs.writeFileSync(registryPath, registry);

// ---------------------------------------------------------------------------
// Success output
// ---------------------------------------------------------------------------

process.stdout.write(`
Template "${name}" created successfully!

Files created:
  ${templateDir}/
    index.tsx         Template definition and exports
    source-page.tsx   Source page (feed/list view)
    item-post.tsx     Item post page (detail view)
    layout.tsx        Layout wrapper (uses PublicLayout)

Registry updated:
  ${registryPath}

Next steps:
  1. Add a TemplateConfig in templates/src/config.ts with vocabulary, SEO, and MCP content
  2. Customize the card component in source-page.tsx (use Tailwind utility classes)
  3. Adjust the article layout in item-post.tsx
  4. (Optional) Add a custom header/footer in layout.tsx
  5. (Optional) Add seed data in templates/seeds/${name}.sql
  6. Set TEMPLATE = "${name}" under [vars] in server/wrangler.toml
  7. Run \`pnpm css:build && pnpm dev:server\` and preview at http://localhost:8787

See templates/TEMPLATE_GUIDE.md for full documentation.
`);
