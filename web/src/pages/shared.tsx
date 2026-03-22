import type { Context } from 'hono';
import type { ItemStoreRpc } from '@pignal/db';
import type { WebEnv } from '../types';
import { PublicLayout } from '../components/public-layout';
import { TypeBadge } from '../components/type-badge';
import { VisibilityBadge } from '../components/visibility-badge';
import { TableOfContents } from '../components/table-of-contents';
import { SourceActionBar } from '../components/source-action-bar';
import { buildMetaTags } from '../lib/seo';
import { renderMarkdown, stripMarkdown, extractHeadings, normalizeHeadings } from '../lib/markdown';
import { formatDate, readingTime } from '../lib/time';
import { raw } from 'hono/html';

function formatAiSource(sourceAi: string): string | null {
  if (!sourceAi) return null;
  if (sourceAi === 'mcp-self-hosted') return 'MCP';
  const parts = sourceAi.split(':');
  return parts.length === 2 ? parts[1] : sourceAi;
}

type WebVars = { store: ItemStoreRpc };

export async function sharedPage(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const token = c.req.param('token')!;
  const store = c.get('store');

  const [row, settings] = await Promise.all([
    store.getByShareToken(token),
    store.getSettings(),
  ]);

  if (!row) {
    c.status(404);
    return c.html(<p class="text-center text-muted py-12">This shared link is invalid or has expired.</p>);
  }
  const sourceUrl = new URL(c.req.url).origin;
  const sourceTitle = settings.source_title || 'My Pignal';
  const domain = new URL(sourceUrl).hostname;
  const sourceAuthor = settings.owner_name || settings.source_title || domain;
  const githubUrl = settings.source_social_github || '';

  const showToc = settings.source_show_toc !== 'false';
  const showReadingTime = settings.source_show_reading_time !== 'false';

  // Derive OG image: prefer GitHub avatar (direct URL, no redirect), fall back to branded PNG
  const githubUsername = githubUrl.replace(/\/$/, '').split('/').pop() || '';
  const ogImage = githubUsername
    ? `https://avatars.githubusercontent.com/${githubUsername}?s=400`
    : `${sourceUrl}/og-image.png`;

  const description = stripMarkdown(row.content).slice(0, 160);
  const metaTags = buildMetaTags({
    title: `${row.keySummary} | ${sourceTitle}`,
    description,
    canonicalUrl: `${sourceUrl}/s/${token}`,
    ogType: 'article',
    noIndex: true,
    imageUrl: ogImage,
  });

  const normalized = normalizeHeadings(row.content);
  const headings = extractHeadings(normalized, true);
  const renderedContent = renderMarkdown(normalized, true);

  // Unlisted content should not be CDN-cached — revoked tokens must take effect immediately
  c.header('Cache-Control', 'private, no-store');

  return c.html(
    <PublicLayout title={row.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_200px] gap-10 items-start max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-12 w-full">
        <main class="min-w-0 max-w-full break-words">
          <div class="flex items-center gap-2 text-sm text-muted mb-4 p-3 bg-warning-bg border border-warning-border rounded-lg">
            <VisibilityBadge visibility="unlisted" />
            This post was shared via a private link
          </div>

          <SourceActionBar sourceUrl={sourceUrl} showRawLink={false} />

          <article class="min-w-0 max-w-full">
            <header>
              <div class="mb-3">
                <TypeBadge typeName={row.typeName} />
              </div>
              <h1 class="text-2xl sm:text-3xl font-bold tracking-tight mb-3">{row.keySummary}</h1>
              <div class="flex items-center gap-2.5 flex-wrap text-sm text-muted">
                {!row.validationActionLabel && (
                  githubUrl ? (
                    <a href={githubUrl} target="_blank" rel="noopener" class="font-medium text-muted hover:text-primary transition-colors">
                      {sourceAuthor}
                    </a>
                  ) : (
                    <span>{sourceAuthor}</span>
                  )
                )}
                <time datetime={row.vouchedAt || row.createdAt}>
                  {formatDate(row.vouchedAt || row.createdAt)}
                </time>
                {showReadingTime && <span>{readingTime(row.content)}</span>}
                {row.validationActionLabel && (
                  githubUrl ? (
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-success/80 bg-success-bg">
                      {row.validationActionLabel} by <a href={githubUrl} target="_blank" rel="noopener" class="text-success hover:underline">{sourceAuthor}</a>
                    </span>
                  ) : (
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-success/80 bg-success-bg">
                      {row.validationActionLabel} by {sourceAuthor}
                    </span>
                  )
                )}
                {row.sourceAi && formatAiSource(row.sourceAi) && (
                  <span class="text-sm text-muted italic">
                    AI-assisted via {formatAiSource(row.sourceAi)}
                  </span>
                )}
              </div>
            </header>
            <div class="content mt-6 pt-6 border-t border-border">
              {raw(renderedContent)}
            </div>
          </article>
        </main>

        {showToc && (
          <div class="max-xl:hidden">
            <TableOfContents headings={headings} />
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
