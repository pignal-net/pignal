import type { Template, PartialResultsProps } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { DirectorySourcePage } from './source-page';
import { DirectoryItemPost } from './item-post';
import { DirectoryLayout } from './layout';
import { Pagination } from '../../components/pagination';
import { stripMarkdown } from '../../lib/markdown';

const config = getTemplateConfig('directory');

function getStatusClasses(label: string | null): string {
  if (!label) return '';
  const lower = label.toLowerCase();
  if (lower.includes('active') || lower.includes('recommended')) return 'bg-green-500/15 text-green-600';
  if (lower.includes('new')) return 'bg-blue-500/15 text-blue-500';
  if (lower.includes('archived') || lower.includes('inactive') || lower.includes('stale')) return 'bg-border/50 text-muted';
  if (lower.includes('deprecated') || lower.includes('shutting')) return 'bg-red-500/15 text-red-600';
  return 'bg-green-500/15 text-green-600';
}

function DirectoryPartialResults(props: PartialResultsProps) {
  if (props.items.length === 0) {
    return (
      <div class="empty-state">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
        <p>{`No ${props.vocabulary.itemPlural} found.`}</p>
      </div>
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
      <div class="flex flex-col">
        {sortedLetters.map((letter) => (
          <>
            <div class="text-xl font-bold text-primary pt-2 pb-1 mt-6 first:mt-0 mb-3 border-b-2 border-primary">{letter}</div>
            {grouped[letter].map((item) => {
              const desc = stripMarkdown(item.content).slice(0, 140);
              const statusClasses = getStatusClasses(item.validationActionLabel);
              return (
                <div class="flex items-start gap-3 py-3 border-b border-border-subtle transition-colors hover:bg-primary/[0.03] max-sm:flex-col max-sm:gap-1">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-0.5 flex-wrap">
                      <a href={`/item/${item.slug}`} class="no-underline text-text font-semibold text-[0.95rem] hover:text-primary after:content-['\\2197'] after:text-xs after:ml-1 after:opacity-40">{item.keySummary}</a>
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
                </div>
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
