/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useObjectActions } from '../use-object-actions';
import type { SelectedObjectData } from '@/lib/core/types';

// Mock stores
const mockAddTarget = jest.fn();

jest.mock('@/lib/stores', () => ({
  useMountStore: jest.fn((selector) => {
    const state = {
      mountInfo: { Connected: false },
    };
    return selector(state);
  }),
  useTargetListStore: jest.fn((selector) => {
    const state = { addTarget: mockAddTarget };
    return selector(state);
  }),
}));

// Mock next-intl (jest.setup.ts provides global mock, but explicit for clarity)
jest.mock('next-intl', () => {
  const mockT = (key: string) => key;
  mockT.rich = (key: string) => key;
  mockT.raw = (key: string) => key;
  mockT.markup = (key: string) => key;
  return {
    useTranslations: () => mockT,
    useLocale: () => 'en',
  };
});

import { useMountStore } from '@/lib/stores';
const mockUseMountStore = useMountStore as unknown as jest.Mock;

const mockSelectedObject: SelectedObjectData = {
  names: ['M31', 'Andromeda Galaxy', 'NGC 224'],
  ra: '00h 42m 44.3s',
  dec: '+41° 16\' 09"',
  raDeg: 10.6847,
  decDeg: 41.2692,
  type: 'Galaxy',
  magnitude: 3.44,
  constellation: 'And',
};

describe('useObjectActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mount store to disconnected
    mockUseMountStore.mockImplementation((selector) => {
      const state = { mountInfo: { Connected: false } };
      return selector(state);
    });
  });

  describe('mountConnected', () => {
    it('returns false when mount is disconnected', () => {
      const { result } = renderHook(() =>
        useObjectActions({ selectedObject: mockSelectedObject })
      );
      expect(result.current.mountConnected).toBe(false);
    });

    it('returns true when mount is connected', () => {
      mockUseMountStore.mockImplementation((selector) => {
        const state = { mountInfo: { Connected: true } };
        return selector(state);
      });

      const { result } = renderHook(() =>
        useObjectActions({ selectedObject: mockSelectedObject })
      );
      expect(result.current.mountConnected).toBe(true);
    });
  });

  describe('handleSlew', () => {
    it('calls onSetFramingCoordinates with correct data', () => {
      const mockOnSetFramingCoordinates = jest.fn();
      const { result } = renderHook(() =>
        useObjectActions({
          selectedObject: mockSelectedObject,
          onSetFramingCoordinates: mockOnSetFramingCoordinates,
        })
      );

      act(() => {
        result.current.handleSlew();
      });

      expect(mockOnSetFramingCoordinates).toHaveBeenCalledWith({
        ra: 10.6847,
        dec: 41.2692,
        raString: '00h 42m 44.3s',
        decString: '+41° 16\' 09"',
        name: 'M31',
      });
    });

    it('calls onAfterSlew callback after slew', () => {
      const mockOnAfterSlew = jest.fn();
      const mockOnSetFramingCoordinates = jest.fn();
      const { result } = renderHook(() =>
        useObjectActions({
          selectedObject: mockSelectedObject,
          onSetFramingCoordinates: mockOnSetFramingCoordinates,
          onAfterSlew: mockOnAfterSlew,
        })
      );

      act(() => {
        result.current.handleSlew();
      });

      expect(mockOnSetFramingCoordinates).toHaveBeenCalled();
      expect(mockOnAfterSlew).toHaveBeenCalled();
    });

    it('does nothing when selectedObject is null', () => {
      const mockOnSetFramingCoordinates = jest.fn();
      const { result } = renderHook(() =>
        useObjectActions({
          selectedObject: null,
          onSetFramingCoordinates: mockOnSetFramingCoordinates,
        })
      );

      act(() => {
        result.current.handleSlew();
      });

      expect(mockOnSetFramingCoordinates).not.toHaveBeenCalled();
    });

    it('does not call onAfterSlew when selectedObject is null', () => {
      const mockOnAfterSlew = jest.fn();
      const { result } = renderHook(() =>
        useObjectActions({
          selectedObject: null,
          onAfterSlew: mockOnAfterSlew,
        })
      );

      act(() => {
        result.current.handleSlew();
      });

      expect(mockOnAfterSlew).not.toHaveBeenCalled();
    });

    it('handles missing onSetFramingCoordinates gracefully', () => {
      const { result } = renderHook(() =>
        useObjectActions({ selectedObject: mockSelectedObject })
      );

      expect(() => {
        act(() => {
          result.current.handleSlew();
        });
      }).not.toThrow();
    });
  });

  describe('handleAddToList', () => {
    it('calls addTarget with correct data', () => {
      const { result } = renderHook(() =>
        useObjectActions({ selectedObject: mockSelectedObject })
      );

      act(() => {
        result.current.handleAddToList();
      });

      expect(mockAddTarget).toHaveBeenCalledWith({
        name: 'M31',
        ra: 10.6847,
        dec: 41.2692,
        raString: '00h 42m 44.3s',
        decString: '+41° 16\' 09"',
        priority: 'medium',
      });
    });

    it('does nothing when selectedObject is null', () => {
      const { result } = renderHook(() =>
        useObjectActions({ selectedObject: null })
      );

      act(() => {
        result.current.handleAddToList();
      });

      expect(mockAddTarget).not.toHaveBeenCalled();
    });

    it('uses fallback name when names array has empty first element', () => {
      const objWithEmptyName: SelectedObjectData = {
        ...mockSelectedObject,
        names: [''],
      };

      const { result } = renderHook(() =>
        useObjectActions({ selectedObject: objWithEmptyName })
      );

      act(() => {
        result.current.handleAddToList();
      });

      // The mock t() returns the key string
      expect(mockAddTarget).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'common.unknown' })
      );
    });
  });

  describe('stability', () => {
    it('returns stable references when deps do not change', () => {
      const { result, rerender } = renderHook(() =>
        useObjectActions({ selectedObject: mockSelectedObject })
      );

      const firstSlew = result.current.handleSlew;
      const firstAdd = result.current.handleAddToList;

      rerender();

      expect(result.current.handleSlew).toBe(firstSlew);
      expect(result.current.handleAddToList).toBe(firstAdd);
    });
  });
});
