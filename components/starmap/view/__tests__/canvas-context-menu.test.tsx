/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { CanvasContextMenu } from '../canvas-context-menu';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (key === 'zoom.fovPreset' && values?.value) return `${values.value}°`;
    return key;
  },
}));

jest.mock('@/components/ui/dropdown-menu', () => {
  const Item = ({ children, onClick, disabled, ...props }: React.PropsWithChildren<{ onClick?: () => void; disabled?: boolean }>) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  );
  const CheckboxItem = ({
    children,
    onCheckedChange,
    disabled,
    ...props
  }: React.PropsWithChildren<{ onCheckedChange?: (checked: boolean) => void; disabled?: boolean }>) => (
    <button onClick={() => onCheckedChange?.(true)} disabled={disabled} {...props}>{children}</button>
  );
  const Wrapper = ({ children }: React.PropsWithChildren) => <div>{children}</div>;
  return {
    DropdownMenu: Wrapper,
    DropdownMenuContent: Wrapper,
    DropdownMenuItem: Item,
    DropdownMenuSeparator: () => <hr />,
    DropdownMenuSub: Wrapper,
    DropdownMenuSubContent: Wrapper,
    DropdownMenuSubTrigger: Item,
    DropdownMenuCheckboxItem: CheckboxItem,
    DropdownMenuShortcut: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
    DropdownMenuTrigger: Wrapper,
  };
});

const mockSetSkyEngine = jest.fn();
const mockToggleCatalogLayer = jest.fn();
const mockToggleImageOverlayLayer = jest.fn();
const mockToggleMocLayer = jest.fn();
const mockToggleFitsLayer = jest.fn();
let mockSkyEngine: 'stellarium' | 'aladin' = 'aladin';

jest.mock('@/lib/stores', () => ({
  useSettingsStore: jest.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      skyEngine: mockSkyEngine,
      setSkyEngine: mockSetSkyEngine,
    })
  ),
  useAladinStore: jest.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      catalogLayers: [
        { id: 'simbad', name: 'SIMBAD', enabled: true },
        { id: 'ned', name: 'NED', enabled: false },
      ],
      toggleCatalogLayer: mockToggleCatalogLayer,
      imageOverlayLayers: [
        { id: 'overlay-1', name: 'Overlay 1', enabled: true },
        { id: 'overlay-2', name: 'Overlay 2', enabled: false },
      ],
      toggleImageOverlayLayer: mockToggleImageOverlayLayer,
      mocLayers: [
        { id: 'moc-1', name: 'MOC 1', visible: true },
        { id: 'moc-2', name: 'MOC 2', visible: false },
      ],
      toggleMocLayer: mockToggleMocLayer,
      fitsLayers: [
        { id: 'fits-1', name: 'FITS 1', enabled: true },
        { id: 'fits-2', name: 'FITS 2', enabled: false },
      ],
      toggleFitsLayer: mockToggleFitsLayer,
    })
  ),
  useEquipmentStore: jest.fn(() => ({ setFOVEnabled: jest.fn(), setRotationAngle: jest.fn(), setMosaic: jest.fn() })),
  useStellariumStore: jest.fn(() => ({ setViewDirection: jest.fn() })),
}));

jest.mock('@/lib/hooks/use-equipment-fov-props', () => ({
  useEquipmentFOVRead: jest.fn(() => ({
    fovSimEnabled: false,
    mosaic: { enabled: false },
  })),
}));

describe('CanvasContextMenu (Aladin mode)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSkyEngine = 'aladin';
  });

  it('renders full Aladin layer controls in display submenu and supports toggles', () => {
    render(
      <CanvasContextMenu
        open={true}
        position={{ x: 10, y: 10 }}
        coords={{ ra: 10, dec: 20, raStr: '00h40m', decStr: '+20d00m' }}
        selectedObject={null}
        mountConnected={false}
        stellariumSettings={{
          constellationsLinesVisible: false,
          equatorialLinesVisible: false,
          azimuthalLinesVisible: false,
          dsosVisible: false,
          surveyEnabled: false,
          atmosphereVisible: false,
        }}
        onOpenChange={() => {}}
        onAddToTargetList={() => {}}
        onNavigateToCoords={() => {}}
        onOpenGoToDialog={() => {}}
        onSetPendingMarkerCoords={() => {}}
        onSetFramingCoordinates={() => {}}
        onZoomIn={() => {}}
        onZoomOut={() => {}}
        onSetFov={() => {}}
        onToggleStellariumSetting={() => {}}
        onToggleSearch={() => {}}
        onResetView={() => {}}
      />
    );

    fireEvent.click(screen.getByText('SIMBAD'));
    fireEvent.click(screen.getByText('MOC 1'));
    fireEvent.click(screen.getByText('Overlay 1'));
    fireEvent.click(screen.getByText('FITS 1'));

    expect(screen.getByText('NED')).toBeDefined();
    expect(screen.getByText('MOC 2')).toBeDefined();
    expect(screen.getByText('Overlay 2')).toBeDefined();
    expect(screen.getByText('FITS 2')).toBeDefined();
    expect(mockToggleCatalogLayer).toHaveBeenCalledWith('simbad');
    expect(mockToggleMocLayer).toHaveBeenCalledWith('moc-1');
    expect(mockToggleImageOverlayLayer).toHaveBeenCalledWith('overlay-1');
    expect(mockToggleFitsLayer).toHaveBeenCalledWith('fits-1');
  });

  it('shows explicit Stellarium-only fallback and one-click compensation', () => {
    render(
      <CanvasContextMenu
        open={true}
        position={{ x: 10, y: 10 }}
        coords={null}
        selectedObject={null}
        mountConnected={false}
        stellariumSettings={{
          constellationsLinesVisible: false,
          equatorialLinesVisible: false,
          azimuthalLinesVisible: false,
          dsosVisible: false,
          surveyEnabled: false,
          atmosphereVisible: false,
        }}
        onOpenChange={() => {}}
        onAddToTargetList={() => {}}
        onNavigateToCoords={() => {}}
        onOpenGoToDialog={() => {}}
        onSetPendingMarkerCoords={() => {}}
        onSetFramingCoordinates={() => {}}
        onZoomIn={() => {}}
        onZoomOut={() => {}}
        onSetFov={() => {}}
        onToggleStellariumSetting={() => {}}
        onToggleSearch={() => {}}
        onResetView={() => {}}
      />
    );

    expect(screen.getAllByText('settings.stellariumFeatureUnavailable').length).toBeGreaterThan(0);

    const switchButtons = screen.getAllByText('settings.switchToStellarium');
    fireEvent.click(switchButtons[0]);
    expect(mockSetSkyEngine).toHaveBeenCalledWith('stellarium');
  });
});
