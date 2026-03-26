/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import type { ItemPostProps } from '../types';
import { TypeBadge } from '@pignal/render/components/type-badge';

import { SourceActionBar } from '@pignal/render/components/source-action-bar';
import { JsonLd } from '@pignal/render/components/json-ld';
import { buildSourcePostingJsonLd, buildMetaTags, resolveOgImage } from '@pignal/render/lib/seo';
import { stripMarkdown } from '@pignal/render/lib/markdown';
import { formatDate, readingTime } from '@pignal/render/lib/time';
import { raw } from 'hono/html';
import { WikiLayout } from './layout';

/** Inject heading anchor links into rendered HTML for h2/h3/h4 with IDs */
function addHeadingAnchors(html: string): string {
  return html.replace(
    /<(h[234])(\s[^>]*?\bid="([^"]+)"[^>]*)>([\s\S]*?)<\/\1>/gi,
    (_match, tag: string, attrs: string, id: string, content: string) => {
      return `<${tag}${attrs}>${content}<a href="#${id}" class="heading-anchor" aria-label="Link to this section">#</a></${tag}>`;
    }
  );
}

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
  const showReadingTime = settings.source_show_reading_time !== 'false';

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

  const contentWithAnchors = addHeadingAnchors(renderedContent);

  // Filter headings for TOC (h2/h3 only)
  const tocHeadings = headings ? headings.filter((h) => h.level === 2 || h.level === 3) : [];

  return (
    <WikiLayout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings} visitor={props.visitor}>
      <JsonLd data={jsonLd} />

      <div class="max-w-7xl mx-auto px-4 pt-8 pb-16 grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-8 items-start">
        <div class="min-w-0 max-w-full">
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
            <span>{item.keySummary}</span>
          </nav>

          <article class="source-article">
            <header>
              <div class="source-category">
                <TypeBadge typeName={item.typeName} />
              </div>
              <h1>{item.keySummary}</h1>
              <div class="post-meta flex items-center gap-2.5 flex-wrap text-sm text-muted">
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
            <div class="mt-8 content">
              {raw(contentWithAnchors)}
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

        {/* Table of contents sidebar */}
        {tocHeadings.length > 2 && (
          <aside class="source-toc sticky top-6 max-lg:hidden text-sm" aria-label="Table of contents">
            <div class="toc-title">On this page</div>
            <ul class="list-none p-0 m-0">
              {tocHeadings.map((h) => (
                <li>
                  <a
                    href={`#${h.id}`}
                    class={`block py-1 no-underline text-muted hover:text-primary transition-colors ${h.level === 3 ? 'toc-h3 pl-3 text-[0.78rem]' : 'text-[0.82rem]'}`}
                  >
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </WikiLayout>
  );
}
