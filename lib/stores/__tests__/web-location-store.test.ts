/**
 * @jest-environment jsdom
 */

jest.mock('@/lib/storage', () => ({
  getZustandStorage: jest.fn(() => ({
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  })),
}));

import { useWebLocationStore } from '../web-location-store';

describe('useWebLocationStore', () => {
  beforeEach(() => {
    // Reset store state between tests
    useWebLocationStore.setState({ locations: [] });
  });

  it('starts with empty locations', () => {
    expect(useWebLocationStore.getState().locations).toEqual([]);
  });

  it('adds a location and returns an id', () => {
    const id = useWebLocationStore.getState().addLocation({
      name: 'Test Site',
      latitude: 40.5,
      longitude: -73.5,
      altitude: 100,
      timezone: 'Asia/Shanghai',
      notes: 'Primary site',
      bortle_class: 3,
      is_default: true,
      is_current: true,
    });

    expect(typeof id).toBe('string');
    expect(id.startsWith('web-loc-')).toBe(true);

    const locations = useWebLocationStore.getState().locations;
    expect(locations).toHaveLength(1);
    expect(locations[0].name).toBe('Test Site');
    expect(locations[0].latitude).toBe(40.5);
    expect(locations[0].timezone).toBe('Asia/Shanghai');
    expect(locations[0].notes).toBe('Primary site');
    expect(locations[0].id).toBe(id);
  });

  it('normalizes first added location to current and default even when flags are false', () => {
    const id = useWebLocationStore.getState().addLocation({
      name: 'First',
      latitude: 0,
      longitude: 0,
      altitude: 0,
      is_default: false,
      is_current: false,
    });

    const loc = useWebLocationStore.getState().locations.find((item) => item.id === id)!;
    expect(loc.is_current).toBe(true);
    expect(loc.is_default).toBe(true);
  });

  it('updates a location', () => {
    const id = useWebLocationStore.getState().addLocation({
      name: 'Original',
      latitude: 0,
      longitude: 0,
      altitude: 0,
      is_default: false,
      is_current: false,
    });

    useWebLocationStore.getState().updateLocation(id, { name: 'Updated', latitude: 50 });

    const loc = useWebLocationStore.getState().locations[0];
    expect(loc.name).toBe('Updated');
    expect(loc.latitude).toBe(50);
    expect(loc.longitude).toBe(0); // unchanged
  });

  it('removes a location', () => {
    const id = useWebLocationStore.getState().addLocation({
      name: 'ToRemove',
      latitude: 0,
      longitude: 0,
      altitude: 0,
      is_default: false,
      is_current: false,
    });

    expect(useWebLocationStore.getState().locations).toHaveLength(1);
    useWebLocationStore.getState().removeLocation(id);
    expect(useWebLocationStore.getState().locations).toHaveLength(0);
  });

  it('sets current location', () => {
    const id1 = useWebLocationStore.getState().addLocation({
      name: 'A',
      latitude: 0,
      longitude: 0,
      altitude: 0,
      is_default: false,
      is_current: true,
    });
    const id2 = useWebLocationStore.getState().addLocation({
      name: 'B',
      latitude: 10,
      longitude: 10,
      altitude: 0,
      is_default: false,
      is_current: false,
    });

    useWebLocationStore.getState().setCurrent(id2);

    const locs = useWebLocationStore.getState().locations;
    expect(locs.find(l => l.id === id1)!.is_current).toBe(false);
    expect(locs.find(l => l.id === id2)!.is_current).toBe(true);
    expect(locs.filter((l) => l.is_current)).toHaveLength(1);
    expect(locs.filter((l) => l.is_default)).toHaveLength(1);
  });

  it('sets default location without changing current location', () => {
    const id1 = useWebLocationStore.getState().addLocation({
      name: 'A',
      latitude: 0,
      longitude: 0,
      altitude: 0,
      is_default: true,
      is_current: true,
    });
    const id2 = useWebLocationStore.getState().addLocation({
      name: 'B',
      latitude: 1,
      longitude: 1,
      altitude: 1,
      is_default: false,
      is_current: false,
    });

    useWebLocationStore.getState().setDefault(id2);

    const locs = useWebLocationStore.getState().locations;
    expect(locs.find((l) => l.id === id1)!.is_current).toBe(true);
    expect(locs.find((l) => l.id === id2)!.is_default).toBe(true);
    expect(locs.filter((l) => l.is_current)).toHaveLength(1);
    expect(locs.filter((l) => l.is_default)).toHaveLength(1);
  });

  it('promotes deterministic current/default after deleting active location', () => {
    const id1 = useWebLocationStore.getState().addLocation({
      name: 'A',
      latitude: 0,
      longitude: 0,
      altitude: 0,
      is_default: true,
      is_current: true,
    });
    const id2 = useWebLocationStore.getState().addLocation({
      name: 'B',
      latitude: 1,
      longitude: 1,
      altitude: 1,
      is_default: false,
      is_current: false,
    });

    useWebLocationStore.getState().removeLocation(id1);

    const locs = useWebLocationStore.getState().locations;
    expect(locs).toHaveLength(1);
    expect(locs[0].id).toBe(id2);
    expect(locs[0].is_current).toBe(true);
    expect(locs[0].is_default).toBe(true);
  });

  it('clears all locations', () => {
    useWebLocationStore.getState().addLocation({
      name: 'A', latitude: 0, longitude: 0, altitude: 0, is_default: false, is_current: false,
    });
    useWebLocationStore.getState().addLocation({
      name: 'B', latitude: 0, longitude: 0, altitude: 0, is_default: false, is_current: false,
    });

    expect(useWebLocationStore.getState().locations).toHaveLength(2);
    useWebLocationStore.getState().clearAll();
    expect(useWebLocationStore.getState().locations).toHaveLength(0);
  });
});
