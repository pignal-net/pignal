import type { Template, PartialResultsProps } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { ServicesSourcePage } from './source-page';
import { ServicesItemPost } from './item-post';
import { ServicesLayout } from './layout';
import { Pagination } from '../../components/pagination';
import { stripMarkdown } from '../../lib/markdown';
import templateStyles from './styles.css';

const config = getTemplateConfig('services');

function ServicesPartialResults(props: PartialResultsProps) {
  if (props.items.length === 0) {
    return <p class="services-empty">No {props.vocabulary.itemPlural} found.</p>;
  }

  // Group items by tier (type) — we just show them in a flat grid for partial results
  return (
    <>
      <div class="services-grid">
        {props.items.map((item) => {
          const desc = stripMarkdown(item.content).slice(0, 150);
          return (
            <div class="services-card">
              <div class="services-card-header">
                <h3><a href={`/item/${item.slug}`}>{item.keySummary}</a></h3>
                {item.typeName && <span class="services-tier-badge">{item.typeName}</span>}
              </div>
              {desc && <div class="services-card-description">{desc}</div>}
              <div class="services-card-footer">
                <div>
                  {item.workspaceName && <span class="services-package-label">{item.workspaceName}</span>}
                </div>
                <div style="display:flex;align-items:center;gap:0.5rem">
                  {item.validationActionLabel && (
                    <span class="services-availability-badge">{item.validationActionLabel}</span>
                  )}
                  <a href={`/item/${item.slug}`}>Details</a>
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

  styles: templateStyles,
};
