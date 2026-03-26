import type { ItemPostProps } from '@pignal/templates';
import { TypeBadge } from '../../components/type-badge';

import { SourceActionBar } from '../../components/source-action-bar';
import { JsonLd } from '../../components/json-ld';
import { buildSourcePostingJsonLd, buildMetaTags, resolveOgImage } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { formatDate, readingTime } from '../../lib/time';
import { raw } from 'hono/html';
import { BlogLayout } from './layout';

function formatAiSource(sourceAi: string): string | null {
  if (!sourceAi) return null;
  if (sourceAi === 'mcp-self-hosted') return 'MCP';
  const parts = sourceAi.split(':');
  return parts.length === 2 ? parts[1] : sourceAi;
}

export function BlogItemPost(props: ItemPostProps) {
  const {
    item,
    settings,
    renderedContent,
    headings: _headings,
    sourceUrl,
    sourceAuthor,
    githubUrl,
    t: _t,
    locale: _locale,
    defaultLocale: _defaultLocale,
    localePrefix,
  } = props;

  const sourceTitle = settings.source_title || 'My Pignal';
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
    <BlogLayout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings} t={props.t} locale={props.locale} defaultLocale={props.defaultLocale} visitor={props.visitor}>
      <JsonLd data={jsonLd} />

      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-16 w-full">

        <main class="min-w-0 max-w-full break-words">
          <SourceActionBar slug={item.slug ?? undefined} sourceUrl={sourceUrl} t={props.t} />

          <article class="source-article min-w-0 max-w-full drop-cap">
            <header>
              <div class="mb-4">
                <TypeBadge typeName={item.typeName} />
                {item.workspaceName && (
                  <a href={`${localePrefix}/?workspace=${item.workspaceId}`} class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary ml-2">{item.workspaceName}</a>
                )}
              </div>
              <h1 class="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-4">{item.keySummary}</h1>
              <div class="flex items-center gap-2.5 flex-wrap text-sm text-muted">
                {!item.validationActionLabel && (
                  githubUrl ? (
                    <a href={githubUrl} target="_blank" rel="noopener" class="font-medium text-text hover:text-primary transition-colors">
                      {sourceAuthor}
                    </a>
                  ) : (
                    <span>{sourceAuthor}</span>
                  )
                )}
                <time datetime={item.vouchedAt || item.createdAt}>
                  {formatDate(item.vouchedAt || item.createdAt)}
                </time>
                {showReadingTime && <span>{readingTime(item.content)}</span>}
                {item.validationActionLabel && (
                  githubUrl ? (
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-success/80 bg-success/10">
                      {item.validationActionLabel} by <a href={githubUrl} target="_blank" rel="noopener" class="hover:underline">{sourceAuthor}</a>
                    </span>
                  ) : (
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-success/80 bg-success/10">
                      {item.validationActionLabel} by {sourceAuthor}
                    </span>
                  )
                )}
                {item.sourceAi && formatAiSource(item.sourceAi) && (
                  <span class="text-sm text-muted italic">
                    AI-assisted via {formatAiSource(item.sourceAi)}
                  </span>
                )}
              </div>
            </header>
            <div class="content mt-8">
              {raw(renderedContent)}
            </div>
            {item.tags && item.tags.length > 0 && (
              <footer class="mt-10 pt-6 border-t border-border-subtle">
                <div class="flex flex-wrap gap-2">
                  {item.tags.map((t) => (
                    <a href={`${localePrefix}/?tag=${encodeURIComponent(t)}`} class="inline-block px-3 py-1 rounded-full text-sm font-medium text-muted no-underline border border-border-subtle hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-colors">#{t}</a>
                  ))}
                </div>
              </footer>
            )}
          </article>
        </main>
      </div>
    </BlogLayout>
  );
}
