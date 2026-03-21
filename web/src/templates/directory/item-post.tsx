import type { ItemPostProps } from '@pignal/templates';
import { TypeBadge } from '../../components/type-badge';
import { SourceActionBar } from '../../components/source-action-bar';
import { JsonLd } from '../../components/json-ld';
import { buildSourcePostingJsonLd, buildMetaTags } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { formatDate } from '../../lib/time';
import { raw } from 'hono/html';
import { DirectoryLayout } from './layout';

function getStatusClass(label: string | null): string {
  if (!label) return '';
  const lower = label.toLowerCase();
  if (lower.includes('active') || lower.includes('recommended')) return 'directory-status-active';
  if (lower.includes('new')) return 'directory-status-new';
  if (lower.includes('archived') || lower.includes('inactive') || lower.includes('stale')) return 'directory-status-archived';
  if (lower.includes('deprecated') || lower.includes('shutting')) return 'directory-status-deprecated';
  return 'directory-status-active';
}

export function DirectoryItemPost(props: ItemPostProps) {
  const {
    item,
    settings,
    renderedContent,
    sourceUrl,
    sourceAuthor,
    githubUrl,
  } = props;

  const sourceTitle = settings.source_title || 'My Resource Directory';

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

  const statusClass = getStatusClass(item.validationActionLabel);

  return (
    <DirectoryLayout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="directory-post">
        <SourceActionBar slug={item.slug ?? undefined} sourceUrl={sourceUrl} />

        <article class="source-article">
          <header class="directory-post-header">
            <div class="source-category">
              <TypeBadge typeName={item.typeName} />
              {item.workspaceName && (
                <a href={`/?workspace=${item.workspaceId}`} class="workspace-badge">{item.workspaceName}</a>
              )}
              {item.validationActionLabel && (
                <span class={`directory-status-badge ${statusClass}`}>{item.validationActionLabel}</span>
              )}
            </div>
            <h1>{item.keySummary}</h1>
            <div class="directory-post-meta">
              {githubUrl ? (
                <a href={githubUrl} target="_blank" rel="noopener" class="post-author">
                  {sourceAuthor}
                </a>
              ) : (
                <span>{sourceAuthor}</span>
              )}
              <time datetime={item.vouchedAt || item.createdAt}>
                {formatDate(item.vouchedAt || item.createdAt)}
              </time>
            </div>
          </header>

          <div class="directory-post-content content">
            {raw(renderedContent)}
          </div>

          {item.tags && item.tags.length > 0 && (
            <footer class="directory-post-tags">
              <div class="item-tags">
                {item.tags.map((t) => (
                  <a href={`/?tag=${encodeURIComponent(t)}`} class="item-tag">#{t}</a>
                ))}
              </div>
            </footer>
          )}
        </article>
      </div>
    </DirectoryLayout>
  );
}
