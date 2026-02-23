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
    const state = { preferences: {}, display: {} };
    return selector(state);
  }),
  useEquipmentStore: jest.fn((selector) => {
    const state = { fovDisplay: { enabled: false }, sensorWidth: 23.5, sensorHeight: 15.6, focalLength: 400, pixelSize: 3.76, aperture: 80 };
    return selector(state);
  }),
  useOnboardingBridgeStore: jest.fn((selector) => {
    const state = { openDailyKnowledgeRequestId: 0 };
    return selector(state);
  }),
}));
jest.mock('@/lib/stores/settings-store', () => ({
  useSettingsStore: jest.fn((selector) => {
    const state = { preferences: {}, display: {} };
    return selector(state);
  }),
}));
jest.mock('@/lib/core/selection-utils', () => ({ buildSelectionData: jest.fn(() => ({ currentSelection: null, observationSelection: null })) }));
jest.mock('@/lib/hooks/use-equipment-fov-props', () => ({
  useEquipmentFOVProps: jest.fn(() => ({
    fovSimEnabled: false, setFovSimEnabled: jest.fn(),
    sensorWidth: 23.5, setSensorWidth: jest.fn(),
    sensorHeight: 15.6, setSensorHeight: jest.fn(),
    focalLength: 400, setFocalLength: jest.fn(),
    pixelSize: 3.76, setPixelSize: jest.fn(),
    aperture: 80, setAperture: jest.fn(),
    rotationAngle: 0, setRotationAngle: jest.fn(),
    binning: 1, setBinning: jest.fn(),
  })),
}));
jest.mock('@/components/ui/button', () => ({ Button: ({ children, ...props }: React.PropsWithChildren) => <button {...props}>{children}</button> }));
jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  TooltipContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  TooltipTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
jest.mock('@/components/ui/scroll-area', () => ({ ScrollArea: ({ children }: React.PropsWithChildren) => <div>{children}</div> }));
jest.mock('@/components/starmap/controls/zoom-controls', () => ({ ZoomControls: () => <div data-testid="zoom-controls" /> }));
jest.mock('@/components/starmap/overlays/fov-simulator', () => ({ FOVSimulator: () => null }));
jest.mock('@/components/starmap/planning/exposure-calculator', () => ({ ExposureCalculator: () => null }));
jest.mock('@/components/starmap/planning/shot-list', () => ({ ShotList: () => null }));
jest.mock('@/components/starmap/planning/observation-log', () => ({ ObservationLog: () => null }));
jest.mock('@/components/starmap/management/marker-manager', () => ({ MarkerManager: () => null }));
jest.mock('@/components/starmap/management/location-manager', () => ({ LocationManager: () => null }));
jest.mock('@/components/starmap/mount/stellarium-mount', () => ({ StellariumMount: () => null }));
jest.mock('@/components/starmap/planning/astro-session-panel', () => ({ AstroSessionPanel: () => null }));

import { RightControlPanel } from '../right-control-panel';

describe('RightControlPanel', () => {
  it('renders without crashing', () => {
    render(
      <RightControlPanel
        stel={false}
        currentFov={60}
        selectedObject={null}
        showSessionPanel={false}
        contextMenuCoords={null}
        onZoomIn={jest.fn()}
        onZoomOut={jest.fn()}
        onFovSliderChange={jest.fn()}
        onLocationChange={jest.fn()}
      />
    );
  });
});
