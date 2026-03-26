import type { ItemPostProps } from '@pignal/templates';
import { TypeBadge } from '../../components/type-badge';

import { SourceActionBar } from '../../components/source-action-bar';
import { JsonLd } from '../../components/json-ld';
import { buildSourcePostingJsonLd, buildMetaTags, resolveOgImage } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { formatDate, readingTime } from '../../lib/time';
import { raw } from 'hono/html';
import { RunbookLayout } from './layout';

export function RunbookItemPost(props: ItemPostProps) {
  const {
    item,
    settings,
    renderedContent,
    headings,
    sourceUrl,
    sourceAuthor,
    githubUrl,
    vocabulary: _vocabulary,
  } = props;

  const sourceTitle = settings.source_title || 'My Runbook';
  const showReadingTime = settings.source_show_reading_time !== 'false';

  const ogImage = resolveOgImage(settings, sourceUrl);

  const description = stripMarkdown(item.content).slice(0, 160);
  const jsonLd = buildSourcePostingJsonLd(item, settings, sourceUrl, description, props.seo);
  const metaTags = buildMetaTags({
    title: `${item.keySummary} | ${sourceTitle}`,
    description,
    canonicalUrl: `${sourceUrl}/item/${item.slug}`,
    ogType: 'article',
    feedUrl: `${sourceUrl}/feed.xml`,
    imageUrl: ogImage,
  });

  // Extract prerequisites if content starts with a prerequisites section
  const contentLower = item.content.toLowerCase();
  const hasPrerequisites = contentLower.startsWith('## prerequisites') ||
    contentLower.startsWith('# prerequisites') ||
    contentLower.includes('\n## prerequisites');

  // Count steps (headings that look like numbered steps)
  const stepCount = headings
    ? headings.filter((h) => h.level === 2 && /^(step\s+\d|#?\d+[\.\):])/i.test(h.text)).length
    : 0;

  return (
    <RunbookLayout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="max-w-4xl mx-auto px-4 pt-8 pb-16">
        <div class="min-w-0 max-w-full">
          <SourceActionBar slug={item.slug ?? undefined} sourceUrl={sourceUrl} t={props.t} />

          {/* Breadcrumb */}
          <nav class="flex items-center gap-1.5 text-sm text-muted mb-4 flex-wrap" aria-label="Breadcrumb">
            <a href="/" class="text-primary no-underline hover:underline">{sourceTitle}</a>
            <span class="text-muted opacity-50">/</span>
            {item.typeName && (
              <>
                <a href={`/?type=${item.typeId}`} class="text-primary no-underline hover:underline">{item.typeName}</a>
                <span class="text-muted opacity-50">/</span>
              </>
            )}
            <span>{item.keySummary}</span>
          </nav>

          <article class="source-article">
            <header>
              <div class="source-category">
                <TypeBadge typeName={item.typeName} />
                {item.workspaceName && (
                  <a href={`/?workspace=${item.workspaceId}`} class="workspace-badge">{item.workspaceName}</a>
                )}
              </div>
              <h1>{item.keySummary}</h1>
              <div class="post-meta flex items-center gap-2.5 flex-wrap text-sm text-muted">
                {githubUrl ? (
                  <a href={githubUrl} target="_blank" rel="noopener" class="post-author">
                    {sourceAuthor}
                  </a>
                ) : (
                  <span>{sourceAuthor}</span>
                )}
                <time datetime={item.vouchedAt || item.createdAt}>
                  {formatDate(item.vouchedAt || item.createdAt)}
                </time>
                {showReadingTime && <span>{readingTime(item.content)}</span>}
                {stepCount > 0 && <span>{stepCount} steps</span>}
                {item.validationActionLabel && (
                  <span class="validation-badge">
                    {item.validationActionLabel} by {sourceAuthor}
                  </span>
                )}
              </div>
            </header>

            {/* Prerequisites callout if detected */}
            {hasPrerequisites && (
              <div class="p-4 mb-6 rounded-lg bg-info-bg border border-info-border" role="note">
                <div class="text-sm font-bold uppercase tracking-wide text-info mb-1">Prerequisites</div>
                <div class="text-sm text-muted">Check the prerequisites section below before proceeding.</div>
              </div>
            )}

            <div class="mt-8 content">
              {raw(renderedContent)}
            </div>

            {item.tags && item.tags.length > 0 && (
              <footer class="mt-10 pt-6 border-t border-border-subtle">
                <div class="flex flex-wrap gap-2">
                  {item.tags.map((t) => (
                    <a href={`/?tag=${encodeURIComponent(t)}`} class="inline-block px-3 py-1 rounded-full text-sm font-medium text-muted no-underline border border-border-subtle hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-colors">#{t}</a>
                  ))}
                </div>
              </footer>
            )}
          </article>
        </div>
      </div>
    </RunbookLayout>
  );
}
