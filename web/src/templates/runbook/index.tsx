import type { Template, PartialResultsProps } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { RunbookSourcePage } from './source-page';
import { RunbookItemPost } from './item-post';
import { RunbookLayout } from './layout';
import { Pagination } from '../../components/pagination';
import templateStyles from './styles.css';

const config = getTemplateConfig('runbook');

function RunbookPartialResults(props: PartialResultsProps) {
  if (props.items.length === 0) {
    return <p class="runbook-empty">No {props.vocabulary.itemPlural} matching this filter.</p>;
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
      <div class="runbook-procedure-list">
        {groupNames.map((name) => (
          <>
            <div class="runbook-group-header">{name}</div>
            {grouped[name].map((item) => (
              <div class="runbook-card">
                <div class="runbook-card-body">
                  <h3><a href={`/item/${item.slug}`}>{item.keySummary}</a></h3>
                  <div class="runbook-card-meta">
                    {item.typeName && <span class="runbook-system-badge">{item.typeName}</span>}
                    {item.validationActionLabel && <span class="runbook-validation-badge">{item.validationActionLabel}</span>}
                  </div>
                </div>
              </div>
            ))}
          </>
        ))}
        {ungrouped.length > 0 && (
          <>
            {groupNames.length > 0 && <div class="runbook-group-header">Uncategorized</div>}
            {ungrouped.map((item) => (
              <div class="runbook-card">
                <div class="runbook-card-body">
                  <h3><a href={`/item/${item.slug}`}>{item.keySummary}</a></h3>
                  <div class="runbook-card-meta">
                    {item.typeName && <span class="runbook-system-badge">{item.typeName}</span>}
                    {item.validationActionLabel && <span class="runbook-validation-badge">{item.validationActionLabel}</span>}
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

  styles: templateStyles,
};
