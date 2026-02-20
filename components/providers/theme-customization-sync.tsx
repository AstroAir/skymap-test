'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useThemeStore } from '@/lib/stores/theme-store';

export function ThemeCustomizationSyncProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const applyCustomization = useThemeStore((state) => state.applyCustomization);

  useEffect(() => {
    applyCustomization();
  }, [resolvedTheme, applyCustomization]);

  return <>{children}</>;
}
