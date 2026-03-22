interface SourceActionBarProps {
  slug?: string;
  sourceUrl: string;
  showRawLink?: boolean;
}

export function SourceActionBar({ slug, sourceUrl, showRawLink = true }: SourceActionBarProps) {
  const rawMdUrl = slug ? `/item/${slug}.md` : undefined;
  const fullMdUrl = slug ? `${sourceUrl}/item/${slug}.md` : undefined;

  return (
    <div class="flex justify-between items-center mb-8 pb-4 border-b border-border-subtle relative">
      <nav class="flex items-center gap-1.5 text-sm text-muted" aria-label="Breadcrumb">
        <a href="/" class="text-muted no-underline hover:text-primary transition-colors">&larr; All posts</a>
      </nav>
      <details class="dropdown" role="list">
        <summary aria-haspopup="listbox" class="px-2.5 py-1 text-xs border border-border rounded-md text-muted hover:text-text hover:border-text/30 transition-colors bg-transparent cursor-pointer">Share</summary>
        <ul role="listbox">
          <li>
            <a href="#" data-action="copy-page" role="option">
              Copy page text
            </a>
          </li>
          {fullMdUrl && (
            <li>
              <a href="#" data-action="copy-markdown" data-url={fullMdUrl} role="option">
                Copy as Markdown
              </a>
            </li>
          )}
          {showRawLink && rawMdUrl && (
            <li>
              <a href={rawMdUrl} role="option">
                View raw Markdown
              </a>
            </li>
          )}
        </ul>
      </details>
    </div>
  );
}
