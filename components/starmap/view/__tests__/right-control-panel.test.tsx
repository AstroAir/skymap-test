/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mockSetPreference = jest.fn();
let mockCollapsed = false;
let mockExpandRequestId = 0;

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('@/lib/stores/settings-store', () => ({
  useSettingsStore: jest.fn(
    (
      selector: (state: {
        preferences: { rightPanelCollapsed: boolean };
        setPreference: (key: string, value: boolean) => void;
      }) => unknown
    ) =>
      selector({
        preferences: { rightPanelCollapsed: mockCollapsed },
        setPreference: mockSetPreference,
      })
  ),
}));

jest.mock('@/lib/stores', () => ({
  useEquipmentStore: jest.fn((selector: (state: { aperture: number; pixelSize: number }) => unknown) =>
    selector({ aperture: 80, pixelSize: 3.76 })
  ),
  useOnboardingBridgeStore: jest.fn((selector: (state: { expandRightPanelRequestId: number }) => unknown) =>
    selector({ expandRightPanelRequestId: mockExpandRequestId })
  ),
}));

jest.mock('@/lib/core/selection-utils', () => ({
  buildSelectionData: jest.fn(() => ({ currentSelection: null, observationSelection: null })),
}));

jest.mock('@/lib/hooks/use-equipment-fov-props', () => ({
  useEquipmentFOVProps: jest.fn(() => ({
    fovSimEnabled: false,
    setFovSimEnabled: jest.fn(),
    sensorWidth: 23.5,
    setSensorWidth: jest.fn(),
    sensorHeight: 15.6,
    setSensorHeight: jest.fn(),
    focalLength: 400,
    pixelSize: 3.76,
    rotationAngle: 0,
    setFocalLength: jest.fn(),
    setPixelSize: jest.fn(),
    mosaic: { rows: 1, cols: 1, overlapPercent: 20 },
    setMosaic: jest.fn(),
    gridType: 'single',
    setGridType: jest.fn(),
    setRotationAngle: jest.fn(),
  })),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  TooltipContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  TooltipTrigger: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

jest.mock('@/components/starmap/controls/zoom-controls', () => ({
  ZoomControls: () => <div data-testid="zoom-controls" />,
}));
jest.mock('@/components/starmap/overlays/fov-simulator', () => ({ FOVSimulator: () => null }));
jest.mock('@/components/starmap/planning/exposure-calculator', () => ({ ExposureCalculator: () => null }));
jest.mock('@/components/starmap/planning/shot-list', () => ({ ShotList: () => null }));
jest.mock('@/components/starmap/planning/observation-log', () => ({ ObservationLog: () => null }));
jest.mock('@/components/starmap/management/marker-manager', () => ({ MarkerManager: () => null }));
jest.mock('@/components/starmap/management/location-manager', () => ({
  LocationManager: ({ trigger }: { trigger: React.ReactNode }) => <>{trigger}</>,
}));
jest.mock('@/components/starmap/mount/stellarium-mount', () => ({ StellariumMount: () => null }));
jest.mock('@/components/starmap/planning/astro-session-panel', () => ({ AstroSessionPanel: () => null }));

import { RightControlPanel } from '../right-control-panel';

const defaultProps = {
  stel: false,
  currentFov: 60,
  selectedObject: null,
  showSessionPanel: false,
  contextMenuCoords: null,
  onZoomIn: jest.fn(),
  onZoomOut: jest.fn(),
  onFovSliderChange: jest.fn(),
  onGoToCoordinates: jest.fn(),
  onLocationChange: jest.fn(),
};

function rerenderWithTick(
  rerender: (ui: React.ReactElement) => void,
  tickState: { value: number }
) {
  tickState.value += 1;
  rerender(<RightControlPanel {...defaultProps} currentFov={60 + tickState.value} />);
}

function clickToggleAndRerender(
  rerender: (ui: React.ReactElement) => void,
  tickState: { value: number }
) {
  const label = mockCollapsed ? 'sidePanel.expand' : 'sidePanel.collapse';
  fireEvent.click(screen.getByRole('button', { name: label }));
  rerenderWithTick(rerender, tickState);
}

describe('RightControlPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCollapsed = false;
    mockExpandRequestId = 0;
    mockSetPreference.mockImplementation((key: string, value: boolean) => {
      if (key === 'rightPanelCollapsed') {
        mockCollapsed = value;
      }
    });
  });

  it('renders startup expanded state without transition animation', () => {
    render(<RightControlPanel {...defaultProps} />);

    const panel = screen.getByTestId('right-control-panel-content');
    expect(panel).toHaveAttribute('data-state', 'expanded');
    expect(panel).toHaveAttribute('data-transition', 'initial');
    expect(panel.className).toContain('transition-none');
    expect(panel.className).not.toContain('transition-[transform,opacity]');
    expect(panel.className).not.toContain('pointer-events-none');
  });

  it('renders startup collapsed state without transition animation', () => {
    mockCollapsed = true;
    render(<RightControlPanel {...defaultProps} />);

    const panel = screen.getByTestId('right-control-panel-content');
    expect(panel).toHaveAttribute('data-state', 'collapsed');
    expect(panel).toHaveAttribute('data-transition', 'initial');
    expect(panel.className).toContain('transition-none');
    expect(panel.className).toContain('translate-x-[calc(100%+16px)]');
    expect(panel.className).toContain('pointer-events-none');
  });

  it('uses explicit transform/opacity transitions after a user toggle', () => {
    const { rerender } = render(<RightControlPanel {...defaultProps} />);
    const tickState = { value: 0 };

    clickToggleAndRerender(rerender, tickState);

    const panel = screen.getByTestId('right-control-panel-content');
    expect(mockSetPreference).toHaveBeenCalledWith('rightPanelCollapsed', true);
    expect(panel).toHaveAttribute('data-state', 'collapsed');
    expect(panel).toHaveAttribute('data-transition', 'enabled');
    expect(panel.className).toContain('transition-[transform,opacity]');
    expect(panel.className).toContain('motion-reduce:transition-none');
    expect(panel.className).toContain('motion-reduce:duration-0');
  });

  it('converges to the final user intent during rapid repeated toggles', () => {
    const { rerender } = render(<RightControlPanel {...defaultProps} />);
    const tickState = { value: 0 };

    clickToggleAndRerender(rerender, tickState);
    clickToggleAndRerender(rerender, tickState);
    clickToggleAndRerender(rerender, tickState);

    expect(mockSetPreference).toHaveBeenNthCalledWith(1, 'rightPanelCollapsed', true);
    expect(mockSetPreference).toHaveBeenNthCalledWith(2, 'rightPanelCollapsed', false);
    expect(mockSetPreference).toHaveBeenNthCalledWith(3, 'rightPanelCollapsed', true);
    expect(screen.getByTestId('right-control-panel-content')).toHaveAttribute('data-state', 'collapsed');
  });

  it('preserves onboarding-driven programmatic expand behavior', async () => {
    mockCollapsed = true;
    const { rerender } = render(<RightControlPanel {...defaultProps} />);
    const tickState = { value: 0 };

    mockExpandRequestId = 1;
    rerenderWithTick(rerender, tickState);

    await waitFor(() => {
      expect(mockSetPreference).toHaveBeenCalledWith('rightPanelCollapsed', false);
    });

    rerenderWithTick(rerender, tickState);
    const panel = screen.getByTestId('right-control-panel-content');
    expect(panel).toHaveAttribute('data-state', 'expanded');
  });

  it('keeps collapsed panel non-interactive and expanded panel interactive', () => {
    mockCollapsed = true;
    const { rerender } = render(<RightControlPanel {...defaultProps} />);
    const tickState = { value: 0 };

    const panelCollapsed = screen.getByTestId('right-control-panel-content');
    expect(panelCollapsed.className).toContain('pointer-events-none');

    mockCollapsed = false;
    rerenderWithTick(rerender, tickState);
    const panelExpanded = screen.getByTestId('right-control-panel-content');
    expect(panelExpanded.className).not.toContain('pointer-events-none');
  });
});
