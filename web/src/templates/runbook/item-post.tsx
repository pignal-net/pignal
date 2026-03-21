import type { ItemPostProps } from '@pignal/templates';
import { TypeBadge } from '../../components/type-badge';
import { TableOfContents } from '../../components/table-of-contents';
import { SourceActionBar } from '../../components/source-action-bar';
import { JsonLd } from '../../components/json-ld';
import { buildSourcePostingJsonLd, buildMetaTags } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { formatDate, readingTime } from '../../lib/time';
import { raw } from 'hono/html';
import { RunbookLayout } from './layout';

export function RunbookItemPost(props: ItemPostProps) {
  const {
    item,
    settings,
    renderedContent,
    headings,
    sourceUrl,
    sourceAuthor,
    githubUrl,
    vocabulary: _vocabulary,
  } = props;

  const sourceTitle = settings.source_title || 'My Runbook';
  const showReadingTime = settings.source_show_reading_time !== 'false';

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

  // Extract prerequisites if content starts with a prerequisites section
  const contentLower = item.content.toLowerCase();
  const hasPrerequisites = contentLower.startsWith('## prerequisites') ||
    contentLower.startsWith('# prerequisites') ||
    contentLower.includes('\n## prerequisites');

  return (
    <RunbookLayout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="runbook-post">
        <div class="runbook-post-main">
          <SourceActionBar slug={item.slug ?? undefined} sourceUrl={sourceUrl} />

          {/* Breadcrumb */}
          <nav class="runbook-breadcrumb" aria-label="Breadcrumb">
            <a href="/">{sourceTitle}</a>
            <span class="runbook-breadcrumb-sep">/</span>
            {item.typeName && (
              <>
                <a href={`/?type=${item.typeId}`}>{item.typeName}</a>
                <span class="runbook-breadcrumb-sep">/</span>
              </>
            )}
            <span>{item.keySummary}</span>
          </nav>

          <article class="source-article">
            <header class="runbook-post-header">
              <div class="source-category">
                <TypeBadge typeName={item.typeName} />
                {item.workspaceName && (
                  <a href={`/?workspace=${item.workspaceId}`} class="workspace-badge">{item.workspaceName}</a>
                )}
              </div>
              <h1>{item.keySummary}</h1>
              <div class="runbook-post-meta">
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
                {showReadingTime && <span>{readingTime(item.content)}</span>}
                {item.validationActionLabel && (
                  <span class="validation-badge">
                    {item.validationActionLabel} by {sourceAuthor}
                  </span>
                )}
              </div>
            </header>

            {/* Prerequisites callout if detected */}
            {hasPrerequisites && (
              <div class="runbook-prerequisites">
                <div class="runbook-prerequisites-title">Prerequisites</div>
                <div>Check the prerequisites section below before proceeding.</div>
              </div>
            )}

            <div class="runbook-post-content content">
              {raw(renderedContent)}
            </div>

            {item.tags && item.tags.length > 0 && (
              <footer class="runbook-post-tags">
                <div class="item-tags">
                  {item.tags.map((t) => (
                    <a href={`/?tag=${encodeURIComponent(t)}`} class="item-tag">#{t}</a>
                  ))}
                </div>
              </footer>
            )}
          </article>
        </div>

        {/* Always-visible ToC */}
        <TableOfContents headings={headings} />
      </div>
    </RunbookLayout>
  );
}
