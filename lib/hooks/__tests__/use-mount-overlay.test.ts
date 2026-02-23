/**
 * Tests for use-mount-overlay.ts
 * Mount position overlay management
 */

import { renderHook } from '@testing-library/react';
import { useMountOverlay } from '../use-mount-overlay';

jest.mock('@/lib/stores', () => ({
  useStellariumStore: jest.fn((selector) =>
    selector({ stel: null })
  ),
  useMountStore: jest.fn((selector) =>
    selector({
      mountInfo: {
        Connected: false,
        Coordinates: { RA: 0, Dec: 0 },
        Tracking: false,
        Slewing: false,
        Parked: false,
        PierSide: undefined,
      },
      profileInfo: {
        AstrometrySettings: { Latitude: 40, Longitude: -74, Elevation: 0 },
      },
    })
  ),
}));

describe('useMountOverlay', () => {
  it('should return disconnected state when mount is not connected', () => {
    const { result } = renderHook(() => useMountOverlay());
    expect(result.current.connected).toBe(false);
    expect(result.current.tracking).toBe(false);
    expect(result.current.slewing).toBe(false);
    expect(result.current.parked).toBe(false);
  });

  it('should provide toggle and sync functions', () => {
    const { result } = renderHook(() => useMountOverlay());
    expect(typeof result.current.toggleAutoSync).toBe('function');
    expect(typeof result.current.syncViewToMount).toBe('function');
  });
});
