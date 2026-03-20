import type { Item } from '@pignal/core';
import { TypeBadge } from './type-badge';
import { VisibilityBadge } from './visibility-badge';
import { Pagination } from './pagination';
import { formatDate, relativeTime, readingTime } from '../lib/time';
import { stripMarkdown } from '../lib/markdown';

/* ============================================================
   Shared item card + feed results
   Used by both public source page (/) and admin items page (/pignal/items)
   ============================================================ */

interface ItemCardProps {
  item: Item;
  /** URL prefix for item detail links. Public: '/item' (uses slug), Admin: '/pignal/items' (uses id) */
  basePath: string;
  /** URL prefix for tag filter links. Public: '/', Admin: '/pignal/items' */
  tagBasePath: string;
  /** Tag query param name. Public: 'tag', Admin: 'tag' */
  tagParam?: string;
  /** Whether to use slug (public) or id (admin) for detail links */
  useSlug?: boolean;
  showReadingTime?: boolean;
  showVisibility?: boolean;
  isPinned?: boolean;
}

export function ItemCard({
  item,
  basePath,
  tagBasePath,
  tagParam = 'tag',
  useSlug = true,
  showReadingTime = false,
  showVisibility = false,
  isPinned = false,
}: ItemCardProps) {
  const detailUrl = useSlug ? `${basePath}/${item.slug}` : `${basePath}/${item.id}`;
  const dateStr = useSlug
    ? formatDate(item.vouchedAt || item.createdAt)
    : relativeTime(item.createdAt);

  return (
    <article class="source-card">
      <div class="source-card-header">
        {isPinned && <span class="pin-indicator" title="Pinned">📌</span>}
        <TypeBadge typeName={item.typeName} />
        {showVisibility && <VisibilityBadge visibility={item.visibility} />}
        {item.workspaceName && (
          <span class="workspace-badge">{item.workspaceName}</span>
        )}
        <time datetime={item.vouchedAt || item.createdAt}>{dateStr}</time>
        {item.validationActionLabel && (
          <span class="validation-badge">{item.validationActionLabel}</span>
        )}
      </div>
      <h2><a href={detailUrl}>{item.keySummary}</a></h2>
      <p class="source-card-preview">
        {stripMarkdown(item.content).slice(0, 200)}{item.content.length > 200 ? '...' : ''}
      </p>
      {item.tags && item.tags.length > 0 && (
        <div class="item-tags">
          {item.tags.map((t) => (
            <a href={`${tagBasePath}?${tagParam}=${encodeURIComponent(t)}`} class="item-tag">#{t}</a>
          ))}
        </div>
      )}
      <div class="source-card-footer">
        {showReadingTime && <span>{readingTime(item.content)}</span>}
        <a href={detailUrl}>Read more &rarr;</a>
      </div>
    </article>
  );
}

/* ============================================================
   Timeline grouping
   ============================================================ */

interface TimelineGroup {
  label: string;
  items: Item[];
}

function groupByTimeline(items: Item[], sort: 'newest' | 'oldest'): TimelineGroup[] {
  if (items.length === 0) return [];

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = today.getDay();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - dayOfWeek);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const groups = new Map<string, Item[]>();

  for (const item of items) {
    const d = new Date(item.vouchedAt || item.createdAt);
    let key: string;

    if (d >= today) {
      key = 'Today';
    } else if (d >= weekStart) {
      key = 'This Week';
    } else if (d >= monthStart) {
      key = 'This Month';
    } else {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    }

    const arr = groups.get(key) ?? [];
    arr.push(item);
    groups.set(key, arr);
  }

  const orderedLabels = ['Today', 'This Week', 'This Month'];
  const monthlyKeys = [...groups.keys()].filter((k) => !orderedLabels.includes(k));
  monthlyKeys.sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return sort === 'oldest' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
  });

  let allLabels: string[];
  if (sort === 'oldest') {
    allLabels = [...monthlyKeys, ...orderedLabels.slice().reverse()];
  } else {
    allLabels = [...orderedLabels, ...monthlyKeys];
  }

  const result: TimelineGroup[] = [];
  for (const label of allLabels) {
    const items = groups.get(label);
    if (items && items.length > 0) {
      result.push({ label, items });
    }
  }

  return result;
}

/* ============================================================
   Feed results with timeline grouping + pagination
   ============================================================ */

interface FeedResultsProps {
  items: Item[];
  total: number;
  limit: number;
  offset: number;
  paginationBase: string;
  sort: 'newest' | 'oldest';
  /** Item detail link prefix. Public: '/item', Admin: '/pignal/items' */
  basePath: string;
  /** Tag filter link prefix. Public: '/', Admin: '/pignal/items' */
  tagBasePath: string;
  tagParam?: string;
  useSlug?: boolean;
  showReadingTime?: boolean;
  showVisibility?: boolean;
  emptyMessage?: string;
  /** HTMX target for pagination links */
  htmxTarget?: string;
}

export function FeedResults({
  items,
  total,
  limit,
  offset,
  paginationBase,
  sort,
  basePath,
  tagBasePath,
  tagParam = 'tag',
  useSlug = true,
  showReadingTime = false,
  showVisibility = false,
  emptyMessage = 'No items matching this filter.',
  htmxTarget,
}: FeedResultsProps) {
  if (items.length === 0) {
    return <p class="empty-state">{emptyMessage}</p>;
  }

  const pinned = items.filter((i) => !!i.pinnedAt);
  const unpinned = items.filter((i) => !i.pinnedAt);
  const groups = groupByTimeline(unpinned, sort);

  return (
    <>
      {pinned.length > 0 && (
        <div class="timeline-group timeline-group--pinned">
          {pinned.map((item) => (
            <ItemCard
              item={item} basePath={basePath} tagBasePath={tagBasePath}
              tagParam={tagParam} useSlug={useSlug}
              showReadingTime={showReadingTime} showVisibility={showVisibility}
              isPinned={true}
            />
          ))}
        </div>
      )}
      {groups.map((group) => (
        <div class="timeline-group">
          <h3 class="timeline-heading">{group.label}</h3>
          {group.items.map((item) => (
            <ItemCard
              item={item} basePath={basePath} tagBasePath={tagBasePath}
              tagParam={tagParam} useSlug={useSlug}
              showReadingTime={showReadingTime} showVisibility={showVisibility}
              isPinned={false}
            />
          ))}
        </div>
      ))}
      <Pagination
        total={total}
        limit={limit}
        offset={offset}
        baseUrl={paginationBase}
        htmxTarget={htmxTarget}
      />
    </>
  );
}
