interface SourceActionBarProps {
  slug?: string;
  sourceUrl: string;
  showRawLink?: boolean;
}

export function SourceActionBar({ slug, sourceUrl, showRawLink = true }: SourceActionBarProps) {
  const rawMdUrl = slug ? `/signal/${slug}.md` : undefined;
  const fullMdUrl = slug ? `${sourceUrl}/signal/${slug}.md` : undefined;

  return (
    <div class="source-actions">
      <nav class="source-breadcrumb" aria-label="Breadcrumb">
        <a href="/">&larr; All posts</a>
      </nav>
      <details class="dropdown" role="list">
        <summary aria-haspopup="listbox">Copy page</summary>
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
