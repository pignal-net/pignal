import type { Template, PartialResultsProps, Item } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { ResumeSourcePage } from './source-page';
import { ResumeItemPost } from './item-post';
import { ResumeLayout } from './layout';
import { Pagination } from '../../components/pagination';
import { stripMarkdown } from '../../lib/markdown';
import { formatDate } from '../../lib/time';
import templateStyles from './styles.css';

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
    return <p class="resume-empty">No {vocabulary.itemPlural} matching this filter.</p>;
  }

  const sections = groupByType(items);

  return (
    <>
      <div class="resume-sections">
        {sections.map((section) => (
          <div class="resume-section">
            <div class="resume-section-header">
              <h2 class="resume-section-title">{section.typeName}</h2>
              <span class="resume-section-count">
                {section.items.length} {section.items.length === 1 ? vocabulary.item : vocabulary.itemPlural}
              </span>
            </div>
            <div class="resume-entries">
              {section.items.map((item) => {
                const description = stripMarkdown(item.content).slice(0, 200);
                const dateStr = item.vouchedAt || item.createdAt;
                return (
                  <div class="resume-entry">
                    <div class="resume-entry-header">
                      <h3 class="resume-entry-title">
                        {item.slug ? (
                          <a href={`/item/${item.slug}`}>{item.keySummary}</a>
                        ) : (
                          item.keySummary
                        )}
                      </h3>
                      <time class="resume-entry-date" datetime={dateStr}>{formatDate(dateStr)}</time>
                    </div>
                    {description && (
                      <p class="resume-entry-description">{description}</p>
                    )}
                    <div class="resume-entry-meta">
                      {item.validationActionLabel && (
                        <span class="resume-entry-badge">{item.validationActionLabel}</span>
                      )}
                      {item.tags && item.tags.slice(0, 5).map((t) => {
                        const url = buildFilterUrl({ tag: t });
                        return (
                          <a href={url} class="resume-entry-tag" {...hxProps(url)}>
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

  styles: templateStyles,
};
