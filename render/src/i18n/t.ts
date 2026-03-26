import type { Locale, TranslationMap, TFunction } from './types';
import { FALLBACK_LOCALE } from './types';

const registry: Record<string, TranslationMap> = {};

export function registerTranslations(locale: Locale, map: TranslationMap): void {
	registry[locale] = { ...registry[locale], ...map };
}

export function createT(locale: Locale): TFunction {
	const map = registry[locale];
	const fallback = registry[FALLBACK_LOCALE];
	return (key, params) => {
		let text = map?.[key] ?? fallback?.[key] ?? key;
		if (params) {
			for (const [k, v] of Object.entries(params)) {
				text = text.replaceAll(`{${k}}`, String(v));
			}
		}
		return text;
	};
}
