import type { Context } from 'hono';
import type { ItemStoreRpc } from '@pignal/db';
import type { WebEnv } from '../types';
import { AppLayout } from '../components/app-layout';
import { StatCard } from '../components/stat-card';
import { getCsrfToken } from '../middleware/csrf';
import { IconList, IconTag, IconSettings } from '../components/icons';

type WebVars = { store: ItemStoreRpc };

export async function dashboardPage(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const stats = await store.stats();
  const csrfToken = getCsrfToken(c);

  return c.html(
    <AppLayout
      title="Dashboard"
      currentPath="/pignal"
      csrfToken={csrfToken}
    >
      {/* Page header */}
      <div class="mb-8">
        <h1 class="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p class="text-muted text-sm mt-1">Overview of your signal store</p>
      </div>

      {/* Stats grid */}
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-6">
        <StatCard label="Total Signals" value={stats.total} />
        <StatCard label="Archived" value={stats.archivedCount} />
        <StatCard label="Validated" value={stats.validationStats.validated} />
        <StatCard label="Unvalidated" value={stats.validationStats.unvalidated} />
      </div>

      {/* By Type */}
      {Object.keys(stats.byType).length > 0 && (
        <section class="mt-10">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-muted mb-4">By Type</h2>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {Object.entries(stats.byType).map(([name, cnt]) => (
              <StatCard label={name} value={cnt} />
            ))}
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section class="mt-10">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-muted mb-4">Quick Actions</h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <a href="/pignal/items" class="bg-surface rounded-xl border border-border-subtle shadow-card hover:shadow-card-hover p-5 flex items-start gap-4 no-underline transition-all duration-200 group">
            <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <IconList size={20} />
            </div>
            <div>
              <div class="text-sm font-semibold text-text group-hover:text-primary transition-colors">Browse Items</div>
              <div class="text-xs text-muted mt-0.5">Search, filter, and manage all your signals</div>
            </div>
          </a>
          <a href="/pignal/types" class="bg-surface rounded-xl border border-border-subtle shadow-card hover:shadow-card-hover p-5 flex items-start gap-4 no-underline transition-all duration-200 group">
            <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <IconTag size={20} />
            </div>
            <div>
              <div class="text-sm font-semibold text-text group-hover:text-primary transition-colors">Manage Types</div>
              <div class="text-xs text-muted mt-0.5">Organize items with types and actions</div>
            </div>
          </a>
          <a href="/pignal/settings" class="bg-surface rounded-xl border border-border-subtle shadow-card hover:shadow-card-hover p-5 flex items-start gap-4 no-underline transition-all duration-200 group">
            <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <IconSettings size={20} />
            </div>
            <div>
              <div class="text-sm font-semibold text-text group-hover:text-primary transition-colors">Settings</div>
              <div class="text-xs text-muted mt-0.5">Configure your signal store preferences</div>
            </div>
          </a>
        </div>
      </section>

      {/* Join Network */}
      <section class="mt-12 bg-surface rounded-xl border border-border-subtle shadow-card p-6 sm:p-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h2 class="text-lg font-bold mb-1">Join the Pignal Network</h2>
            <p class="text-sm text-muted leading-relaxed max-w-lg">
              Your signals live here. Register on <strong class="text-text">pignal.net</strong> to get discovered in the global feed and build trust as a knowledge source.
            </p>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <a href="https://pignal.net" role="button" target="_blank" rel="noopener">
              Register &rarr;
            </a>
            <a href="/" role="button" class="outline">
              View site
            </a>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
