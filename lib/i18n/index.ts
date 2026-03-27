import type { SupportedLanguage } from '@/types';
import en, { type TranslationKeys } from './locales/en';
import vi from './locales/vi';

export type { TranslationKeys };

const locales: Record<SupportedLanguage, Record<TranslationKeys, string>> = { en, vi };

export function getTranslations(lang: SupportedLanguage) {
  const dict = locales[lang] || locales.vi;
  return {
    t: (key: TranslationKeys) => dict[key] || key,
    lang,
  };
}
