/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import type { ItemPostProps } from '../types';
import { TypeBadge } from '@pignal/render/components/type-badge';
import { SourceActionBar } from '@pignal/render/components/source-action-bar';
import { JsonLd } from '@pignal/render/components/json-ld';
import { buildSourcePostingJsonLd, buildMetaTags, resolveOgImage } from '@pignal/render/lib/seo';
import { stripMarkdown } from '@pignal/render/lib/markdown';
import { raw } from 'hono/html';
import { GlossaryLayout } from './layout';

/** Extract the term name (before any dash separator) from keySummary */
function getTermName(keySummary: string): string {
  const dashIdx = keySummary.indexOf(' \u2014 ');
  if (dashIdx > 0) return keySummary.slice(0, dashIdx);
  const hyphenIdx = keySummary.indexOf(' - ');
  if (hyphenIdx > 0) return keySummary.slice(0, hyphenIdx);
  return keySummary;
}

export function GlossaryItemPost(props: ItemPostProps) {
  const {
    item,
    settings,
    renderedContent,
    sourceUrl,
    sourceAuthor,
    githubUrl,
    vocabulary: _vocabulary,
  } = props;

  const sourceTitle = settings.source_title || 'My Glossary';
  const termName = getTermName(item.keySummary);

  const ogImage = resolveOgImage(settings, sourceUrl);

  const description = stripMarkdown(item.content).slice(0, 160);
  const jsonLd = buildSourcePostingJsonLd(item, settings, sourceUrl, description, props.seo);
  const metaTags = buildMetaTags({
    title: `${termName} | ${sourceTitle}`,
    description,
    canonicalUrl: `${sourceUrl}/item/${item.slug}`,
    ogType: 'article',
    feedUrl: `${sourceUrl}/feed.xml`,
    imageUrl: ogImage,
  });

  return (
    <GlossaryLayout title={termName} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings} visitor={props.visitor}>
      <JsonLd data={jsonLd} />

      <div class="max-w-[750px] mx-auto py-8 pb-16">
        <SourceActionBar slug={item.slug ?? undefined} sourceUrl={sourceUrl} t={props.t} />

        {/* Breadcrumb */}
        <nav class="flex items-center gap-1.5 text-sm text-muted mb-4 flex-wrap" aria-label="Breadcrumb">
          <a href="/" class="text-primary no-underline hover:underline">{sourceTitle}</a>
          <span class="text-muted opacity-50">/</span>
          {item.workspaceName && (
            <>
              <a href={`/?workspace=${item.workspaceId}`} class="text-primary no-underline hover:underline">{item.workspaceName}</a>
              <span class="text-muted opacity-50">/</span>
            </>
          )}
          <span>{termName}</span>
        </nav>

        <article class="mt-4">
          <header class="mb-8 pb-4 border-b-2 border-border-subtle">
            <h1 class="text-3xl sm:text-4xl font-extrabold m-0 leading-tight mb-4">{termName}</h1>
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

          <div class="leading-loose text-[1.05rem] content">
            {raw(renderedContent)}
          </div>

          {item.tags && item.tags.length > 0 && (
            <footer class="mt-10 pt-6 border-t border-border-subtle">
              <div class="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Related topics</div>
              <div class="flex flex-wrap gap-2">
                {item.tags.map((t) => (
                  <a href={`/?tag=${encodeURIComponent(t)}`} class="inline-block px-3 py-1 rounded-full text-sm font-medium text-muted no-underline border border-border-subtle hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-colors">#{t}</a>
                ))}
              </div>
            </footer>
          )}
        </article>
      </div>
    </GlossaryLayout>
  );
}
