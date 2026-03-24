import type { ItemPostProps } from '@pignal/templates';
import { TypeBadge } from '../../components/type-badge';
import { SourceActionBar } from '../../components/source-action-bar';
import { JsonLd } from '../../components/json-ld';
import { buildSourcePostingJsonLd, buildMetaTags, resolveOgImage } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { formatDate } from '../../lib/time';
import { raw } from 'hono/html';
import { ShopLayout } from './layout';

export function ShopItemPost(props: ItemPostProps) {
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
    <ShopLayout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="max-w-3xl mx-auto px-4 pt-8 pb-16">
        <SourceActionBar slug={item.slug ?? undefined} sourceUrl={sourceUrl} />

        {/* Hero section: image + info side by side */}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 items-start">
          <div class="aspect-square bg-gradient-to-br from-primary/5 to-primary/15 rounded-xl flex items-center justify-center text-6xl text-primary opacity-50 border border-border-subtle shadow-card">
            <span>{icon}</span>
          </div>
          <div>
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
            <p class="text-[0.95rem] text-muted leading-relaxed mb-4">{excerpt}{item.content.length > 300 ? '...' : ''}</p>
            {item.tags && item.tags.length > 0 && (
              <div class="item-tags">
                {item.tags.map((t) => (
                  <a href={`/?tag=${encodeURIComponent(t)}`} class="item-tag">#{t}</a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Full content below */}
        <div class="mt-8 content">
          {raw(renderedContent)}
        </div>
      </div>
    </ShopLayout>
  );
}
