import { registerTranslations } from './t';
import en from './locales/en.json';
import vi from './locales/vi.json';
import zh from './locales/zh.json';

registerTranslations('en', en);
registerTranslations('vi', vi);
registerTranslations('zh', zh);

export { registerTranslations, createT } from './t';
export { localePath, stripLocalePath, buildHreflangTags } from './utils';
export { SUPPORTED_LOCALES, FALLBACK_LOCALE } from './types';
export type { Locale, TFunction, TranslationMap } from './types';
