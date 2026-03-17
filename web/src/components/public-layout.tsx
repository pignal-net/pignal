import type { Child } from 'hono/jsx';
import type { SettingsMap } from '@pignal/db';
import { Layout } from './layout';
import { buildThemeStyleTag } from '../lib/theme';
import { APP_JS_URL, HTMX_JS_URL, LOGO_SVG_URL } from '../lib/static-versions';

interface PublicLayoutProps {
  title: string;
  head?: string;
  sourceTitle: string;
  sourceUrl: string;
  settings?: SettingsMap;
  children: Child;
}

export function PublicLayout({ title, head, sourceTitle, sourceUrl, settings = {}, children }: PublicLayoutProps) {
  const githubUrl = settings.source_social_github;
  const twitterUrl = settings.source_social_twitter;
  const customFooter = settings.source_custom_footer;
  const logoText = settings.source_logo_text || sourceTitle;
  const customCss = settings.source_custom_css;
  const customHead = settings.source_custom_head;
  const codeTheme = settings.source_code_theme;

  const themeStyle = buildThemeStyleTag(settings);
  // Sanitize custom CSS: strip </style> sequences to prevent breaking out of the style context
  const safeCss = customCss ? customCss.replace(/<\/style\s*>/gi, '/* blocked */') : '';
  const customCssTag = safeCss ? `<style>${safeCss}</style>` : '';
  const customHeadHtml = customHead || '';

  const headContent = (head || `<title>${title} | ${sourceTitle}</title>`) + themeStyle + customCssTag + customHeadHtml;

  const codeThemeAttr = codeTheme && codeTheme !== 'default' ? codeTheme : undefined;

  return (
    <Layout title={title} head={headContent}>
      <div {...(codeThemeAttr ? { 'data-code-theme': codeThemeAttr } : {})}>
        <header class="container">
          <nav aria-label="Source navigation">
            <ul>
              <li>
                <strong>
                  <a href="/" style="display:inline-flex;align-items:center;gap:0.35rem">
                    <img src={LOGO_SVG_URL} alt="" width="20" height="20" style="border-radius:4px" />
                    {logoText}
                  </a>
                </strong>
              </li>
            </ul>
            <ul>
              {githubUrl && (
                <li><a href={githubUrl} target="_blank" rel="noopener" class="secondary">GitHub</a></li>
              )}
              {twitterUrl && (
                <li><a href={twitterUrl} target="_blank" rel="noopener" class="secondary">Twitter</a></li>
              )}
              <li><a href="/feed.xml" class="secondary">Feed</a></li>
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
        <main id="main-content">
          {children}
        </main>
        <footer id="main-footer" class="container">
          <small>
            {customFooter || (
              <>Powered by <a href="https://github.com/pignal-net/pignal" rel="noopener" style="display:inline-flex;align-items:center;gap:0.25rem"><img src={LOGO_SVG_URL} alt="" width="14" height="14" style="border-radius:3px" />pignal</a></>
            )}
            {sourceUrl && (
              <> | <a href={`${sourceUrl}/llms.txt`}>llms.txt</a></>
            )}
          </small>
        </footer>
        <script src={HTMX_JS_URL}></script>
        <script src={APP_JS_URL}></script>
      </div>
    </Layout>
  );
}
