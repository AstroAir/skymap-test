'use client';

import { useCelestialName } from '@/lib/starmap/hooks';

interface TranslatedNameProps {
  name: string;
  className?: string;
}

/**
 * Component that displays a translated celestial object name
 * Uses the current sky culture language setting
 */
export function TranslatedName({ name, className }: TranslatedNameProps) {
  const translatedName = useCelestialName(name);
  return <span className={className}>{translatedName || name}</span>;
}
