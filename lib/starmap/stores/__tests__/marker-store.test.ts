/**
 * @jest-environment jsdom
 */
import { useMarkerStore, MARKER_COLORS, MARKER_ICONS, type MarkerInput } from '../marker-store';

// Mock zustand persist
jest.mock('zustand/middleware', () => ({
  persist: (config: unknown) => config,
}));

describe('MARKER_COLORS', () => {
  it('is an array', () => {
    expect(Array.isArray(MARKER_COLORS)).toBe(true);
  });

  it('contains hex colors', () => {
    MARKER_COLORS.forEach((color) => {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  it('has at least 5 colors', () => {
    expect(MARKER_COLORS.length).toBeGreaterThanOrEqual(5);
  });
});

describe('MARKER_ICONS', () => {
  it('is an array', () => {
    expect(Array.isArray(MARKER_ICONS)).toBe(true);
  });

  it('contains star icon', () => {
    expect(MARKER_ICONS).toContain('star');
  });

  it('contains circle icon', () => {
    expect(MARKER_ICONS).toContain('circle');
  });

  it('contains crosshair icon', () => {
    expect(MARKER_ICONS).toContain('crosshair');
  });
});

describe('useMarkerStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useMarkerStore.setState({
      markers: [],
      groups: ['Default'],
      activeMarkerId: null,
      showMarkers: true,
      pendingCoords: null,
      editingMarkerId: null,
    });
  });

  describe('initial state', () => {
    it('has empty markers array', () => {
      expect(useMarkerStore.getState().markers).toEqual([]);
    });

    it('has Default group', () => {
      expect(useMarkerStore.getState().groups).toContain('Default');
    });

    it('has no active marker', () => {
      expect(useMarkerStore.getState().activeMarkerId).toBeNull();
    });

    it('shows markers by default', () => {
      expect(useMarkerStore.getState().showMarkers).toBe(true);
    });

    it('has no pending coords', () => {
      expect(useMarkerStore.getState().pendingCoords).toBeNull();
    });
  });

  describe('addMarker', () => {
    it('adds a marker and returns ID', () => {
      const marker: MarkerInput = {
        name: 'Test Marker',
        ra: 180,
        dec: 45,
        raString: '12:00:00',
        decString: '+45:00:00',
        color: '#ef4444',
        icon: 'star',
      };

      const id = useMarkerStore.getState().addMarker(marker);
      expect(id).toBeDefined();
      expect(id).toMatch(/^marker-/);

      const markers = useMarkerStore.getState().markers;
      expect(markers.length).toBe(1);
      expect(markers[0].name).toBe('Test Marker');
    });

    it('auto-generates timestamps', () => {
      const marker: MarkerInput = {
        name: 'Test',
        ra: 0,
        dec: 0,
        raString: '0:00:00',
        decString: '+00:00:00',
        color: '#ef4444',
        icon: 'star',
      };

      useMarkerStore.getState().addMarker(marker);
      const addedMarker = useMarkerStore.getState().markers[0];

      expect(addedMarker.createdAt).toBeDefined();
      expect(addedMarker.updatedAt).toBeDefined();
    });

    it('sets visible to true by default', () => {
      const marker: MarkerInput = {
        name: 'Test',
        ra: 0,
        dec: 0,
        raString: '0:00:00',
        decString: '+00:00:00',
        color: '#ef4444',
        icon: 'star',
      };

      useMarkerStore.getState().addMarker(marker);
      expect(useMarkerStore.getState().markers[0].visible).toBe(true);
    });
  });

  describe('removeMarker', () => {
    it('removes marker by ID', () => {
      const marker: MarkerInput = {
        name: 'Test',
        ra: 0,
        dec: 0,
        raString: '0:00:00',
        decString: '+00:00:00',
        color: '#ef4444',
        icon: 'star',
      };

      const id = useMarkerStore.getState().addMarker(marker);
      expect(useMarkerStore.getState().markers.length).toBe(1);

      useMarkerStore.getState().removeMarker(id);
      expect(useMarkerStore.getState().markers.length).toBe(0);
    });

    it('clears active marker if removed', () => {
      const marker: MarkerInput = {
        name: 'Test',
        ra: 0,
        dec: 0,
        raString: '0:00:00',
        decString: '+00:00:00',
        color: '#ef4444',
        icon: 'star',
      };

      const id = useMarkerStore.getState().addMarker(marker);
      useMarkerStore.getState().setActiveMarker(id);
      expect(useMarkerStore.getState().activeMarkerId).toBe(id);

      useMarkerStore.getState().removeMarker(id);
      expect(useMarkerStore.getState().activeMarkerId).toBeNull();
    });
  });

  describe('updateMarker', () => {
    it('updates marker properties', () => {
      const marker: MarkerInput = {
        name: 'Original',
        ra: 0,
        dec: 0,
        raString: '0:00:00',
        decString: '+00:00:00',
        color: '#ef4444',
        icon: 'star',
      };

      const id = useMarkerStore.getState().addMarker(marker);
      useMarkerStore.getState().updateMarker(id, { name: 'Updated' });

      expect(useMarkerStore.getState().markers[0].name).toBe('Updated');
    });
  });

  describe('setActiveMarker', () => {
    it('sets active marker', () => {
      const marker: MarkerInput = {
        name: 'Test',
        ra: 0,
        dec: 0,
        raString: '0:00:00',
        decString: '+00:00:00',
        color: '#ef4444',
        icon: 'star',
      };

      const id = useMarkerStore.getState().addMarker(marker);
      useMarkerStore.getState().setActiveMarker(id);

      expect(useMarkerStore.getState().activeMarkerId).toBe(id);
    });

    it('clears active marker', () => {
      useMarkerStore.getState().setActiveMarker('some-id');
      useMarkerStore.getState().setActiveMarker(null);

      expect(useMarkerStore.getState().activeMarkerId).toBeNull();
    });
  });

  describe('clearAllMarkers', () => {
    it('removes all markers', () => {
      const marker: MarkerInput = {
        name: 'Test',
        ra: 0,
        dec: 0,
        raString: '0:00:00',
        decString: '+00:00:00',
        color: '#ef4444',
        icon: 'star',
      };

      useMarkerStore.getState().addMarker(marker);
      useMarkerStore.getState().addMarker({ ...marker, name: 'Test 2' });
      expect(useMarkerStore.getState().markers.length).toBe(2);

      useMarkerStore.getState().clearAllMarkers();
      expect(useMarkerStore.getState().markers.length).toBe(0);
    });
  });

  describe('toggleMarkerVisibility', () => {
    it('toggles marker visibility', () => {
      const marker: MarkerInput = {
        name: 'Test',
        ra: 0,
        dec: 0,
        raString: '0:00:00',
        decString: '+00:00:00',
        color: '#ef4444',
        icon: 'star',
      };

      const id = useMarkerStore.getState().addMarker(marker);
      expect(useMarkerStore.getState().markers[0].visible).toBe(true);

      useMarkerStore.getState().toggleMarkerVisibility(id);
      expect(useMarkerStore.getState().markers[0].visible).toBe(false);

      useMarkerStore.getState().toggleMarkerVisibility(id);
      expect(useMarkerStore.getState().markers[0].visible).toBe(true);
    });
  });

  describe('setShowMarkers', () => {
    it('sets global marker visibility', () => {
      useMarkerStore.getState().setShowMarkers(false);
      expect(useMarkerStore.getState().showMarkers).toBe(false);

      useMarkerStore.getState().setShowMarkers(true);
      expect(useMarkerStore.getState().showMarkers).toBe(true);
    });
  });

  describe('addGroup', () => {
    it('adds a new group', () => {
      useMarkerStore.getState().addGroup('New Group');
      expect(useMarkerStore.getState().groups).toContain('New Group');
    });
  });

  describe('removeGroup', () => {
    it('removes a group', () => {
      useMarkerStore.getState().addGroup('To Remove');
      expect(useMarkerStore.getState().groups).toContain('To Remove');

      useMarkerStore.getState().removeGroup('To Remove');
      expect(useMarkerStore.getState().groups).not.toContain('To Remove');
    });
  });

  describe('getVisibleMarkers', () => {
    it('returns only visible markers', () => {
      const marker: MarkerInput = {
        name: 'Visible',
        ra: 0,
        dec: 0,
        raString: '0:00:00',
        decString: '+00:00:00',
        color: '#ef4444',
        icon: 'star',
      };

      const id1 = useMarkerStore.getState().addMarker(marker);
      useMarkerStore.getState().addMarker({ ...marker, name: 'Also Visible' });

      useMarkerStore.getState().toggleMarkerVisibility(id1);

      const visible = useMarkerStore.getState().getVisibleMarkers();
      expect(visible.length).toBe(1);
      expect(visible[0].name).toBe('Also Visible');
    });
  });
});
