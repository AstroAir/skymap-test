/**
 * Tests for use-is-client.ts
 * SSR-safe client detection hook
 */

import { renderHook } from '@testing-library/react';
import { useIsClient } from '../use-is-client';

describe('useIsClient', () => {
  it('should return true on client side', () => {
    const { result } = renderHook(() => useIsClient());
    expect(result.current).toBe(true);
  });
});
