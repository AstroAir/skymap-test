/**
 * Tests for use-prefers-reduced-motion.ts
 * Reduced motion preference detection
 */

import { renderHook } from '@testing-library/react';
import { usePrefersReducedMotion } from '../use-prefers-reduced-motion';

describe('usePrefersReducedMotion', () => {
  it('should return a boolean', () => {
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(typeof result.current).toBe('boolean');
  });

  it('should return true in jsdom (matchMedia returns false for motion query)', () => {
    // jsdom matchMedia always returns matches:false, so !false = true
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });
});
