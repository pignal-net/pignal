import type { ItemPostProps } from '@pignal/templates';
import { TypeBadge } from '../../components/type-badge';
import { SourceActionBar } from '../../components/source-action-bar';
import { JsonLd } from '../../components/json-ld';
import { buildSourcePostingJsonLd, buildMetaTags } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { formatDate } from '../../lib/time';
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

  const githubUsername = githubUrl.replace(/\/$/, '').split('/').pop() || '';
  const ogImage = githubUsername
    ? `https://avatars.githubusercontent.com/${githubUsername}?s=400`
    : `${sourceUrl}/og-image.png`;

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
    <RecipesLayout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="max-w-3xl mx-auto px-4 pt-8 pb-16">
        <SourceActionBar slug={item.slug ?? undefined} sourceUrl={sourceUrl} />

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
          <div class="flex gap-4 flex-wrap mb-6 mt-4 p-4 rounded-lg bg-surface-raised">
            <div class="flex flex-col items-center gap-0.5 text-sm text-muted min-w-[80px]">
              <span class="font-bold text-base text-text">{vocabulary.item}</span>
              <span>{item.typeName || 'General'}</span>
            </div>
            {item.workspaceName && (
              <div class="flex flex-col items-center gap-0.5 text-sm text-muted min-w-[80px]">
                <span class="font-bold text-base text-text">{vocabulary.workspace}</span>
                <span>{item.workspaceName}</span>
              </div>
            )}
          </div>

          {item.tags && item.tags.length > 0 && (
            <div class="item-tags">
              {item.tags.map((t) => (
                <a href={`/?tag=${encodeURIComponent(t)}`} class="item-tag">#{t}</a>
              ))}
            </div>
          )}
        </div>

        {/* Full recipe content (ingredients, instructions, notes) */}
        <div class="mt-8 content">
          {raw(renderedContent)}
        </div>
      </div>
    </RecipesLayout>
  );
}
