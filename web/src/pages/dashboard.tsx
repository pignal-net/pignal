import type { Context } from 'hono';
import type { ItemStoreRpc } from '@pignal/db';
import type { WebEnv } from '../types';
import { AppLayout } from '../components/app-layout';
import { StatCard } from '../components/stat-card';
import { getCsrfToken } from '../middleware/csrf';

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
      <div class="stat-grid">
        <StatCard label="Total Signals" value={stats.total} />
        <StatCard label="Archived" value={stats.archivedCount} />
        <StatCard label="Validated" value={stats.validationStats.validated} />
        <StatCard label="Unvalidated" value={stats.validationStats.unvalidated} />
      </div>

      {Object.keys(stats.byType).length > 0 && (
        <section>
          <h2>By Type</h2>
          <div class="stat-grid">
            {Object.entries(stats.byType).map(([name, cnt]) => (
              <StatCard label={name} value={cnt} />
            ))}
          </div>
        </section>
      )}

      <section class="federation-promo">
        <div class="federation-promo-hero">
          <h2>Join the Pignal Network</h2>
          <p class="federation-promo-tagline">
            Your signals live here. The world discovers them on <strong>pignal.net</strong>.
          </p>
        </div>

        <div class="federation-promo-grid">
          <article class="federation-promo-card">
            <div class="federation-promo-icon">&#x1F310;</div>
            <h3>Get Discovered</h3>
            <p>
              Register your signal store on the Pignal hub. Your vouched signals appear in the
              global feed, searchable by anyone.
            </p>
          </article>

          <article class="federation-promo-card">
            <div class="federation-promo-icon">&#x1F91D;</div>
            <h3>Build Trust</h3>
            <p>
              Signals you vouch for carry your name. Peer verification builds your
              reputation as a trusted knowledge source.
            </p>
          </article>

          <article class="federation-promo-card">
            <div class="federation-promo-icon">&#x1F512;</div>
            <h3>Own Your Data</h3>
            <p>
              Your signal store stays yours. Pignal.net indexes what you publish &mdash;
              it never owns or stores your data.
            </p>
          </article>
        </div>

        <div class="federation-promo-steps">
          <h3>How It Works</h3>
          <ol>
            <li>
              <strong>Capture</strong> &mdash; Create items via MCP, the API, or the dashboard
            </li>
            <li>
              <strong>Vouch</strong> &mdash; Review and validate items you stand behind
            </li>
            <li>
              <strong>Publish</strong> &mdash; Vouched items appear on your public source page
            </li>
            <li>
              <strong>Federate</strong> &mdash; Register on pignal.net to join the global network
            </li>
          </ol>
        </div>

        <div class="federation-promo-cta">
          <a href="https://pignal.net" role="button" target="_blank" rel="noopener">
            Register on pignal.net &rarr;
          </a>
          <a href="/" role="button" class="outline">
            View your public source page
          </a>
        </div>
      </section>
    </AppLayout>
  );
}
