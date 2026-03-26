import type { Item } from '@pignal/core';
import type { TFunction } from '../i18n/types';
import { TypeBadge } from './type-badge';
import { VisibilityBadge } from './visibility-badge';
import { Pagination } from './pagination';
import { EmptyState } from './empty-state';
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
  t?: TFunction;
}

const identity = (key: string) => key;

export function ItemCard({
  item,
  basePath,
  tagBasePath,
  tagParam = 'tag',
  useSlug = true,
  showReadingTime = false,
  showVisibility = false,
  isPinned = false,
  t: tProp,
}: ItemCardProps) {
  const t = tProp ?? identity;
  const detailUrl = useSlug ? `${basePath}/${item.slug}` : `${basePath}/${item.id}`;
  const dateStr = useSlug
    ? formatDate(item.vouchedAt || item.createdAt)
    : relativeTime(item.createdAt);

  return (
    <article class="py-6 border-b border-border-subtle last:border-b-0">
      {/* Title */}
      <h2 class="mb-2 text-lg font-semibold leading-snug">
        <a href={detailUrl} class="text-text no-underline hover:text-primary transition-colors">{item.keySummary}</a>
      </h2>

      {/* Meta row */}
      <div class="flex items-center gap-2.5 mb-3 text-xs text-muted flex-wrap">
        {isPinned && <span class="text-xs text-muted italic">{t('feed.pinned')}</span>}
        <TypeBadge typeName={item.typeName} />
        {showVisibility && <VisibilityBadge visibility={item.visibility} t={tProp} />}
        {item.workspaceName && (
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-muted/70 bg-muted/10 no-underline hover:text-primary hover:bg-primary-focus transition-colors">
            {item.workspaceName}
          </span>
        )}
        <time datetime={item.vouchedAt || item.createdAt}>{dateStr}</time>
        {item.validationActionLabel && (
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-success/80 bg-success-bg">
            &#10003; {item.validationActionLabel}
          </span>
        )}
      </div>

      {/* Preview */}
      <p class="text-sm text-muted leading-relaxed line-clamp-2 mb-3">
        {stripMarkdown(item.content).slice(0, 200)}{item.content.length > 200 ? '...' : ''}
      </p>

      {/* Footer: tags + reading time */}
      <div class="flex items-center gap-2 flex-wrap text-xs text-muted">
        {item.tags && item.tags.length > 0 && (
          item.tags.map((tag) => (
            <a
              href={`${tagBasePath}?${tagParam}=${encodeURIComponent(tag)}`}
              class="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium text-muted/70 bg-muted/8 border border-border-subtle no-underline whitespace-nowrap hover:text-primary hover:bg-primary-focus transition-colors"
            >
              #{tag}
            </a>
          ))
        )}
        {showReadingTime && <span>{readingTime(item.content)}</span>}
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

const MONTH_KEYS = [
  'feed.month.january', 'feed.month.february', 'feed.month.march', 'feed.month.april',
  'feed.month.may', 'feed.month.june', 'feed.month.july', 'feed.month.august',
  'feed.month.september', 'feed.month.october', 'feed.month.november', 'feed.month.december',
];

function groupByTimeline(items: Item[], sort: 'newest' | 'oldest', t: (key: string) => string): TimelineGroup[] {
  if (items.length === 0) return [];

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = today.getDay();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - dayOfWeek);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const todayLabel = t('feed.today');
  const thisWeekLabel = t('feed.thisWeek');
  const thisMonthLabel = t('feed.thisMonth');

  const groups = new Map<string, Item[]>();

  for (const item of items) {
    const d = new Date(item.vouchedAt || item.createdAt);
    let key: string;

    if (d >= today) {
      key = todayLabel;
    } else if (d >= weekStart) {
      key = thisWeekLabel;
    } else if (d >= monthStart) {
      key = thisMonthLabel;
    } else {
      const monthName = t(MONTH_KEYS[d.getMonth()]);
      key = `${monthName} ${d.getFullYear()}`;
    }

    const arr = groups.get(key) ?? [];
    arr.push(item);
    groups.set(key, arr);
  }

  const orderedLabels = [todayLabel, thisWeekLabel, thisMonthLabel];
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
  t?: TFunction;
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
  t: tProp,
}: FeedResultsProps) {
  const t = tProp ?? identity;

  if (items.length === 0) {
    return <EmptyState icon="inbox" title={t('feed.noItems')} description={emptyMessage} />;
  }

  const pinned = items.filter((i) => !!i.pinnedAt);
  const unpinned = items.filter((i) => !i.pinnedAt);
  const groups = groupByTimeline(unpinned, sort, t);

  return (
    <>
      {pinned.length > 0 && (
        <div>
          {pinned.map((item) => (
            <ItemCard
              item={item} basePath={basePath} tagBasePath={tagBasePath}
              tagParam={tagParam} useSlug={useSlug}
              showReadingTime={showReadingTime} showVisibility={showVisibility}
              isPinned={true}
              t={tProp}
            />
          ))}
        </div>
      )}
      {groups.map((group, idx) => (
        <div class={idx === 0 && pinned.length === 0 ? '' : 'mt-8'}>
          <h3 class={`text-xs font-bold uppercase tracking-wide text-muted mb-2 ${idx > 0 || pinned.length > 0 ? 'border-t border-border-subtle pt-6' : ''}`}>
            {group.label}
          </h3>
          {group.items.map((item) => (
            <ItemCard
              item={item} basePath={basePath} tagBasePath={tagBasePath}
              tagParam={tagParam} useSlug={useSlug}
              showReadingTime={showReadingTime} showVisibility={showVisibility}
              isPinned={false}
              t={tProp}
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
        t={tProp}
      />
    </>
  );
}
