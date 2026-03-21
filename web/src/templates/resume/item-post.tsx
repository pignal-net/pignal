import type { ItemPostProps } from '@pignal/templates';
import { TypeBadge } from '../../components/type-badge';
import { SourceActionBar } from '../../components/source-action-bar';
import { JsonLd } from '../../components/json-ld';
import { buildSourcePostingJsonLd, buildMetaTags } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { formatDate } from '../../lib/time';
import { raw } from 'hono/html';
import { ResumeLayout } from './layout';

export function ResumeItemPost(props: ItemPostProps) {
  const {
    item,
    settings,
    renderedContent,
    sourceUrl,
    sourceAuthor,
    githubUrl,
    vocabulary: _vocabulary,
  } = props;

  const sourceTitle = settings.source_title || 'My Resume';

  // Derive OG image
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

  const dateStr = item.vouchedAt || item.createdAt;

  return (
    <ResumeLayout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="source-page source-page--post">
        <main class="resume-post">
          <SourceActionBar slug={item.slug ?? undefined} sourceUrl={sourceUrl} />

          <article class="source-article">
            <header class="resume-post-header">
              <div class="resume-post-section">
                <TypeBadge typeName={item.typeName} />
              </div>
              <h1 class="resume-post-title">{item.keySummary}</h1>
              <div class="resume-post-meta">
                {githubUrl ? (
                  <a href={githubUrl} target="_blank" rel="noopener">
                    {sourceAuthor}
                  </a>
                ) : (
                  <span>{sourceAuthor}</span>
                )}
                <time datetime={dateStr}>{formatDate(dateStr)}</time>
                {item.validationActionLabel && (
                  <span class="resume-entry-badge">
                    {item.validationActionLabel}
                  </span>
                )}
                {item.workspaceName && (
                  <span class="resume-entry-badge">{item.workspaceName}</span>
                )}
              </div>
            </header>

            <div class="resume-post-content content">
              {raw(renderedContent)}
            </div>

            {item.tags && item.tags.length > 0 && (
              <footer class="resume-post-tags">
                {item.tags.map((t) => (
                  <a href={`/?tag=${encodeURIComponent(t)}`} class="resume-post-tag">#{t}</a>
                ))}
              </footer>
            )}
          </article>
        </main>
      </div>
    </ResumeLayout>
  );
}
