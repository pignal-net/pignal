interface TypeBadgeProps {
  typeName: string;
  color?: string;
}

// Map default type names to CSS custom properties (adapt to dark mode automatically)
const TYPE_VAR_MAP: Record<string, string> = {
  Insight: 'var(--app-type-insight)',
  Decision: 'var(--app-type-decision)',
  'Problem Solution': 'var(--app-type-solution)',
  'Core Point': 'var(--app-type-core)',
};

export function TypeBadge({ typeName, color }: TypeBadgeProps) {
  // User-defined color from DB (hex) takes priority; otherwise use themed CSS variable
  const bg = color || TYPE_VAR_MAP[typeName] || 'var(--app-type-default)';

  return (
    <span class="type-badge" style={`background-color: ${bg}`}>
      {typeName}
    </span>
  );
}
