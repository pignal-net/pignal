import type { ItemPostProps } from '@pignal/templates';
import { TypeBadge } from '../../components/type-badge';
import { SourceActionBar } from '../../components/source-action-bar';
import { JsonLd } from '../../components/json-ld';
import { buildSourcePostingJsonLd, buildMetaTags, resolveOgImage } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { formatDate } from '../../lib/time';
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
    <FlashcardsLayout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="max-w-2xl mx-auto px-4 pt-8 pb-16">
        <SourceActionBar slug={item.slug ?? undefined} sourceUrl={sourceUrl} />

        <div class="mb-8">
          {/* Front: question/prompt */}
          <div class="p-8 sm:p-10 border border-border-subtle shadow-card rounded-xl bg-surface text-center mb-4">
            <div class="text-xs uppercase tracking-wider text-muted mb-2">Front</div>
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
          <div class="p-8 sm:p-10 border border-border-subtle shadow-card rounded-xl bg-primary/[0.04]">
            <div class="text-xs uppercase tracking-wider text-muted mb-3">Back</div>
            <div class="content">
              {raw(renderedContent)}
            </div>
          </div>
        </div>

        {item.tags && item.tags.length > 0 && (
          <div class="item-tags">
            {item.tags.map((t) => (
              <a href={`/?tag=${encodeURIComponent(t)}`} class="item-tag">#{t}</a>
            ))}
          </div>
        )}
      </div>
    </FlashcardsLayout>
  );
}
