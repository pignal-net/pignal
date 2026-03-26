import type { Locale } from '../i18n/types';
import { SUPPORTED_LOCALES } from '../i18n/types';
import { localePath, stripLocalePath } from '../i18n/utils';

const LOCALE_LABELS: Record<Locale, string> = {
	en: 'English',
	vi: 'Tiếng Việt',
	zh: '中文',
};

const LOCALE_SHORT: Record<Locale, string> = {
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
		<details class="dropdown relative">
			<summary class="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-muted hover:text-text hover:bg-surface-hover transition-colors cursor-pointer list-none select-none">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="10" />
					<path d="M2 12h20" />
					<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
				</svg>
				{LOCALE_SHORT[currentLocale]}
			</summary>
			<div class="absolute right-0 top-full mt-1 min-w-[140px] bg-surface border border-border rounded-lg shadow-md z-50 py-1">
				{SUPPORTED_LOCALES.map((code) => {
					const href = localePath(cleanPath, code, defaultLocale);
					const isActive = code === currentLocale;
					return (
						<a
							href={href}
							class={`flex items-center justify-between px-3 py-1.5 text-sm transition-colors ${
								isActive
									? 'text-primary font-medium bg-primary/5'
									: 'text-text hover:bg-surface-hover'
							}`}
							lang={code}
						>
							<span>{LOCALE_LABELS[code]}</span>
							{isActive && (
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
									<polyline points="20 6 9 17 4 12" />
								</svg>
							)}
						</a>
					);
				})}
			</div>
		</details>
	);
}
