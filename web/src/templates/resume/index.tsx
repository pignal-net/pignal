import type { Template, PartialResultsProps, Item } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { ResumeSourcePage } from './source-page';
import { ResumeItemPost } from './item-post';
import { ResumeLayout } from './layout';
import { Pagination } from '../../components/pagination';
import { stripMarkdown } from '../../lib/markdown';
import { formatDate } from '../../lib/time';

const config = getTemplateConfig('resume');

const HX_TARGET = '#source-results';
const HX_INDICATOR = '#source-loading';

function hxProps(url: string) {
  return {
    'hx-get': url,
    'hx-target': HX_TARGET,
    'hx-swap': 'innerHTML',
    'hx-push-url': 'true',
    'hx-indicator': HX_INDICATOR,
  };
}

function buildFilterUrl(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) qs.set(k, v);
  }
  const s = qs.toString();
  return s ? `/?${s}` : '/';
}

/** Group items by typeId, preserving original order */
function groupByType(items: Item[]): { typeId: string; typeName: string; items: Item[] }[] {
  const groups = new Map<string, { typeName: string; items: Item[] }>();
  for (const item of items) {
    const existing = groups.get(item.typeId);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.set(item.typeId, { typeName: item.typeName, items: [item] });
    }
  }
  return Array.from(groups.entries()).map(([typeId, data]) => ({
    typeId,
    typeName: data.typeName,
    items: data.items,
  }));
}

function ResumePartialResults(props: PartialResultsProps) {
  const { items, total, limit, offset, paginationBase, vocabulary } = props;

  if (items.length === 0) {
    return (
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="10" width="36" height="28" rx="3"/><path d="M6 22h12l3 4h6l3-4h12"/><path d="M20 18h8M22 14h4"/></svg>
        </div>
        <p class="empty-state-title">{`No ${vocabulary.itemPlural} found`}</p>
        <p class="empty-state-description">Try adjusting your filters or search query.</p>
      </div>
    );
  }

  const sections = groupByType(items);

  return (
    <>
      <div class="max-w-[740px] mx-auto px-4 max-sm:px-2">
        {sections.map((section) => (
          <div class="mb-10">
            <div class="flex items-center gap-3 mb-4 pb-2 border-b-2 border-primary">
              <h2 class="text-xs font-bold uppercase tracking-wider text-primary m-0">{section.typeName}</h2>
              <span class="text-[0.7rem] font-normal text-muted ml-auto">
                {section.items.length} {section.items.length === 1 ? vocabulary.item : vocabulary.itemPlural}
              </span>
            </div>
            <div class="flex flex-col relative pl-5 before:content-[''] before:absolute before:left-[3px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border-subtle">
              {section.items.map((item) => {
                const description = stripMarkdown(item.content).slice(0, 200);
                const dateStr = item.vouchedAt || item.createdAt;
                return (
                  <div class="relative py-3 pl-3 before:content-[''] before:absolute before:-left-5 before:top-[1.15rem] before:w-2 before:h-2 before:rounded-full before:border-2 before:border-surface before:z-[1] before:bg-border-subtle first:before:bg-primary">
                    <div class="flex justify-between items-baseline gap-3 flex-wrap mb-1">
                      <h3 class="text-[0.95rem] font-semibold m-0 leading-snug text-text">
                        {item.slug ? (
                          <a href={`/item/${item.slug}`} class="text-inherit no-underline hover:text-primary">{item.keySummary}</a>
                        ) : (
                          item.keySummary
                        )}
                      </h3>
                      <time class="text-xs text-muted whitespace-nowrap shrink-0" datetime={dateStr}>{formatDate(dateStr)}</time>
                    </div>
                    {description && (
                      <p class="text-sm text-muted leading-relaxed m-0 mt-1 line-clamp-3">{description}</p>
                    )}
                    <div class="flex items-center gap-2 flex-wrap mt-1.5">
                      {item.validationActionLabel && (
                        <span class="inline-block px-2 py-0.5 text-[0.65rem] font-semibold rounded-xl bg-primary/10 text-primary uppercase tracking-wide">{item.validationActionLabel}</span>
                      )}
                      {item.tags && item.tags.slice(0, 5).map((t) => {
                        const url = buildFilterUrl({ tag: t });
                        return (
                          <a href={url} class="inline-block px-1.5 py-0.5 text-[0.65rem] rounded-full bg-muted/8 border border-border-subtle text-muted no-underline hover:text-text" {...hxProps(url)}>
                            {t}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <Pagination
        total={total}
        limit={limit}
        offset={offset}
        baseUrl={paginationBase}
        htmxTarget={HX_TARGET}
      />
    </>
  );
}

export const resumeTemplate: Template = {
  SourcePage: ResumeSourcePage,
  ItemPost: ResumeItemPost,
  Layout: ResumeLayout,
  PartialResults: ResumePartialResults,

  vocabulary: config.vocabulary,
  seo: config.seo,
  profile: config.profile,

  styles: '',
};
