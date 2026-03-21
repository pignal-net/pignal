import type { Template, PartialResultsProps } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { DirectorySourcePage } from './source-page';
import { DirectoryItemPost } from './item-post';
import { DirectoryLayout } from './layout';
import { Pagination } from '../../components/pagination';
import { stripMarkdown } from '../../lib/markdown';
import templateStyles from './styles.css';

const config = getTemplateConfig('directory');

function getStatusClass(label: string | null): string {
  if (!label) return '';
  const lower = label.toLowerCase();
  if (lower.includes('active') || lower.includes('recommended')) return 'directory-status-active';
  if (lower.includes('new')) return 'directory-status-new';
  if (lower.includes('archived') || lower.includes('inactive') || lower.includes('stale')) return 'directory-status-archived';
  if (lower.includes('deprecated') || lower.includes('shutting')) return 'directory-status-deprecated';
  return 'directory-status-active';
}

function DirectoryPartialResults(props: PartialResultsProps) {
  if (props.items.length === 0) {
    return <p class="directory-empty">No {props.vocabulary.itemPlural} found.</p>;
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
      <div class="directory-resource-list">
        {sortedLetters.map((letter) => (
          <>
            <div class="directory-letter-header">{letter}</div>
            {grouped[letter].map((item) => {
              const desc = stripMarkdown(item.content).slice(0, 140);
              const statusClass = getStatusClass(item.validationActionLabel);
              return (
                <div class="directory-card">
                  <div class="directory-card-body">
                    <div class="directory-card-title">
                      <a href={`/item/${item.slug}`}>{item.keySummary}</a>
                      {item.typeName && <span class="directory-category-badge">{item.typeName}</span>}
                      {item.validationActionLabel && (
                        <span class={`directory-status-badge ${statusClass}`}>{item.validationActionLabel}</span>
                      )}
                    </div>
                    {desc && <div class="directory-card-description">{desc}</div>}
                    {item.workspaceName && (
                      <div class="directory-card-meta">
                        <span class="directory-card-collection">{item.workspaceName}</span>
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

  styles: templateStyles,
};
