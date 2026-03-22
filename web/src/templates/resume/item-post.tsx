import type { ItemPostProps } from '@pignal/templates';
import { TypeBadge } from '../../components/type-badge';
import { SourceActionBar } from '../../components/source-action-bar';
import { JsonLd } from '../../components/json-ld';
import { buildSourcePostingJsonLd, buildMetaTags } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { formatDate } from '../../lib/time';
import { raw } from 'hono/html';
import { ResumeLayout } from './layout';

export function ResumeItemPost(props: ItemPostProps) {
  const {
    item,
    settings,
    renderedContent,
    sourceUrl,
    sourceAuthor,
    githubUrl,
    vocabulary: _vocabulary,
  } = props;

  const sourceTitle = settings.source_title || 'My Resume';

  // Derive OG image
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

  const dateStr = item.vouchedAt || item.createdAt;

  return (
    <ResumeLayout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="source-page source-page--post">
        <main class="max-w-[740px] mx-auto px-4">
          <SourceActionBar slug={item.slug ?? undefined} sourceUrl={sourceUrl} />

          <article class="source-article">
            <header class="mb-8 pb-6 border-b-2 border-primary">
              <div class="inline-block mb-4">
                <TypeBadge typeName={item.typeName} />
              </div>
              <h1 class="text-3xl sm:text-4xl max-sm:text-xl font-bold m-0 leading-tight mb-4 text-text">{item.keySummary}</h1>
              <div class="flex items-center gap-3 flex-wrap text-[0.8rem] text-muted">
                {githubUrl ? (
                  <a href={githubUrl} target="_blank" rel="noopener" class="text-primary no-underline hover:underline">
                    {sourceAuthor}
                  </a>
                ) : (
                  <span>{sourceAuthor}</span>
                )}
                <time datetime={dateStr}>{formatDate(dateStr)}</time>
                {item.validationActionLabel && (
                  <span class="inline-block px-2 py-0.5 text-[0.65rem] font-semibold rounded-xl bg-primary/10 text-primary uppercase tracking-wide">
                    {item.validationActionLabel}
                  </span>
                )}
                {item.workspaceName && (
                  <span class="inline-block px-2 py-0.5 text-[0.65rem] font-semibold rounded-xl bg-primary/10 text-primary uppercase tracking-wide">{item.workspaceName}</span>
                )}
              </div>
            </header>

            <div class="mt-8 content">
              {raw(renderedContent)}
            </div>

            {item.tags && item.tags.length > 0 && (
              <footer class="flex flex-wrap gap-1.5 mt-10 pt-6 border-t border-border-subtle">
                {item.tags.map((t) => (
                  <a href={`/?tag=${encodeURIComponent(t)}`} class="inline-block px-2.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary no-underline hover:underline">#{t}</a>
                ))}
              </footer>
            )}
          </article>
        </main>
      </div>
    </ResumeLayout>
  );
}
