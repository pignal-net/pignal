/**
 * Skeleton loading placeholders using the `.skeleton` CSS classes from input.css.
 *
 * Usage:
 *   <SkeletonCard />
 *   <SkeletonGrid count={6} layout="grid" />
 *   <SkeletonGrid count={3} layout="list" />
 */

/**
 * A single skeleton card mimicking an item card layout.
 * Shows a title line, a meta line, and 3 content lines with varying widths.
 */
export function SkeletonCard() {
  return (
    <div class="bg-surface rounded-xl border border-border-subtle shadow-card p-5" aria-hidden="true">
      {/* Title line */}
      <div class="skeleton skeleton-line skeleton-line-medium" />
      {/* Meta line */}
      <div class="skeleton skeleton-line skeleton-line-short" />
      {/* Content lines */}
      <div class="mt-3">
        <div class="skeleton skeleton-line skeleton-line-long" />
        <div class="skeleton skeleton-line skeleton-line-medium" />
        <div class="skeleton skeleton-line skeleton-line-short" />
      </div>
    </div>
  );
}

interface SkeletonGridProps {
  count?: number;
  layout?: 'list' | 'grid';
}

/**
 * Renders N skeleton cards in either a vertical list or a responsive grid.
 */
export function SkeletonGrid({ count = 3, layout = 'list' }: SkeletonGridProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  const containerClass =
    layout === 'grid'
      ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
      : 'flex flex-col gap-4';

  return (
    <div class={containerClass} role="status" aria-label="Loading">
      {items.map((i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
