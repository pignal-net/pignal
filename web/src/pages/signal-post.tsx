import type { Context } from 'hono';
import type { Signal } from '@pignal/core';
import type { SignalWithMeta, SignalStoreRpc } from '@pignal/db';
import type { WebEnv } from '../types';
import { PublicLayout } from '../components/public-layout';
import { TypeBadge } from '../components/type-badge';
import { TableOfContents } from '../components/table-of-contents';
import { SourceActionBar } from '../components/source-action-bar';
import { JsonLd } from '../components/json-ld';
import { buildSourcePostingJsonLd, buildMetaTags } from '../lib/seo';
import { renderMarkdown, stripMarkdown, extractHeadings, normalizeHeadings } from '../lib/markdown';
import { formatDate, readingTime } from '../lib/time';
import { raw } from 'hono/html';

type WebVars = { store: SignalStoreRpc };

function formatAiSource(sourceAi: string): string | null {
  if (!sourceAi) return null;
  if (sourceAi === 'mcp-self-hosted') return 'MCP';
  const parts = sourceAi.split(':');
  return parts.length === 2 ? parts[1] : sourceAi;
}

function toSignal(row: SignalWithMeta): Signal {
  return {
    id: row.id,
    keySummary: row.keySummary,
    content: row.content,
    typeId: row.typeId,
    typeName: row.typeName,
    workspaceId: row.workspaceId,
    workspaceName: row.workspaceName,
    sourceAi: row.sourceAi,
    validationActionId: row.validationActionId,
    validationActionLabel: row.validationActionLabel,
    tags: row.tags,
    pinnedAt: row.pinnedAt,
    isArchived: row.isArchived === 1,
    visibility: row.visibility ?? 'private',
    slug: row.slug,
    shareToken: row.shareToken,
    vouchedAt: row.vouchedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function signalPostPage(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const slug = c.req.param('slug')!;
  const store = c.get('store');

  const [row, settings] = await Promise.all([
    store.getBySlug(slug),
    store.getSettings(),
  ]);

  if (!row) {
    c.status(404);
    return c.html(<p class="empty-state">Post not found.</p>);
  }

  const signal = toSignal(row);
  const sourceUrl = new URL(c.req.url).origin;
  const sourceTitle = settings.source_title || 'My Signals';
  const domain = new URL(sourceUrl).hostname;
  const sourceAuthor = settings.owner_name || settings.source_title || domain;
  const githubUrl = settings.source_social_github || '';

  const showToc = settings.source_show_toc !== 'false';
  const showReadingTime = settings.source_show_reading_time !== 'false';

  // Compute description once, pass to both meta tags and JSON-LD
  // Derive OG image: prefer GitHub avatar (direct URL, no redirect), fall back to branded PNG
  const githubUsername = githubUrl.replace(/\/$/, '').split('/').pop() || '';
  const ogImage = githubUsername
    ? `https://avatars.githubusercontent.com/${githubUsername}?s=400`
    : `${sourceUrl}/og-image.png`;

  const description = stripMarkdown(signal.content).slice(0, 160);
  const jsonLd = buildSourcePostingJsonLd(signal, settings, sourceUrl, description);
  const metaTags = buildMetaTags({
    title: `${signal.keySummary} | ${sourceTitle}`,
    description,
    canonicalUrl: `${sourceUrl}/signal/${slug}`,
    ogType: 'article',
    feedUrl: `${sourceUrl}/feed.xml`,
    imageUrl: ogImage,
  });

  // Normalize headings once, reuse for both extraction and rendering
  const normalized = normalizeHeadings(signal.content);
  const headings = extractHeadings(normalized, true);
  const renderedContent = renderMarkdown(normalized, true);

  c.header('Cache-Control', 'public, max-age=60');

  return c.html(
    <PublicLayout title={signal.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="source-page source-page--post">

        <main class="source-main">
          <SourceActionBar slug={slug} sourceUrl={sourceUrl} />

          <article class="source-article">
            <header>
              <div class="source-category">
                <TypeBadge typeName={signal.typeName} />
                {signal.workspaceName && (
                  <a href={`/?workspace=${signal.workspaceId}`} class="workspace-badge">{signal.workspaceName}</a>
                )}
              </div>
              <h1>{signal.keySummary}</h1>
              <div class="post-meta">
                {!signal.validationActionLabel && (
                  githubUrl ? (
                    <a href={githubUrl} target="_blank" rel="noopener" class="post-author">
                      {sourceAuthor}
                    </a>
                  ) : (
                    <span>{sourceAuthor}</span>
                  )
                )}
                <time datetime={signal.vouchedAt || signal.createdAt}>
                  {formatDate(signal.vouchedAt || signal.createdAt)}
                </time>
                {showReadingTime && <span>{readingTime(signal.content)}</span>}
                {signal.validationActionLabel && (
                  githubUrl ? (
                    <span class="validation-badge">
                      {signal.validationActionLabel} by <a href={githubUrl} target="_blank" rel="noopener">{sourceAuthor}</a>
                    </span>
                  ) : (
                    <span class="validation-badge">
                      {signal.validationActionLabel} by {sourceAuthor}
                    </span>
                  )
                )}
                {signal.sourceAi && formatAiSource(signal.sourceAi) && (
                  <span class="ai-source">
                    AI-assisted via {formatAiSource(signal.sourceAi)}
                  </span>
                )}
              </div>
            </header>
            <div class="content">
              {raw(renderedContent)}
            </div>
            {signal.tags && signal.tags.length > 0 && (
              <footer class="signal-tags-footer">
                <div class="signal-tags">
                  {signal.tags.map((t) => (
                    <a href={`/?tag=${encodeURIComponent(t)}`} class="signal-tag">#{t}</a>
                  ))}
                </div>
              </footer>
            )}
          </article>
        </main>

        {showToc && <TableOfContents headings={headings} />}
      </div>
    </PublicLayout>
  );
}
