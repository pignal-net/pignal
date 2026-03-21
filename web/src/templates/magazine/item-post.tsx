import type { ItemPostProps } from '@pignal/templates';
import { TableOfContents } from '../../components/table-of-contents';
import { SourceActionBar } from '../../components/source-action-bar';
import { JsonLd } from '../../components/json-ld';
import { buildSourcePostingJsonLd, buildMetaTags } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { relativeTime, readingTime } from '../../lib/time';
import { raw } from 'hono/html';
import { MagazineLayout } from './layout';

const HX_TARGET = '#source-results';
const HX_INDICATOR = '#source-loading';

function hxProps(url: string) {
  return {
    'hx-get': url,
    'hx-target': HX_TARGET,
    'hx-swap': 'innerHTML',
    'hx-push-url': 'true',
    'hx-indicator': HX_INDICATOR,
  };
}

export function MagazineItemPost(props: ItemPostProps) {
  const {
    item,
    settings,
    renderedContent,
    headings,
    sourceUrl,
    sourceAuthor,
    githubUrl,
  } = props;

  const sourceTitle = settings.source_title || 'My Magazine';
  const showToc = settings.source_show_toc !== 'false';
  const showReadingTime = settings.source_show_reading_time !== 'false';
  const dateStr = item.vouchedAt || item.createdAt;

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
    <MagazineLayout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="source-page source-page--post">
        <main class="source-main">
          <SourceActionBar slug={item.slug ?? undefined} sourceUrl={sourceUrl} />

          <article class="source-article">
            <header class="magazine-post-header">
              <div class="source-category">
                <a href={`/?type=${item.typeId}`} class="magazine-section-badge" {...hxProps(`/?type=${item.typeId}`)}>
                  {item.typeName}
                </a>
                {item.workspaceName && (
                  <a href={`/?workspace=${item.workspaceId}`} class="workspace-badge" {...hxProps(`/?workspace=${item.workspaceId}`)}>
                    {item.workspaceName}
                  </a>
                )}
              </div>
              <h1>{item.keySummary}</h1>
              <div class="magazine-post-meta">
                {githubUrl ? (
                  <a href={githubUrl} target="_blank" rel="noopener" class="post-author">
                    {sourceAuthor}
                  </a>
                ) : (
                  <span class="post-author">{sourceAuthor}</span>
                )}
                <span class="magazine-meta-sep">/</span>
                <time datetime={dateStr} class="magazine-time">
                  {relativeTime(dateStr)}
                </time>
                {showReadingTime && (
                  <>
                    <span class="magazine-meta-sep">/</span>
                    <span class="magazine-reading-time">{readingTime(item.content)}</span>
                  </>
                )}
                {item.validationActionLabel && (
                  <>
                    <span class="magazine-meta-sep">/</span>
                    <span class="validation-badge">
                      {item.validationActionLabel} by {sourceAuthor}
                    </span>
                  </>
                )}
              </div>
            </header>
            <div class="content">
              {raw(renderedContent)}
            </div>
            {item.tags && item.tags.length > 0 && (
              <footer class="item-tags-footer">
                <div class="item-tags">
                  {item.tags.map((t) => (
                    <a href={`/?tag=${encodeURIComponent(t)}`} class="item-tag" {...hxProps(`/?tag=${encodeURIComponent(t)}`)}>#{t}</a>
                  ))}
                </div>
              </footer>
            )}
          </article>
        </main>

        {showToc && <TableOfContents headings={headings} />}
      </div>
    </MagazineLayout>
  );
}
