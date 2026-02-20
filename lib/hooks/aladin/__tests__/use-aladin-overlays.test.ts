/**
 * @jest-environment jsdom
 */

import React from 'react';
import { act, renderHook } from '@testing-library/react';

// Mock logger
jest.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }),
}));

let mockSkyEngine = 'aladin';
jest.mock('@/lib/stores/settings-store', () => ({
  useSettingsStore: jest.fn((selector) => {
    const state = { skyEngine: mockSkyEngine };
    return typeof selector === 'function' ? selector(state) : state;
  }),
}));

const markerState = {
  markers: [
    { id: '1', name: 'Marker1', ra: 10, dec: 20, color: '#ff0000', icon: 'star', visible: true, createdAt: 0, updatedAt: 0, raString: '', decString: '' },
    { id: '2', name: 'Marker2', ra: 30, dec: 40, color: '#00ff00', icon: 'circle', visible: false, createdAt: 0, updatedAt: 0, raString: '', decString: '' },
  ],
  showMarkers: true,
};

const mockMarkerSubscribe = jest.fn((_listener?: unknown) => jest.fn());
jest.mock('@/lib/stores/marker-store', () => ({
  useMarkerStore: Object.assign(jest.fn(), {
    getState: () => markerState,
    subscribe: (listener: unknown) => mockMarkerSubscribe(listener),
  }),
}));

const targetState = {
  targets: [{ id: 't1', name: 'M31', ra: 10.684, dec: 41.269 }],
  activeTargetId: 't1',
};

const mockTargetSubscribe = jest.fn((_listener?: unknown) => jest.fn());
jest.mock('@/lib/stores/target-list-store', () => ({
  useTargetListStore: Object.assign(jest.fn(), {
    getState: () => targetState,
    subscribe: (listener: unknown) => mockTargetSubscribe(listener),
  }),
}));

// aladin-lite is resolved via moduleNameMapper → __mocks__/aladin-lite.js
// eslint-disable-next-line @typescript-eslint/no-require-imports
const aladinMock = require('aladin-lite').default;

describe('useAladinOverlays', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockSkyEngine = 'aladin';
    markerState.showMarkers = true;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('exports the hook correctly', async () => {
    const { useAladinOverlays } = await import('../use-aladin-overlays');
    expect(useAladinOverlays).toBeDefined();
    expect(typeof useAladinOverlays).toBe('function');
  });

  it('renders overlays in aladin mode when markers are enabled', async () => {
    const { useAladinOverlays } = await import('../use-aladin-overlays');
    const aladinRef = { current: { addOverlay: jest.fn() } } as React.RefObject<unknown>;

    renderHook(() =>
      useAladinOverlays({ aladinRef: aladinRef as never, engineReady: true })
    );

    await act(async () => {
      jest.advanceTimersByTime(700);
      await Promise.resolve();
    });

    expect(aladinMock.graphicOverlay).toHaveBeenCalled();
    expect((aladinRef.current as { addOverlay: jest.Mock }).addOverlay).toHaveBeenCalled();
    expect(aladinMock.polyline).toHaveBeenCalled();
  });

  it('does not render marker overlays when showMarkers is false', async () => {
    markerState.showMarkers = false;
    const { useAladinOverlays } = await import('../use-aladin-overlays');
    const aladinRef = { current: { addOverlay: jest.fn() } } as React.RefObject<unknown>;

    renderHook(() =>
      useAladinOverlays({ aladinRef: aladinRef as never, engineReady: true })
    );

    await act(async () => {
      jest.advanceTimersByTime(700);
      await Promise.resolve();
    });

    expect(aladinMock.polyline).not.toHaveBeenCalled();
    expect(aladinMock.circle).toHaveBeenCalledTimes(1); // target overlay only
  });

  it('does not create overlays when skyEngine is stellarium', async () => {
    mockSkyEngine = 'stellarium';
    const { useAladinOverlays } = await import('../use-aladin-overlays');
    const aladinRef = { current: { addOverlay: jest.fn() } } as React.RefObject<unknown>;

    renderHook(() =>
      useAladinOverlays({ aladinRef: aladinRef as never, engineReady: true })
    );

    await act(async () => {
      jest.advanceTimersByTime(700);
      await Promise.resolve();
    });

    expect(aladinMock.graphicOverlay).not.toHaveBeenCalled();
  });
});
