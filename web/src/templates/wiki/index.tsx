import type { Template, PartialResultsProps } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { WikiSourcePage } from './source-page';
import { WikiItemPost } from './item-post';
import { WikiLayout } from './layout';
import { Pagination } from '../../components/pagination';
import { stripMarkdown } from '../../lib/markdown';
import templateStyles from './styles.css';

const config = getTemplateConfig('wiki');

function WikiPartialResults(props: PartialResultsProps) {
  if (props.items.length === 0) {
    return <p class="wiki-empty">No {props.vocabulary.itemPlural} matching this filter.</p>;
  }

  // Group items alphabetically
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
      <div class="wiki-article-list">
        {sortedLetters.map((letter) => (
          <>
            <div class="wiki-letter-header">{letter}</div>
            {grouped[letter].map((item) => {
              const desc = stripMarkdown(item.content).slice(0, 100);
              return (
                <div class="wiki-article-row">
                  <div class="wiki-article-title">
                    <a href={`/item/${item.slug}`}>{item.keySummary}</a>
                    {desc && <div class="wiki-article-description">{desc}</div>}
                  </div>
                  <div class="wiki-article-meta">
                    {item.typeName && <span class="wiki-article-topic">{item.typeName}</span>}
                    {item.workspaceName && <span>{item.workspaceName}</span>}
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

export const wikiTemplate: Template = {
  SourcePage: WikiSourcePage,
  ItemPost: WikiItemPost,
  Layout: WikiLayout,
  PartialResults: WikiPartialResults,

  vocabulary: config.vocabulary,
  seo: config.seo,

  profile: config.profile,

  styles: templateStyles,
};
