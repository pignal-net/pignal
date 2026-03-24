import type { Context } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { count, gte } from 'drizzle-orm';
import type { ItemStoreRpc } from '@pignal/db';
import { pageViews } from '@pignal/db/schema';
import type { WebEnv } from '../types';
import { AppLayout } from '../components/app-layout';
import { PageHeader } from '../components/page-header';
import { getCsrfToken } from '../middleware/csrf';
import { ActionStore } from '@pignal/core/store/action-store';

type WebVars = { store: ItemStoreRpc };

/** Query page view counts from D1. Returns { today, week, allTime }. */
async function getPageViewStats(db: D1Database): Promise<{ today: number; week: number; allTime: number }> {
  const d1 = drizzle(db);
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [todayResult, weekResult, allTimeResult] = await Promise.all([
    d1.select({ count: count() }).from(pageViews).where(gte(pageViews.createdAt, today)),
    d1.select({ count: count() }).from(pageViews).where(gte(pageViews.createdAt, weekAgo)),
    d1.select({ count: count() }).from(pageViews),
  ]);

  return {
    today: todayResult[0]?.count ?? 0,
    week: weekResult[0]?.count ?? 0,
    allTime: allTimeResult[0]?.count ?? 0,
  };
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div class="bg-surface rounded-xl border border-border-subtle shadow-card p-4">
      <p class="text-2xl font-bold text-text">{value}</p>
      <p class="text-sm text-muted">{label}</p>
    </div>
  );
}

export async function dashboardPage(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const csrfToken = getCsrfToken(c);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = drizzle((c.env as any).DB);
  const actionStore = new ActionStore(db);

  const [stats, types, workspaces, actionStats] = await Promise.all([
    store.stats(),
    store.listTypes(),
    store.listWorkspaces(),
    actionStore.submissionStats(),
  ]);

  // Count published (vouched) items
  const vouchedResult = await store.list({ visibility: 'vouched', limit: 1 });
  const publishedItems = vouchedResult.total;

  // Page view analytics
  const d1Db = (c.env as unknown as { DB?: D1Database }).DB;
  const viewStats = d1Db ? await getPageViewStats(d1Db) : { today: 0, week: 0, allTime: 0 };

  return c.html(
    <AppLayout
      title="Dashboard"
      currentPath="/pignal"
      csrfToken={csrfToken}
    >
      <PageHeader title="Dashboard" description="Overview of your site" />

      {/* Stats Grid */}
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Items" value={stats.total} />
        <StatCard label="Published" value={publishedItems} />
        <StatCard label="Types" value={types.length} />
        <StatCard label="Workspaces" value={workspaces.length} />
        <StatCard label="Actions" value={actionStats.totalActions} />
        <StatCard label="Submissions" value={actionStats.totalSubmissions} />
        {viewStats.allTime > 0 && (
          <>
            <StatCard label="Views Today" value={viewStats.today} />
            <StatCard label="Views This Week" value={viewStats.week} />
          </>
        )}
      </div>

      {/* Join the Pignal Network */}
      <div class="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-6 mb-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-text mb-1">Join the Pignal Network</h2>
            <p class="text-sm text-muted leading-relaxed max-w-lg">
              Register your site on <strong class="text-text">pignal.net</strong> to get discovered, monitored, and managed from the hub. Connect with the growing community of AI-native websites.
            </p>
          </div>
          <a href="https://pignal.net" target="_blank" rel="noopener"
            class="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-inverse text-sm font-medium hover:bg-primary-hover transition-colors shadow-xs">
            Register on pignal.net
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h8v8" /><path d="M13 3 5 11" /></svg>
          </a>
        </div>
      </div>
    </AppLayout>
  );
}
