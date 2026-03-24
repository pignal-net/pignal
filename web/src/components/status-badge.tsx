const DEFAULT_STYLES: Record<string, string> = {
  active: 'text-success border border-success-border bg-success-bg',
  paused: 'text-warning border border-warning-border bg-warning-bg',
  archived: 'text-muted border border-border bg-muted/10',
  new: 'text-info border border-info-border bg-info-bg',
  read: 'text-muted border border-border bg-muted/10',
  replied: 'text-success border border-success-border bg-success-bg',
  spam: 'text-error border border-error-border bg-error-bg',
  draft: 'text-warning border border-warning-border bg-warning-bg',
  published: 'text-success border border-success-border bg-success-bg',
};

export interface StatusBadgeProps {
  status: string;
  styles?: Record<string, string>;
}

export function StatusBadge({ status, styles }: StatusBadgeProps) {
  const map = styles ?? DEFAULT_STYLES;
  return (
    <span class={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${map[status] ?? map.archived ?? 'text-muted border border-border'}`}>
      {status}
    </span>
  );
}
