/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import type { ItemPostProps } from '../types';
import { TypeBadge } from '@pignal/render/components/type-badge';
import { SourceActionBar } from '@pignal/render/components/source-action-bar';
import { JsonLd } from '@pignal/render/components/json-ld';
import { buildSourcePostingJsonLd, buildMetaTags, resolveOgImage } from '@pignal/render/lib/seo';
import { stripMarkdown } from '@pignal/render/lib/markdown';
import { formatDate } from '@pignal/render/lib/time';
import { raw } from 'hono/html';
import { ResumeLayout } from './layout';

export function ResumeItemPost(props: ItemPostProps) {
  const {
    item,
    settings,
    renderedContent,
    sourceUrl,
    sourceAuthor,
    githubUrl,
    vocabulary: _vocabulary,
  } = props;

  const sourceTitle = settings.source_title || 'My Resume';

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

  const dateStr = item.vouchedAt || item.createdAt;

  return (
    <ResumeLayout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings} t={props.t} locale={props.locale} defaultLocale={props.defaultLocale} visitor={props.visitor}>
      <JsonLd data={jsonLd} />

      <div class="source-page source-page--post fade-in-page">
        <main class="max-w-[740px] mx-auto px-4">
          <SourceActionBar slug={item.slug ?? undefined} sourceUrl={sourceUrl} t={props.t} />

          <article class="source-article">
            <header class="mb-8 pb-6 border-b-2 border-primary">
              <div class="inline-block mb-4">
                <TypeBadge typeName={item.typeName} />
              </div>
              <h1 class="text-3xl sm:text-4xl max-sm:text-xl font-bold m-0 leading-tight mb-4 text-text">{item.keySummary}</h1>
              <div class="flex items-center gap-3 flex-wrap text-[0.8rem] text-muted">
                {githubUrl ? (
                  <a href={githubUrl} target="_blank" rel="noopener" class="text-primary no-underline hover:underline">
                    {sourceAuthor}
                  </a>
                ) : (
                  <span>{sourceAuthor}</span>
                )}
                <time datetime={dateStr}>{formatDate(dateStr)}</time>
                {item.validationActionLabel && (
                  <span class="inline-block px-2 py-0.5 text-[0.65rem] font-semibold rounded-full bg-primary/10 text-primary uppercase tracking-wide">
                    {item.validationActionLabel}
                  </span>
                )}
                {item.workspaceName && (
                  <span class="inline-block px-2 py-0.5 text-[0.65rem] font-semibold rounded-full bg-primary/10 text-primary uppercase tracking-wide">{item.workspaceName}</span>
                )}
              </div>
            </header>

            <div class="mt-8 content">
              {raw(renderedContent)}
            </div>

            {item.tags && item.tags.length > 0 && (
              <footer class="flex flex-wrap gap-2 mt-10 pt-6 border-t border-border-subtle">
                {item.tags.map((t) => (
                  <a href={`/?tag=${encodeURIComponent(t)}`} class="inline-block px-3 py-1 text-xs rounded-full bg-primary/10 text-primary no-underline hover:bg-primary/20 transition-colors">#{t}</a>
                ))}
              </footer>
            )}
          </article>
        </main>
      </div>
    </ResumeLayout>
  );
}
