/**
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useTonightRecommendations } from '../use-tonight-recommendations';

// Mock stellarium store
jest.mock('@/lib/stores', () => ({
  useStellariumStore: jest.fn((selector) => {
    const state = {
      stel: {
        core: {
          observer: {
            latitude: 40.7128,
            longitude: -74.006,
          },
        },
      },
    };
    return typeof selector === 'function' ? selector(state) : state;
  }),
}));

// Mock equipment store — default: no equipment (fallback scoring)
let mockEquipment = {
  focalLength: 0,
  aperture: 0,
  sensorWidth: 0,
  sensorHeight: 0,
  pixelSize: 0,
  exposureDefaults: { bortle: 5 },
};

jest.mock('@/lib/stores/equipment-store', () => ({
  useEquipmentStore: jest.fn((selector) => {
    return typeof selector === 'function' ? selector(mockEquipment) : mockEquipment;
  }),
}));

// Mock settings store
jest.mock('@/lib/stores/settings-store', () => ({
  useSettingsStore: jest.fn((selector) => {
    const state = { stellarium: { bortleIndex: 4 }, search: { enableFuzzySearch: true } };
    return typeof selector === 'function' ? selector(state) : state;
  }),
}));

describe('useTonightRecommendations', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Reset to no-equipment defaults
    mockEquipment = {
      focalLength: 0,
      aperture: 0,
      sensorWidth: 0,
      sensorHeight: 0,
      pixelSize: 0,
      exposureDefaults: { bortle: 5 },
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initial state', () => {
    it('should return initial loading state', () => {
      const { result } = renderHook(() => useTonightRecommendations());

      expect(result.current.recommendations).toBeDefined();
      expect(result.current.conditions).toBeNull();
      expect(typeof result.current.isLoading).toBe('boolean');
      expect(typeof result.current.refresh).toBe('function');
      expect(result.current.planDate).toBeInstanceOf(Date);
      expect(typeof result.current.setPlanDate).toBe('function');
    });
  });

  describe('standard scoring (no equipment)', () => {
    it('should calculate recommendations after mount', async () => {
      const { result } = renderHook(() => useTonightRecommendations());

      // Trigger the setTimeout from useEffect
      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.recommendations.length).toBeGreaterThan(0);
      expect(result.current.conditions).not.toBeNull();
    });

    it('should produce recommendations with required fields', async () => {
      const { result } = renderHook(() => useTonightRecommendations());

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.recommendations.length).toBeGreaterThan(0);
      });

      const rec = result.current.recommendations[0];
      expect(rec.Name).toBeDefined();
      expect(rec.Type).toBe('DSO');
      expect(typeof rec.RA).toBe('number');
      expect(typeof rec.Dec).toBe('number');
      expect(typeof rec.score).toBe('number');
      expect(typeof rec.maxAltitude).toBe('number');
      expect(typeof rec.moonDistance).toBe('number');
      expect(typeof rec.imagingHours).toBe('number');
      expect(Array.isArray(rec.reasons)).toBe(true);
      expect(Array.isArray(rec.warnings)).toBe(true);
    });

    it('should populate conditions with moon and twilight data', async () => {
      const { result } = renderHook(() => useTonightRecommendations());

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.conditions).not.toBeNull();
      });

      const cond = result.current.conditions!;
      expect(typeof cond.moonPhase).toBe('number');
      expect(typeof cond.moonIllumination).toBe('number');
      expect(typeof cond.moonPhaseName).toBe('string');
      expect(typeof cond.totalDarkHours).toBe('number');
      expect(typeof cond.latitude).toBe('number');
      expect(typeof cond.longitude).toBe('number');
      expect(cond.twilight).toBeDefined();
    });

    it('should include enhanced scoring data in standard mode', async () => {
      const { result } = renderHook(() => useTonightRecommendations());

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.recommendations.length).toBeGreaterThan(0);
      });

      const rec = result.current.recommendations[0];
      // Standard scoring should include comprehensive score breakdown
      expect(rec.airmass).toBeDefined();
      expect(typeof rec.airmass).toBe('number');
      expect(rec.airmassQuality).toBeDefined();
      expect(rec.scoreBreakdown).toBeDefined();
      expect(rec.qualityRating).toBeDefined();
      expect(typeof rec.seasonalOptimal).toBe('boolean');
      expect(typeof rec.transitDuringDark).toBe('boolean');
    });

    it('should sort recommendations by score descending', async () => {
      const { result } = renderHook(() => useTonightRecommendations());

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.recommendations.length).toBeGreaterThan(1);
      });

      const scores = result.current.recommendations.map(r => r.score);
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
      }
    });

    it('should limit recommendations to 25', async () => {
      const { result } = renderHook(() => useTonightRecommendations());

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.recommendations.length).toBeGreaterThan(0);
      });

      expect(result.current.recommendations.length).toBeLessThanOrEqual(25);
    });
  });

  describe('equipment-aware scoring (AdvancedRecommendationEngine)', () => {
    beforeEach(() => {
      mockEquipment = {
        focalLength: 600,
        aperture: 80,
        sensorWidth: 23.5,
        sensorHeight: 15.6,
        pixelSize: 3.76,
        exposureDefaults: { bortle: 4 },
      };
    });

    it('should use advanced engine when equipment data is available', async () => {
      const { result } = renderHook(() => useTonightRecommendations());

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.recommendations.length).toBeGreaterThan(0);
    });

    it('should produce recommendations with equipment-specific fields', async () => {
      const { result } = renderHook(() => useTonightRecommendations());

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.recommendations.length).toBeGreaterThan(0);
      });

      const rec = result.current.recommendations[0];
      expect(rec.Name).toBeDefined();
      expect(rec.Type).toBe('DSO');
      expect(typeof rec.score).toBe('number');
      expect(rec.score).toBeGreaterThanOrEqual(0);
      expect(rec.score).toBeLessThanOrEqual(100);
      expect(typeof rec.moonDistance).toBe('number');
      expect(typeof rec.imagingHours).toBe('number');
    });

    it('should include scoreBreakdown with advanced engine', async () => {
      const { result } = renderHook(() => useTonightRecommendations());

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.recommendations.length).toBeGreaterThan(0);
      });

      const rec = result.current.recommendations[0];
      expect(rec.scoreBreakdown).toBeDefined();
      if (rec.scoreBreakdown) {
        expect(typeof rec.scoreBreakdown.altitudeScore).toBe('number');
        expect(typeof rec.scoreBreakdown.airmassScore).toBe('number');
        expect(typeof rec.scoreBreakdown.moonScore).toBe('number');
        expect(typeof rec.scoreBreakdown.brightnessScore).toBe('number');
        expect(typeof rec.scoreBreakdown.seasonalScore).toBe('number');
        expect(typeof rec.scoreBreakdown.transitScore).toBe('number');
      }
    });

    it('should include FOV fit reasons/warnings', async () => {
      const { result } = renderHook(() => useTonightRecommendations());

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.recommendations.length).toBeGreaterThan(0);
      });

      // At least some recommendations should have FOV-related i18n keys
      const allReasons = result.current.recommendations.flatMap(r => r.reasons);
      const allWarnings = result.current.recommendations.flatMap(r => r.warnings);
      const allMessages = [...allReasons, ...allWarnings];

      const hasFovMessage = allMessages.some(
        m => m.key === 'tonightRec.goodFovFit' || m.key === 'tonightRec.tooLargeForFov'
      );
      // FOV messages should appear for at least some targets
      expect(hasFovMessage).toBe(true);
    });
  });

  describe('refresh', () => {
    it('should recalculate recommendations on refresh', async () => {
      const { result } = renderHook(() => useTonightRecommendations());

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const firstResults = [...result.current.recommendations];

      act(() => {
        result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // After refresh, should still have recommendations
      expect(result.current.recommendations.length).toBeGreaterThan(0);
      // Same location/date → same results
      expect(result.current.recommendations.length).toBe(firstResults.length);
    });
  });

  describe('planDate', () => {
    it('should allow setting a custom plan date', async () => {
      const { result } = renderHook(() => useTonightRecommendations());

      const newDate = new Date('2025-06-15T00:00:00');
      act(() => {
        result.current.setPlanDate(newDate);
      });

      expect(result.current.planDate.getTime()).toBe(newDate.getTime());
    });
  });
});
