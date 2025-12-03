'use client';

import { useMemo } from 'react';
import { useSettingsStore } from '@/lib/starmap/stores';
import { translateCelestialName, type SkyCultureLanguage } from '@/lib/starmap/translations';

/**
 * Hook to get the translated name for a celestial object
 * Uses the current sky culture language setting
 */
export function useCelestialName(name: string | undefined | null): string {
  const skyCultureLanguage = useSettingsStore(
    (state) => state.stellarium.skyCultureLanguage
  );

  return useMemo(() => {
    if (!name) return '';
    return translateCelestialName(name, skyCultureLanguage);
  }, [name, skyCultureLanguage]);
}

/**
 * Hook to get translated names for multiple celestial objects
 */
export function useCelestialNames(names: string[] | undefined | null): string[] {
  const skyCultureLanguage = useSettingsStore(
    (state) => state.stellarium.skyCultureLanguage
  );

  return useMemo(() => {
    if (!names || names.length === 0) return [];
    return names.map((name) => translateCelestialName(name, skyCultureLanguage));
  }, [names, skyCultureLanguage]);
}

/**
 * Hook to translate a name with fallback to original
 * Returns both translated and original name
 */
export function useCelestialNameWithOriginal(name: string | undefined | null): {
  translated: string;
  original: string;
  isTranslated: boolean;
} {
  const skyCultureLanguage = useSettingsStore(
    (state) => state.stellarium.skyCultureLanguage
  );

  return useMemo(() => {
    if (!name) return { translated: '', original: '', isTranslated: false };
    const translated = translateCelestialName(name, skyCultureLanguage);
    return {
      translated,
      original: name,
      isTranslated: translated !== name,
    };
  }, [name, skyCultureLanguage]);
}

/**
 * Get the current sky culture language setting
 */
export function useSkyCultureLanguage(): SkyCultureLanguage {
  return useSettingsStore((state) => state.stellarium.skyCultureLanguage);
}

/**
 * Utility function to translate celestial name (non-hook version)
 * Use this when you need to translate outside of React components
 */
export function getCelestialNameTranslation(
  name: string,
  language: SkyCultureLanguage
): string {
  return translateCelestialName(name, language);
}
