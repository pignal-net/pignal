import type { ItemPostProps } from '@pignal/templates';
import { TypeBadge } from '../../components/type-badge';
import { SourceActionBar } from '../../components/source-action-bar';
import { JsonLd } from '../../components/json-ld';
import { buildSourcePostingJsonLd, buildMetaTags, resolveOgImage } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { formatDate, readingTime } from '../../lib/time';
import { raw } from 'hono/html';
import { CourseLayout } from './layout';

export function CourseItemPost(props: ItemPostProps) {
  const {
    item,
    settings,
    renderedContent,
    sourceUrl,
    sourceAuthor,
    githubUrl,
    vocabulary: _vocabulary,
  } = props;

  const sourceTitle = settings.source_title || 'My Course';
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
    <CourseLayout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings} visitor={props.visitor}>
      <JsonLd data={jsonLd} />

      <div class="max-w-3xl mx-auto px-4 pt-8 pb-16">
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
          <header class="mb-6">
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
              <div class="flex flex-wrap gap-2">
                {item.tags.map((t) => (
                  <a href={`/?tag=${encodeURIComponent(t)}`} class="inline-block px-3 py-1 rounded-full text-sm font-medium text-muted no-underline border border-border-subtle hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-colors">#{t}</a>
                ))}
              </div>
            </footer>
          )}

          {/* Navigation back to course */}
          <nav class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10 pt-6 border-t border-border-subtle" aria-label="Lesson navigation">
            <a href={item.typeId ? `/?type=${item.typeId}` : '/'} class="card-hover flex flex-col gap-1 px-4 py-3 border border-border-subtle shadow-card rounded-xl no-underline text-text transition-all hover:border-primary hover:bg-primary/4">
              <span class="text-[0.72rem] uppercase tracking-wide text-muted font-semibold">Back to</span>
              <span class="text-[0.9rem] font-medium text-primary">{item.typeName || 'All lessons'}</span>
            </a>
          </nav>
        </article>
      </div>
    </CourseLayout>
  );
}
