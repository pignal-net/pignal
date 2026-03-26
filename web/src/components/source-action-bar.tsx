import type { TFunction } from '../i18n/types';

interface SourceActionBarProps {
  slug?: string;
  sourceUrl: string;
  showRawLink?: boolean;
  t?: TFunction;
}

const identity = (key: string) => key;

export function SourceActionBar({ slug, sourceUrl, showRawLink = true, t: tProp }: SourceActionBarProps) {
  const t = tProp ?? identity;
  const rawMdUrl = slug ? `/item/${slug}.md` : undefined;
  const fullMdUrl = slug ? `${sourceUrl}/item/${slug}.md` : undefined;

  return (
    <div class="flex justify-between items-center mb-8 pb-4 border-b border-border-subtle relative">
      <nav class="flex items-center gap-1.5 text-sm text-muted" aria-label="Breadcrumb">
        <a href="/" class="text-muted no-underline hover:text-primary transition-colors">&larr; {t('post.backToAll')}</a>
      </nav>
      <details class="dropdown" role="list">
        <summary aria-haspopup="listbox" class="px-2.5 py-1 text-xs border border-border rounded-md text-muted hover:text-text hover:border-text/30 transition-colors bg-transparent cursor-pointer">{t('post.share')}</summary>
        <ul role="listbox">
          <li>
            <a href="#" data-action="copy-page" role="option">
              {t('post.copyPageText')}
            </a>
          </li>
          {fullMdUrl && (
            <li>
              <a href="#" data-action="copy-markdown" data-url={fullMdUrl} role="option">
                {t('post.copyAsMarkdown')}
              </a>
            </li>
          )}
          {showRawLink && rawMdUrl && (
            <li>
              <a href={rawMdUrl} role="option">
                {t('post.viewRawMarkdown')}
              </a>
            </li>
          )}
        </ul>
      </details>
    </div>
  );
}
