/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock stores
const mockUseSettingsStore = jest.fn((selector) => {
  const state = {
    stellarium: {
      constellationsLinesVisible: true,
      constellationArtVisible: false,
      azimuthalLinesVisible: false,
      equatorialLinesVisible: false,
      meridianLinesVisible: false,
      eclipticLinesVisible: false,
      atmosphereVisible: false,
      landscapesVisible: false,
      dsosVisible: true,
      surveyEnabled: true,
      surveyId: 'dss',
      surveyUrl: undefined,
      skyCultureLanguage: 'native',
      nightMode: false,
      sensorControl: false,
    },
    connection: { ip: 'localhost', port: '1888' },
    backendProtocol: 'http',
    setStellariumSettings: jest.fn(),
    setConnection: jest.fn(),
    setBackendProtocol: jest.fn(),
  };
  return selector ? selector(state) : state;
});

const mockUseEquipmentStore = jest.fn((selector) => {
  const state = {
    resetToDefaults: jest.fn(),
  };
  return selector ? selector(state) : state;
});

jest.mock('@/lib/stores', () => ({
  useSettingsStore: (selector: (state: unknown) => unknown) => mockUseSettingsStore(selector),
  useEquipmentStore: (selector: (state: unknown) => unknown) => mockUseEquipmentStore(selector),
}));

// Mock UI components
jest.mock('@/components/ui/drawer', () => ({
  Drawer: ({ children, open }: { children: React.ReactNode; open?: boolean }) => (
    <div data-testid="drawer" data-open={open}>{children}</div>
  ),
  DrawerContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="drawer-content">{children}</div>
  ),
  DrawerHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="drawer-header">{children}</div>
  ),
  DrawerTitle: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="drawer-title">{children}</h2>
  ),
  DrawerTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    asChild ? <>{children}</> : <div data-testid="drawer-trigger">{children}</div>
  ),
  DrawerFooter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="drawer-footer">{children}</div>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => (
    <button onClick={onClick} disabled={disabled} data-testid="button" {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: { children: React.ReactNode; value?: string; onValueChange?: (v: string) => void }) => (
    <div data-testid="tabs" data-value={value} onClick={() => onValueChange?.('equipment')}>{children}</div>
  ),
  TabsContent: ({ children, value }: { children: React.ReactNode; value?: string }) => (
    <div data-testid={`tabs-content-${value}`}>{children}</div>
  ),
  TabsList: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tabs-list">{children}</div>
  ),
  TabsTrigger: ({ children, value }: { children: React.ReactNode; value?: string }) => (
    <button data-testid={`tabs-trigger-${value}`}>{children}</button>
  ),
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="scroll-area">{children}</div>
  ),
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    asChild ? <>{children}</> : <div>{children}</div>
  ),
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr data-testid="separator" />,
}));

jest.mock('@/lib/utils', () => ({
  cn: (...args: (string | undefined)[]) => args.filter(Boolean).join(' '),
}));

// Mock child components
jest.mock('../display-settings', () => ({
  DisplaySettings: () => <div data-testid="display-settings">DisplaySettings</div>,
}));

jest.mock('../equipment-settings', () => ({
  EquipmentSettings: () => <div data-testid="equipment-settings">EquipmentSettings</div>,
}));

jest.mock('../fov-settings', () => ({
  FOVSettings: () => <div data-testid="fov-settings">FOVSettings</div>,
}));

jest.mock('../exposure-settings', () => ({
  ExposureSettings: () => <div data-testid="exposure-settings">ExposureSettings</div>,
}));

jest.mock('../location-settings', () => ({
  LocationSettings: () => <div data-testid="location-settings">LocationSettings</div>,
}));

jest.mock('../connection-settings', () => ({
  ConnectionSettings: () => <div data-testid="connection-settings">ConnectionSettings</div>,
}));

jest.mock('../../../map', () => ({
  MapProviderSettings: () => <div data-testid="map-provider-settings">MapProviderSettings</div>,
  MapHealthMonitor: () => <div data-testid="map-health-monitor">MapHealthMonitor</div>,
}));

import { UnifiedSettings } from '../unified-settings';

describe('UnifiedSettings Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders the drawer component', () => {
      render(<UnifiedSettings />);
      expect(screen.getByTestId('drawer')).toBeInTheDocument();
    });

    it('renders drawer content with header', () => {
      render(<UnifiedSettings />);
      expect(screen.getByTestId('drawer-content')).toBeInTheDocument();
      expect(screen.getByTestId('drawer-header')).toBeInTheDocument();
    });

    it('renders tabs for different settings categories', () => {
      render(<UnifiedSettings />);
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
      expect(screen.getByTestId('tabs-list')).toBeInTheDocument();
    });

    it('renders all tab triggers', () => {
      render(<UnifiedSettings />);
      expect(screen.getByTestId('tabs-trigger-display')).toBeInTheDocument();
      expect(screen.getByTestId('tabs-trigger-equipment')).toBeInTheDocument();
      expect(screen.getByTestId('tabs-trigger-fov')).toBeInTheDocument();
      expect(screen.getByTestId('tabs-trigger-exposure')).toBeInTheDocument();
      expect(screen.getByTestId('tabs-trigger-map')).toBeInTheDocument();
    });

    it('renders drawer footer with action buttons', () => {
      render(<UnifiedSettings />);
      expect(screen.getByTestId('drawer-footer')).toBeInTheDocument();
      const buttons = screen.getAllByTestId('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Child Components Integration', () => {
    it('renders DisplaySettings in display tab', () => {
      render(<UnifiedSettings />);
      expect(screen.getByTestId('display-settings')).toBeInTheDocument();
    });

    it('renders ConnectionSettings in display tab', () => {
      render(<UnifiedSettings />);
      expect(screen.getByTestId('connection-settings')).toBeInTheDocument();
    });

    it('renders LocationSettings in display tab', () => {
      render(<UnifiedSettings />);
      expect(screen.getByTestId('location-settings')).toBeInTheDocument();
    });

    it('renders EquipmentSettings in equipment tab', () => {
      render(<UnifiedSettings />);
      expect(screen.getByTestId('equipment-settings')).toBeInTheDocument();
    });

    it('renders FOVSettings in fov tab', () => {
      render(<UnifiedSettings />);
      expect(screen.getByTestId('fov-settings')).toBeInTheDocument();
    });

    it('renders ExposureSettings in exposure tab', () => {
      render(<UnifiedSettings />);
      expect(screen.getByTestId('exposure-settings')).toBeInTheDocument();
    });

    it('renders MapProviderSettings in map tab', () => {
      render(<UnifiedSettings />);
      expect(screen.getByTestId('map-provider-settings')).toBeInTheDocument();
    });

    it('renders MapHealthMonitor in map tab', () => {
      render(<UnifiedSettings />);
      expect(screen.getByTestId('map-health-monitor')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('renders reset button in header', () => {
      render(<UnifiedSettings />);
      const buttons = screen.getAllByTestId('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('renders scroll areas for tab content', () => {
      render(<UnifiedSettings />);
      const scrollAreas = screen.getAllByTestId('scroll-area');
      expect(scrollAreas.length).toBeGreaterThanOrEqual(5);
    });

    it('renders separators between sections', () => {
      render(<UnifiedSettings />);
      const separators = screen.getAllByTestId('separator');
      expect(separators.length).toBeGreaterThan(0);
    });
  });

  describe('Tab Content', () => {
    it('renders display tab content', () => {
      render(<UnifiedSettings />);
      expect(screen.getByTestId('tabs-content-display')).toBeInTheDocument();
    });

    it('renders equipment tab content', () => {
      render(<UnifiedSettings />);
      expect(screen.getByTestId('tabs-content-equipment')).toBeInTheDocument();
    });

    it('renders fov tab content', () => {
      render(<UnifiedSettings />);
      expect(screen.getByTestId('tabs-content-fov')).toBeInTheDocument();
    });

    it('renders exposure tab content', () => {
      render(<UnifiedSettings />);
      expect(screen.getByTestId('tabs-content-exposure')).toBeInTheDocument();
    });

    it('renders map tab content', () => {
      render(<UnifiedSettings />);
      expect(screen.getByTestId('tabs-content-map')).toBeInTheDocument();
    });
  });
});

describe('UnifiedSettings Store Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should read stellarium settings from store', () => {
    render(<UnifiedSettings />);
    expect(mockUseSettingsStore).toHaveBeenCalled();
  });

  it('should read connection settings from store', () => {
    render(<UnifiedSettings />);
    expect(mockUseSettingsStore).toHaveBeenCalled();
  });

  it('should read equipment store', () => {
    render(<UnifiedSettings />);
    expect(mockUseEquipmentStore).toHaveBeenCalled();
  });
});

describe('UnifiedSettings Export', () => {
  it('exports the UnifiedSettings component', () => {
    expect(UnifiedSettings).toBeDefined();
    expect(typeof UnifiedSettings).toBe('function');
  });
});