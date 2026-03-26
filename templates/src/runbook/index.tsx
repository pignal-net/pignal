/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import type { Template, PartialResultsProps } from '../types';
import { RunbookSourcePage } from './source-page';
import { RunbookItemPost } from './item-post';
import { RunbookLayout } from './layout';
import { Pagination } from '@pignal/render/components/pagination';
import { EmptyState } from '@pignal/render/components/empty-state';

import { runbookConfig as config } from './config';

function RunbookPartialResults(props: PartialResultsProps) {
  if (props.items.length === 0) {
    return (
      <EmptyState
        icon="file"
        title={`No ${props.vocabulary.itemPlural} found`}
        description="Try adjusting your filters or search query."
      />
    );
  }

  // Group by playbook (workspace)
  const grouped: Record<string, typeof props.items> = {};
  const ungrouped: typeof props.items = [];
  for (const item of props.items) {
    if (item.workspaceName) {
      if (!grouped[item.workspaceName]) grouped[item.workspaceName] = [];
      grouped[item.workspaceName].push(item);
    } else {
      ungrouped.push(item);
    }
  }
  const groupNames = Object.keys(grouped).sort();

  return (
    <>
      <div class="flex flex-col gap-2">
        {groupNames.map((name) => (
          <>
            <div class="text-sm font-bold text-muted uppercase tracking-wide py-2 mt-6 first:mt-0 mb-2 border-b border-border-subtle">{name}</div>
            {grouped[name].map((item, idx) => (
              <div class="card-hover flex items-center gap-3 px-4 py-3 border border-border-subtle shadow-card rounded-xl bg-surface transition-all border-l-[3px] border-l-transparent hover:border-l-primary">
                <div class="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">{idx + 1}</div>
                <div class="flex-1 min-w-0">
                  <h3 class="m-0 mb-0.5 text-[0.95rem] font-semibold leading-snug">
                    <a href={`/item/${item.slug}`} class="no-underline text-text hover:text-primary transition-colors">{item.keySummary}</a>
                  </h3>
                  <div class="flex items-center gap-2 flex-wrap text-xs text-muted">
                    {item.typeName && <span class="text-[0.72rem] px-2 py-0.5 rounded-full bg-primary/12 text-primary font-medium whitespace-nowrap">{item.typeName}</span>}
                    {item.validationActionLabel && <span class="text-[0.68rem] px-1.5 py-0.5 rounded-full font-semibold whitespace-nowrap bg-success-bg text-success border border-success-border">{item.validationActionLabel}</span>}
                  </div>
                </div>
              </div>
            ))}
          </>
        ))}
        {ungrouped.length > 0 && (
          <>
            {groupNames.length > 0 && <div class="text-sm font-bold text-muted uppercase tracking-wide py-2 mt-6 mb-2 border-b border-border-subtle">Uncategorized</div>}
            {ungrouped.map((item, idx) => (
              <div class="card-hover flex items-center gap-3 px-4 py-3 border border-border-subtle shadow-card rounded-xl bg-surface transition-all border-l-[3px] border-l-transparent hover:border-l-primary">
                <div class="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">{idx + 1}</div>
                <div class="flex-1 min-w-0">
                  <h3 class="m-0 mb-0.5 text-[0.95rem] font-semibold leading-snug">
                    <a href={`/item/${item.slug}`} class="no-underline text-text hover:text-primary transition-colors">{item.keySummary}</a>
                  </h3>
                  <div class="flex items-center gap-2 flex-wrap text-xs text-muted">
                    {item.typeName && <span class="text-[0.72rem] px-2 py-0.5 rounded-full bg-primary/12 text-primary font-medium whitespace-nowrap">{item.typeName}</span>}
                    {item.validationActionLabel && <span class="text-[0.68rem] px-1.5 py-0.5 rounded-full font-semibold whitespace-nowrap bg-success-bg text-success border border-success-border">{item.validationActionLabel}</span>}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
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

export const runbookTemplate: Template = {
  SourcePage: RunbookSourcePage,
  ItemPost: RunbookItemPost,
  Layout: RunbookLayout,
  PartialResults: RunbookPartialResults,

  vocabulary: config.vocabulary,
  seo: config.seo,

  profile: config.profile,

  styles: '',
};
