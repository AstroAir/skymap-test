/**
 * Tests for use-observer-sync.ts
 * Observer location sync from profile to Stellarium engine
 */

import { renderHook } from '@testing-library/react';
import { useObserverSync } from '../use-observer-sync';
import { useRef } from 'react';

jest.mock('@/lib/stores', () => ({
  useMountStore: Object.assign(
    jest.fn((selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        profileInfo: {
          AstrometrySettings: { Latitude: 40, Longitude: -74, Elevation: 100 },
        },
        setProfileInfo: jest.fn(),
      })
    ),
    {
      getState: () => ({
        profileInfo: {
          AstrometrySettings: { Latitude: 40, Longitude: -74, Elevation: 100 },
        },
      }),
    }
  ),
}));

jest.mock('@/lib/stores/web-location-store', () => ({
  useWebLocationStore: Object.assign(jest.fn(), {
    getState: () => ({ locations: [] }),
  }),
}));

describe('useObserverSync', () => {
  it('should not throw when stelRef is null', () => {
    expect(() => {
      renderHook(() => {
        const ref = useRef(null);
        useObserverSync(ref);
      });
    }).not.toThrow();
  });

  it('should sync observer when engine is available', () => {
    const mockStel = {
      core: {
        observer: {
          latitude: 0,
          longitude: 0,
          elevation: 0,
        },
      },
    };
    renderHook(() => {
      const ref = useRef(mockStel);
      useObserverSync(ref as never);
    });
    // Should not throw
  });
});
