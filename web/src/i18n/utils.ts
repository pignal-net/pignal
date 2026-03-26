import type { Locale } from './types';
import { SUPPORTED_LOCALES } from './types';

/** Build locale-aware path. Default locale gets no prefix. */
export function localePath(path: string, locale: Locale, defaultLocale: Locale): string {
	if (locale === defaultLocale) return path;
	return `/${locale}${path.startsWith('/') ? '' : '/'}${path}`;
}

/** Strip locale prefix from URL path (for language switcher links). */
export function stripLocalePath(pathname: string): string {
	const segments = pathname.split('/').filter(Boolean);
	if (segments[0] && SUPPORTED_LOCALES.includes(segments[0] as Locale)) {
		return '/' + segments.slice(1).join('/') || '/';
	}
	return pathname;
}

/** Generate hreflang link tags for SEO. */
export function buildHreflangTags(currentPath: string, sourceUrl: string, defaultLocale: Locale): string {
	const cleanPath = stripLocalePath(currentPath);
	const tags = SUPPORTED_LOCALES.map((loc) => {
		const href = loc === defaultLocale
			? `${sourceUrl}${cleanPath}`
			: `${sourceUrl}/${loc}${cleanPath}`;
		return `<link rel="alternate" hreflang="${loc}" href="${href}" />`;
	});
	// x-default points to the default locale (unprefixed)
	tags.push(`<link rel="alternate" hreflang="x-default" href="${sourceUrl}${cleanPath}" />`);
	return tags.join('\n    ');
}
