interface TypeBadgeProps {
  typeName: string;
  color?: string;
}

// Map default type names to CSS custom properties (adapt to dark mode automatically)
const TYPE_VAR_MAP: Record<string, string> = {
  Insight: 'var(--color-type-insight)',
  Decision: 'var(--color-type-decision)',
  'Problem Solution': 'var(--color-type-solution)',
  'Core Point': 'var(--color-type-core)',
};

export function TypeBadge({ typeName, color }: TypeBadgeProps) {
  // User-defined color from DB (hex) takes priority; otherwise use themed CSS variable
  const bg = color || TYPE_VAR_MAP[typeName] || 'var(--color-type-default)';

  return (
    <span
      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap"
      style={`background-color: color-mix(in srgb, ${bg} 15%, transparent); color: ${bg}; border: 1px solid color-mix(in srgb, ${bg} 25%, transparent);`}
    >
      {typeName}
    </span>
  );
}
