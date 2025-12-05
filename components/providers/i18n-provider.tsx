'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { useLocaleStore } from '@/lib/i18n/locale-store';
import type { Locale } from '@/i18n/config';

// Import messages statically for static export
import enMessages from '@/i18n/messages/en.json';
import zhMessages from '@/i18n/messages/zh.json';

const messages: Record<Locale, typeof enMessages> = {
  en: enMessages,
  zh: zhMessages,
};

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const locale = useLocaleStore((state) => state.locale);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use default locale during SSR/initial render
  const currentLocale = mounted ? locale : 'en';

  return (
    <NextIntlClientProvider
      locale={currentLocale}
      messages={messages[currentLocale]}
      timeZone={Intl.DateTimeFormat().resolvedOptions().timeZone}
    >
      {children}
    </NextIntlClientProvider>
  );
}
