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
import { RecipesLayout } from './layout';

export function RecipesItemPost(props: ItemPostProps) {
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
    <RecipesLayout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings} t={props.t} locale={props.locale} defaultLocale={props.defaultLocale} visitor={props.visitor}>
      <JsonLd data={jsonLd} />

      <div class="max-w-3xl mx-auto px-4 pt-8 pb-16 fade-in-page">
        <SourceActionBar slug={item.slug ?? undefined} sourceUrl={sourceUrl} t={props.t} />

        <article>
          <div class="mb-8">
            <h1 class="text-3xl sm:text-4xl font-bold leading-tight mb-4">{item.keySummary}</h1>
            <div class="post-meta flex items-center gap-2.5 flex-wrap text-sm text-muted">
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

            {/* Recipe info bar */}
            <div class="flex gap-4 flex-wrap mb-6 mt-4 p-4 rounded-xl bg-surface-raised border border-border-subtle">
              <div class="flex flex-col items-center gap-0.5 text-sm text-muted min-w-[80px]">
                <span class="text-xs font-bold uppercase tracking-wider text-muted">{vocabulary.type}</span>
                <span class="font-semibold text-text">{item.typeName || 'General'}</span>
              </div>
              {item.workspaceName && (
                <div class="flex flex-col items-center gap-0.5 text-sm text-muted min-w-[80px]">
                  <span class="text-xs font-bold uppercase tracking-wider text-muted">{vocabulary.workspace}</span>
                  <span class="font-semibold text-text">{item.workspaceName}</span>
                </div>
              )}
            </div>

            {item.tags && item.tags.length > 0 && (
              <div class="flex gap-1.5 flex-wrap">
                {item.tags.map((t) => (
                  <a href={`/?tag=${encodeURIComponent(t)}`} class="inline-flex items-center rounded-full text-[0.78rem] px-2.5 py-0.5 no-underline text-muted hover:bg-primary/5 hover:text-primary transition-colors border border-border-subtle">#{t}</a>
                ))}
              </div>
            )}
          </div>

          {/* Full recipe content (ingredients, instructions, notes) */}
          <div class="mt-8 content">
            {raw(renderedContent)}
          </div>
        </article>
      </div>
    </RecipesLayout>
  );
}
