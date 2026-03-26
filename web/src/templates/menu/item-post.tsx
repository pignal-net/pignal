import type { ItemPostProps } from '@pignal/templates';
import { TypeBadge } from '../../components/type-badge';
import { SourceActionBar } from '../../components/source-action-bar';
import { JsonLd } from '../../components/json-ld';
import { buildSourcePostingJsonLd, buildMetaTags, resolveOgImage } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { raw } from 'hono/html';
import { MenuLayout } from './layout';

export function MenuItemPost(props: ItemPostProps) {
  const {
    item,
    settings,
    renderedContent,
    sourceUrl,
    sourceAuthor,
    githubUrl,
    vocabulary: _vocabulary,
  } = props;

  const sourceTitle = settings.source_title || 'My Menu';

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
    <MenuLayout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="max-w-2xl mx-auto py-4">
        <SourceActionBar slug={item.slug ?? undefined} sourceUrl={sourceUrl} t={props.t} />

        <article class="mt-4">
          <header class="mb-6 pb-4 border-b border-border-subtle">
            <h1 class="text-3xl sm:text-4xl m-0 leading-tight mb-4">{item.keySummary}</h1>
            <div class="flex items-center gap-2 flex-wrap text-sm text-muted">
              <TypeBadge typeName={item.typeName} />
              {item.workspaceName && (
                <a href={`/?workspace=${item.workspaceId}`} class="workspace-badge">{item.workspaceName}</a>
              )}
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
          </header>

          <div class="content leading-relaxed">
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
      </div>
    </MenuLayout>
  );
}
