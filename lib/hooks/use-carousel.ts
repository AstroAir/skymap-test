/**
 * Generic circular carousel navigation hook
 * Provides state management for cycling through a list of items
 */

import { useState, useCallback } from 'react';

export interface UseCarouselOptions<T> {
  items: readonly T[];
  initialIndex?: number;
  getKey?: (item: T) => string;
}

export interface UseCarouselReturn<T> {
  activeIndex: number;
  activeItem: T;
  goToNext: () => void;
  goToPrev: () => void;
  goTo: (index: number) => void;
}

export function useCarousel<T>({
  items,
  initialIndex = 0,
}: UseCarouselOptions<T>): UseCarouselReturn<T> {
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const goToNext = useCallback(() => {
    if (items.length === 0) return;
    setActiveIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const goToPrev = useCallback(() => {
    if (items.length === 0) return;
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  const goTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < items.length) {
        setActiveIndex(index);
      }
    },
    [items.length]
  );

  const safeIndex = items.length > 0 ? Math.min(activeIndex, items.length - 1) : 0;

  return {
    activeIndex: safeIndex,
    activeItem: items[safeIndex],
    goToNext,
    goToPrev,
    goTo,
  };
}
