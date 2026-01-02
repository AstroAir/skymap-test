import { act, renderHook } from '@testing-library/react';
import { useStellariumStore } from '../stellarium-store';
import type { StellariumSettings } from '@/lib/core/types';

// Mock translations
jest.mock('@/lib/translations', () => ({
  updateStellariumTranslation: jest.fn(),
}));

// Mock core constants
jest.mock('@/lib/core/constants', () => ({
  SKY_SURVEYS: [],
}));

// Helper to create mock settings
const createMockSettings = (overrides?: Partial<StellariumSettings>): StellariumSettings => ({
  constellationsLinesVisible: true,
  constellationArtVisible: false,
  azimuthalLinesVisible: true,
  equatorialLinesVisible: true,
  meridianLinesVisible: false,
  eclipticLinesVisible: true,
  atmosphereVisible: true,
  dsosVisible: true,
  landscapesVisible: true,
  skyCultureLanguage: 'en',
  surveyEnabled: true,
  surveyId: 'DSS',
  nightMode: false,
  sensorControl: false,
  ...overrides,
});

describe('useStellariumStore', () => {
  beforeEach(() => {
    // Reset store state
    const { result } = renderHook(() => useStellariumStore());
    act(() => {
      result.current.setStel(null);
      result.current.setBaseUrl('');
      result.current.setSearch({
        RAangle: 0,
        DECangle: 0,
        RAangleString: '',
        DECangleString: '',
      });
    });
  });

  describe('initial state', () => {
    it('should have null stel initially', () => {
      const { result } = renderHook(() => useStellariumStore());
      expect(result.current.stel).toBeNull();
    });

    it('should have empty baseUrl initially', () => {
      const { result } = renderHook(() => useStellariumStore());
      expect(result.current.baseUrl).toBe('');
    });

    it('should have default search state', () => {
      const { result } = renderHook(() => useStellariumStore());
      expect(result.current.search).toEqual({
        RAangle: 0,
        DECangle: 0,
        RAangleString: '',
        DECangleString: '',
      });
    });

    it('should have null helper functions initially', () => {
      const { result } = renderHook(() => useStellariumStore());
      expect(result.current.getCurrentViewDirection).toBeNull();
      expect(result.current.setViewDirection).toBeNull();
    });
  });

  describe('setStel', () => {
    it('should set stellarium engine instance', () => {
      const { result } = renderHook(() => useStellariumStore());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockStel = { core: {} } as any;

      act(() => {
        result.current.setStel(mockStel);
      });

      expect(result.current.stel).toBe(mockStel);
    });

    it('should set stel to null', () => {
      const { result } = renderHook(() => useStellariumStore());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockStel = { core: {} } as any;

      act(() => {
        result.current.setStel(mockStel);
      });

      expect(result.current.stel).toBe(mockStel);

      act(() => {
        result.current.setStel(null);
      });

      expect(result.current.stel).toBeNull();
    });
  });

  describe('setBaseUrl', () => {
    it('should set base URL', () => {
      const { result } = renderHook(() => useStellariumStore());

      act(() => {
        result.current.setBaseUrl('https://example.com/');
      });

      expect(result.current.baseUrl).toBe('https://example.com/');
    });
  });

  describe('setSearch', () => {
    it('should update search state partially', () => {
      const { result } = renderHook(() => useStellariumStore());

      act(() => {
        result.current.setSearch({ RAangle: 180 });
      });

      expect(result.current.search.RAangle).toBe(180);
      expect(result.current.search.DECangle).toBe(0); // Should remain unchanged
    });

    it('should update multiple search properties', () => {
      const { result } = renderHook(() => useStellariumStore());

      act(() => {
        result.current.setSearch({
          RAangle: 180,
          DECangle: 45,
          RAangleString: '12h 00m 00s',
          DECangleString: '+45° 00\' 00"',
        });
      });

      expect(result.current.search).toEqual({
        RAangle: 180,
        DECangle: 45,
        RAangleString: '12h 00m 00s',
        DECangleString: '+45° 00\' 00"',
      });
    });
  });

  describe('setHelpers', () => {
    it('should set helper functions', () => {
      const { result } = renderHook(() => useStellariumStore());
      const mockGetViewDir = jest.fn(() => ({ ra: 0, dec: 0, alt: 0, az: 0 }));
      const mockSetViewDir = jest.fn();

      act(() => {
        result.current.setHelpers({
          getCurrentViewDirection: mockGetViewDir,
          setViewDirection: mockSetViewDir,
        });
      });

      expect(result.current.getCurrentViewDirection).toBe(mockGetViewDir);
      expect(result.current.setViewDirection).toBe(mockSetViewDir);
    });

    it('should preserve existing helpers when setting only one', () => {
      const { result } = renderHook(() => useStellariumStore());
      const mockGetViewDir = jest.fn(() => ({ ra: 0, dec: 0, alt: 0, az: 0 }));
      const mockSetViewDir = jest.fn();

      act(() => {
        result.current.setHelpers({
          getCurrentViewDirection: mockGetViewDir,
          setViewDirection: mockSetViewDir,
        });
      });

      const newMockGetViewDir = jest.fn(() => ({ ra: 90, dec: 45, alt: 30, az: 180 }));

      act(() => {
        result.current.setHelpers({
          getCurrentViewDirection: newMockGetViewDir,
        });
      });

      expect(result.current.getCurrentViewDirection).toBe(newMockGetViewDir);
      expect(result.current.setViewDirection).toBe(mockSetViewDir); // Should remain unchanged
    });
  });

  describe('updateStellariumCore', () => {
    it('should warn if stel is not ready', () => {
      const { result } = renderHook(() => useStellariumStore());
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      act(() => {
        result.current.updateStellariumCore(createMockSettings());
      });

      expect(consoleSpy).toHaveBeenCalledWith('Stellarium engine not ready, settings update skipped');
      consoleSpy.mockRestore();
    });

    it('should update stellarium core settings when stel is available', () => {
      const { result } = renderHook(() => useStellariumStore());
      
      const mockCore = {
        constellations: {
          lines_visible: false,
          labels_visible: false,
        },
        lines: {
          azimuthal: { visible: false },
          equatorial: { visible: false },
          meridian: { visible: false },
          ecliptic: { visible: false },
        },
        atmosphere: { visible: false },
        dsos: { visible: false },
        landscapes: {
          addDataSource: jest.fn(),
          setCurrentLandscape: jest.fn(),
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockStel = { core: mockCore } as any;

      act(() => {
        result.current.setStel(mockStel);
        result.current.setBaseUrl('https://example.com/');
      });

      act(() => {
        result.current.updateStellariumCore(createMockSettings());
      });

      expect(mockCore.constellations.lines_visible).toBe(true);
      expect(mockCore.lines.azimuthal.visible).toBe(true);
      expect(mockCore.atmosphere.visible).toBe(true);
      expect(mockCore.dsos.visible).toBe(true);
    });
  });
});
