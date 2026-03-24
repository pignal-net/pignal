import type { Child } from 'hono/jsx';
import { Layout } from './layout';
import { HTMX_JS_URL, APP_JS_URL, LOGO_SVG_URL } from '../lib/static-versions';
import { IconLogout, IconExternalLink, IconHamburger } from '../components/icons';

interface AppLayoutProps {
  title: string;
  currentPath: string;
  csrfToken: string;
  flash?: { type: 'success' | 'error'; message: string };
  children: Child;
}

const ALL_NAV = [
  { href: '/pignal', label: 'Dashboard' },
  { href: '/pignal/items', label: 'Items' },
  { href: '/pignal/types', label: 'Types' },
  { href: '/pignal/workspaces', label: 'Workspaces' },
  { href: '/pignal/actions', label: 'Actions' },
  { href: '/pignal/submissions', label: 'Submissions' },
  { href: '/pignal/api-keys', label: 'API Keys' },
  { href: '/pignal/settings', label: 'Settings' },
];

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
        {/* Navigation */}
        <header class="sticky top-0 z-40 bg-bg-page/80 backdrop-blur-lg border-b border-border">
          <div class="max-w-6xl mx-auto w-full px-4 sm:px-6">
            <nav class="flex items-center justify-between h-14 gap-4" aria-label="Main navigation">
              {/* Left: Logo */}
              <div class="flex items-center shrink-0">
                <a href="/pignal" class="inline-flex items-center gap-1.5 text-base font-bold text-text no-underline hover:text-primary transition-colors">
                  <img src={LOGO_SVG_URL} alt="" width="20" height="20" class="rounded" />
                  pignal
                </a>
              </div>

              {/* Center: Nav pill group (hidden on mobile) */}
              <div class="hidden md:flex items-center bg-surface rounded-lg p-1 shadow-xs border border-border">
                {ALL_NAV.map((item) => (
                  <a
                    href={item.href}
                    class={`px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap ${
                      currentPath === item.href
                        ? 'bg-primary/10 text-primary font-semibold shadow-xs'
                        : 'text-muted hover:text-text hover:bg-surface-hover'
                    }`}
                    {...(currentPath === item.href ? { 'aria-current': 'page' } : {})}
                  >
                    {item.label}
                  </a>
                ))}
              </div>

              {/* Right: Actions */}
              <div class="flex items-center gap-1 shrink-0">
                {/* View Site (hidden on mobile) */}
                <a
                  href="/"
                  target="_blank"
                  rel="noopener"
                  class="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-muted hover:text-text hover:bg-surface-hover rounded-md transition-colors"
                >
                  View Site
                  <IconExternalLink size={14} />
                </a>

                {/* Theme toggle */}
                <button class="theme-toggle" type="button" aria-label="Toggle theme">
                </button>

                {/* Logout (hidden on mobile) */}
                <a
                  href="/pignal/logout"
                  class="hidden md:inline-flex items-center p-2 text-muted hover:text-text hover:bg-surface-hover rounded-md transition-colors"
                  aria-label="Logout"
                >
                  <IconLogout size={16} />
                </a>

                {/* Mobile hamburger menu */}
                <details class="md:hidden relative">
                  <summary class="list-none cursor-pointer p-2 rounded-md text-muted hover:text-text hover:bg-surface-hover transition-colors">
                    <IconHamburger size={18} />
                  </summary>
                  <div class="absolute right-0 top-full mt-1 w-56 bg-surface border border-border rounded-lg shadow-md py-1 z-50">
                    {ALL_NAV.map((item) => (
                      <a
                        href={item.href}
                        class={`block px-4 py-2 text-sm transition-colors ${
                          currentPath === item.href
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-muted hover:text-text hover:bg-surface-hover'
                        }`}
                        {...(currentPath === item.href ? { 'aria-current': 'page' } : {})}
                      >
                        {item.label}
                      </a>
                    ))}
                    <div class="border-t border-border my-1" />
                    <a
                      href="/"
                      target="_blank"
                      rel="noopener"
                      class="flex items-center gap-2 px-4 py-2 text-sm text-muted hover:text-text hover:bg-surface-hover transition-colors"
                    >
                      View Site
                      <IconExternalLink size={14} />
                    </a>
                    <a
                      href="/pignal/logout"
                      class="flex items-center gap-2 px-4 py-2 text-sm text-muted hover:text-text hover:bg-surface-hover transition-colors"
                    >
                      <IconLogout size={14} />
                      Logout
                    </a>
                  </div>
                </details>
              </div>
            </nav>
          </div>
        </header>

        {/* Loading indicator */}
        <div id="nav-loading" class="nav-loading max-w-6xl mx-auto px-4 sm:px-6" hidden>
          <span class="app-spinner" />
        </div>

        {/* Main content */}
        <main id="main-content" class="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8" hx-headers={`{"X-CSRF-Token": "${csrfToken}"}`}>
          {flash && (
            <div class={`flash flash-${flash.type}`} role="alert">{flash.message}</div>
          )}
          {children}
        </main>

        {/* Footer */}
        <footer class="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 mt-auto border-t border-border-subtle">
          <div class="flex items-center justify-between text-sm text-muted">
            <span>
              Powered by{' '}
              <a href="https://github.com/pignal-net/pignal" rel="noopener" class="inline-flex items-center gap-1 text-muted hover:text-primary transition-colors">
                <img src={LOGO_SVG_URL} alt="" width="14" height="14" class="rounded-sm" />
                pignal
              </a>
            </span>
            <a href="/" class="inline-flex items-center gap-1 text-muted hover:text-primary transition-colors">
              View public site
              <IconExternalLink size={14} />
            </a>
          </div>
        </footer>

        {/* Reusable form dialog */}
        <div id="app-dialog" class="confirm-overlay">
          <div class="app-dialog-panel">
            <div id="app-dialog-content"></div>
          </div>
        </div>

        <script src={HTMX_JS_URL}></script>
        <script src={APP_JS_URL}></script>
      </div>
    </Layout>
  );
}
