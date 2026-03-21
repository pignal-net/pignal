import type { ItemPostProps } from '@pignal/templates';
import { TableOfContents } from '../../components/table-of-contents';
import { SourceActionBar } from '../../components/source-action-bar';
import { JsonLd } from '../../components/json-ld';
import { buildSourcePostingJsonLd, buildMetaTags } from '../../lib/seo';
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

/**
 * Extract key outcome metrics from the content for the callout box.
 */
function extractMetrics(content: string): { value: string; label: string }[] {
  const metrics: { value: string; label: string }[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    if (metrics.length >= 4) break;

    const pctMatch = line.match(/(\d+(?:\.\d+)?%)\s+([\w\s]{3,20})/i);
    if (pctMatch && metrics.length < 4) {
      metrics.push({ value: pctMatch[1], label: pctMatch[2].trim().slice(0, 20) });
      continue;
    }

    const multMatch = line.match(/(\d+(?:\.\d+)?x)\s+([\w\s]{3,20})/i);
    if (multMatch && metrics.length < 4) {
      metrics.push({ value: multMatch[1], label: multMatch[2].trim().slice(0, 20) });
      continue;
    }

    const dollarMatch = line.match(/(\$[\d.]+[KMB]?)\s+([\w\s]{3,20})/i);
    if (dollarMatch && metrics.length < 4) {
      metrics.push({ value: dollarMatch[1], label: dollarMatch[2].trim().slice(0, 20) });
    }
  }

  return metrics;
}

export function CaseStudiesItemPost(props: ItemPostProps) {
  const {
    item,
    settings,
    renderedContent,
    headings,
    sourceUrl,
    sourceAuthor,
    githubUrl,
  } = props;

  const sourceTitle = settings.source_title || 'My Case Studies';
  const showToc = settings.source_show_toc !== 'false';
  const showReadingTime = settings.source_show_reading_time !== 'false';
  const dateStr = item.vouchedAt || item.createdAt;

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

  const metrics = extractMetrics(item.content);

  return (
    <CaseStudiesLayout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="source-page source-page--post">
        <main class="source-main">
          <SourceActionBar slug={item.slug ?? undefined} sourceUrl={sourceUrl} />

          <article class="source-article">
            <header class="case-studies-post-header">
              <div class="source-category">
                <a href={`/?type=${item.typeId}`} class="case-studies-industry-badge" {...hxProps(`/?type=${item.typeId}`)}>
                  {item.typeName}
                </a>
                {item.workspaceName && (
                  <a href={`/?workspace=${item.workspaceId}`} class="workspace-badge" {...hxProps(`/?workspace=${item.workspaceId}`)}>
                    {item.workspaceName}
                  </a>
                )}
              </div>
              <h1>{item.keySummary}</h1>
              <div class="case-studies-post-meta">
                {githubUrl ? (
                  <a href={githubUrl} target="_blank" rel="noopener" class="post-author">
                    {sourceAuthor}
                  </a>
                ) : (
                  <span class="post-author">{sourceAuthor}</span>
                )}
                <span class="case-studies-meta-sep">/</span>
                <time datetime={dateStr}>{formatDate(dateStr)}</time>
                {showReadingTime && (
                  <>
                    <span class="case-studies-meta-sep">/</span>
                    <span>{readingTime(item.content)}</span>
                  </>
                )}
                {item.validationActionLabel && (
                  <>
                    <span class="case-studies-meta-sep">/</span>
                    <span class="validation-badge">
                      {item.validationActionLabel} by {sourceAuthor}
                    </span>
                  </>
                )}
              </div>
            </header>

            {/* Key metrics callout box */}
            {metrics.length > 0 && (
              <div class="case-studies-key-metrics">
                <div class="case-studies-key-metrics-title">Key Outcomes</div>
                <div class="case-studies-metrics">
                  {metrics.map((m) => (
                    <div class="case-studies-metric">
                      <span class="case-studies-metric-value">{m.value}</span>
                      <span class="case-studies-metric-label">{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div class="content">
              {raw(renderedContent)}
            </div>
            {item.tags && item.tags.length > 0 && (
              <footer class="item-tags-footer">
                <div class="item-tags">
                  {item.tags.map((t) => (
                    <a href={`/?tag=${encodeURIComponent(t)}`} class="item-tag" {...hxProps(`/?tag=${encodeURIComponent(t)}`)}>#{t}</a>
                  ))}
                </div>
              </footer>
            )}
          </article>
        </main>

        {showToc && <TableOfContents headings={headings} />}
      </div>
    </CaseStudiesLayout>
  );
}
