'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { defaultLocale, type Locale } from '@/i18n/config';

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create(
  persist<LocaleState>(
    (set) => ({
      locale: defaultLocale,
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'skymap-locale',
    }
  )
);
