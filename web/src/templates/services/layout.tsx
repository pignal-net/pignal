import type { LayoutProps } from '@pignal/templates';
import { PublicLayout } from '../../components/public-layout';

export function ServicesLayout({ title, head, sourceTitle, sourceUrl, settings, children }: LayoutProps) {
  return (
    <PublicLayout
      title={title}
      head={head}
      sourceTitle={sourceTitle}
      sourceUrl={sourceUrl}
      settings={settings}
    >
      {children}
    </PublicLayout>
  );
}
