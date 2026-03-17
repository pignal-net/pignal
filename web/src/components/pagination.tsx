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

  return (
    <nav class="pagination" aria-label="Pagination">
      {currentPage > 1 && (
        <a
          href={`${baseUrl}${separator}offset=${(currentPage - 2) * limit}`}
          rel="prev"
          {...(htmxTarget ? { 'hx-get': `${baseUrl}${separator}offset=${(currentPage - 2) * limit}`, 'hx-target': htmxTarget, 'hx-push-url': 'true' } : {})}
        >
          Previous
        </a>
      )}
      {pages.map((page) => (
        page === '...' ? (
          <span class="ellipsis">…</span>
        ) : page === currentPage ? (
          <span class="current">{page}</span>
        ) : (
          <a
            href={`${baseUrl}${separator}offset=${(page - 1) * limit}`}
            {...(htmxTarget ? { 'hx-get': `${baseUrl}${separator}offset=${(page - 1) * limit}`, 'hx-target': htmxTarget, 'hx-push-url': 'true' } : {})}
          >
            {page}
          </a>
        )
      ))}
      {currentPage < totalPages && (
        <a
          href={`${baseUrl}${separator}offset=${currentPage * limit}`}
          rel="next"
          {...(htmxTarget ? { 'hx-get': `${baseUrl}${separator}offset=${currentPage * limit}`, 'hx-target': htmxTarget, 'hx-push-url': 'true' } : {})}
        >
          Next
        </a>
      )}
    </nav>
  );
}
