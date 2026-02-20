/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';

// Mock logger
jest.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }),
}));

// ============================================================================
// Store mocks — configurable per test
// ============================================================================

let mockSkyEngine = 'stellarium';
let mockStel: Record<string, unknown> | null = null;
let mockAladin: Record<string, unknown> | null = null;
const mockSetViewDirection = jest.fn();

jest.mock('@/lib/stores', () => ({
  useStellariumStore: jest.fn((selector) => {
    const state = {
      stel: mockStel,
      aladin: mockAladin,
      setViewDirection: mockSetViewDirection,
    };
    return typeof selector === 'function' ? selector(state) : state;
  }),
}));

jest.mock('@/lib/stores/settings-store', () => ({
  useSettingsStore: jest.fn((selector) => {
    const state = { skyEngine: mockSkyEngine };
    return typeof selector === 'function' ? selector(state) : state;
  }),
}));

jest.mock('@/lib/astronomy/starmap-utils', () => ({
  rad2deg: (rad: number) => rad * (180 / Math.PI),
}));

// ============================================================================
// Tests
// ============================================================================

describe('useSelectTarget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSkyEngine = 'stellarium';
    mockStel = null;
    mockAladin = null;
  });

  it('exports the hook correctly', async () => {
    const { useSelectTarget } = await import('../use-select-target');
    expect(useSelectTarget).toBeDefined();
    expect(typeof useSelectTarget).toBe('function');
  });

  // ==========================================================================
  // Aladin engine path
  // ==========================================================================

  describe('Aladin engine', () => {
    beforeEach(() => {
      mockSkyEngine = 'aladin';
      mockStel = null;
    });

    it('navigates by coordinates via setViewDirection when RA/Dec available', async () => {
      const { useSelectTarget } = await import('../use-select-target');
      const onSelect = jest.fn();
      const addRecentSearch = jest.fn();

      const { result } = renderHook(() =>
        useSelectTarget({ onSelect, addRecentSearch })
      );

      await act(async () => {
        await result.current({
          Name: 'M31',
          RA: 10.684,
          Dec: 41.269,
          Type: 'DSO',
        });
      });

      expect(mockSetViewDirection).toHaveBeenCalledWith(10.684, 41.269);
      expect(addRecentSearch).toHaveBeenCalledWith('M31');
      expect(onSelect).toHaveBeenCalled();
    });

    it('uses aladin.gotoObject when no RA/Dec but name is available', async () => {
      const mockGotoObject = jest.fn();
      mockAladin = {
        gotoObject: mockGotoObject,
        adjustFovForObject: jest.fn(),
      };

      const { useSelectTarget } = await import('../use-select-target');
      const onSelect = jest.fn();

      const { result } = renderHook(() =>
        useSelectTarget({ onSelect })
      );

      await act(async () => {
        await result.current({
          Name: 'Sirius',
          Type: 'Star',
        });
      });

      expect(mockGotoObject).toHaveBeenCalledWith('Sirius', expect.objectContaining({
        success: expect.any(Function),
        error: expect.any(Function),
      }));
      expect(onSelect).toHaveBeenCalled();
    });

    it('does nothing when aladin is null and no coordinates', async () => {
      mockAladin = null;

      const { useSelectTarget } = await import('../use-select-target');
      const onSelect = jest.fn();

      const { result } = renderHook(() =>
        useSelectTarget({ onSelect })
      );

      await act(async () => {
        await result.current({
          Name: 'Unknown',
          Type: 'DSO',
        });
      });

      expect(mockSetViewDirection).not.toHaveBeenCalled();
      // Callbacks should still fire
      expect(onSelect).toHaveBeenCalled();
    });

    it('prefers coordinates over gotoObject when both available', async () => {
      const mockGotoObject = jest.fn();
      mockAladin = { gotoObject: mockGotoObject };

      const { useSelectTarget } = await import('../use-select-target');

      const { result } = renderHook(() => useSelectTarget());

      await act(async () => {
        await result.current({
          Name: 'M42',
          RA: 83.82,
          Dec: -5.39,
          Type: 'DSO',
        });
      });

      // Should use coordinates, NOT gotoObject
      expect(mockSetViewDirection).toHaveBeenCalledWith(83.82, -5.39);
      expect(mockGotoObject).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Stellarium engine path
  // ==========================================================================

  describe('Stellarium engine', () => {
    const createMockStel = () => ({
      core: {
        observer: { latitude: 40, longitude: -74, utc: 59000 },
        selection: null,
      },
      observer: { latitude: 40, longitude: -74 },
      D2R: Math.PI / 180,
      R2D: 180 / Math.PI,
      getObj: jest.fn(),
      createObj: jest.fn(() => ({
        pos: [0, 0, 0],
        update: jest.fn(),
      })),
      convertFrame: jest.fn(() => [0, 0, -1]),
      c2s: jest.fn(() => [0, 0]),
      s2c: jest.fn(() => [0, 0, 1]),
      anp: jest.fn((x: number) => x),
      anpm: jest.fn((x: number) => x),
      pointAndLock: jest.fn(),
    });

    beforeEach(() => {
      mockSkyEngine = 'stellarium';
    });

    it('does nothing when stel is null', async () => {
      mockStel = null;
      const { useSelectTarget } = await import('../use-select-target');
      const onSelect = jest.fn();

      const { result } = renderHook(() =>
        useSelectTarget({ onSelect })
      );

      await act(async () => {
        await result.current({
          Name: 'M31',
          RA: 10.684,
          Dec: 41.269,
          Type: 'DSO',
        });
      });

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('uses pointAndLock for StellariumObj items', async () => {
      const stel = createMockStel();
      mockStel = stel;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockObj = { id: 'planet_mars', designations: () => ['Mars'] } as any;

      const { useSelectTarget } = await import('../use-select-target');
      const onSelect = jest.fn();

      const { result } = renderHook(() =>
        useSelectTarget({ onSelect })
      );

      await act(async () => {
        await result.current({
          Name: 'Mars',
          Type: 'Planet',
          StellariumObj: mockObj,
        });
      });

      expect(stel.pointAndLock).toHaveBeenCalledWith(mockObj);
      expect(onSelect).toHaveBeenCalled();
    });

    it('creates circle object for coordinate-based items', async () => {
      const stel = createMockStel();
      mockStel = stel;

      const { useSelectTarget } = await import('../use-select-target');
      const onSelect = jest.fn();

      const { result } = renderHook(() =>
        useSelectTarget({ onSelect })
      );

      await act(async () => {
        await result.current({
          Name: 'M31',
          RA: 10.684,
          Dec: 41.269,
          Type: 'DSO',
        });
      });

      expect(stel.s2c).toHaveBeenCalled();
      expect(stel.convertFrame).toHaveBeenCalled();
      expect(stel.createObj).toHaveBeenCalledWith('circle', expect.any(Object));
      expect(stel.pointAndLock).toHaveBeenCalled();
      expect(onSelect).toHaveBeenCalled();
    });

    it('reuses the same target object across repeated coordinate jumps', async () => {
      const stel = createMockStel();
      mockStel = stel;

      const { useSelectTarget } = await import('../use-select-target');
      const { result } = renderHook(() => useSelectTarget());

      await act(async () => {
        await result.current({
          Name: 'M31',
          RA: 10.684,
          Dec: 41.269,
          Type: 'DSO',
        });
      });

      await act(async () => {
        await result.current({
          Name: 'M42',
          RA: 83.82,
          Dec: -5.39,
          Type: 'DSO',
        });
      });

      expect(stel.createObj).toHaveBeenCalledTimes(1);
      expect(stel.pointAndLock).toHaveBeenCalledTimes(2);
    });
  });
});
