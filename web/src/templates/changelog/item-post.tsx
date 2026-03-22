import type { ItemPostProps } from '@pignal/templates';
import { SourceActionBar } from '../../components/source-action-bar';
import { JsonLd } from '../../components/json-ld';
import { buildSourcePostingJsonLd, buildMetaTags } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { formatDate } from '../../lib/time';
import { raw } from 'hono/html';
import { ChangelogLayout } from './layout';

/** Map type name to Tailwind badge classes */
function getTypeBadgeClasses(typeName: string): string {
  const lower = typeName.toLowerCase();
  if (lower.includes('feature') || lower.includes('new')) return 'bg-primary/85 text-white';
  if (lower.includes('fix') || lower.includes('bug')) return 'bg-emerald-600/85 text-white';
  if (lower.includes('breaking')) return 'bg-red-600/85 text-white';
  if (lower.includes('improvement') || lower.includes('enhance')) return 'bg-primary/60 text-white';
  if (lower.includes('deprecat')) return 'bg-red-600/50 text-white';
  return 'bg-muted/60 text-white';
}

export function ChangelogItemPost(props: ItemPostProps) {
  const {
    item,
    settings,
    renderedContent,
    sourceUrl,
    sourceAuthor,
    githubUrl,
    vocabulary: _vocabulary,
  } = props;

  const sourceTitle = settings.source_title || 'Changelog';

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

  const badgeClasses = getTypeBadgeClasses(item.typeName);

  return (
    <ChangelogLayout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-16 w-full">
        <main class="min-w-0 max-w-full break-words">
          <SourceActionBar slug={item.slug ?? undefined} sourceUrl={sourceUrl} />

          <article class="source-article min-w-0 max-w-full">
            <header>
              <div class="flex items-center gap-2 flex-wrap mb-2">
                <span class={`inline-block px-2 py-0.5 rounded text-[0.72rem] font-semibold tracking-tight whitespace-nowrap ${badgeClasses}`}>{item.typeName}</span>
                {item.workspaceName && (
                  <a href={`/?workspace=${item.workspaceId}`} class="inline-block px-1.5 py-0.5 rounded text-[0.72rem] font-medium bg-muted/20 text-text no-underline hover:bg-muted/35 transition-colors">{item.workspaceName}</a>
                )}
              </div>
              <h1 class="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-4">{item.keySummary}</h1>
              <div class="flex items-center gap-3 flex-wrap text-sm text-muted mb-4">
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
                    <a href={`/?tag=${encodeURIComponent(t)}`} class="item-tag text-sm text-primary hover:underline">#{t}</a>
                  ))}
                </div>
              </footer>
            )}
          </article>
        </main>
      </div>
    </ChangelogLayout>
  );
}
