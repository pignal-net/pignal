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
import { FlashcardsLayout } from './layout';

export function FlashcardsItemPost(props: ItemPostProps) {
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
    <FlashcardsLayout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings} visitor={props.visitor}>
      <JsonLd data={jsonLd} />

      <div class="max-w-2xl mx-auto px-4 pt-8 pb-16">
        <SourceActionBar slug={item.slug ?? undefined} sourceUrl={sourceUrl} t={props.t} />

        {/* Breadcrumb */}
        <nav class="flex items-center gap-1.5 text-sm text-muted mb-6 flex-wrap" aria-label="Breadcrumb">
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

        <div class="mb-8">
          {/* Front: question/prompt */}
          <div class="p-8 sm:p-10 border border-border-subtle shadow-card rounded-xl bg-surface text-center mb-4">
            <div class="text-xs uppercase tracking-wider text-muted mb-3 font-semibold">Front</div>
            <h1 class="text-3xl sm:text-4xl font-bold leading-tight mb-4">{item.keySummary}</h1>
            <div class="flex items-center gap-2.5 flex-wrap text-sm text-muted mb-4 justify-center">
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
          </div>

          {/* Back: answer/content */}
          <div class="p-8 sm:p-10 border border-primary/20 shadow-card rounded-xl bg-surface-hover">
            <div class="text-xs uppercase tracking-wider text-primary mb-3 font-semibold">Back</div>
            <div class="content">
              {raw(renderedContent)}
            </div>
          </div>
        </div>

        {item.tags && item.tags.length > 0 && (
          <div class="flex flex-wrap gap-2">
            {item.tags.map((t) => (
              <a href={`/?tag=${encodeURIComponent(t)}`} class="inline-block px-3 py-1 rounded-full text-sm font-medium text-muted no-underline border border-border-subtle hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-colors">#{t}</a>
            ))}
          </div>
        )}
      </div>
    </FlashcardsLayout>
  );
}
