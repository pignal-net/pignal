import type { Child } from 'hono/jsx';
import { Layout } from './layout';
import { HTMX_JS_URL, APP_JS_URL, LOGO_SVG_URL } from '../lib/static-versions';

interface AppLayoutProps {
  title: string;
  currentPath: string;
  csrfToken: string;
  flash?: { type: 'success' | 'error'; message: string };
  children: Child;
}

const PRIMARY_NAV = [
  { href: '/pignal/signals', label: 'Signals' },
  { href: '/', label: 'Pignal' },
];

const ADMIN_NAV = [
  { href: '/pignal/types', label: 'Types' },
  { href: '/pignal/workspaces', label: 'Workspaces' },
  { href: '/pignal/api-keys', label: 'API Keys' },
  { href: '/pignal/settings', label: 'Settings' },
];

function isAdminPath(path: string): boolean {
  return ADMIN_NAV.some((item) => path === item.href);
}

export function AppLayout({
  title,
  currentPath,
  csrfToken,
  flash,
  children,
}: AppLayoutProps) {
  return (
    <Layout title={`${title} | pignal`}>
      <div>
        <header class="container">
          <nav aria-label="Main navigation">
            <ul>
              <li>
                <strong>
                  <a href="/pignal" style="display:inline-flex;align-items:center;gap:0.35rem">
                    <img src={LOGO_SVG_URL} alt="" width="20" height="20" style="border-radius:4px" />
                    pignal
                  </a>
                </strong>
              </li>
            </ul>
            <ul>
              {PRIMARY_NAV.map((item) => (
                <li>
                  <a
                    href={item.href}
                    {...(currentPath === item.href ? { 'aria-current': 'page' } : {})}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <details class="dropdown" role="list" dir="rtl">
                  <summary
                    aria-haspopup="listbox"
                    {...(isAdminPath(currentPath) ? { class: 'active' } : {})}
                  >
                    <img
                      src={LOGO_SVG_URL}
                      alt="Admin"
                      class="source-avatar-sm"
                      width="24"
                      height="24"
                    />
                  </summary>
                  <ul role="listbox">
                    {ADMIN_NAV.map((item) => (
                      <li>
                        <a
                          href={item.href}
                          {...(currentPath === item.href ? { 'aria-current': 'page' } : {})}
                        >
                          {item.label}
                        </a>
                      </li>
                    ))}
                    <li><a href="/pignal/logout">Logout</a></li>
                  </ul>
                </details>
              </li>
              <li>
                <button class="theme-toggle" type="button" aria-label="Toggle theme">
                  {'\uD83D\uDCBB'}
                </button>
              </li>
            </ul>
          </nav>
        </header>

        <div id="nav-loading" class="nav-loading container" hidden>
          <span class="app-spinner" />
        </div>
        <main id="main-content" class="container" hx-headers={`{"X-CSRF-Token": "${csrfToken}"}`}>
          {flash && (
            <div class={`flash flash-${flash.type}`} role="alert">{flash.message}</div>
          )}
          {children}
        </main>

        <footer id="main-footer" class="container">
          <small>Powered by <a href="https://github.com/pignal-net/pignal" rel="noopener" style="display:inline-flex;align-items:center;gap:0.25rem"><img src={LOGO_SVG_URL} alt="" width="14" height="14" style="border-radius:3px" />pignal</a></small>
        </footer>

        <script src={HTMX_JS_URL}></script>
        <script src={APP_JS_URL}></script>
      </div>
    </Layout>
  );
}
