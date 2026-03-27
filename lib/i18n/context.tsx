'use client';

import { createContext, useContext } from 'react';
import type { SupportedLanguage } from '@/types';
import { getTranslations, type TranslationKeys } from './index';

interface LanguageContextValue {
  t: (key: TranslationKeys) => string;
  lang: SupportedLanguage;
}

const LanguageContext = createContext<LanguageContextValue>({
  t: (key) => key,
  lang: 'vi',
});

export function LanguageProvider({
  lang,
  children,
}: {
  lang: SupportedLanguage;
  children: React.ReactNode;
}) {
  const value = getTranslations(lang);
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
