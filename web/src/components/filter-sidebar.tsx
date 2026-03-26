/**
 * Shared filter sidebar / chips component.
 *
 * Normalizes the repeated filter sidebar pattern used across templates
 * (shop, wiki, recipes, etc.). Supports two layout modes:
 *
 * - `sidebar`: Vertical list with count badges, grouped by title.
 *              On mobile (`max-lg:`), collapses to horizontal scrollable chips.
 * - `chips`:  Always renders as horizontal pill-shaped filter chips.
 *
 * Integrates with HTMX for partial page updates via hx-get/hx-target/hx-push-url.
 *
 * Usage:
 *   <FilterSidebar
 *     groups={[
 *       { title: "Categories", items: [...], activeValue: "cat-1" },
 *       { title: "Collections", items: [...] },
 *     ]}
 *     hxTarget="#source-results"
 *     hxPushUrl
 *   />
 */

interface FilterItem {
  label: string;
  value: string;
  count?: number;
  href: string;
}

interface FilterGroup {
  title: string;
  items: FilterItem[];
  activeValue?: string;
}

interface FilterSidebarProps {
  groups: FilterGroup[];
  hxTarget?: string;
  hxPushUrl?: boolean;
  layout?: 'sidebar' | 'chips';
}

const HX_SWAP = 'innerHTML';

function hxAttrs(href: string, target?: string, pushUrl?: boolean, indicator?: string) {
  const attrs: Record<string, string> = {
    'hx-get': href,
    'hx-swap': HX_SWAP,
  };
  if (target) attrs['hx-target'] = target;
  if (pushUrl) attrs['hx-push-url'] = 'true';
  if (indicator) attrs['hx-indicator'] = indicator;
  return attrs;
}

/**
 * Sidebar layout: vertical grouped lists on desktop, horizontal chips on mobile.
 */
function SidebarLayout({ groups, hxTarget, hxPushUrl }: Omit<FilterSidebarProps, 'layout'>) {
  return (
    <aside class="sticky top-6 text-sm max-lg:static max-lg:flex max-lg:gap-4 max-lg:flex-wrap max-lg:border-b max-lg:border-border-subtle max-lg:pb-4 max-lg:mb-0 lg:bg-surface lg:rounded-xl lg:border lg:border-border-subtle lg:shadow-card lg:p-4">
      {groups.map((group) => (
        <div class="mb-6 max-lg:mb-0 last:mb-0">
          <div class="text-[0.7rem] font-bold uppercase tracking-wider text-muted mb-2">
            {group.title}
          </div>
          <ul class="list-none p-0 m-0 max-lg:flex max-lg:gap-1 max-lg:flex-wrap">
            {group.items.map((item) => {
              const isActive = group.activeValue === item.value;
              return (
                <li>
                  <a
                    href={item.href}
                    class={`flex justify-between items-center px-2.5 py-1.5 rounded-lg no-underline text-sm transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-text hover:bg-primary/5 hover:text-primary'
                    }`}
                    {...hxAttrs(item.href, hxTarget, hxPushUrl)}
                  >
                    <span>{item.label}</span>
                    {item.count !== undefined && (
                      <span
                        class={`text-xs min-w-[1.2em] text-right ${
                          isActive ? 'text-primary/60' : 'text-muted'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </aside>
  );
}

/**
 * Chips layout: always renders horizontal pill-shaped filter chips.
 * Uses the existing .filter-chip / .filter-chip.active CSS classes.
 */
function ChipsLayout({ groups, hxTarget, hxPushUrl }: Omit<FilterSidebarProps, 'layout'>) {
  return (
    <nav class="flex flex-wrap gap-2 mb-4" aria-label="Filters">
      {groups.map((group) => (
        <>
          {group.items.map((item) => {
            const isActive = group.activeValue === item.value;
            return (
              <a
                href={item.href}
                class={`filter-chip${isActive ? ' active' : ''}`}
                {...hxAttrs(item.href, hxTarget, hxPushUrl)}
              >
                {item.label}
                {item.count !== undefined && (
                  <span class="filter-chip-count"> ({item.count})</span>
                )}
              </a>
            );
          })}
        </>
      ))}
    </nav>
  );
}

export function FilterSidebar({ groups, hxTarget, hxPushUrl, layout = 'sidebar' }: FilterSidebarProps) {
  if (layout === 'chips') {
    return <ChipsLayout groups={groups} hxTarget={hxTarget} hxPushUrl={hxPushUrl} />;
  }
  return <SidebarLayout groups={groups} hxTarget={hxTarget} hxPushUrl={hxPushUrl} />;
}
