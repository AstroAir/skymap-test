/**
 * @jest-environment jsdom
 */

import { renderHook } from '@testing-library/react';

// Mock logger
jest.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }),
}));

// Mock settings store
let mockSkyEngine = 'aladin';
jest.mock('@/lib/stores/settings-store', () => ({
  useSettingsStore: jest.fn((selector) => {
    const state = { skyEngine: mockSkyEngine };
    return typeof selector === 'function' ? selector(state) : state;
  }),
}));

// Mock marker store
const mockMarkers = [
  { id: '1', name: 'Marker1', ra: 10, dec: 20, color: '#ff0000', icon: 'star', visible: true, createdAt: 0, updatedAt: 0, raString: '', decString: '' },
  { id: '2', name: 'Marker2', ra: 30, dec: 40, color: '#00ff00', icon: 'circle', visible: false, createdAt: 0, updatedAt: 0, raString: '', decString: '' },
];

jest.mock('@/lib/stores/marker-store', () => ({
  useMarkerStore: Object.assign(
    jest.fn(),
    {
      getState: () => ({ markers: mockMarkers }),
      subscribe: jest.fn(() => jest.fn()),
    }
  ),
}));

// Mock target list store
const mockTargets = [
  { id: 't1', name: 'M31', ra: 10.684, dec: 41.269 },
  { id: 't2', name: 'M42', ra: 83.82, dec: -5.39 },
];

jest.mock('@/lib/stores/target-list-store', () => ({
  useTargetListStore: Object.assign(
    jest.fn(),
    {
      getState: () => ({ targets: mockTargets, activeTargetId: 't1' }),
      subscribe: jest.fn(() => jest.fn()),
    }
  ),
}));

// aladin-lite is resolved via moduleNameMapper → __mocks__/aladin-lite.js
// eslint-disable-next-line @typescript-eslint/no-require-imports
const aladinMock = require('aladin-lite').default;

describe('useAladinOverlays', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSkyEngine = 'aladin';
  });

  it('exports the hook correctly', async () => {
    const { useAladinOverlays } = await import('../use-aladin-overlays');
    expect(useAladinOverlays).toBeDefined();
    expect(typeof useAladinOverlays).toBe('function');
  });

  it('does not create overlays when engine is not ready', async () => {
    const { useAladinOverlays } = await import('../use-aladin-overlays');
    const aladinRef = { current: null };

    renderHook(() =>
      useAladinOverlays({ aladinRef, engineReady: false })
    );

    expect(aladinMock.graphicOverlay).not.toHaveBeenCalled();
  });

  it('does not create overlays when skyEngine is stellarium', async () => {
    mockSkyEngine = 'stellarium';
    const { useAladinOverlays } = await import('../use-aladin-overlays');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const aladinRef = { current: { addOverlay: jest.fn() } } as any;

    renderHook(() =>
      useAladinOverlays({ aladinRef, engineReady: true })
    );

    expect(aladinMock.graphicOverlay).not.toHaveBeenCalled();
  });
});
