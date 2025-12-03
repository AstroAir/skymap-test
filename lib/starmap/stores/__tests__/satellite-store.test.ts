/**
 * @jest-environment jsdom
 */
import { useSatelliteStore, type TrackedSatellite } from '../satellite-store';

// Mock zustand persist
jest.mock('zustand/middleware', () => ({
  persist: (config: unknown) => config,
}));

const createMockSatellite = (overrides?: Partial<TrackedSatellite>): TrackedSatellite => ({
  id: 'sat-1',
  name: 'ISS',
  noradId: 25544,
  type: 'iss',
  altitude: 420,
  velocity: 7.66,
  inclination: 51.6,
  period: 92.9,
  ra: 180,
  dec: 45,
  isVisible: true,
  ...overrides,
});

describe('useSatelliteStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useSatelliteStore.setState({
      showSatellites: false,
      showLabels: true,
      showOrbits: false,
      trackedSatellites: [],
      selectedSatelliteId: null,
    });
  });

  describe('initial state', () => {
    it('has satellites hidden by default', () => {
      expect(useSatelliteStore.getState().showSatellites).toBe(false);
    });

    it('has labels shown by default', () => {
      expect(useSatelliteStore.getState().showLabels).toBe(true);
    });

    it('has orbits hidden by default', () => {
      expect(useSatelliteStore.getState().showOrbits).toBe(false);
    });

    it('has empty tracked satellites', () => {
      expect(useSatelliteStore.getState().trackedSatellites).toEqual([]);
    });

    it('has no selected satellite', () => {
      expect(useSatelliteStore.getState().selectedSatelliteId).toBeNull();
    });
  });

  describe('setShowSatellites', () => {
    it('shows satellites', () => {
      useSatelliteStore.getState().setShowSatellites(true);
      expect(useSatelliteStore.getState().showSatellites).toBe(true);
    });

    it('hides satellites', () => {
      useSatelliteStore.getState().setShowSatellites(true);
      useSatelliteStore.getState().setShowSatellites(false);
      expect(useSatelliteStore.getState().showSatellites).toBe(false);
    });
  });

  describe('setShowLabels', () => {
    it('toggles label visibility', () => {
      useSatelliteStore.getState().setShowLabels(false);
      expect(useSatelliteStore.getState().showLabels).toBe(false);

      useSatelliteStore.getState().setShowLabels(true);
      expect(useSatelliteStore.getState().showLabels).toBe(true);
    });
  });

  describe('setShowOrbits', () => {
    it('toggles orbit visibility', () => {
      useSatelliteStore.getState().setShowOrbits(true);
      expect(useSatelliteStore.getState().showOrbits).toBe(true);

      useSatelliteStore.getState().setShowOrbits(false);
      expect(useSatelliteStore.getState().showOrbits).toBe(false);
    });
  });

  describe('addTrackedSatellite', () => {
    it('adds a satellite', () => {
      const satellite = createMockSatellite();
      useSatelliteStore.getState().addTrackedSatellite(satellite);

      expect(useSatelliteStore.getState().trackedSatellites.length).toBe(1);
      expect(useSatelliteStore.getState().trackedSatellites[0].name).toBe('ISS');
    });

    it('updates existing satellite with same ID', () => {
      const satellite = createMockSatellite();
      useSatelliteStore.getState().addTrackedSatellite(satellite);

      const updated = createMockSatellite({ altitude: 430 });
      useSatelliteStore.getState().addTrackedSatellite(updated);

      expect(useSatelliteStore.getState().trackedSatellites.length).toBe(1);
      expect(useSatelliteStore.getState().trackedSatellites[0].altitude).toBe(430);
    });
  });

  describe('removeTrackedSatellite', () => {
    it('removes satellite by ID', () => {
      const satellite = createMockSatellite();
      useSatelliteStore.getState().addTrackedSatellite(satellite);
      expect(useSatelliteStore.getState().trackedSatellites.length).toBe(1);

      useSatelliteStore.getState().removeTrackedSatellite('sat-1');
      expect(useSatelliteStore.getState().trackedSatellites.length).toBe(0);
    });

    it('clears selected satellite if removed', () => {
      const satellite = createMockSatellite();
      useSatelliteStore.getState().addTrackedSatellite(satellite);
      useSatelliteStore.getState().setSelectedSatellite('sat-1');

      useSatelliteStore.getState().removeTrackedSatellite('sat-1');
      expect(useSatelliteStore.getState().selectedSatelliteId).toBeNull();
    });
  });

  describe('updateTrackedSatellite', () => {
    it('updates satellite properties', () => {
      const satellite = createMockSatellite();
      useSatelliteStore.getState().addTrackedSatellite(satellite);

      useSatelliteStore.getState().updateTrackedSatellite('sat-1', { altitude: 425 });
      expect(useSatelliteStore.getState().trackedSatellites[0].altitude).toBe(425);
    });
  });

  describe('setTrackedSatellites', () => {
    it('replaces all tracked satellites', () => {
      const sat1 = createMockSatellite({ id: 'sat-1' });
      const sat2 = createMockSatellite({ id: 'sat-2', name: 'Hubble' });

      useSatelliteStore.getState().setTrackedSatellites([sat1, sat2]);
      expect(useSatelliteStore.getState().trackedSatellites.length).toBe(2);
    });
  });

  describe('clearTrackedSatellites', () => {
    it('removes all satellites', () => {
      const sat1 = createMockSatellite({ id: 'sat-1' });
      const sat2 = createMockSatellite({ id: 'sat-2' });

      useSatelliteStore.getState().setTrackedSatellites([sat1, sat2]);
      expect(useSatelliteStore.getState().trackedSatellites.length).toBe(2);

      useSatelliteStore.getState().clearTrackedSatellites();
      expect(useSatelliteStore.getState().trackedSatellites.length).toBe(0);
    });

    it('clears selected satellite', () => {
      const satellite = createMockSatellite();
      useSatelliteStore.getState().addTrackedSatellite(satellite);
      useSatelliteStore.getState().setSelectedSatellite('sat-1');

      useSatelliteStore.getState().clearTrackedSatellites();
      expect(useSatelliteStore.getState().selectedSatelliteId).toBeNull();
    });
  });

  describe('setSelectedSatellite', () => {
    it('sets selected satellite', () => {
      useSatelliteStore.getState().setSelectedSatellite('sat-1');
      expect(useSatelliteStore.getState().selectedSatelliteId).toBe('sat-1');
    });

    it('clears selected satellite', () => {
      useSatelliteStore.getState().setSelectedSatellite('sat-1');
      useSatelliteStore.getState().setSelectedSatellite(null);
      expect(useSatelliteStore.getState().selectedSatelliteId).toBeNull();
    });
  });
});
