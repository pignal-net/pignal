import type { ItemPostProps } from '@pignal/templates';
import { TypeBadge } from '../../components/type-badge';

import { SourceActionBar } from '../../components/source-action-bar';
import { JsonLd } from '../../components/json-ld';
import { buildSourcePostingJsonLd, buildMetaTags, resolveOgImage } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { formatDate, readingTime } from '../../lib/time';
import { raw } from 'hono/html';
import { WikiLayout } from './layout';

export function WikiItemPost(props: ItemPostProps) {
  const {
    item,
    settings,
    renderedContent,
    headings: _headings,
    sourceUrl,
    sourceAuthor,
    githubUrl,
    vocabulary: _vocabulary,
  } = props;

  const sourceTitle = settings.source_title || 'My Knowledge Base';
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

  return (
    <WikiLayout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="max-w-4xl mx-auto px-4 pt-8 pb-16">
        <div class="min-w-0 max-w-full">
          <SourceActionBar slug={item.slug ?? undefined} sourceUrl={sourceUrl} />

          {/* Breadcrumb */}
          <nav class="flex items-center gap-1.5 text-sm text-muted mb-4 flex-wrap" aria-label="Breadcrumb">
            <a href="/" class="text-primary no-underline hover:underline">{sourceTitle}</a>
            <span class="text-muted opacity-50">/</span>
            {item.workspaceName && (
              <>
                <a href={`/?workspace=${item.workspaceId}`} class="text-primary no-underline hover:underline">{item.workspaceName}</a>
                <span class="text-muted opacity-50">/</span>
              </>
            )}
            <span>{item.keySummary}</span>
          </nav>

          <article class="source-article">
            <header>
              <div class="source-category">
                <TypeBadge typeName={item.typeName} />
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
                {item.validationActionLabel && (
                  <span class="validation-badge">
                    {item.validationActionLabel} by {sourceAuthor}
                  </span>
                )}
              </div>
            </header>
            <div class="mt-8 content">
              {raw(renderedContent)}
            </div>
            {item.tags && item.tags.length > 0 && (
              <footer class="mt-10 pt-6 border-t border-border-subtle">
                <div class="item-tags">
                  {item.tags.map((t) => (
                    <a href={`/?tag=${encodeURIComponent(t)}`} class="item-tag">#{t}</a>
                  ))}
                </div>
              </footer>
            )}
          </article>
        </div>
      </div>
    </WikiLayout>
  );
}
