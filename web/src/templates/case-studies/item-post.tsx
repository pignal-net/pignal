import type { ItemPostProps } from '@pignal/templates';

import { SourceActionBar } from '../../components/source-action-bar';
import { JsonLd } from '../../components/json-ld';
import { buildSourcePostingJsonLd, buildMetaTags, resolveOgImage } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { formatDate, readingTime } from '../../lib/time';
import { raw } from 'hono/html';
import { CaseStudiesLayout } from './layout';

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

function extractMetrics(content: string): { value: string; label: string }[] {
  const metrics: { value: string; label: string }[] = [];
  const lines = content.split('\n');
  for (const line of lines) {
    if (metrics.length >= 4) break;
    const pctMatch = line.match(/(\d+(?:\.\d+)?%)\s+([\w\s]{3,20})/i);
    if (pctMatch && metrics.length < 4) { metrics.push({ value: pctMatch[1], label: pctMatch[2].trim().slice(0, 20) }); continue; }
    const multMatch = line.match(/(\d+(?:\.\d+)?x)\s+([\w\s]{3,20})/i);
    if (multMatch && metrics.length < 4) { metrics.push({ value: multMatch[1], label: multMatch[2].trim().slice(0, 20) }); continue; }
    const dollarMatch = line.match(/(\$[\d.]+[KMB]?)\s+([\w\s]{3,20})/i);
    if (dollarMatch && metrics.length < 4) { metrics.push({ value: dollarMatch[1], label: dollarMatch[2].trim().slice(0, 20) }); }
  }
  return metrics;
}

export function CaseStudiesItemPost(props: ItemPostProps) {
  const {
    item,
    settings,
    renderedContent,
    headings: _headings,
    sourceUrl,
    sourceAuthor,
    githubUrl,
  } = props;

  const sourceTitle = settings.source_title || 'My Case Studies';
  const showReadingTime = settings.source_show_reading_time !== 'false';
  const dateStr = item.vouchedAt || item.createdAt;

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

  const metrics = extractMetrics(item.content);

  return (
    <CaseStudiesLayout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings} visitor={props.visitor}>
      <JsonLd data={jsonLd} />

      <div class="source-page source-page--post fade-in-page">
        <main class="source-main min-w-0 max-w-full">
          <SourceActionBar slug={item.slug ?? undefined} sourceUrl={sourceUrl} t={props.t} />

          <article class="source-article">
            <header>
              <div class="source-category">
                <a href={`/?type=${item.typeId}`} class="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide text-primary-inverse bg-primary no-underline hover:opacity-90 mb-4" {...hxProps(`/?type=${item.typeId}`)}>
                  {item.typeName}
                </a>
                {item.workspaceName && (
                  <a href={`/?workspace=${item.workspaceId}`} class="workspace-badge" {...hxProps(`/?workspace=${item.workspaceId}`)}>
                    {item.workspaceName}
                  </a>
                )}
              </div>
              <h1>{item.keySummary}</h1>
              <div class="flex items-center gap-3 flex-wrap text-[0.88rem] text-muted mt-3">
                {githubUrl ? (
                  <a href={githubUrl} target="_blank" rel="noopener" class="text-text font-medium no-underline hover:text-primary">
                    {sourceAuthor}
                  </a>
                ) : (
                  <span class="text-text font-medium">{sourceAuthor}</span>
                )}
                <span class="text-muted opacity-40">/</span>
                <time datetime={dateStr}>{formatDate(dateStr)}</time>
                {showReadingTime && (
                  <>
                    <span class="text-muted opacity-40">/</span>
                    <span>{readingTime(item.content)}</span>
                  </>
                )}
                {item.validationActionLabel && (
                  <>
                    <span class="text-muted opacity-40">/</span>
                    <span class="validation-badge">
                      {item.validationActionLabel} by {sourceAuthor}
                    </span>
                  </>
                )}
              </div>
            </header>

            {/* Key metrics callout box */}
            {metrics.length > 0 && (
              <div class="border-2 border-primary rounded-xl overflow-hidden my-6" role="region" aria-label="Key Outcomes">
                <div class="px-4 py-2 bg-primary text-primary-inverse text-xs font-semibold uppercase tracking-wide">Key Outcomes</div>
                <div class="flex max-sm:flex-col" role="list">
                  {metrics.map((m, i) => (
                    <div class={`flex-1 px-4 py-3 max-sm:py-2 text-center max-sm:text-left max-sm:flex max-sm:items-center max-sm:gap-2 bg-surface ${i > 0 ? 'border-l max-sm:border-l-0 max-sm:border-t border-border' : ''}`} role="listitem">
                      <span class="block max-sm:inline max-sm:min-w-[4rem] text-2xl max-sm:text-lg font-bold text-primary leading-tight mb-0.5">{m.value}</span>
                      <span class="block max-sm:inline text-[0.72rem] text-muted uppercase tracking-wide">{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div class="mt-8 content">
              {raw(renderedContent)}
            </div>
            {item.tags && item.tags.length > 0 && (
              <footer class="mt-10 pt-6 border-t border-border-subtle">
                <div class="flex flex-wrap gap-2">
                  {item.tags.map((t) => (
                    <a href={`/?tag=${encodeURIComponent(t)}`} class="text-sm px-3 py-1 rounded-full bg-muted/8 border border-border-subtle text-muted no-underline hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-colors" {...hxProps(`/?tag=${encodeURIComponent(t)}`)}>#{t}</a>
                  ))}
                </div>
              </footer>
            )}
          </article>
        </main>
      </div>
    </CaseStudiesLayout>
  );
}
