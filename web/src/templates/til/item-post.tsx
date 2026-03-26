import type { ItemPostProps } from '@pignal/templates';
import { TypeBadge } from '../../components/type-badge';
import { SourceActionBar } from '../../components/source-action-bar';
import { JsonLd } from '../../components/json-ld';
import { buildSourcePostingJsonLd, buildMetaTags, resolveOgImage } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { formatDate } from '../../lib/time';
import { raw } from 'hono/html';
import { TilLayout } from './layout';

export function TilItemPost(props: ItemPostProps) {
  const {
    item,
    settings,
    renderedContent,
    sourceUrl,
    sourceAuthor,
    githubUrl,
  } = props;

  const sourceTitle = settings.source_title || 'Today I Learned';

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

  return (
    <TilLayout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="max-w-[680px] mx-auto px-4 sm:px-6 py-8 pb-16 w-full">
        <main class="min-w-0 max-w-full break-words">
          <SourceActionBar slug={item.slug ?? undefined} sourceUrl={sourceUrl} t={props.t} />

          <article class="source-article min-w-0 max-w-full">
            <header>
              <div class="mb-4">
                <TypeBadge typeName={item.typeName} />
                {item.workspaceName && (
                  <a href={`/?workspace=${item.workspaceId}`} class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary ml-2">{item.workspaceName}</a>
                )}
              </div>
              <h1 class="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-4">{item.keySummary}</h1>
              <div class="flex items-center gap-2.5 flex-wrap text-sm text-muted">
                {githubUrl ? (
                  <a href={githubUrl} target="_blank" rel="noopener" class="font-medium text-text hover:text-primary transition-colors">
                    {sourceAuthor}
                  </a>
                ) : (
                  <span>{sourceAuthor}</span>
                )}
                <time datetime={item.vouchedAt || item.createdAt}>
                  {formatDate(item.vouchedAt || item.createdAt)}
                </time>
                {item.validationActionLabel && (
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-success/80 bg-success/10">
                    {item.validationActionLabel} by {sourceAuthor}
                  </span>
                )}
              </div>
            </header>
            <div class="content mt-8">
              {raw(renderedContent)}
            </div>
            {item.tags && item.tags.length > 0 && (
              <footer class="mt-10 pt-6 border-t border-border-subtle">
                <div class="flex flex-wrap gap-2">
                  {item.tags.map((t) => (
                    <a href={`/?tag=${encodeURIComponent(t)}`} class="inline-block px-3 py-1 rounded-full text-sm font-medium text-muted no-underline border border-border-subtle hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-colors">#{t}</a>
                  ))}
                </div>
              </footer>
            )}
          </article>
        </main>
      </div>
    </TilLayout>
  );
}
