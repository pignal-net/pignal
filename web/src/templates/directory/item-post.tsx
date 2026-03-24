import type { ItemPostProps } from '@pignal/templates';
import { TypeBadge } from '../../components/type-badge';
import { SourceActionBar } from '../../components/source-action-bar';
import { JsonLd } from '../../components/json-ld';
import { buildSourcePostingJsonLd, buildMetaTags, resolveOgImage } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { formatDate } from '../../lib/time';
import { raw } from 'hono/html';
import { DirectoryLayout } from './layout';

function getStatusClasses(label: string | null): string {
  if (!label) return '';
  const lower = label.toLowerCase();
  if (lower.includes('active') || lower.includes('recommended')) return 'bg-green-500/15 text-green-600';
  if (lower.includes('new')) return 'bg-blue-500/15 text-blue-500';
  if (lower.includes('archived') || lower.includes('inactive') || lower.includes('stale')) return 'bg-border/50 text-muted';
  if (lower.includes('deprecated') || lower.includes('shutting')) return 'bg-red-500/15 text-red-600';
  return 'bg-green-500/15 text-green-600';
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

  const statusClasses = getStatusClasses(item.validationActionLabel);

  return (
    <DirectoryLayout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
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
                <span class={`text-[0.68rem] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${statusClasses}`}>{item.validationActionLabel}</span>
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
    </DirectoryLayout>
  );
}
