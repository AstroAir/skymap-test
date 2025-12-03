/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import { useTargetPlanner } from '../use-target-planner';

// Mock stores
jest.mock('@/lib/starmap/stores/target-list-store', () => ({
  useTargetListStore: jest.fn((selector) =>
    selector({
      targets: [
        {
          id: 'target-1',
          name: 'M31',
          ra: 10.68,
          dec: 41.27,
          raString: '00:42:44',
          decString: '+41:16:09',
          priority: 'high',
          status: 'planned',
          tags: [],
          isFavorite: false,
          isArchived: false,
          addedAt: Date.now(),
        },
      ],
      updateObservableWindow: jest.fn(),
    })
  ),
}));

jest.mock('@/lib/starmap/stores', () => ({
  useMountStore: jest.fn((selector) =>
    selector({
      profileInfo: {
        AstrometrySettings: {
          Latitude: 40.7128,
          Longitude: -74.006,
          Elevation: 10,
        },
      },
    })
  ),
}));

// Mock sky-atlas
jest.mock('@/lib/starmap/sky-atlas', () => ({
  calculateNighttimeData: jest.fn(() => ({
    date: new Date(),
    referenceDate: new Date(),
    sunRiseAndSet: { rise: new Date(), set: new Date() },
    twilightRiseAndSet: { rise: new Date(), set: new Date() },
    moonRiseAndSet: { rise: new Date(), set: new Date() },
    moonPhase: 'waxingGibbous',
    moonPhaseValue: 0.45,
    moonIllumination: 97,
  })),
  calculateAltitudeData: jest.fn(() => ({
    objectId: '',
    points: [],
    maxAltitude: 60,
    maxAltitudeTime: new Date(),
    transitTime: new Date(),
    riseTime: new Date(),
    setTime: new Date(),
  })),
  calculateMoonDistance: jest.fn(() => 45),
}));

describe('useTargetPlanner', () => {
  it('returns target visibilities data', () => {
    const { result } = renderHook(() => useTargetPlanner());

    expect(result.current.targetVisibilities).toBeDefined();
    expect(Array.isArray(result.current.targetVisibilities)).toBe(true);
  });

  it('returns nighttime data', () => {
    const { result } = renderHook(() => useTargetPlanner());

    expect(result.current.nighttimeData).toBeDefined();
  });

  it('returns session plan', () => {
    const { result } = renderHook(() => useTargetPlanner());

    expect(result.current.sessionPlan).toBeDefined();
  });

  it('provides location data', () => {
    const { result } = renderHook(() => useTargetPlanner());

    expect(result.current.location).toBeDefined();
    expect(result.current.location.latitude).toBeDefined();
    expect(result.current.location.longitude).toBeDefined();
  });

  it('provides getSortedByAltitude function', () => {
    const { result } = renderHook(() => useTargetPlanner());

    expect(typeof result.current.getSortedByAltitude).toBe('function');
    expect(Array.isArray(result.current.getSortedByAltitude())).toBe(true);
  });

  it('provides getSortedByTransit function', () => {
    const { result } = renderHook(() => useTargetPlanner());

    expect(typeof result.current.getSortedByTransit).toBe('function');
    expect(Array.isArray(result.current.getSortedByTransit())).toBe(true);
  });

  it('provides getSortedByScore function', () => {
    const { result } = renderHook(() => useTargetPlanner());

    expect(typeof result.current.getSortedByScore).toBe('function');
    expect(Array.isArray(result.current.getSortedByScore())).toBe(true);
  });

  it('provides updateAllVisibility function', () => {
    const { result } = renderHook(() => useTargetPlanner());

    expect(typeof result.current.updateAllVisibility).toBe('function');
  });
});
