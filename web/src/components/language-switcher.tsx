import type { Locale } from '../i18n/types';
import { SUPPORTED_LOCALES } from '../i18n/types';
import { localePath, stripLocalePath } from '../i18n/utils';

const LOCALE_LABELS: Record<Locale, string> = {
	en: 'EN',
	vi: 'VI',
	zh: '中',
};

interface LanguageSwitcherProps {
	currentLocale: Locale;
	defaultLocale: Locale;
	currentPath: string;
}

export function LanguageSwitcher({ currentLocale, defaultLocale, currentPath }: LanguageSwitcherProps) {
	const cleanPath = stripLocalePath(currentPath);

	return (
		<div class="flex items-center gap-0.5">
			{SUPPORTED_LOCALES.map((code) => {
				const href = localePath(cleanPath, code, defaultLocale);
				const isActive = code === currentLocale;
				return (
					<a
						href={href}
						class={`px-1.5 py-1 rounded text-xs font-medium transition-colors ${
							isActive
								? 'bg-primary/10 text-primary'
								: 'text-muted hover:text-text hover:bg-surface-hover'
						}`}
						{...(isActive ? { 'aria-current': 'true' as const } : {})}
						lang={code}
					>
						{LOCALE_LABELS[code]}
					</a>
				);
			})}
		</div>
	);
}
