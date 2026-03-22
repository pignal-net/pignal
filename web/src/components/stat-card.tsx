interface StatCardProps {
  label: string;
  value: number | string;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div class="p-6 bg-surface rounded-xl border border-border-subtle shadow-card hover:shadow-card-hover transition-shadow duration-200">
      <div class="text-3xl font-bold leading-tight tracking-tight text-text">{value}</div>
      <div class="text-xs font-medium text-muted mt-2 uppercase tracking-widest">{label}</div>
    </div>
  );
}
