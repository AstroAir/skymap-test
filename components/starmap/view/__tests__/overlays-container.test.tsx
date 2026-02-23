/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react';

jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
jest.mock('@/lib/stores', () => ({
  useStellariumStore: jest.fn((selector) => {
    const state = { stel: null, activeEngine: 'stellarium' };
    return selector(state);
  }),
  useSettingsStore: jest.fn((selector) => {
    const state = { display: { showFovOverlay: false, showSatelliteOverlay: false, showSkyMarkers: false, showOcularOverlay: false } };
    return selector(state);
  }),
  useEquipmentStore: jest.fn((selector) => {
    const state = {
      fovDisplay: { enabled: false, frameColor: '#fff', frameStyle: 'solid', overlayOpacity: 0.5 },
      ocularDisplay: { enabled: false, appliedFov: 1, opacity: 0.5, showCrosshair: false },
      rotationAngle: 0,
      pixelSize: 3.76, sensorWidth: 23.5, sensorHeight: 15.6, focalLength: 400, aperture: 80,
    };
    return selector(state);
  }),
}));
jest.mock('@/lib/stores/settings-store', () => ({
  useSettingsStore: jest.fn((selector) => {
    const state = { display: { showFovOverlay: false, showSatelliteOverlay: false, showSkyMarkers: false, showOcularOverlay: false }, skyEngine: 'stellarium' };
    return selector(state);
  }),
}));
jest.mock('@/lib/hooks/use-equipment-fov-props', () => ({
  useEquipmentFOVRead: jest.fn(() => ({
    fovSimEnabled: false, sensorWidth: 23.5, sensorHeight: 15.6, focalLength: 400,
    mosaic: { enabled: false, rows: 1, cols: 1, overlap: 10 },
    gridType: 'none',
  })),
}));
jest.mock('@/components/starmap/overlays/fov-overlay', () => ({ FOVOverlay: () => null }));
jest.mock('@/components/starmap/overlays/ocular-overlay', () => ({ OcularOverlay: () => null }));
jest.mock('@/components/starmap/overlays/sky-markers', () => ({ SkyMarkers: () => null }));
jest.mock('@/components/starmap/overlays/satellite-overlay', () => ({ SatelliteOverlay: () => null }));

import { OverlaysContainer } from '../overlays-container';

describe('OverlaysContainer', () => {
  it('renders without crashing', () => {
    render(
      <OverlaysContainer
        currentFov={60}
        containerBounds={{ width: 800, height: 600 }}
        onRotationChange={jest.fn()}
        onMarkerDoubleClick={jest.fn()}
        onMarkerEdit={jest.fn()}
        onMarkerNavigate={jest.fn()}
      />
    );
  });
});
