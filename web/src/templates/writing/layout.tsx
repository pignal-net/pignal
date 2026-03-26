import type { LayoutProps } from '@pignal/templates';
import { PublicLayout } from '../../components/public-layout';

export function WritingLayout({ title, head, sourceTitle, sourceUrl, settings, t, locale, defaultLocale, children, visitor }: LayoutProps) {
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
