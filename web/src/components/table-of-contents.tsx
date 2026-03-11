import type { TocEntry } from '../lib/markdown';

interface TableOfContentsProps {
  headings: TocEntry[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  if (headings.length === 0) return <></>;

  return (
    <aside class="source-toc">
      <nav aria-label="Table of contents">
        <p class="toc-title">On this page</p>
        <ul>
          {headings.map((h) => (
            <li class={h.level === 3 ? 'toc-h3' : ''}>
              <a href={`#${h.id}`}>{h.text}</a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
