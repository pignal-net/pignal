import type { Context } from 'hono';
import type { SignalStoreRpc } from '@pignal/db';
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

type WebVars = { store: SignalStoreRpc };

export async function sharedPage(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const token = c.req.param('token')!;
  const store = c.get('store');

  const [row, settings] = await Promise.all([
    store.getByShareToken(token),
    store.getSettings(),
  ]);

  if (!row) {
    c.status(404);
    return c.html(<p class="empty-state">This shared link is invalid or has expired.</p>);
  }
  const sourceUrl = new URL(c.req.url).origin;
  const sourceTitle = settings.source_title || 'My Signals';
  const domain = new URL(sourceUrl).hostname;
  const sourceAuthor = settings.owner_name || settings.source_title || domain;
  const githubUrl = settings.source_social_github || '';

  const showToc = settings.source_show_toc !== 'false';
  const showReadingTime = settings.source_show_reading_time !== 'false';

  const description = stripMarkdown(row.content).slice(0, 160);
  const metaTags = buildMetaTags({
    title: `${row.keySummary} | ${sourceTitle}`,
    description,
    canonicalUrl: `${sourceUrl}/s/${token}`,
    ogType: 'article',
    noIndex: true,
  });

  const normalized = normalizeHeadings(row.content);
  const headings = extractHeadings(normalized, true);
  const renderedContent = renderMarkdown(normalized, true);

  // Unlisted content should not be CDN-cached — revoked tokens must take effect immediately
  c.header('Cache-Control', 'private, no-store');

  return c.html(
    <PublicLayout title={row.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <div class="source-page source-page--shared">
        <main class="source-main">
          <div class="shared-notice">
            <VisibilityBadge visibility="unlisted" />
            This post was shared via a private link
          </div>

          <SourceActionBar sourceUrl={sourceUrl} showRawLink={false} />

          <article class="source-article">
            <header>
              <div class="source-category">
                <TypeBadge typeName={row.typeName} />
              </div>
              <h1>{row.keySummary}</h1>
              <div class="post-meta">
                {!row.validationActionLabel && (
                  githubUrl ? (
                    <a href={githubUrl} target="_blank" rel="noopener" class="post-author">
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
                    <span class="validation-badge">
                      {row.validationActionLabel} by <a href={githubUrl} target="_blank" rel="noopener">{sourceAuthor}</a>
                    </span>
                  ) : (
                    <span class="validation-badge">
                      {row.validationActionLabel} by {sourceAuthor}
                    </span>
                  )
                )}
                {row.sourceAi && formatAiSource(row.sourceAi) && (
                  <span class="ai-source">
                    AI-assisted via {formatAiSource(row.sourceAi)}
                  </span>
                )}
              </div>
            </header>
            <div class="content">
              {raw(renderedContent)}
            </div>
          </article>
        </main>

        {showToc && <TableOfContents headings={headings} />}
      </div>
    </PublicLayout>
  );
}
