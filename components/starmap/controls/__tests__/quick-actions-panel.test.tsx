/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuickActionsPanel } from '../quick-actions-panel';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: React.PropsWithChildren<{ onClick?: () => void; disabled?: boolean; 'data-tour-id'?: string }>) => (
    <button onClick={onClick} disabled={disabled} data-testid={props['data-tour-id']} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: React.PropsWithChildren) => <span data-testid="badge">{children}</span>,
}));

jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children, open, onOpenChange }: React.PropsWithChildren<{ open?: boolean; onOpenChange?: (v: boolean) => void }>) => (
    <div data-testid="popover" data-open={open} onClick={() => onOpenChange?.(!open)}>{children}</div>
  ),
  PopoverContent: ({ children }: React.PropsWithChildren) => <div data-testid="popover-content">{children}</div>,
  PopoverTrigger: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: React.PropsWithChildren) => <>{children}</>,
  TooltipContent: ({ children }: React.PropsWithChildren) => <div data-testid="tooltip-content">{children}</div>,
  TooltipTrigger: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr />,
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

// Mock stores
const mockToggleStellariumSetting = jest.fn();
const mockSetFovEnabled = jest.fn();
const mockSetViewDirection = jest.fn();
const mockSetSkyEngine = jest.fn();
const mockToggleCatalogLayer = jest.fn();
const mockToggleMocLayer = jest.fn();
const mockToggleFitsLayer = jest.fn();
const mockToggleImageOverlayLayer = jest.fn();
const mockUpdateImageOverlayLayer = jest.fn();
let mockSkyEngine: 'stellarium' | 'aladin' = 'stellarium';

jest.mock('@/lib/stores', () => ({
  useMountStore: jest.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      profileInfo: {
        AstrometrySettings: { Latitude: 40.0, Longitude: -74.0 },
      },
    })
  ),
  useEquipmentStore: jest.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      fovDisplay: { enabled: false },
      setFOVEnabled: mockSetFovEnabled,
    })
  ),
  useSettingsStore: jest.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      skyEngine: mockSkyEngine,
      setSkyEngine: mockSetSkyEngine,
      stellarium: {
        constellationsLinesVisible: true,
        equatorialLinesVisible: false,
        azimuthalLinesVisible: false,
        dsosVisible: true,
      },
      toggleStellariumSetting: mockToggleStellariumSetting,
    })
  ),
  useAladinStore: jest.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      catalogLayers: [
        { id: 'simbad', name: 'SIMBAD', enabled: true },
        { id: 'ned', name: 'NED', enabled: false },
      ],
      toggleCatalogLayer: mockToggleCatalogLayer,
      mocLayers: [
        { id: 'moc-1', name: 'MOC 1', visible: true },
        { id: 'moc-2', name: 'MOC 2', visible: false },
      ],
      toggleMocLayer: mockToggleMocLayer,
      imageOverlayLayers: [
        { id: 'overlay-1', name: 'Overlay 1', enabled: true, opacity: 0.5 },
        { id: 'overlay-2', name: 'Overlay 2', enabled: false, opacity: 0.2 },
      ],
      toggleImageOverlayLayer: mockToggleImageOverlayLayer,
      updateImageOverlayLayer: mockUpdateImageOverlayLayer,
      fitsLayers: [
        { id: 'fits-1', name: 'FITS 1', enabled: true },
        { id: 'fits-2', name: 'FITS 2', enabled: false },
      ],
      toggleFitsLayer: mockToggleFitsLayer,
    })
  ),
  useStellariumStore: jest.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      setViewDirection: mockSetViewDirection,
    })
  ),
}));

jest.mock('@/lib/stores/target-list-store', () => ({
  useTargetListStore: jest.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      targets: [
        { id: '1', name: 'M31', ra: 10.68, dec: 41.27 },
        { id: '2', name: 'M42', ra: 83.82, dec: -5.39 },
      ],
      activeTargetId: '1',
    })
  ),
}));

jest.mock('@/lib/hooks/use-observing-conditions', () => ({
  useObservingConditions: jest.fn(() => ({
    moonPhaseName: 'Waxing Crescent',
    moonIllumination: 25,
    sunAltitude: -15,
    isDark: true,
    isTwilight: false,
    isDay: false,
    twilight: {},
  })),
}));

jest.mock('@/lib/astronomy/navigation', () => ({
  getCelestialReferencePoint: jest.fn((direction: string) => {
    switch (direction) {
      case 'NCP': return { ra: 0, dec: 90 };
      case 'SCP': return { ra: 0, dec: -90 };
      case 'zenith': return { ra: 100, dec: 40 };
      default: return { ra: 0, dec: 0 };
    }
  }),
}));

jest.mock('@/lib/core/constants/fov', () => ({
  ZOOM_PRESETS: [
    { fov: 90, labelKey: 'wideField' },
    { fov: 60, labelKey: 'normal' },
    { fov: 30, labelKey: 'medium' },
    { fov: 5, labelKey: 'detail' },
  ],
}));

describe('QuickActionsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSkyEngine = 'stellarium';
  });

  it('renders the trigger button', () => {
    render(<QuickActionsPanel />);
    const button = screen.getByTestId('quick-actions');
    expect(button).toBeDefined();
  });

  it('shows conditions summary (dark sky)', () => {
    render(<QuickActionsPanel />);
    expect(screen.getByText('quickActions.darkSky')).toBeDefined();
    expect(screen.getByText('25%')).toBeDefined();
  });

  it('shows active target when available', () => {
    render(<QuickActionsPanel />);
    expect(screen.getByText('M31')).toBeDefined();
  });

  it('navigates to active target on click', () => {
    render(<QuickActionsPanel />);
    const targetButton = screen.getByText('M31').closest('button');
    expect(targetButton).toBeDefined();
    fireEvent.click(targetButton!);
    expect(mockSetViewDirection).toHaveBeenCalledWith(10.68, 41.27);
  });

  it('renders celestial direction navigation buttons', () => {
    render(<QuickActionsPanel />);
    expect(screen.getByText('quickActions.ncp')).toBeDefined();
    expect(screen.getByText('quickActions.scp')).toBeDefined();
    expect(screen.getByText('quickActions.vernal')).toBeDefined();
    expect(screen.getByText('quickActions.autumnal')).toBeDefined();
  });

  it('navigates to NCP on direction button click', () => {
    render(<QuickActionsPanel />);
    const ncpButton = screen.getByText('quickActions.ncp').closest('button');
    fireEvent.click(ncpButton!);
    expect(mockSetViewDirection).toHaveBeenCalledWith(0, 90);
  });

  it('renders zoom preset buttons', () => {
    render(<QuickActionsPanel />);
    expect(screen.getByText('90°')).toBeDefined();
    expect(screen.getByText('60°')).toBeDefined();
    expect(screen.getByText('30°')).toBeDefined();
    expect(screen.getByText('5°')).toBeDefined();
  });

  it('calls onZoomToFov when preset clicked', () => {
    const onZoomToFov = jest.fn();
    render(<QuickActionsPanel onZoomToFov={onZoomToFov} />);
    const preset60 = screen.getByText('60°');
    fireEvent.click(preset60);
    expect(onZoomToFov).toHaveBeenCalledWith(60);
  });

  it('renders display toggle buttons', () => {
    render(<QuickActionsPanel />);
    expect(screen.getByText('quickActions.constellations')).toBeDefined();
    expect(screen.getByText('quickActions.eqGrid')).toBeDefined();
    expect(screen.getByText('quickActions.azGrid')).toBeDefined();
    expect(screen.getByText('quickActions.fovOverlay')).toBeDefined();
    expect(screen.getByText('quickActions.dsos')).toBeDefined();
  });

  it('toggles constellation display on click', () => {
    render(<QuickActionsPanel />);
    const constellationBtn = screen.getByText('quickActions.constellations').closest('button');
    fireEvent.click(constellationBtn!);
    expect(mockToggleStellariumSetting).toHaveBeenCalledWith('constellationsLinesVisible');
  });

  it('calls onResetView when reset button clicked', () => {
    const onResetView = jest.fn();
    render(<QuickActionsPanel onResetView={onResetView} />);
    const resetBtn = screen.getByText('quickActions.reset').closest('button');
    fireEvent.click(resetBtn!);
    expect(onResetView).toHaveBeenCalled();
  });

  it('shows target list summary with count', () => {
    render(<QuickActionsPanel />);
    expect(screen.getByText('quickActions.totalTargets')).toBeDefined();
    expect(screen.getByText('2')).toBeDefined();
  });

  it('renders Aladin-specific layer controls without truncating lists', () => {
    mockSkyEngine = 'aladin';
    render(<QuickActionsPanel />);

    expect(screen.getByText('SIMBAD')).toBeDefined();
    expect(screen.getByText('NED')).toBeDefined();
    expect(screen.getByText('MOC 1')).toBeDefined();
    expect(screen.getByText('MOC 2')).toBeDefined();
    expect(screen.getByText('Overlay 1')).toBeDefined();
    expect(screen.getByText('Overlay 2')).toBeDefined();
    expect(screen.getByText('FITS 1')).toBeDefined();
    expect(screen.getByText('FITS 2')).toBeDefined();
  });

  it('applies Aladin overlay opacity quick adjustments', () => {
    mockSkyEngine = 'aladin';
    render(<QuickActionsPanel />);

    const increaseBtn = screen.getByText('settings.aladinOverlayOpacity +10%').closest('button');
    expect(increaseBtn).toBeDefined();
    fireEvent.click(increaseBtn!);

    expect(mockUpdateImageOverlayLayer).toHaveBeenCalledWith('overlay-1', { opacity: 0.6 });
  });

  it('provides one-click compensation to switch back to Stellarium in Aladin mode', () => {
    mockSkyEngine = 'aladin';
    render(<QuickActionsPanel />);

    const switchBtn = screen.getByText('settings.switchToStellarium').closest('button');
    expect(switchBtn).toBeDefined();
    fireEvent.click(switchBtn!);

    expect(mockSetSkyEngine).toHaveBeenCalledWith('stellarium');
  });
});
