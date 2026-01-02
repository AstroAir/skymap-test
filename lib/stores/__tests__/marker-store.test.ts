import { act, renderHook } from '@testing-library/react';
import { useMarkerStore, MARKER_COLORS, MARKER_ICONS, type MarkerInput } from '../marker-store';

// Mock Tauri platform check
jest.mock('@/lib/storage/platform', () => ({
  isTauri: jest.fn(() => false),
}));

// Mock markers API
jest.mock('@/lib/tauri/markers-api', () => ({
  markersApi: {
    addMarker: jest.fn().mockResolvedValue(undefined),
    removeMarker: jest.fn().mockResolvedValue(undefined),
    updateMarker: jest.fn().mockResolvedValue(undefined),
    removeMarkersByGroup: jest.fn().mockResolvedValue(undefined),
    clearAllMarkers: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock zustand storage
jest.mock('@/lib/storage', () => ({
  getZustandStorage: jest.fn(() => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  })),
}));

describe('useMarkerStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useMarkerStore());
    act(() => {
      result.current.clearAllMarkers();
    });
  });

  describe('initial state', () => {
    it('should have empty markers array initially', () => {
      const { result } = renderHook(() => useMarkerStore());
      expect(result.current.markers).toEqual([]);
    });

    it('should have default group', () => {
      const { result } = renderHook(() => useMarkerStore());
      expect(result.current.groups).toContain('Default');
    });

    it('should have showMarkers enabled by default', () => {
      const { result } = renderHook(() => useMarkerStore());
      expect(result.current.showMarkers).toBe(true);
    });

    it('should have no active marker', () => {
      const { result } = renderHook(() => useMarkerStore());
      expect(result.current.activeMarkerId).toBeNull();
    });
  });

  describe('addMarker', () => {
    it('should add a marker and return its id', () => {
      const { result } = renderHook(() => useMarkerStore());
      const markerInput: MarkerInput = {
        name: 'Test Marker',
        ra: 180,
        dec: 45,
        raString: '12h 00m 00s',
        decString: '+45° 00\' 00"',
        color: '#ef4444',
        icon: 'star',
      };

      let markerId: string;
      act(() => {
        markerId = result.current.addMarker(markerInput);
      });

      expect(markerId!).toBeDefined();
      expect(markerId!).toMatch(/^marker-/);
      expect(result.current.markers).toHaveLength(1);
      expect(result.current.markers[0].name).toBe('Test Marker');
    });

    it('should auto-add group if not exists', () => {
      const { result } = renderHook(() => useMarkerStore());
      const markerInput: MarkerInput = {
        name: 'Test Marker',
        ra: 180,
        dec: 45,
        raString: '12h 00m 00s',
        decString: '+45° 00\' 00"',
        color: '#ef4444',
        icon: 'star',
        group: 'NewGroup',
      };

      act(() => {
        result.current.addMarker(markerInput);
      });

      expect(result.current.groups).toContain('NewGroup');
    });
  });

  describe('removeMarker', () => {
    it('should remove a marker by id', () => {
      const { result } = renderHook(() => useMarkerStore());
      
      let markerId: string;
      act(() => {
        markerId = result.current.addMarker({
          name: 'Test Marker',
          ra: 180,
          dec: 45,
          raString: '12h 00m 00s',
          decString: '+45° 00\' 00"',
          color: '#ef4444',
          icon: 'star',
        });
      });

      expect(result.current.markers).toHaveLength(1);

      act(() => {
        result.current.removeMarker(markerId!);
      });

      expect(result.current.markers).toHaveLength(0);
    });

    it('should clear active marker if removed', () => {
      const { result } = renderHook(() => useMarkerStore());
      
      let markerId: string;
      act(() => {
        markerId = result.current.addMarker({
          name: 'Test Marker',
          ra: 180,
          dec: 45,
          raString: '12h 00m 00s',
          decString: '+45° 00\' 00"',
          color: '#ef4444',
          icon: 'star',
        });
        result.current.setActiveMarker(markerId);
      });

      expect(result.current.activeMarkerId).toBe(markerId!);

      act(() => {
        result.current.removeMarker(markerId!);
      });

      expect(result.current.activeMarkerId).toBeNull();
    });
  });

  describe('updateMarker', () => {
    it('should update marker properties', () => {
      const { result } = renderHook(() => useMarkerStore());
      
      let markerId: string;
      act(() => {
        markerId = result.current.addMarker({
          name: 'Test Marker',
          ra: 180,
          dec: 45,
          raString: '12h 00m 00s',
          decString: '+45° 00\' 00"',
          color: '#ef4444',
          icon: 'star',
        });
      });

      act(() => {
        result.current.updateMarker(markerId!, { name: 'Updated Marker' });
      });

      expect(result.current.markers[0].name).toBe('Updated Marker');
    });
  });

  describe('visibility', () => {
    it('should toggle marker visibility', () => {
      const { result } = renderHook(() => useMarkerStore());
      
      let markerId: string;
      act(() => {
        markerId = result.current.addMarker({
          name: 'Test Marker',
          ra: 180,
          dec: 45,
          raString: '12h 00m 00s',
          decString: '+45° 00\' 00"',
          color: '#ef4444',
          icon: 'star',
        });
      });

      expect(result.current.markers[0].visible).toBe(true);

      act(() => {
        result.current.toggleMarkerVisibility(markerId!);
      });

      expect(result.current.markers[0].visible).toBe(false);
    });

    it('should set show markers flag', () => {
      const { result } = renderHook(() => useMarkerStore());

      act(() => {
        result.current.setShowMarkers(false);
      });

      expect(result.current.showMarkers).toBe(false);
    });
  });

  describe('group management', () => {
    it('should add a new group', () => {
      const { result } = renderHook(() => useMarkerStore());

      act(() => {
        result.current.addGroup('Observation Targets');
      });

      expect(result.current.groups).toContain('Observation Targets');
    });

    it('should remove a group', () => {
      const { result } = renderHook(() => useMarkerStore());

      act(() => {
        result.current.addGroup('ToRemove');
      });

      expect(result.current.groups).toContain('ToRemove');

      act(() => {
        result.current.removeGroup('ToRemove');
      });

      expect(result.current.groups).not.toContain('ToRemove');
    });
  });

  describe('getters', () => {
    it('should get markers by group', () => {
      const { result } = renderHook(() => useMarkerStore());

      act(() => {
        result.current.addMarker({
          name: 'Marker 1',
          ra: 180,
          dec: 45,
          raString: '12h 00m 00s',
          decString: '+45° 00\' 00"',
          color: '#ef4444',
          icon: 'star',
          group: 'GroupA',
        });
        result.current.addMarker({
          name: 'Marker 2',
          ra: 90,
          dec: 30,
          raString: '06h 00m 00s',
          decString: '+30° 00\' 00"',
          color: '#3b82f6',
          icon: 'circle',
          group: 'GroupB',
        });
      });

      const groupAMarkers = result.current.getMarkersByGroup('GroupA');
      expect(groupAMarkers).toHaveLength(1);
      expect(groupAMarkers[0].name).toBe('Marker 1');
    });

    it('should get visible markers only', () => {
      const { result } = renderHook(() => useMarkerStore());

      act(() => {
        result.current.addMarker({
          name: 'Visible Marker',
          ra: 180,
          dec: 45,
          raString: '12h 00m 00s',
          decString: '+45° 00\' 00"',
          color: '#ef4444',
          icon: 'star',
        });
        result.current.addMarker({
          name: 'Hidden Marker',
          ra: 90,
          dec: 30,
          raString: '06h 00m 00s',
          decString: '+30° 00\' 00"',
          color: '#3b82f6',
          icon: 'circle',
          visible: false,
        });
      });

      const visibleMarkers = result.current.markers.filter(m => m.visible);
      expect(visibleMarkers).toHaveLength(1);
      expect(visibleMarkers[0].name).toBe('Visible Marker');
    });
  });
});

describe('MARKER_COLORS', () => {
  it('should have 9 colors', () => {
    expect(MARKER_COLORS).toHaveLength(9);
  });

  it('should all be valid hex colors', () => {
    MARKER_COLORS.forEach((color) => {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});

describe('MARKER_ICONS', () => {
  it('should have 8 icons', () => {
    expect(MARKER_ICONS).toHaveLength(8);
  });

  it('should include common icon types', () => {
    expect(MARKER_ICONS).toContain('star');
    expect(MARKER_ICONS).toContain('circle');
    expect(MARKER_ICONS).toContain('crosshair');
    expect(MARKER_ICONS).toContain('pin');
  });
});
