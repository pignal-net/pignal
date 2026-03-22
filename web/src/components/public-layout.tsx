import type { Child } from 'hono/jsx';
import type { SettingsMap } from '@pignal/db';
import { Layout } from './layout';
import { buildThemeStyleTag } from '../lib/theme';
import { sanitizeCss } from '../lib/css-sanitize';
import { APP_JS_URL, HTMX_JS_URL, LOGO_SVG_URL } from '../lib/static-versions';
import { IconGitHub, IconTwitter, IconRSS } from '../components/icons';

interface PublicLayoutProps {
  title: string;
  head?: string;
  sourceTitle: string;
  sourceUrl: string;
  settings?: SettingsMap;
  children: Child;
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

export function PublicLayout({ title, head, sourceTitle, sourceUrl, settings = {}, children }: PublicLayoutProps) {
  const githubUrl = safeUrl(settings.source_social_github);
  const twitterUrl = safeUrl(settings.source_social_twitter);
  const customFooter = settings.source_custom_footer;
  const logoText = settings.source_logo_text || sourceTitle;
  const customCss = settings.source_custom_css;
  const customHead = settings.source_custom_head;
  const codeTheme = settings.source_code_theme;

  const themeStyle = buildThemeStyleTag(settings);
  // Sanitize custom CSS: strip dangerous patterns (imports, expressions, script schemes)
  const safeCss = customCss ? sanitizeCss(customCss) : '';
  const customCssTag = safeCss ? `<style>${safeCss}</style>` : '';
  // SECURITY: source_custom_head is intentionally injected raw. It allows arbitrary
  // HTML/scripts (analytics, fonts, etc.) and is only settable by the SERVER_TOKEN admin.
  const customHeadHtml = customHead || '';

  const headContent = (head || `<title>${title} | ${sourceTitle}</title>`) + themeStyle + customCssTag + customHeadHtml;

  const codeThemeAttr = codeTheme && codeTheme !== 'default' ? codeTheme : undefined;

  return (
    <Layout title={title} head={headContent}>
      <div {...(codeThemeAttr ? { 'data-code-theme': codeThemeAttr } : {})}>
        {/* Navigation */}
        <header class="sticky top-0 z-40 border-b border-border bg-bg-page/60 backdrop-blur-md">
          <div class="max-w-5xl mx-auto w-full px-4 sm:px-6">
            <nav class="flex items-center justify-between h-14" aria-label="Source navigation">
              {/* Left: Logo + site name */}
              <div class="flex items-center">
                <a href="/" class="inline-flex items-center gap-1.5 text-base font-bold text-text no-underline hover:text-primary transition-colors">
                  <img src={LOGO_SVG_URL} alt="" width="20" height="20" class="rounded" />
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
                    aria-label="GitHub"
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
                    aria-label="Twitter"
                  >
                    <IconTwitter size={16} />
                  </a>
                )}
                <a
                  href="/feed.xml"
                  class="p-2 rounded-md text-muted hover:text-text hover:bg-surface-hover transition-colors"
                  aria-label="RSS Feed"
                >
                  <IconRSS size={16} />
                </a>

                {/* Vertical divider */}
                <div class="w-px h-5 bg-border mx-1" />

                {/* Theme toggle */}
                <button class="theme-toggle" type="button" aria-label="Toggle theme">
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
        <main id="main-content" class="flex-1">
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
                    Powered by{' '}
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
                  <a href={`${sourceUrl}/llms.txt`} class="text-muted hover:text-primary transition-colors">llms.txt</a>
                )}
                <a href="/feed.xml" class="text-muted hover:text-primary transition-colors">RSS</a>
              </div>
            </div>
          </div>
        </footer>

        <script src={HTMX_JS_URL}></script>
        <script src={APP_JS_URL}></script>
      </div>
    </Layout>
  );
}
