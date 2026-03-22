interface PaginationProps {
  total: number;
  limit: number;
  offset: number;
  baseUrl: string;
  htmxTarget?: string;
}

/**
 * Build a truncated page list: [1, '...', 4, 5, 6, '...', 20]
 * Always shows first, last, and a window around current page.
 */
function buildPageList(currentPage: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [1];
  const windowStart = Math.max(2, currentPage - 1);
  const windowEnd = Math.min(totalPages - 1, currentPage + 1);

  if (windowStart > 2) pages.push('...');
  for (let i = windowStart; i <= windowEnd; i++) pages.push(i);
  if (windowEnd < totalPages - 1) pages.push('...');
  pages.push(totalPages);

  return pages;
}

export function Pagination({ total, limit, offset, baseUrl, htmxTarget }: PaginationProps) {
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  if (totalPages <= 1) return null;

  const pages = buildPageList(currentPage, totalPages);
  const separator = baseUrl.includes('?') ? '&' : '?';

  const linkClass = 'inline-flex items-center justify-center min-w-[2.2rem] h-10 px-2 rounded-lg text-sm no-underline transition-colors text-muted hover:bg-primary hover:text-primary-inverse';
  const currentClass = 'inline-flex items-center justify-center min-w-[2.2rem] h-10 px-2 rounded-lg text-sm font-semibold bg-primary text-primary-inverse';

  return (
    <nav class="flex justify-center items-center gap-1.5 mt-8 pt-6 border-t border-border-subtle flex-wrap" aria-label="Pagination">
      {currentPage > 1 && (
        <a
          href={`${baseUrl}${separator}offset=${(currentPage - 2) * limit}`}
          class={linkClass}
          rel="prev"
          {...(htmxTarget ? { 'hx-get': `${baseUrl}${separator}offset=${(currentPage - 2) * limit}`, 'hx-target': htmxTarget, 'hx-push-url': 'true' } : {})}
        >
          Previous
        </a>
      )}
      {pages.map((page) => (
        page === '...' ? (
          <span class="text-muted px-1">&hellip;</span>
        ) : page === currentPage ? (
          <span class={currentClass}>{page}</span>
        ) : (
          <a
            href={`${baseUrl}${separator}offset=${(page - 1) * limit}`}
            class={linkClass}
            {...(htmxTarget ? { 'hx-get': `${baseUrl}${separator}offset=${(page - 1) * limit}`, 'hx-target': htmxTarget, 'hx-push-url': 'true' } : {})}
          >
            {page}
          </a>
        )
      ))}
      {currentPage < totalPages && (
        <a
          href={`${baseUrl}${separator}offset=${currentPage * limit}`}
          class={linkClass}
          rel="next"
          {...(htmxTarget ? { 'hx-get': `${baseUrl}${separator}offset=${currentPage * limit}`, 'hx-target': htmxTarget, 'hx-push-url': 'true' } : {})}
        >
          Next
        </a>
      )}
    </nav>
  );
}
