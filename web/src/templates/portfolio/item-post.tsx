import type { ItemPostProps } from '@pignal/templates';
import { TypeBadge } from '../../components/type-badge';
import { SourceActionBar } from '../../components/source-action-bar';
import { JsonLd } from '../../components/json-ld';
import { buildSourcePostingJsonLd, buildMetaTags } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { formatDate } from '../../lib/time';
import { raw } from 'hono/html';
import { PortfolioLayout } from './layout';

export function PortfolioItemPost(props: ItemPostProps) {
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
  const icon = item.typeName ? item.typeName.charAt(0).toUpperCase() : '?';

  const githubUsername = githubUrl.replace(/\/$/, '').split('/').pop() || '';
  const ogImage = githubUsername
    ? `https://avatars.githubusercontent.com/${githubUsername}?s=400`
    : `${sourceUrl}/og-image.png`;

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
    <PortfolioLayout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="portfolio-showcase">
        <SourceActionBar slug={item.slug ?? undefined} sourceUrl={sourceUrl} />

        {/* Full-width hero image area */}
        <div class="portfolio-showcase-hero">
          <div class="portfolio-showcase-image">
            <span>{icon}</span>
          </div>

          <h1 class="portfolio-showcase-title">{item.keySummary}</h1>

          <div class="portfolio-showcase-meta">
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

          <p class="portfolio-showcase-excerpt">{excerpt}{item.content.length > 300 ? '...' : ''}</p>

          {item.tags && item.tags.length > 0 && (
            <div class="item-tags">
              {item.tags.map((t) => (
                <a href={`/?tag=${encodeURIComponent(t)}`} class="item-tag">#{t}</a>
              ))}
            </div>
          )}
        </div>

        {/* Full content below */}
        <div class="portfolio-showcase-content content">
          {raw(renderedContent)}
        </div>
      </div>
    </PortfolioLayout>
  );
}
