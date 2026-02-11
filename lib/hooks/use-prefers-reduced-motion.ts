'use client';

import { useState, useEffect } from 'react';

const QUERY = '(prefers-reduced-motion: no-preference)';

function getInitialState(): boolean {
  if (typeof window === 'undefined') return false;
  return !window.matchMedia(QUERY).matches;
}

/**
 * Hook to detect if the user prefers reduced motion.
 * Returns true if the user has enabled "Reduce motion" in their OS settings.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(getInitialState);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(QUERY);

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(!event.matches);
    };

    mediaQueryList.addEventListener('change', listener);
    return () => {
      mediaQueryList.removeEventListener('change', listener);
    };
  }, []);

  return prefersReducedMotion;
}
