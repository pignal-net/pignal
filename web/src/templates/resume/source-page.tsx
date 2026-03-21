import type { SourcePageProps } from '@pignal/templates';
import type { Item } from '@pignal/templates';
import { Pagination } from '../../components/pagination';
import { JsonLd } from '../../components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { formatDate } from '../../lib/time';
import { ResumeLayout } from './layout';

/* HTMX constants */
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

/** Group items by typeId, preserving type display order */
function groupByType(items: Item[], types: { id: string; name: string; icon: string | null }[]): { typeId: string; typeName: string; typeIcon: string | null; items: Item[] }[] {
  const groups = new Map<string, Item[]>();
  for (const item of items) {
    const list = groups.get(item.typeId) || [];
    list.push(item);
    groups.set(item.typeId, list);
  }

  // Order by types array order, then any remaining
  const result: { typeId: string; typeName: string; typeIcon: string | null; items: Item[] }[] = [];
  for (const type of types) {
    const typeItems = groups.get(type.id);
    if (typeItems && typeItems.length > 0) {
      result.push({ typeId: type.id, typeName: type.name, typeIcon: type.icon, items: typeItems });
      groups.delete(type.id);
    }
  }
  // Any ungrouped types (shouldn't happen, but safe)
  for (const [typeId, typeItems] of groups) {
    if (typeItems.length > 0) {
      result.push({ typeId, typeName: typeItems[0].typeName, typeIcon: null, items: typeItems });
    }
  }
  return result;
}

/** Collect all unique tags from items for the skills display */
function collectTags(items: Item[]): string[] {
  const tagSet = new Set<string>();
  for (const item of items) {
    if (item.tags) {
      for (const t of item.tags) tagSet.add(t);
    }
  }
  return Array.from(tagSet).sort();
}

export function ResumeSourcePage(props: SourcePageProps) {
  const {
    items,
    types,
    workspaces,
    counts,
    settings,
    filters,
    pagination,
    paginationBase,
    sourceUrl,
    vocabulary,
  } = props;

  const sourceTitle = settings.source_title || 'My Resume';
  const sourceDescription = settings.source_description || '';

  const activeType = filters.typeId ? types.find((t) => t.id === filters.typeId) : undefined;
  const activeWorkspace = filters.workspaceId ? workspaces.find((w) => w.id === filters.workspaceId) : undefined;

  let pageTitle = sourceTitle;
  if (activeType) pageTitle = `${activeType.name} | ${sourceTitle}`;
  else if (activeWorkspace) pageTitle = `${activeWorkspace.name} | ${sourceTitle}`;
  else if (filters.tag) pageTitle = `#${filters.tag} | ${sourceTitle}`;

  const githubUrl = settings.source_social_github || '';
  const githubUsername = githubUrl.replace(/\/$/, '').split('/').pop() || '';
  const ogImage = githubUsername
    ? `https://avatars.githubusercontent.com/${githubUsername}?s=400`
    : `${sourceUrl}/og-image.png`;

  const jsonLd = buildSourceJsonLd(settings, sourceUrl, props.seo);
  const metaTags = buildMetaTags({
    title: pageTitle,
    description: sourceDescription,
    canonicalUrl: sourceUrl || '/',
    ogType: 'website',
    feedUrl: `${sourceUrl}/feed.xml`,
    imageUrl: ogImage,
  });

  const filterParams = new URLSearchParams();
  if (filters.typeId) filterParams.set('type', filters.typeId);
  if (filters.workspaceId) filterParams.set('workspace', filters.workspaceId);
  if (filters.tag) filterParams.set('tag', filters.tag);
  if (filters.q) filterParams.set('q', filters.q);
  if (filters.sort === 'oldest') filterParams.set('sort', 'oldest');
  const filterQs = filterParams.toString();

  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  let relLinks = '';
  const safeSourceUrl = escapeHtmlAttr(sourceUrl);
  const baseUrlStr = filterQs ? `${safeSourceUrl}/?${escapeHtmlAttr(filterQs)}` : `${safeSourceUrl}/`;
  const sep = filterQs ? '&amp;' : '?';
  if (currentPage > 1) {
    relLinks += `\n    <link rel="prev" href="${baseUrlStr}${sep}offset=${(currentPage - 2) * pagination.limit}">`;
  }
  if (currentPage < totalPages) {
    relLinks += `\n    <link rel="next" href="${baseUrlStr}${sep}offset=${currentPage * pagination.limit}">`;
  }

  const headContent = `${metaTags}${relLinks}`;

  // Collect all skills (tags) for the hero section
  const allSkills = collectTags(items);

  // Filter which types/workspaces have items
  const typesWithItems = types.filter((t) => (counts.byType[t.id] ?? 0) > 0);
  const workspacesWithItems = workspaces.filter((w) => (counts.byWorkspace[w.id] ?? 0) > 0);

  // Group items by type for section rendering
  const sections = groupByType(items, types);

  // Build sort param for filter URLs
  const sortParam = filters.sort === 'oldest' ? 'oldest' : undefined;

  return (
    <ResumeLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="resume-hero">
        {githubUsername && (
          <img
            src={`https://avatars.githubusercontent.com/${githubUsername}?s=192`}
            alt={sourceTitle}
            class="resume-hero-avatar"
            width="96"
            height="96"
          />
        )}
        <h1 class="resume-hero-name">{sourceTitle}</h1>
        {sourceDescription && <p class="resume-hero-tagline">{sourceDescription}</p>}

        <div class="resume-hero-links">
          {githubUrl && (
            <a href={githubUrl} target="_blank" rel="noopener">GitHub</a>
          )}
          {settings.source_social_twitter && (
            <a href={settings.source_social_twitter} target="_blank" rel="noopener">Twitter</a>
          )}
          {settings.source_social_linkedin && (
            <a href={settings.source_social_linkedin} target="_blank" rel="noopener">LinkedIn</a>
          )}
          {settings.source_url && (
            <a href={settings.source_url} target="_blank" rel="noopener">Website</a>
          )}
        </div>

        {allSkills.length > 0 && (
          <div class="resume-skills">
            {allSkills.map((skill) => {
              const url = buildFilterUrl({ tag: skill, workspace: filters.workspaceId, sort: sortParam });
              return (
                <a href={url} class="resume-skill-chip" {...hxProps(url)}>{skill}</a>
              );
            })}
          </div>
        )}
      </div>

      {/* Profile tabs (workspace filter) */}
      {workspacesWithItems.length > 0 && (
        <div class="resume-profiles">
          {(() => {
            const url = buildFilterUrl({ type: filters.typeId, tag: filters.tag, q: filters.q, sort: sortParam });
            return (
              <a href={url} class={`resume-profile-tab ${!filters.workspaceId ? 'active' : ''}`} {...hxProps(url)}>
                All {vocabulary.workspacePlural}
              </a>
            );
          })()}
          {workspacesWithItems.map((ws) => {
            const url = buildFilterUrl({
              workspace: filters.workspaceId === ws.id ? undefined : ws.id,
              type: filters.typeId,
              tag: filters.tag,
              q: filters.q,
              sort: sortParam,
            });
            return (
              <a href={url} class={`resume-profile-tab ${filters.workspaceId === ws.id ? 'active' : ''}`} {...hxProps(url)}>
                {ws.name}
              </a>
            );
          })}
        </div>
      )}

      {/* Section filter chips */}
      {typesWithItems.length > 1 && (
        <div class="resume-section-filters">
          {(() => {
            const url = buildFilterUrl({ workspace: filters.workspaceId, tag: filters.tag, q: filters.q, sort: sortParam });
            return (
              <a href={url} class={`resume-section-chip ${!filters.typeId ? 'active' : ''}`} {...hxProps(url)}>
                All <span class="resume-section-chip-count">({counts.total})</span>
              </a>
            );
          })()}
          {typesWithItems.map((type) => {
            const url = buildFilterUrl({ type: type.id, workspace: filters.workspaceId, tag: filters.tag, q: filters.q, sort: sortParam });
            return (
              <a href={url} class={`resume-section-chip ${filters.typeId === type.id ? 'active' : ''}`} {...hxProps(url)}>
                {type.icon ? `${type.icon} ` : ''}{type.name}
                <span class="resume-section-chip-count">({counts.byType[type.id] ?? 0})</span>
              </a>
            );
          })}
        </div>
      )}

      {/* Active tag filter badge */}
      {filters.tag && (
        <div class="resume-active-tag">
          {(() => {
            const url = buildFilterUrl({ type: filters.typeId, workspace: filters.workspaceId, q: filters.q, sort: sortParam });
            return (
              <a href={url} {...hxProps(url)}>
                #{filters.tag} &times;
              </a>
            );
          })()}
        </div>
      )}

      <div id="source-loading" class="source-loading htmx-indicator">
        <span class="app-spinner" />
      </div>
      <div id="source-results">
        <ResumeResults
          items={items}
          sections={sections}
          total={pagination.total}
          limit={pagination.limit}
          offset={pagination.offset}
          paginationBase={paginationBase}
          vocabulary={vocabulary}
          filters={filters}
        />
      </div>
    </ResumeLayout>
  );
}

/** Inner results component used both in full page and partial */
function ResumeResults(props: {
  items: Item[];
  sections: { typeId: string; typeName: string; typeIcon: string | null; items: Item[] }[];
  total: number;
  limit: number;
  offset: number;
  paginationBase: string;
  vocabulary: SourcePageProps['vocabulary'];
  filters: SourcePageProps['filters'];
}) {
  const { items, sections, total, limit, offset, paginationBase, vocabulary, filters } = props;
  const sortParam = filters.sort === 'oldest' ? 'oldest' : undefined;

  if (items.length === 0) {
    return <p class="resume-empty">No {vocabulary.itemPlural} matching this filter.</p>;
  }

  return (
    <>
      <div class="resume-sections">
        {sections.map((section) => (
          <div class="resume-section">
            <div class="resume-section-header">
              {section.typeIcon && <span class="resume-section-icon">{section.typeIcon}</span>}
              <h2 class="resume-section-title">{section.typeName}</h2>
              <span class="resume-section-count">{section.items.length} {section.items.length === 1 ? vocabulary.item : vocabulary.itemPlural}</span>
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
                      {item.workspaceName && (
                        <span class="resume-entry-badge">{item.workspaceName}</span>
                      )}
                      {item.tags && item.tags.slice(0, 5).map((t) => {
                        const url = buildFilterUrl({ tag: t, type: filters.typeId, workspace: filters.workspaceId, sort: sortParam });
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
