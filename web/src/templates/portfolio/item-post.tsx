import type { ItemPostProps } from '@pignal/templates';
import { TypeBadge } from '../../components/type-badge';
import { SourceActionBar } from '../../components/source-action-bar';
import { JsonLd } from '../../components/json-ld';
import { buildSourcePostingJsonLd, buildMetaTags, resolveOgImage } from '../../lib/seo';
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

  const ogImage = resolveOgImage(settings, sourceUrl);

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
    <PortfolioLayout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings} visitor={props.visitor}>
      <JsonLd data={jsonLd} />

      <div class="max-w-4xl mx-auto px-4 pt-8 pb-16 fade-in-page">
        <SourceActionBar slug={item.slug ?? undefined} sourceUrl={sourceUrl} t={props.t} />

        {/* Full-width hero image area */}
        <div class="mb-8">
          <div class="aspect-video bg-gradient-to-br from-primary/5 to-primary/15 rounded-xl flex items-center justify-center text-7xl text-primary opacity-40 border border-border-subtle shadow-card mb-6">
            <span>{icon}</span>
          </div>

          <h1 class="text-3xl sm:text-4xl font-bold leading-tight mb-4">{item.keySummary}</h1>

          <div class="post-meta">
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

          <p class="text-base text-muted leading-relaxed mb-6">{excerpt}{item.content.length > 300 ? '...' : ''}</p>

          {item.tags && item.tags.length > 0 && (
            <div class="flex flex-wrap gap-2 mt-4">
              {item.tags.map((t) => (
                <a href={`/?tag=${encodeURIComponent(t)}`} class="text-sm px-3 py-1 rounded-full bg-muted/8 border border-border-subtle text-muted no-underline hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-colors">#{t}</a>
              ))}
            </div>
          )}
        </div>

        {/* Full content below */}
        <div class="mt-8 content">
          {raw(renderedContent)}
        </div>
      </div>
    </PortfolioLayout>
  );
}
