import type { Template, PartialResultsProps } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { CourseSourcePage } from './source-page';
import { CourseItemPost } from './item-post';
import { CourseLayout } from './layout';
import { Pagination } from '../../components/pagination';
import { stripMarkdown } from '../../lib/markdown';
import { readingTime } from '../../lib/time';

const config = getTemplateConfig('course');

function CoursePartialResults(props: PartialResultsProps) {
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

  return (
    <>
      <div class="flex flex-col gap-3">
        {props.items.map((item, idx) => {
          const num = props.offset + idx + 1;
          const desc = stripMarkdown(item.content).slice(0, 120);
          return (
            <div class="flex items-start max-sm:flex-col gap-4 max-sm:gap-2 p-4 border border-border-subtle shadow-card rounded-xl bg-surface transition-all hover:shadow-card-hover hover:border-primary">
              <div class="flex items-center justify-center w-10 h-10 max-sm:w-8 max-sm:h-8 rounded-full bg-primary/12 text-primary text-base max-sm:text-sm font-bold shrink-0">{num}</div>
              <div class="flex-1 min-w-0">
                <h3 class="m-0 mb-1 text-base font-semibold leading-snug">
                  <a href={`/item/${item.slug}`} class="no-underline text-text hover:text-primary">{item.keySummary}</a>
                </h3>
                <div class="flex items-center gap-2 flex-wrap text-xs text-muted">
                  {item.typeName && <span class="text-[0.72rem] px-2 py-0.5 rounded-full bg-primary/12 text-primary font-medium whitespace-nowrap">{item.typeName}</span>}
                  {item.workspaceName && <span class="text-[0.72rem] text-muted">{item.workspaceName}</span>}
                  <span>{readingTime(item.content)}</span>
                </div>
                {desc && <div class="text-sm text-muted mt-1 line-clamp-2 leading-relaxed">{desc}</div>}
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

export const courseTemplate: Template = {
  SourcePage: CourseSourcePage,
  ItemPost: CourseItemPost,
  Layout: CourseLayout,
  PartialResults: CoursePartialResults,

  vocabulary: config.vocabulary,
  seo: config.seo,

  profile: config.profile,

  styles: '',
};
