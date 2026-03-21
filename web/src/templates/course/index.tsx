import type { Template, PartialResultsProps } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { CourseSourcePage } from './source-page';
import { CourseItemPost } from './item-post';
import { CourseLayout } from './layout';
import { Pagination } from '../../components/pagination';
import { stripMarkdown } from '../../lib/markdown';
import { readingTime } from '../../lib/time';
import templateStyles from './styles.css';

const config = getTemplateConfig('course');

function CoursePartialResults(props: PartialResultsProps) {
  if (props.items.length === 0) {
    return <p class="course-empty">No {props.vocabulary.itemPlural} matching this filter.</p>;
  }

  return (
    <>
      <div class="course-lesson-list">
        {props.items.map((item, idx) => {
          const num = props.offset + idx + 1;
          const desc = stripMarkdown(item.content).slice(0, 120);
          return (
            <div class="course-card">
              <div class="course-card-num">{num}</div>
              <div class="course-card-body">
                <h3><a href={`/item/${item.slug}`}>{item.keySummary}</a></h3>
                <div class="course-card-meta">
                  {item.typeName && <span class="course-module-badge">{item.typeName}</span>}
                  {item.workspaceName && <span class="course-track-badge">{item.workspaceName}</span>}
                  <span>{readingTime(item.content)}</span>
                </div>
                {desc && <div class="course-card-description">{desc}</div>}
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

  styles: templateStyles,
};
