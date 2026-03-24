import type { ItemPostProps } from '@pignal/templates';
import { SourceActionBar } from '../../components/source-action-bar';
import { JsonLd } from '../../components/json-ld';
import { buildSourcePostingJsonLd, buildMetaTags, resolveOgImage } from '../../lib/seo';
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

/** Map severity to badge Tailwind classes */
function getSeverityClasses(severity: string): string {
  switch (severity) {
    case 'p0': return 'bg-red-600 text-white';
    case 'p1': return 'bg-red-500/70 text-white';
    case 'p2': return 'bg-primary/70 text-white';
    case 'p3': return 'bg-muted/80 text-white';
    default: return 'bg-muted/80 text-white';
  }
}

/** Map validation action label to status Tailwind classes */
function getStatusClasses(actionLabel: string | null | undefined): string {
  if (!actionLabel) return '';
  const lower = actionLabel.toLowerCase();
  if (lower.includes('resolved') || lower.includes('fix')) return 'bg-emerald-500/20 text-emerald-600';
  if (lower.includes('investigating') || lower.includes('false alarm')) return 'bg-red-500/15 text-red-600';
  if (lower.includes('monitoring') || lower.includes('downgraded')) return 'bg-primary/15 text-primary';
  if (lower.includes('escalated') || lower.includes('upgraded')) return 'bg-red-500/15 text-red-600';
  return 'bg-muted/15 text-muted';
}

/** Try to extract duration from content */
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
  const severityClasses = getSeverityClasses(severity);
  const statusClasses = getStatusClasses(item.validationActionLabel);
  const duration = extractDuration(item.content);

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
    <IncidentsLayout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-16 w-full">
        <main class="min-w-0 max-w-full break-words">
          <SourceActionBar slug={item.slug ?? undefined} sourceUrl={sourceUrl} />

          <article class="source-article min-w-0 max-w-full">
            <header>
              <div class="flex items-center gap-2 flex-wrap mb-2">
                <span class={`inline-block px-2 py-0.5 rounded text-[0.72rem] font-semibold tracking-tight whitespace-nowrap ${severityClasses}`}>{item.typeName}</span>
                {item.validationActionLabel && (
                  <span class={`inline-block px-1.5 py-0.5 rounded text-[0.7rem] font-semibold tracking-tight whitespace-nowrap ${statusClasses}`}>{item.validationActionLabel}</span>
                )}
                {item.workspaceName && (
                  <a href={`/?workspace=${item.workspaceId}`} class="inline-block px-1.5 py-0.5 rounded text-[0.72rem] font-medium bg-muted/20 text-text no-underline hover:bg-muted/35 transition-colors">{item.workspaceName}</a>
                )}
              </div>
              <h1 class="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-4">{item.keySummary}</h1>

              {/* Metadata grid */}
              <div class="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm text-muted mb-5 p-3 sm:p-4 border border-border-subtle shadow-card rounded-xl bg-surface">
                <span class="font-semibold text-text">{vocabulary.type}:</span>
                <span>{item.typeName}</span>

                <span class="font-semibold text-text">Reported:</span>
                <time datetime={item.createdAt}>{formatDate(item.createdAt)}</time>

                {item.vouchedAt && item.vouchedAt !== item.createdAt && (
                  <>
                    <span class="font-semibold text-text">Published:</span>
                    <time datetime={item.vouchedAt}>{formatDate(item.vouchedAt)}</time>
                  </>
                )}

                {duration && (
                  <>
                    <span class="font-semibold text-text">Duration:</span>
                    <span class="text-sm text-muted italic">{duration}</span>
                  </>
                )}

                {item.workspaceName && (
                  <>
                    <span class="font-semibold text-text">{vocabulary.workspace}:</span>
                    <span>{item.workspaceName}</span>
                  </>
                )}

                {item.validationActionLabel && (
                  <>
                    <span class="font-semibold text-text">Status:</span>
                    <span class={`inline-block px-1.5 py-0.5 rounded text-[0.7rem] font-semibold w-fit ${statusClasses}`}>{item.validationActionLabel}</span>
                  </>
                )}

                <span class="font-semibold text-text">Author:</span>
                <span>
                  {githubUrl ? (
                    <a href={githubUrl} target="_blank" rel="noopener" class="text-primary hover:underline">{sourceAuthor}</a>
                  ) : (
                    sourceAuthor
                  )}
                </span>
              </div>
            </header>
            <div class="content mt-8">
              {raw(renderedContent)}
            </div>
            {item.tags && item.tags.length > 0 && (
              <footer class="mt-10 pt-6 border-t border-border-subtle">
                <div class="flex flex-wrap gap-2">
                  {item.tags.map((t) => (
                    <a href={`/?tag=${encodeURIComponent(t)}`} class="item-tag text-sm text-primary hover:underline">#{t}</a>
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
