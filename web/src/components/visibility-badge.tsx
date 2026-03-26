import type { TFunction } from '../i18n/types';

interface VisibilityBadgeProps {
  visibility: string;
  t?: TFunction;
}

const VISIBILITY_STYLES: Record<string, string> = {
  private: 'text-muted bg-muted/15',
  unlisted: 'text-info bg-info-bg',
  vouched: 'text-success bg-success-bg',
};

const VISIBILITY_KEYS: Record<string, string> = {
  private: 'common.private',
  unlisted: 'common.unlisted',
  vouched: 'common.vouched',
};

const identity = (key: string) => key;

export function VisibilityBadge({ visibility, t: tProp }: VisibilityBadgeProps) {
  const t = tProp ?? identity;
  const colorClass = VISIBILITY_STYLES[visibility] || VISIBILITY_STYLES.private;
  const label = VISIBILITY_KEYS[visibility] ? t(VISIBILITY_KEYS[visibility]) : visibility;

  return (
    <span class={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide uppercase whitespace-nowrap ${colorClass}`}>
      {label}
    </span>
  );
}
