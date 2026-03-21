import type { ItemPostProps } from '@pignal/templates';
import { TypeBadge } from '../../components/type-badge';
import { TableOfContents } from '../../components/table-of-contents';
import { SourceActionBar } from '../../components/source-action-bar';
import { JsonLd } from '../../components/json-ld';
import { buildSourcePostingJsonLd, buildMetaTags } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { formatDate, readingTime } from '../../lib/time';
import { raw } from 'hono/html';
import { WikiLayout } from './layout';

export function WikiItemPost(props: ItemPostProps) {
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

  const sourceTitle = settings.source_title || 'My Knowledge Base';
  const showToc = settings.source_show_toc !== 'false';
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

  return (
    <WikiLayout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="wiki-post">
        <div class="wiki-post-main">
          <SourceActionBar slug={item.slug ?? undefined} sourceUrl={sourceUrl} />

          {/* Breadcrumb */}
          <nav class="wiki-breadcrumb" aria-label="Breadcrumb">
            <a href="/">{sourceTitle}</a>
            <span class="wiki-breadcrumb-sep">/</span>
            {item.workspaceName && (
              <>
                <a href={`/?workspace=${item.workspaceId}`}>{item.workspaceName}</a>
                <span class="wiki-breadcrumb-sep">/</span>
              </>
            )}
            <span>{item.keySummary}</span>
          </nav>

          <article class="source-article">
            <header>
              <div class="source-category">
                <TypeBadge typeName={item.typeName} />
              </div>
              <h1>{item.keySummary}</h1>
              <div class="wiki-post-meta">
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
            <div class="wiki-post-content content">
              {raw(renderedContent)}
            </div>
            {item.tags && item.tags.length > 0 && (
              <footer class="wiki-post-tags">
                <div class="item-tags">
                  {item.tags.map((t) => (
                    <a href={`/?tag=${encodeURIComponent(t)}`} class="item-tag">#{t}</a>
                  ))}
                </div>
              </footer>
            )}
          </article>
        </div>

        {showToc && <TableOfContents headings={headings} />}
      </div>
    </WikiLayout>
  );
}
