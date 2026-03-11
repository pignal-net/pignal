interface VisibilityBadgeProps {
  visibility: string;
}

export function VisibilityBadge({ visibility }: VisibilityBadgeProps) {
  return (
    <span class="visibility-badge" data-visibility={visibility}>
      {visibility}
    </span>
  );
}
