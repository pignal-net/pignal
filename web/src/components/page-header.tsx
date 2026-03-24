import type { Child } from 'hono/jsx';

export interface PageHeaderProps {
  title: string;
  description?: string;
  count?: number;
  action?: Child;
}

export function PageHeader({ title, description, count, action }: PageHeaderProps) {
  return (
    <div class="mb-8 flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p class="text-muted text-sm mt-1">
            {description}
            {count !== undefined && count > 0 && <span class="ml-1">({count})</span>}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
