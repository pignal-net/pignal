interface VisibilityBadgeProps {
  visibility: string;
}

const VISIBILITY_STYLES: Record<string, string> = {
  private: 'text-muted bg-muted/15',
  unlisted: 'text-info bg-info-bg',
  vouched: 'text-success bg-success-bg',
};

export function VisibilityBadge({ visibility }: VisibilityBadgeProps) {
  const colorClass = VISIBILITY_STYLES[visibility] || VISIBILITY_STYLES.private;

  return (
    <span class={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide uppercase whitespace-nowrap ${colorClass}`}>
      {visibility}
    </span>
  );
}
