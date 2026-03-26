/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import type { LayoutProps } from '../types';
import { PublicLayout } from '@pignal/render/components/public-layout';

export function ShopLayout({ title, head, sourceTitle, sourceUrl, settings, t, locale, defaultLocale, children, visitor }: LayoutProps) {
  return (
    <PublicLayout
      title={title}
      head={head}
      sourceTitle={sourceTitle}
      sourceUrl={sourceUrl}
      settings={settings}
      t={t}
      locale={locale}
      defaultLocale={defaultLocale}
      visitor={visitor}
    >
      {children}
    </PublicLayout>
  );
}
