/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import type { Template, PartialResultsProps } from '../types';
import { ServicesSourcePage } from './source-page';
import { ServicesItemPost } from './item-post';
import { ServicesLayout } from './layout';
import { Pagination } from '@pignal/render/components/pagination';
import { EmptyState } from '@pignal/render/components/empty-state';
import { stripMarkdown } from '@pignal/render/lib/markdown';

import { servicesConfig as config } from './config';

function ServicesPartialResults(props: PartialResultsProps) {
  if (props.items.length === 0) {
    return (
      <EmptyState
        icon="search"
        title={`No ${props.vocabulary.itemPlural} found`}
        description="Try adjusting your filters or search terms."
      />
    );
  }

  // Group items by tier (type) -- we just show them in a flat grid for partial results
  return (
    <>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {props.items.map((item) => {
          const desc = stripMarkdown(item.content).slice(0, 150);
          return (
            <div class="card-hover border border-border-subtle border-t-[3px] border-t-primary rounded-xl bg-surface p-5 flex flex-col shadow-card">
              <div class="flex items-start justify-between gap-2 mb-2">
                <h3 class="m-0 text-base font-semibold leading-snug flex-1">
                  <a href={`/item/${item.slug}`} class="no-underline text-text hover:text-primary transition-colors">{item.keySummary}</a>
                </h3>
                {item.typeName && <span class="text-[0.7rem] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold whitespace-nowrap shrink-0">{item.typeName}</span>}
              </div>
              {desc && <div class="text-sm text-muted leading-relaxed mb-3 line-clamp-3 flex-1">{desc}</div>}
              <div class="flex items-center justify-between pt-3 border-t border-border-subtle text-xs text-muted">
                <div>
                  {item.workspaceName && <span class="text-[0.72rem]">{item.workspaceName}</span>}
                </div>
                <div class="flex items-center gap-2">
                  {item.validationActionLabel && (
                    <span class="text-[0.7rem] px-2 py-0.5 rounded-full font-semibold bg-success/15 text-success whitespace-nowrap">{item.validationActionLabel}</span>
                  )}
                  <a href={`/item/${item.slug}`} class="text-primary no-underline font-semibold text-[0.82rem] hover:underline">Details</a>
                </div>
              </div>
            </div>
          );
        })}
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

export const servicesTemplate: Template = {
  SourcePage: ServicesSourcePage,
  ItemPost: ServicesItemPost,
  Layout: ServicesLayout,
  PartialResults: ServicesPartialResults,

  vocabulary: config.vocabulary,
  seo: config.seo,

  profile: config.profile,

  styles: '',
};
