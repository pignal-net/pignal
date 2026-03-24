import type { Child } from 'hono/jsx';

export interface CreateSectionProps {
  title: string;
  children: Child;
}

export function CreateSection({ title, children }: CreateSectionProps) {
  return (
    <div class="border-2 border-dashed border-border hover:border-primary/30 transition-colors rounded-xl p-6 mb-8">
      <h2 class="text-base font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}
