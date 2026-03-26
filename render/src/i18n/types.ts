export type Locale = 'en' | 'vi' | 'zh';
export const SUPPORTED_LOCALES: Locale[] = ['en', 'vi', 'zh'];
export const FALLBACK_LOCALE: Locale = 'en';

export type TranslationMap = Record<string, string>;

export type TFunction = (key: string, params?: Record<string, string | number>) => string;
