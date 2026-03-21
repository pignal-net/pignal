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

      <div class="recipes-detail">
        <SourceActionBar slug={item.slug ?? undefined} sourceUrl={sourceUrl} />

        <div class="recipes-detail-header">
          <h1 class="recipes-detail-title">{item.keySummary}</h1>
          <div class="recipes-detail-meta">
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
          <div class="recipes-detail-info">
            <div class="recipes-detail-info-item">
              <span class="recipes-detail-info-value">{vocabulary.item}</span>
              <span>{item.typeName || 'General'}</span>
            </div>
            {item.workspaceName && (
              <div class="recipes-detail-info-item">
                <span class="recipes-detail-info-value">{vocabulary.workspace}</span>
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
        <div class="recipes-detail-content content">
          {raw(renderedContent)}
        </div>
      </div>
    </RecipesLayout>
  );
}
