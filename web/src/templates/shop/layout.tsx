import type { LayoutProps } from '@pignal/templates';
import { PublicLayout } from '../../components/public-layout';
import shopStyles from './styles.css';

export function ShopLayout({ title, head, sourceTitle, sourceUrl, settings, children }: LayoutProps) {
  const styleTag = shopStyles ? `<style>${shopStyles}</style>` : '';
  const headWithStyles = (head || '') + styleTag;

  return (
    <PublicLayout
      title={title}
      head={headWithStyles}
      sourceTitle={sourceTitle}
      sourceUrl={sourceUrl}
      settings={settings}
    >
      {children}
    </PublicLayout>
  );
}
