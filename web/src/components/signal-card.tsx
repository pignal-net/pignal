import type { Signal } from '@pignal/core';
import { TypeBadge } from './type-badge';
import { VisibilityBadge } from './visibility-badge';
import { relativeTime } from '../lib/time';
import { stripMarkdown } from '../lib/markdown';

interface SignalCardProps {
  signal: Signal;
  showVisibility?: boolean;
}

export function SignalCard({ signal, showVisibility = true }: SignalCardProps) {
  const contentPreview = stripMarkdown(signal.content).slice(0, 200);

  return (
    <article class="signal-card">
      <h3>
        <a href={`/pignal/signals/${signal.id}`}>{signal.keySummary}</a>
      </h3>
      <div class="card-meta">
        <TypeBadge typeName={signal.typeName} />
        {showVisibility && <VisibilityBadge visibility={signal.visibility} />}
        {signal.workspaceName && <span>{signal.workspaceName}</span>}
        <time datetime={signal.createdAt}>{relativeTime(signal.createdAt)}</time>
        {signal.validationActionLabel && <span>{signal.validationActionLabel}</span>}
      </div>
      <p class="card-preview">{contentPreview}{signal.content.length > 200 ? '...' : ''}</p>
      {signal.tags && signal.tags.length > 0 && (
        <div class="signal-tags">
          {signal.tags.map((t) => (
            <a href={`/pignal/signals?tag=${encodeURIComponent(t)}`} class="signal-tag">#{t}</a>
          ))}
        </div>
      )}
    </article>
  );
}
