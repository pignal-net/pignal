/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import type { ItemPostProps } from '../types';

import { SourceActionBar } from '@pignal/render/components/source-action-bar';
import { JsonLd } from '@pignal/render/components/json-ld';
import { buildSourcePostingJsonLd, buildMetaTags, resolveOgImage } from '@pignal/render/lib/seo';
import { stripMarkdown } from '@pignal/render/lib/markdown';
import { relativeTime, readingTime } from '@pignal/render/lib/time';
import { raw } from 'hono/html';
import { MagazineLayout } from './layout';

const HX_TARGET = '#source-results';
const HX_INDICATOR = '#source-loading';

function hxProps(url: string) {
  return {
    'hx-get': url,
    'hx-target': HX_TARGET,
    'hx-swap': 'innerHTML',
    'hx-push-url': 'true',
    'hx-indicator': HX_INDICATOR,
  };
}

export function MagazineItemPost(props: ItemPostProps) {
  const {
    item,
    settings,
    renderedContent,
    headings: _headings,
    sourceUrl,
    sourceAuthor,
    githubUrl,
  } = props;

  const sourceTitle = settings.source_title || 'My Magazine';
  const showReadingTime = settings.source_show_reading_time !== 'false';
  const dateStr = item.vouchedAt || item.createdAt;

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
    <MagazineLayout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings} visitor={props.visitor}>
      <JsonLd data={jsonLd} />

      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-16 w-full">
        <main class="min-w-0 max-w-full break-words">
          <SourceActionBar slug={item.slug ?? undefined} sourceUrl={sourceUrl} t={props.t} />

          <article class="min-w-0 max-w-full drop-cap">
            <header class="mb-6">
              <div class="source-category mb-4">
                <a href={`/?type=${item.typeId}`} class="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide text-primary-inverse bg-primary no-underline hover:opacity-90" {...hxProps(`/?type=${item.typeId}`)}>
                  {item.typeName}
                </a>
                {item.workspaceName && (
                  <a href={`/?workspace=${item.workspaceId}`} class="workspace-badge" {...hxProps(`/?workspace=${item.workspaceId}`)}>
                    {item.workspaceName}
                  </a>
                )}
              </div>
              <h1 class="text-[clamp(1.75rem,4vw+0.5rem,2.75rem)] font-bold tracking-tight leading-tight">{item.keySummary}</h1>
              <div class="flex items-center gap-3 flex-wrap text-[0.88rem] text-muted mt-3">
                {githubUrl ? (
                  <a href={githubUrl} target="_blank" rel="noopener" class="text-text font-medium no-underline hover:text-primary">
                    {sourceAuthor}
                  </a>
                ) : (
                  <span class="text-text font-medium">{sourceAuthor}</span>
                )}
                <span class="opacity-40">/</span>
                <time datetime={dateStr} class="whitespace-nowrap">
                  {relativeTime(dateStr)}
                </time>
                {showReadingTime && (
                  <>
                    <span class="opacity-40">/</span>
                    <span class="whitespace-nowrap">{readingTime(item.content)}</span>
                  </>
                )}
                {item.validationActionLabel && (
                  <>
                    <span class="opacity-40">/</span>
                    <span class="validation-badge">
                      {item.validationActionLabel} by {sourceAuthor}
                    </span>
                  </>
                )}
              </div>
            </header>
            <div class="content">
              {raw(renderedContent)}
            </div>
            {item.tags && item.tags.length > 0 && (
              <footer class="mt-10 pt-6 border-t border-border-subtle">
                <div class="flex flex-wrap gap-2">
                  {item.tags.map((t) => (
                    <a href={`/?tag=${encodeURIComponent(t)}`} class="inline-block px-3 py-1 rounded-full text-sm font-medium text-muted no-underline border border-border-subtle hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-colors" {...hxProps(`/?tag=${encodeURIComponent(t)}`)}>#{t}</a>
                  ))}
                </div>
              </footer>
            )}
          </article>
        </main>
      </div>
    </MagazineLayout>
  );
}
