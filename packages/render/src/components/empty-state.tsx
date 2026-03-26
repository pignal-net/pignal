/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
/**
 * Reusable EmptyState component that wraps the `.empty-state` CSS pattern.
 *
 * Usage:
 *   <EmptyState icon="inbox" title="No items found" description="Try adjusting your filters." />
 *   <EmptyState icon="plus" title="Get started" description="Create your first item." action={{ label: "Create", href: "/new" }} />
 */

interface EmptyStateAction {
  label: string;
  href: string;
}

interface EmptyStateProps {
  icon: 'inbox' | 'search' | 'file' | 'plus';
  title: string;
  description?: string;
  action?: EmptyStateAction;
}

function IconInbox() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="6" y="10" width="36" height="28" rx="3" />
      <path d="M6 22h12l3 4h6l3-4h12" />
      <path d="M20 18h8M22 14h4" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="20" cy="20" r="12" />
      <path d="M29 29l10 10" />
      <path d="M15 17h10M17 21h6" />
    </svg>
  );
}

function IconFile() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 6h16l10 10v26a2 2 0 01-2 2H12a2 2 0 01-2-2V8a2 2 0 012-2z" />
      <path d="M28 6v10h10" />
      <path d="M18 24h12M18 30h8" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="24" cy="24" r="16" />
      <path d="M24 16v16M16 24h16" />
    </svg>
  );
}

const icons = {
  inbox: IconInbox,
  search: IconSearch,
  file: IconFile,
  plus: IconPlus,
} as const;

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const Icon = icons[icon];

  return (
    <div class="empty-state" role="status">
      <div class="empty-state-icon">
        <Icon />
      </div>
      <p class="empty-state-title">{title}</p>
      {description && <p class="empty-state-description">{description}</p>}
      {action && (
        <a
          href={action.href}
          class="inline-flex items-center gap-1.5 mt-2 px-4 py-2 rounded-lg text-sm font-medium no-underline bg-primary text-primary-inverse hover:bg-primary-hover transition-colors"
        >
          {action.label}
        </a>
      )}
    </div>
  );
}
