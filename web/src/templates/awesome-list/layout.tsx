import type { LayoutProps } from '@pignal/templates';
import { PublicLayout } from '../../components/public-layout';
import templateStyles from './styles.css';

// TODO: If your template needs a custom header/footer or extra wrapping elements,
// add them here around the {children}. Otherwise the default PublicLayout works out of the box.
export function AwesomeListLayout({ title, head, sourceTitle, sourceUrl, settings, children }: LayoutProps) {
  const styleTag = templateStyles ? `<style>${templateStyles}</style>` : '';
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
