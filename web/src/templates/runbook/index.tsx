import type { Template, PartialResultsProps } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { RunbookSourcePage } from './source-page';
import { RunbookItemPost } from './item-post';
import { RunbookLayout } from './layout';
import { Pagination } from '../../components/pagination';

const config = getTemplateConfig('runbook');

function RunbookPartialResults(props: PartialResultsProps) {
  if (props.items.length === 0) {
    return (
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="10" width="36" height="28" rx="3"/><path d="M6 22h12l3 4h6l3-4h12"/><path d="M20 18h8M22 14h4"/></svg>
        </div>
        <p class="empty-state-title">{`No ${props.vocabulary.itemPlural} found`}</p>
        <p class="empty-state-description">Try adjusting your filters or search query.</p>
      </div>
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
            {grouped[name].map((item) => (
              <div class="flex items-center gap-3 px-4 py-3 border border-border-subtle shadow-card rounded-xl bg-surface transition-all border-l-[3px] border-l-transparent hover:shadow-card-hover hover:border-l-primary">
                <div class="flex-1 min-w-0">
                  <h3 class="m-0 mb-0.5 text-[0.95rem] font-semibold leading-snug">
                    <a href={`/item/${item.slug}`} class="no-underline text-text hover:text-primary">{item.keySummary}</a>
                  </h3>
                  <div class="flex items-center gap-2 flex-wrap text-xs text-muted">
                    {item.typeName && <span class="text-[0.72rem] px-2 py-0.5 rounded-full bg-primary/12 text-primary font-medium whitespace-nowrap">{item.typeName}</span>}
                    {item.validationActionLabel && <span class="text-[0.68rem] px-1.5 py-0.5 rounded-full font-semibold whitespace-nowrap bg-green-500/15 text-green-600">{item.validationActionLabel}</span>}
                  </div>
                </div>
              </div>
            ))}
          </>
        ))}
        {ungrouped.length > 0 && (
          <>
            {groupNames.length > 0 && <div class="text-sm font-bold text-muted uppercase tracking-wide py-2 mt-6 mb-2 border-b border-border-subtle">Uncategorized</div>}
            {ungrouped.map((item) => (
              <div class="flex items-center gap-3 px-4 py-3 border border-border-subtle shadow-card rounded-xl bg-surface transition-all border-l-[3px] border-l-transparent hover:shadow-card-hover hover:border-l-primary">
                <div class="flex-1 min-w-0">
                  <h3 class="m-0 mb-0.5 text-[0.95rem] font-semibold leading-snug">
                    <a href={`/item/${item.slug}`} class="no-underline text-text hover:text-primary">{item.keySummary}</a>
                  </h3>
                  <div class="flex items-center gap-2 flex-wrap text-xs text-muted">
                    {item.typeName && <span class="text-[0.72rem] px-2 py-0.5 rounded-full bg-primary/12 text-primary font-medium whitespace-nowrap">{item.typeName}</span>}
                    {item.validationActionLabel && <span class="text-[0.68rem] px-1.5 py-0.5 rounded-full font-semibold whitespace-nowrap bg-green-500/15 text-green-600">{item.validationActionLabel}</span>}
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
