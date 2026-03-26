import type { Child } from 'hono/jsx';
import type { TFunction, Locale } from '@pignal/render/i18n/types';
import type { VisitorContext } from '../types';
import { Layout } from '@pignal/render/components/layout';
import { HTMX_JS_URL, APP_JS_URL, LOGO_SVG_URL } from '@pignal/render/lib/static-versions';
import { IconLogout, IconExternalLink, IconHamburger } from '@pignal/render/components/icons';
import { localePath } from '@pignal/render/i18n/utils';
import { LanguageSwitcher } from '@pignal/render/components/language-switcher';

interface AppLayoutProps {
  title: string;
  currentPath: string;
  csrfToken: string;
  flash?: { type: 'success' | 'error'; message: string };
  t: TFunction;
  locale: Locale;
  defaultLocale: Locale;
  children: Child;
  /** Visitor identity from hub SSO (null if not authenticated or self-hosted). */
  visitor?: VisitorContext;
}

export function AppLayout({
  title,
  currentPath,
  csrfToken,
  flash,
  t,
  locale,
  defaultLocale,
  children,
  visitor,
}: AppLayoutProps) {
  const lp = (path: string) => localePath(path, locale, defaultLocale);

  const allNav = [
    { href: '/pignal', label: t('nav.dashboard') },
    { href: '/pignal/items', label: t('nav.items') },
    { href: '/pignal/types', label: t('nav.types') },
    { href: '/pignal/workspaces', label: t('nav.workspaces') },
    { href: '/pignal/actions', label: t('nav.actions') },
    { href: '/pignal/submissions', label: t('nav.submissions') },
    { href: '/pignal/api-keys', label: t('nav.apiKeys') },
    { href: '/pignal/settings', label: t('nav.settings') },
  ];

  return (
    <Layout title={`${title} | pignal`} locale={locale}>
      <div>
        <a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-primary focus:text-primary-inverse focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-semibold">
          {t('common.skipToMainContent')}
        </a>

        {/* Navigation */}
        <header class="sticky top-0 z-40 bg-bg-page/80 backdrop-blur-lg border-b border-border">
          <div class="max-w-6xl mx-auto w-full px-4 sm:px-6">
            <nav class="flex items-center justify-between h-14 gap-4" aria-label="Main navigation">
              {/* Left: Logo */}
              <div class="flex items-center shrink-0">
                <a href={lp('/pignal')} class="inline-flex items-center gap-1.5 text-base font-bold text-text no-underline hover:text-primary transition-colors">
                  <img src={LOGO_SVG_URL} alt="" width="20" height="20" class="rounded" />
                  pignal
                </a>
              </div>

              {/* Center: Nav pill group (hidden on mobile) */}
              <div class="hidden md:flex items-center bg-surface rounded-lg p-1 shadow-xs border border-border">
                {allNav.map((item) => (
                  <a
                    href={lp(item.href)}
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
                  {t('common.viewSite')}
                  <IconExternalLink size={14} />
                </a>

                {/* Language switcher */}
                <LanguageSwitcher currentLocale={locale} defaultLocale={defaultLocale} currentPath={currentPath} />

                {/* Theme toggle */}
                <button class="theme-toggle" type="button" aria-label={t('common.toggleTheme')}>
                </button>

                {/* User menu / Logout (hidden on mobile) */}
                {visitor ? (
                  <details class="dropdown relative hidden md:inline-block">
                    <summary class="flex items-center gap-1.5 px-1.5 py-1 rounded-md hover:bg-surface-hover transition-colors cursor-pointer list-none select-none">
                      <img
                        src={`https://github.com/${visitor.login}.png?size=32`}
                        alt=""
                        width="20"
                        height="20"
                        class="rounded-full"
                      />
                    </summary>
                    <div class="absolute right-0 top-full mt-1 min-w-[180px] bg-surface border border-border rounded-lg shadow-md z-50 py-1">
                      <div class="px-3 py-2 border-b border-border-subtle">
                        <div class="text-sm font-medium text-text truncate">{visitor.name}</div>
                        <div class="text-xs text-muted truncate">@{visitor.login}</div>
                      </div>
                      <a href="/" target="_blank" rel="noopener" class="flex items-center gap-2 px-3 py-1.5 text-sm text-text hover:bg-surface-hover transition-colors">
                        <IconExternalLink size={14} />
                        {t('common.viewSite')}
                      </a>
                      <a href="https://pignal.net/logout" class="flex items-center gap-2 px-3 py-1.5 text-sm text-text hover:bg-surface-hover transition-colors">
                        <IconLogout size={14} />
                        {t('common.signOut')}
                      </a>
                    </div>
                  </details>
                ) : (
                  <a
                    href={lp('/pignal/logout')}
                    class="hidden md:inline-flex items-center p-2 text-muted hover:text-text hover:bg-surface-hover rounded-md transition-colors"
                    aria-label={t('common.logout')}
                  >
                    <IconLogout size={16} />
                  </a>
                )}

                {/* Mobile hamburger menu */}
                <details class="md:hidden relative">
                  <summary class="list-none cursor-pointer p-2 rounded-md text-muted hover:text-text hover:bg-surface-hover transition-colors">
                    <IconHamburger size={18} />
                  </summary>
                  <div class="absolute right-0 top-full mt-1 w-56 bg-surface border border-border rounded-lg shadow-md py-1 z-50">
                    {allNav.map((item) => (
                      <a
                        href={lp(item.href)}
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
                    {visitor && (
                      <div class="px-4 py-2 border-b border-border-subtle">
                        <div class="flex items-center gap-2">
                          <img
                            src={`https://github.com/${visitor.login}.png?size=32`}
                            alt=""
                            width="20"
                            height="20"
                            class="rounded-full"
                          />
                          <div>
                            <div class="text-sm font-medium text-text truncate">{visitor.name}</div>
                            <div class="text-xs text-muted truncate">@{visitor.login}</div>
                          </div>
                        </div>
                      </div>
                    )}
                    <a
                      href="/"
                      target="_blank"
                      rel="noopener"
                      class="flex items-center gap-2 px-4 py-2 text-sm text-muted hover:text-text hover:bg-surface-hover transition-colors"
                    >
                      {t('common.viewSite')}
                      <IconExternalLink size={14} />
                    </a>
                    {visitor ? (
                      <a
                        href="https://pignal.net/logout"
                        class="flex items-center gap-2 px-4 py-2 text-sm text-muted hover:text-text hover:bg-surface-hover transition-colors"
                      >
                        <IconLogout size={14} />
                        {t('common.signOut')}
                      </a>
                    ) : (
                      <a
                        href={lp('/pignal/logout')}
                        class="flex items-center gap-2 px-4 py-2 text-sm text-muted hover:text-text hover:bg-surface-hover transition-colors"
                      >
                        <IconLogout size={14} />
                        {t('common.logout')}
                      </a>
                    )}
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
              {t('common.poweredBy')}{' '}
              <a href="https://github.com/pignal-net/pignal" rel="noopener" class="inline-flex items-center gap-1 text-muted hover:text-primary transition-colors">
                <img src={LOGO_SVG_URL} alt="" width="14" height="14" class="rounded-sm" />
                pignal
              </a>
            </span>
            <a href="/" class="inline-flex items-center gap-1 text-muted hover:text-primary transition-colors">
              {t('common.viewPublicSite')}
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
