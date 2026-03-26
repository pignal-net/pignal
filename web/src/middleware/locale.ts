import type { Context, Next } from 'hono';
import type { WebEnv, WebVars } from '../types';
import type { Locale } from '../i18n/types';
import { SUPPORTED_LOCALES, FALLBACK_LOCALE } from '../i18n/types';
import { createT, registerTranslations } from '../i18n/t';
import { getTemplate } from '../templates/registry';

/**
 * i18n middleware — runs AFTER Hono's languageDetector.
 *
 * 1. Reads site default locale from `source_locale` setting (cached 60s)
 * 2. If URL has locale prefix matching the site default → 301 redirect to unprefixed path
 * 3. Creates `t()` function and sets `locale`, `defaultLocale`, `t` on context
 * 4. Registers active template's translations
 */
export async function i18nMiddleware(
	c: Context<{ Bindings: WebEnv; Variables: WebVars }>,
	next: Next,
) {
	const store = c.get('store');
	const settings = await store.getSettings();
	const siteDefault = SUPPORTED_LOCALES.includes(settings.source_locale as Locale)
		? (settings.source_locale as Locale)
		: FALLBACK_LOCALE;

	// Determine locale from URL path prefix
	const pathname = new URL(c.req.url).pathname;
	const segments = pathname.split('/').filter(Boolean);
	const pathLocale = segments.length > 0 && SUPPORTED_LOCALES.includes(segments[0] as Locale)
		? (segments[0] as Locale)
		: null;

	// Redirect if URL has the default locale as prefix (e.g., /en/... when default is en)
	if (pathLocale === siteDefault) {
		const cleanPath = '/' + segments.slice(1).join('/') || '/';
		return c.redirect(cleanPath, 301);
	}

	// URL prefix is authoritative. No prefix = site default.
	// Cookie/header detection from languageDetector is ignored — locale is path-driven.
	const locale = pathLocale ?? siteDefault;

	// Register active template's translations
	const templateName = c.get('templateName');
	const template = getTemplate(templateName);
	if (template.i18n) {
		for (const [loc, strings] of Object.entries(template.i18n)) {
			registerTranslations(loc as Locale, strings as Record<string, string>);
		}
	}

	c.set('locale', locale);
	c.set('defaultLocale', siteDefault);
	c.set('t', createT(locale));

	await next();
}
