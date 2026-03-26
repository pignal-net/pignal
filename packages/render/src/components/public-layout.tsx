/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import type { Child } from 'hono/jsx';
import type { SettingsMap } from '@pignal/db';
import type { VisitorContext } from '../types';
import type { TFunction } from '../i18n/types';
import { Layout } from './layout';
import { buildThemeStyleTag, buildFontTags } from '../lib/theme';
import { sanitizeCss } from '../lib/css-sanitize';
import { APP_JS_URL, HTMX_JS_URL, LOGO_SVG_URL } from '../lib/static-versions';
import { IconGitHub, IconTwitter, IconRSS, IconLinkedIn, IconMastodon, IconYouTube, IconWebsite } from '../components/icons';
import { getCtaSettings, StickyCta } from './cta-block';
import { LanguageSwitcher } from './language-switcher';
import { buildHreflangTags, localePath } from '../i18n/utils';

interface PublicLayoutProps {
  title: string;
  head?: string;
  sourceTitle: string;
  sourceUrl: string;
  settings?: SettingsMap;
  t?: TFunction;
  locale?: string;
  defaultLocale?: string;
  currentPath?: string;
  children: Child;
  /** Visitor identity from hub SSO (null if not authenticated). */
  visitor?: VisitorContext;
}

/** Only allow http/https URLs — block javascript:, data:, file:, etc. */
function safeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? url : undefined;
  } catch {
    return undefined;
  }
}

const identity = (key: string) => key;

export function PublicLayout({ title, head, sourceTitle, sourceUrl, settings = {}, t: tProp, locale = 'en', defaultLocale: defaultLocaleProp = 'en', currentPath = '/', children, visitor }: PublicLayoutProps) {
  const t = tProp ?? identity;
  const dl = defaultLocaleProp as import('../i18n/types').Locale;
  const lp = (path: string) => localePath(path, locale as import('../i18n/types').Locale, dl);
  const githubUrl = safeUrl(settings.source_social_github);
  const twitterUrl = safeUrl(settings.source_social_twitter);
  const customFooter = settings.source_custom_footer;
  const logoText = settings.source_logo_text || sourceTitle;
  const customCss = settings.source_custom_css;
  const customHead = settings.source_custom_head;
  const codeTheme = settings.source_code_theme;
  const linkedinUrl = safeUrl(settings.source_social_linkedin);
  const mastodonUrl = safeUrl(settings.source_social_mastodon);
  const youtubeUrl = safeUrl(settings.source_social_youtube);
  const websiteUrl = safeUrl(settings.source_social_website);
  const faviconUrl = safeUrl(settings.source_favicon_url);
  const logoUrl = safeUrl(settings.source_logo_url);

  const themeStyle = buildThemeStyleTag(settings);
  const fontTags = buildFontTags(settings);
  // Sanitize custom CSS: strip dangerous patterns (imports, expressions, script schemes)
  const safeCss = customCss ? sanitizeCss(customCss) : '';
  const customCssTag = safeCss ? `<style>${safeCss}</style>` : '';
  // SECURITY: source_custom_head is intentionally injected raw. It allows arbitrary
  // HTML/scripts (analytics, fonts, etc.) and is only settable by the SERVER_TOKEN admin.
  const customHeadHtml = customHead || '';

  const hreflangTags = defaultLocaleProp
    ? buildHreflangTags(currentPath, sourceUrl, defaultLocaleProp as import('../i18n/types').Locale)
    : '';
  const headContent = (head || `<title>${title} | ${sourceTitle}</title>`) + themeStyle + fontTags + customCssTag + customHeadHtml + hreflangTags;

  const codeThemeAttr = codeTheme && codeTheme !== 'default' ? codeTheme : undefined;

  return (
    <Layout title={title} head={headContent} faviconUrl={faviconUrl} locale={locale}>
      <div {...(codeThemeAttr ? { 'data-code-theme': codeThemeAttr } : {})}>
        <a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-primary focus:text-primary-inverse focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-semibold">
          {t('common.skipToMainContent')}
        </a>

        {/* Navigation */}
        <header class="sticky top-0 z-40 border-b border-border bg-bg-page/60 backdrop-blur-md">
          <div class="max-w-5xl mx-auto w-full px-4 sm:px-6">
            <nav class="flex items-center justify-between h-14" aria-label="Source navigation">
              {/* Left: Logo + site name */}
              <div class="flex items-center">
                <a href={lp('/')} class="inline-flex items-center gap-1.5 text-base font-bold text-text no-underline hover:text-primary transition-colors">
                  {logoUrl
                    ? <img src={logoUrl} alt="" height="20" class="rounded" />
                    : <img src={LOGO_SVG_URL} alt="" width="20" height="20" class="rounded" />
                  }
                  {logoText}
                </a>
              </div>

              {/* Right: Social icon buttons + theme toggle */}
              <div class="flex items-center gap-0.5">
                {githubUrl && (
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noopener"
                    class="p-2 rounded-md text-muted hover:text-text hover:bg-surface-hover transition-colors"
                    aria-label={t('common.social.github')}
                  >
                    <IconGitHub size={16} />
                  </a>
                )}
                {twitterUrl && (
                  <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noopener"
                    class="p-2 rounded-md text-muted hover:text-text hover:bg-surface-hover transition-colors"
                    aria-label={t('common.social.twitter')}
                  >
                    <IconTwitter size={16} />
                  </a>
                )}
                {linkedinUrl && (
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener"
                    class="p-2 rounded-md text-muted hover:text-text hover:bg-surface-hover transition-colors"
                    aria-label={t('common.social.linkedin')}
                  >
                    <IconLinkedIn size={16} />
                  </a>
                )}
                {mastodonUrl && (
                  <a
                    href={mastodonUrl}
                    target="_blank"
                    rel="noopener"
                    class="p-2 rounded-md text-muted hover:text-text hover:bg-surface-hover transition-colors"
                    aria-label={t('common.social.mastodon')}
                  >
                    <IconMastodon size={16} />
                  </a>
                )}
                {youtubeUrl && (
                  <a
                    href={youtubeUrl}
                    target="_blank"
                    rel="noopener"
                    class="p-2 rounded-md text-muted hover:text-text hover:bg-surface-hover transition-colors"
                    aria-label={t('common.social.youtube')}
                  >
                    <IconYouTube size={16} />
                  </a>
                )}
                {websiteUrl && (
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener"
                    class="p-2 rounded-md text-muted hover:text-text hover:bg-surface-hover transition-colors"
                    aria-label={t('common.social.website')}
                  >
                    <IconWebsite size={16} />
                  </a>
                )}
                <a
                  href={lp('/feed.xml')}
                  class="p-2 rounded-md text-muted hover:text-text hover:bg-surface-hover transition-colors"
                  aria-label={t('common.social.rssFeed')}
                >
                  <IconRSS size={16} />
                </a>

                {/* Visitor login / profile dropdown (hub SSO — auto-enabled for managed sites) */}
                {visitor === null && (
                  <a
                    href={`https://pignal.net/auth/visitor?return_to=${encodeURIComponent(sourceUrl + currentPath)}`}
                    class="px-2.5 py-1 rounded-md text-xs font-medium text-muted hover:text-text hover:bg-surface-hover transition-colors"
                  >
                    {t('common.login')}
                  </a>
                )}
                {visitor && (
                  <details class="dropdown relative">
                    <summary class="flex items-center gap-1.5 px-1.5 py-1 rounded-md hover:bg-surface-hover transition-colors cursor-pointer list-none select-none">
                      <img
                        src={`https://github.com/${visitor.login}.png?size=32`}
                        alt=""
                        width="20"
                        height="20"
                        class="rounded-full"
                      />
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-muted"><path d="m6 9 6 6 6-6"/></svg>
                    </summary>
                    <div class="absolute right-0 top-full mt-1 min-w-[180px] bg-surface border border-border rounded-lg shadow-md z-50 py-1">
                      {/* User info */}
                      <div class="px-3 py-2 border-b border-border-subtle">
                        <div class="text-sm font-medium text-text truncate">{visitor.name}</div>
                        <div class="text-xs text-muted truncate">@{visitor.login}</div>
                      </div>
                      {/* Admin link */}
                      {visitor.role === 'admin' && (
                        <a href={lp('/pignal')} class="flex items-center gap-2 px-3 py-1.5 text-sm text-text hover:bg-surface-hover transition-colors">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                          {t('common.admin')}
                        </a>
                      )}
                      {/* Sign out — redirects to hub for centralized logout */}
                      <a href="https://pignal.net/logout" class="flex items-center gap-2 px-3 py-1.5 text-sm text-text hover:bg-surface-hover transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        {t('common.signOut')}
                      </a>
                    </div>
                  </details>
                )}

                {/* Vertical divider */}
                <div class="w-px h-5 bg-border mx-1" />

                {/* Language switcher */}
                <LanguageSwitcher
                  currentLocale={(locale ?? 'en') as import('../i18n/types').Locale}
                  defaultLocale={(defaultLocaleProp ?? 'en') as import('../i18n/types').Locale}
                  currentPath={currentPath}
                />

                {/* Theme toggle */}
                <button class="theme-toggle" type="button" aria-label={t('common.toggleTheme')}>
                </button>
              </div>
            </nav>
          </div>
        </header>

        {/* Loading indicator */}
        <div id="nav-loading" class="nav-loading max-w-5xl mx-auto px-4 sm:px-6" hidden>
          <span class="app-spinner" />
        </div>

        {/* Main content */}
        <main id="main-content" class="flex-1 fade-in-page">
          {children}
        </main>

        {/* Footer */}
        <footer class="border-t border-border mt-16">
          <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
              {/* Left: Brand text */}
              <span>
                {customFooter || (
                  <>
                    {t('public.poweredBy')}{' '}
                    <a href="https://github.com/pignal-net/pignal" rel="noopener" class="inline-flex items-center gap-1 text-muted hover:text-primary transition-colors">
                      <img src={LOGO_SVG_URL} alt="" width="14" height="14" class="rounded-sm" />
                      pignal
                    </a>
                  </>
                )}
              </span>

              {/* Right: Links */}
              <div class="flex items-center gap-4">
                {sourceUrl && (
                  <a href={`${sourceUrl}/llms.txt`} class="text-muted hover:text-primary transition-colors">{t('public.llmsTxt')}</a>
                )}
                <a href={lp('/feed.xml')} class="text-muted hover:text-primary transition-colors">{t('public.rss')}</a>
              </div>
            </div>
          </div>
        </footer>

        {(() => {
          const stickyCta = getCtaSettings(settings, 'sticky');
          if (stickyCta && stickyCta.text && stickyCta.buttonText) {
            return (
              <StickyCta
                text={stickyCta.text}
                buttonText={stickyCta.buttonText}
                buttonUrl={stickyCta.buttonUrl}
                actionSlug={stickyCta.actionSlug}
                t={t}
              />
            );
          }
          return null;
        })()}

        <script src={HTMX_JS_URL}></script>
        <script src={APP_JS_URL}></script>
      </div>
    </Layout>
  );
}
