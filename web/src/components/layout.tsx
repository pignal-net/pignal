import type { Child } from 'hono/jsx';
import { raw } from 'hono/html';
import { TAILWIND_CSS_URL } from '../lib/static-versions';

interface LayoutProps {
  title: string;
  head?: string;
  faviconUrl?: string;
  locale?: string;
  children: Child;
}

/**
 * Inline script to set data-theme before first paint, preventing FOUC.
 * Reads from localStorage (matching app.js behavior) and defaults to 'auto'.
 */
const THEME_INIT_SCRIPT = `<script>!function(){try{var t=localStorage.getItem('pignal-theme');'light'===t||'dark'===t?document.documentElement.setAttribute('data-theme',t):document.documentElement.removeAttribute('data-theme')}catch(e){}}()</script>`;

export function Layout({ title, head, faviconUrl, locale = 'en', children }: LayoutProps) {
  return (
    <>
      {raw('<!DOCTYPE html>')}
      <html lang={locale}>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {faviconUrl
          ? <link rel="icon" href={faviconUrl} />
          : <>
              <link rel="icon" type="image/png" href="/favicon.ico" />
              <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
            </>
        }
        <link rel="stylesheet" href={TAILWIND_CSS_URL} />
        {raw(THEME_INIT_SCRIPT)}
        {head ? raw(head) : <title>{title}</title>}
      </head>
      <body class="site">
        {children}
      </body>
    </html>
    </>
  );
}
