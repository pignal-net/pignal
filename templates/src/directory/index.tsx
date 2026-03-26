/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import type { Template, PartialResultsProps } from '../types';
import { DirectorySourcePage } from './source-page';
import { DirectoryItemPost } from './item-post';
import { DirectoryLayout } from './layout';
import { Pagination } from '@pignal/render/components/pagination';
import { EmptyState } from '@pignal/render/components/empty-state';
import { stripMarkdown } from '@pignal/render/lib/markdown';

import { directoryConfig as config } from './config';

function getStatusClasses(label: string | null): string {
  if (!label) return '';
  const lower = label.toLowerCase();
  if (lower.includes('active') || lower.includes('recommended')) return 'bg-success-bg text-success border border-success-border';
  if (lower.includes('new')) return 'bg-info-bg text-info border border-info-border';
  if (lower.includes('archived') || lower.includes('inactive') || lower.includes('stale')) return 'bg-surface-raised text-muted border border-border';
  if (lower.includes('deprecated') || lower.includes('shutting')) return 'bg-error-bg text-error border border-error-border';
  return 'bg-success-bg text-success border border-success-border';
}

function DirectoryPartialResults(props: PartialResultsProps) {
  if (props.items.length === 0) {
    return (
      <EmptyState
        icon="search"
        title={`No ${props.vocabulary.itemPlural} found`}
        description="Try adjusting your search or filters."
      />
    );
  }

  // Group alphabetically
  const grouped: Record<string, typeof props.items> = {};
  for (const item of props.items) {
    const letter = (item.keySummary[0] || '#').toUpperCase();
    const key = /[A-Z]/.test(letter) ? letter : '#';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  }
  const sortedLetters = Object.keys(grouped).sort();

  return (
    <>
      {/* A-Z jump links */}
      {sortedLetters.length > 1 && (
        <nav class="flex flex-wrap gap-1 mb-6" aria-label="Alphabetical navigation">
          {sortedLetters.map((letter) => (
            <a
              href={`#letter-${letter}`}
              class="filter-chip"
            >
              {letter}
            </a>
          ))}
        </nav>
      )}
      <div class="flex flex-col">
        {sortedLetters.map((letter) => (
          <>
            <div class="text-lg font-bold text-primary pt-2 pb-1 mt-5 first:mt-0 mb-2 border-b-2 border-primary" id={`letter-${letter}`}>{letter}</div>
            {grouped[letter].map((item) => {
              const desc = stripMarkdown(item.content).slice(0, 140);
              const statusClasses = getStatusClasses(item.validationActionLabel);
              return (
                <a href={`/item/${item.slug}`} class="card-hover flex items-start gap-3 py-3 px-3 rounded-lg border-b border-border-subtle no-underline text-inherit transition-colors hover:bg-primary/4 max-sm:flex-col max-sm:gap-1">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span class="text-text font-semibold text-[0.95rem]">{item.keySummary}</span>
                      {item.typeName && <span class="text-[0.7rem] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium whitespace-nowrap">{item.typeName}</span>}
                      {item.validationActionLabel && (
                        <span class={`text-[0.68rem] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${statusClasses}`}>{item.validationActionLabel}</span>
                      )}
                    </div>
                    {desc && <div class="text-[0.82rem] text-muted leading-relaxed line-clamp-2">{desc}</div>}
                    {item.workspaceName && (
                      <div class="flex items-center gap-2 mt-1 text-xs text-muted">
                        <span class="text-[0.72rem]">{item.workspaceName}</span>
                      </div>
                    )}
                  </div>
                  <svg class="shrink-0 w-4 h-4 mt-1 text-muted opacity-40 max-sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17l9.2-9.2M17 17V7H7" /></svg>
                </a>
              );
            })}
          </>
        ))}
      </div>
      <Pagination
        total={props.total}
        limit={props.limit}
        offset={props.offset}
        baseUrl={props.paginationBase}
        htmxTarget="#source-results"
      />
    </>
  );
}

export const directoryTemplate: Template = {
  SourcePage: DirectorySourcePage,
  ItemPost: DirectoryItemPost,
  Layout: DirectoryLayout,
  PartialResults: DirectoryPartialResults,

  vocabulary: config.vocabulary,
  seo: config.seo,

  profile: config.profile,

  styles: '',
};
