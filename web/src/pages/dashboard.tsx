import type { Context } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import type { Child } from 'hono/jsx';
import { drizzle } from 'drizzle-orm/d1';
import { count, gte } from 'drizzle-orm';
import { pageViews } from '@pignal/db/schema';
import type { WebEnv, WebVars } from '../types';
import { AppLayout } from '../components/app-layout';
import { PageHeader } from '../components/page-header';
import { getCsrfToken } from '../middleware/csrf';
import { ActionStore } from '@pignal/core/store/action-store';

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

function StatCard({ label, value, icon }: { label: string; value: number; icon: Child }) {
  return (
    <div class="bg-surface rounded-xl border border-border-subtle shadow-card card-hover p-4">
      <div class="flex items-center justify-between mb-1">
        <span class="text-primary opacity-60">{icon}</span>
      </div>
      <p class="text-3xl font-bold tracking-tight text-text">{value}</p>
      <p class="text-xs font-medium text-muted mt-1 uppercase tracking-widest">{label}</p>
    </div>
  );
}

/* Stat card icons (16x16 stroke-based SVGs) */
function IconDocument() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 1.5H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5.5L9 1.5z" />
      <path d="M9 1.5V5.5h4" />
      <path d="M5.5 8.5h5M5.5 11h3" />
    </svg>
  );
}

function IconCheckCircle() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M5.5 8l2 2 3.5-3.5" />
    </svg>
  );
}

function IconTagStat() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1.5 9.16V2.5a1 1 0 0 1 1-1h6.66a1 1 0 0 1 .7.29l4.85 4.85a1 1 0 0 1 0 1.41l-5.36 5.36a1 1 0 0 1-1.41 0L1.79 9.87a1 1 0 0 1-.29-.71z" />
      <circle cx="5" cy="5" r="1" fill="currentColor" />
    </svg>
  );
}

function IconFolder() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 3.5a1 1 0 0 1 1-1h3.17a1 1 0 0 1 .7.29L8.5 4.5H13a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5z" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="2.5" width="10" height="12" rx="1" />
      <path d="M6 2.5V2a2 2 0 1 1 4 0v.5" />
      <path d="M6 7h4M6 9.5h4M6 12h2" />
    </svg>
  );
}

function IconInbox() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2.5 9.5h3l1.5 2h2l1.5-2h3" />
      <path d="M3.27 4.5L2.5 9.5v3a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-3l-.77-5A1 1 0 0 0 11.74 3H4.26a1 1 0 0 0-.99.5z" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8s-2.5 4.5-6.5 4.5S1.5 8 1.5 8z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}

export async function dashboardPage(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const csrfToken = getCsrfToken(c);
  const t = c.get('t');
  const locale = c.get('locale');
  const defaultLocale = c.get('defaultLocale');

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
      title={t('dashboard.title')}
      currentPath="/pignal"
      csrfToken={csrfToken}
      t={t}
      locale={locale}
      defaultLocale={defaultLocale}
      visitor={c.get("visitor")}
    >
      <PageHeader title={t('dashboard.title')} description={t('dashboard.description')} />

      {/* Stats Grid */}
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label={t('dashboard.stats.items')} value={stats.total} icon={<IconDocument />} />
        <StatCard label={t('dashboard.stats.published')} value={publishedItems} icon={<IconCheckCircle />} />
        <StatCard label={t('dashboard.stats.types')} value={types.length} icon={<IconTagStat />} />
        <StatCard label={t('dashboard.stats.workspaces')} value={workspaces.length} icon={<IconFolder />} />
        <StatCard label={t('dashboard.stats.actions')} value={actionStats.totalActions} icon={<IconClipboard />} />
        <StatCard label={t('dashboard.stats.submissions')} value={actionStats.totalSubmissions} icon={<IconInbox />} />
        {viewStats.allTime > 0 && (
          <>
            <StatCard label={t('dashboard.stats.viewsToday')} value={viewStats.today} icon={<IconEye />} />
            <StatCard label={t('dashboard.stats.viewsThisWeek')} value={viewStats.week} icon={<IconEye />} />
          </>
        )}
      </div>

      {/* Join the Pignal Network */}
      <div class="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-6 mb-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-text mb-1">{t('dashboard.network.title')}</h2>
            <p class="text-sm text-muted leading-relaxed max-w-lg">
              {t('dashboard.network.description')}
            </p>
          </div>
          <a href="https://pignal.net" target="_blank" rel="noopener"
            class="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-inverse text-sm font-medium hover:bg-primary-hover transition-colors shadow-xs">
            {t('dashboard.network.button')}
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h8v8" /><path d="M13 3 5 11" /></svg>
          </a>
        </div>
      </div>
    </AppLayout>
  );
}
