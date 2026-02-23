/**
 * Tests for use-carousel.ts
 * Circular carousel navigation hook
 */

import { renderHook, act } from '@testing-library/react';
import { useCarousel } from '../use-carousel';

const items = ['a', 'b', 'c', 'd'];

describe('useCarousel', () => {
  it('should start at initialIndex 0 by default', () => {
    const { result } = renderHook(() => useCarousel({ items }));
    expect(result.current.activeIndex).toBe(0);
    expect(result.current.activeItem).toBe('a');
  });

  it('should start at provided initialIndex', () => {
    const { result } = renderHook(() => useCarousel({ items, initialIndex: 2 }));
    expect(result.current.activeIndex).toBe(2);
    expect(result.current.activeItem).toBe('c');
  });

  it('should go to next item', () => {
    const { result } = renderHook(() => useCarousel({ items }));
    act(() => result.current.goToNext());
    expect(result.current.activeIndex).toBe(1);
    expect(result.current.activeItem).toBe('b');
  });

  it('should wrap around at end', () => {
    const { result } = renderHook(() => useCarousel({ items, initialIndex: 3 }));
    act(() => result.current.goToNext());
    expect(result.current.activeIndex).toBe(0);
    expect(result.current.activeItem).toBe('a');
  });

  it('should go to previous item', () => {
    const { result } = renderHook(() => useCarousel({ items, initialIndex: 2 }));
    act(() => result.current.goToPrev());
    expect(result.current.activeIndex).toBe(1);
    expect(result.current.activeItem).toBe('b');
  });

  it('should wrap around at beginning', () => {
    const { result } = renderHook(() => useCarousel({ items }));
    act(() => result.current.goToPrev());
    expect(result.current.activeIndex).toBe(3);
    expect(result.current.activeItem).toBe('d');
  });

  it('should go to specific index', () => {
    const { result } = renderHook(() => useCarousel({ items }));
    act(() => result.current.goTo(2));
    expect(result.current.activeIndex).toBe(2);
    expect(result.current.activeItem).toBe('c');
  });

  it('should ignore out-of-bounds goTo', () => {
    const { result } = renderHook(() => useCarousel({ items }));
    act(() => result.current.goTo(10));
    expect(result.current.activeIndex).toBe(0);
    act(() => result.current.goTo(-1));
    expect(result.current.activeIndex).toBe(0);
  });

  it('should handle empty items', () => {
    const { result } = renderHook(() => useCarousel({ items: [] }));
    expect(result.current.activeIndex).toBe(0);
    expect(result.current.activeItem).toBeUndefined();
  });
});
