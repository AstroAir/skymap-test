/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useTonightRecommendations } from '../use-tonight-recommendations';

// Mock stores
jest.mock('@/lib/starmap/stores', () => ({
  useStellariumStore: jest.fn((selector) =>
    selector({
      stel: null,
    })
  ),
}));

// Mock sky-atlas
jest.mock('@/lib/starmap/sky-atlas', () => ({
  calculateNighttimeData: jest.fn(() => ({
    date: new Date(),
    referenceDate: new Date(),
    sunRiseAndSet: { rise: new Date(), set: new Date() },
    civilTwilightRiseAndSet: { rise: new Date(), set: new Date() },
    nauticalTwilightRiseAndSet: { rise: new Date(), set: new Date() },
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
  enrichDeepSkyObject: jest.fn((dso) => dso),
  DSO_CATALOG: [
    {
      id: 'M31',
      name: 'Andromeda Galaxy',
      type: 'Galaxy',
      constellation: 'Andromeda',
      ra: 10.68,
      dec: 41.27,
      magnitude: 3.4,
    },
  ],
  MOON_PHASE_NAMES: {
    new: 'New Moon',
    waxingCrescent: 'Waxing Crescent',
    firstQuarter: 'First Quarter',
    waxingGibbous: 'Waxing Gibbous',
    full: 'Full Moon',
    waningGibbous: 'Waning Gibbous',
    lastQuarter: 'Last Quarter',
    waningCrescent: 'Waning Crescent',
  },
}));

describe('useTonightRecommendations', () => {
  it('returns recommendations', () => {
    const { result } = renderHook(() => useTonightRecommendations());

    expect(result.current.recommendations).toBeDefined();
    expect(Array.isArray(result.current.recommendations)).toBe(true);
  });

  it('returns tonight conditions', () => {
    const { result } = renderHook(() => useTonightRecommendations());

    // conditions may be null initially
    expect(result.current.conditions === null || typeof result.current.conditions === 'object').toBe(true);
  });

  it('returns loading state', () => {
    const { result } = renderHook(() => useTonightRecommendations());

    expect(typeof result.current.isLoading).toBe('boolean');
  });

  it('provides refresh function', () => {
    const { result } = renderHook(() => useTonightRecommendations());

    expect(typeof result.current.refresh).toBe('function');
  });

  it('can refresh recommendations', async () => {
    const { result } = renderHook(() => useTonightRecommendations());

    await act(async () => {
      result.current.refresh();
    });

    // Should not throw
    expect(result.current.recommendations).toBeDefined();
  });
});
