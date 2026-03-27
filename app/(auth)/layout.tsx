'use client';

import { AmbientGlow } from '@/components/shared/ambient-glow';
import { LanguageProvider } from '@/lib/i18n/context';
import type { SupportedLanguage } from '@/types';

function detectBrowserLang(): SupportedLanguage {
  if (typeof navigator === 'undefined') return 'vi';
  const lang = navigator.language?.toLowerCase() ?? '';
  if (lang.startsWith('vi')) return 'vi';
  return 'en';
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = detectBrowserLang();

  return (
    <LanguageProvider lang={lang}>
      <div className="relative flex min-h-screen">
        <AmbientGlow variant="auth" />
        {children}
      </div>
    </LanguageProvider>
  );
}
