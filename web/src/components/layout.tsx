import type { Child } from 'hono/jsx';
import { raw } from 'hono/html';
import { PICO_CSS_URL, APP_CSS_URL } from '../lib/static-versions';

interface LayoutProps {
  title: string;
  head?: string;
  children: Child;
}

export function Layout({ title, head, children }: LayoutProps) {
  return (
    <>
      {raw('<!DOCTYPE html>')}
      <html lang="en" data-theme="light">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href="/favicon.ico" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="stylesheet" href={PICO_CSS_URL} />
        <link rel="stylesheet" href={APP_CSS_URL} />
        {head ? raw(head) : <title>{title}</title>}
      </head>
      <body class="site">
        {children}
      </body>
    </html>
    </>
  );
}
