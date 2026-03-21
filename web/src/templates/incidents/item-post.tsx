import type { ItemPostProps } from '@pignal/templates';
import { SourceActionBar } from '../../components/source-action-bar';
import { JsonLd } from '../../components/json-ld';
import { buildSourcePostingJsonLd, buildMetaTags } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { formatDate } from '../../lib/time';
import { raw } from 'hono/html';
import { IncidentsLayout } from './layout';

/** Determine severity level from type name (P0, P1, P2, P3) */
function getSeverityLevel(typeName: string): string {
  const lower = typeName.toLowerCase();
  if (lower.includes('p0') || lower.includes('critical')) return 'p0';
  if (lower.includes('p1') || lower.includes('major')) return 'p1';
  if (lower.includes('p2') || lower.includes('minor')) return 'p2';
  if (lower.includes('p3') || lower.includes('low')) return 'p3';
  return 'p3';
}

/** Map validation action label to a status CSS class */
function getStatusClass(actionLabel: string | null | undefined): string {
  if (!actionLabel) return '';
  const lower = actionLabel.toLowerCase();
  if (lower.includes('resolved') || lower.includes('fix')) return 'incidents-status--resolved';
  if (lower.includes('investigating') || lower.includes('false alarm')) return 'incidents-status--investigating';
  if (lower.includes('monitoring') || lower.includes('downgraded')) return 'incidents-status--monitoring';
  if (lower.includes('escalated') || lower.includes('upgraded')) return 'incidents-status--escalated';
  return 'incidents-status--default';
}

/** Try to extract duration from content (e.g. "Duration: 45 minutes" or "lasted 2 hours") */
function extractDuration(content: string): string | null {
  const patterns = [
    /duration:\s*(.+?)(?:\n|$)/i,
    /lasted\s+(.+?)(?:\.|,|\n|$)/i,
    /downtime(?:\s+of)?:\s*(.+?)(?:\n|$)/i,
    /total\s+(?:downtime|outage):\s*(.+?)(?:\n|$)/i,
  ];
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

export function IncidentsItemPost(props: ItemPostProps) {
  const {
    item,
    settings,
    renderedContent,
    sourceUrl,
    sourceAuthor,
    githubUrl,
    vocabulary,
  } = props;

  const sourceTitle = settings.source_title || 'Incident Log';
  const severity = getSeverityLevel(item.typeName);
  const statusClass = getStatusClass(item.validationActionLabel);
  const duration = extractDuration(item.content);

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
    <IncidentsLayout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="source-page source-page--post">
        <main class="source-main">
          <SourceActionBar slug={item.slug ?? undefined} sourceUrl={sourceUrl} />

          <article class="source-article">
            <header>
              <div class="incidents-post-header">
                <span class={`incidents-severity incidents-severity--${severity}`}>{item.typeName}</span>
                {item.validationActionLabel && (
                  <span class={`incidents-status ${statusClass}`}>{item.validationActionLabel}</span>
                )}
                {item.workspaceName && (
                  <a href={`/?workspace=${item.workspaceId}`} class="incidents-service-badge">{item.workspaceName}</a>
                )}
              </div>
              <h1>{item.keySummary}</h1>

              {/* Metadata grid */}
              <div class="incidents-post-meta-grid">
                <span class="incidents-post-meta-label">{vocabulary.type}:</span>
                <span>{item.typeName}</span>

                <span class="incidents-post-meta-label">Reported:</span>
                <time datetime={item.createdAt}>{formatDate(item.createdAt)}</time>

                {item.vouchedAt && item.vouchedAt !== item.createdAt && (
                  <>
                    <span class="incidents-post-meta-label">Published:</span>
                    <time datetime={item.vouchedAt}>{formatDate(item.vouchedAt)}</time>
                  </>
                )}

                {duration && (
                  <>
                    <span class="incidents-post-meta-label">Duration:</span>
                    <span class="incidents-duration">{duration}</span>
                  </>
                )}

                {item.workspaceName && (
                  <>
                    <span class="incidents-post-meta-label">{vocabulary.workspace}:</span>
                    <span>{item.workspaceName}</span>
                  </>
                )}

                {item.validationActionLabel && (
                  <>
                    <span class="incidents-post-meta-label">Status:</span>
                    <span class={`incidents-status ${statusClass}`}>{item.validationActionLabel}</span>
                  </>
                )}

                <span class="incidents-post-meta-label">Author:</span>
                <span>
                  {githubUrl ? (
                    <a href={githubUrl} target="_blank" rel="noopener">{sourceAuthor}</a>
                  ) : (
                    sourceAuthor
                  )}
                </span>
              </div>
            </header>
            <div class="content">
              {raw(renderedContent)}
            </div>
            {item.tags && item.tags.length > 0 && (
              <footer class="item-tags-footer">
                <div class="item-tags">
                  {item.tags.map((t) => (
                    <a href={`/?tag=${encodeURIComponent(t)}`} class="item-tag">#{t}</a>
                  ))}
                </div>
              </footer>
            )}
          </article>
        </main>
      </div>
    </IncidentsLayout>
  );
}
