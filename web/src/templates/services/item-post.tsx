import type { ItemPostProps } from '@pignal/templates';
import { TypeBadge } from '../../components/type-badge';
import { SourceActionBar } from '../../components/source-action-bar';
import { JsonLd } from '../../components/json-ld';
import { buildSourcePostingJsonLd, buildMetaTags } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { formatDate } from '../../lib/time';
import { raw } from 'hono/html';
import { ServicesLayout } from './layout';

export function ServicesItemPost(props: ItemPostProps) {
  const {
    item,
    settings,
    renderedContent,
    sourceUrl,
    sourceAuthor,
    githubUrl,
    vocabulary: _vocabulary,
  } = props;

  const sourceTitle = settings.source_title || 'My Services';

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
    <ServicesLayout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="max-w-3xl mx-auto px-4 pt-8 pb-16">
        <SourceActionBar slug={item.slug ?? undefined} sourceUrl={sourceUrl} />

        <article class="min-w-0 max-w-full">
          <header class="mb-6">
            <div class="source-category">
              <TypeBadge typeName={item.typeName} />
              {item.workspaceName && (
                <a href={`/?workspace=${item.workspaceId}`} class="workspace-badge">{item.workspaceName}</a>
              )}
              {item.validationActionLabel && (
                <span class="text-[0.7rem] px-2 py-0.5 rounded-full font-semibold bg-green-500/15 text-green-600 whitespace-nowrap">{item.validationActionLabel}</span>
              )}
            </div>
            <h1>{item.keySummary}</h1>
            <div class="post-meta">
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

          <div class="content leading-relaxed">
            {raw(renderedContent)}
          </div>

          {item.tags && item.tags.length > 0 && (
            <footer class="mt-10 pt-6 border-t border-border-subtle">
              <div class="item-tags">
                {item.tags.map((t) => (
                  <a href={`/?tag=${encodeURIComponent(t)}`} class="item-tag">#{t}</a>
                ))}
              </div>
            </footer>
          )}
        </article>
      </div>
    </ServicesLayout>
  );
}
