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
import { BookshelfLayout } from './layout';

export function BookshelfItemPost(props: ItemPostProps) {
  const {
    item,
    settings,
    renderedContent,
    sourceUrl,
    sourceAuthor,
    githubUrl,
    vocabulary,
  } = props;

  const sourceTitle = settings.source_title || `My ${vocabulary.itemPlural.charAt(0).toUpperCase() + vocabulary.itemPlural.slice(1)}`;

  const ogImage = resolveOgImage(settings, sourceUrl);

  const description = stripMarkdown(item.content).slice(0, 160);
  const excerpt = stripMarkdown(item.content).slice(0, 300);
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
    <BookshelfLayout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings} t={props.t} locale={props.locale} defaultLocale={props.defaultLocale} visitor={props.visitor}>
      <JsonLd data={jsonLd} />

      <div class="max-w-3xl mx-auto px-4 pt-8 pb-16 fade-in-page">
        <SourceActionBar slug={item.slug ?? undefined} sourceUrl={sourceUrl} t={props.t} />

        <article>
          {/* Hero: cover + info side by side */}
          <div class="grid grid-cols-1 sm:grid-cols-[200px_1fr] max-sm:grid-cols-1 gap-8 max-sm:gap-4 mb-8 items-start">
            <div class="aspect-[2/3] bg-gradient-to-br from-primary/12 to-primary/28 rounded-xl flex items-center justify-center border border-border-subtle max-sm:max-w-[180px] overflow-hidden group">
              <span class="text-lg font-bold text-primary opacity-60 text-center px-6 leading-snug transition-transform duration-300 group-hover:scale-[1.03]">{item.keySummary}</span>
            </div>
            <div>
              <h1 class="text-3xl sm:text-4xl font-bold leading-tight mb-4">{item.keySummary}</h1>
              <div class="post-meta flex items-center gap-2.5 flex-wrap text-sm text-muted mb-4">
                <TypeBadge typeName={item.typeName} />
                {item.workspaceName && (
                  <a href={`/?workspace=${item.workspaceId}`} class="workspace-badge">{item.workspaceName}</a>
                )}
                <time datetime={item.vouchedAt || item.createdAt}>
                  {formatDate(item.vouchedAt || item.createdAt)}
                </time>
                {item.validationActionLabel && (
                  <span class="validation-badge">
                    {item.validationActionLabel}
                    {githubUrl ? (
                      <> by <a href={githubUrl} target="_blank" rel="noopener">{sourceAuthor}</a></>
                    ) : (
                      <> by {sourceAuthor}</>
                    )}
                  </span>
                )}
              </div>
              <p class="text-[0.95rem] text-muted leading-relaxed mb-4">{excerpt}{item.content.length > 300 ? '...' : ''}</p>
              {item.tags && item.tags.length > 0 && (
                <div class="flex gap-1.5 flex-wrap">
                  {item.tags.map((t) => (
                    <a href={`/?tag=${encodeURIComponent(t)}`} class="inline-flex items-center rounded-full text-[0.78rem] px-2.5 py-0.5 no-underline text-muted hover:bg-primary/5 hover:text-primary transition-colors border border-border-subtle">#{t}</a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Full review content */}
          <div class="mt-8 content">
            {raw(renderedContent)}
          </div>
        </article>
      </div>
    </BookshelfLayout>
  );
}
