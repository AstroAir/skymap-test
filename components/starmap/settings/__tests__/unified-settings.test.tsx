/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock stores
const mockUseSettingsStore = jest.fn((selector) => {
  const state = {
    resetToDefaults: jest.fn(),
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

jest.mock('@/lib/stores/theme-store', () => ({
  useThemeStore: (selector: (state: unknown) => unknown) => {
    const state = { resetCustomization: jest.fn() };
    return selector ? selector(state) : state;
  },
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

jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    asChild ? <>{children}</> : <div>{children}</div>
  ),
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogAction: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}));

jest.mock('@/lib/utils', () => ({
  cn: (...args: (string | undefined)[]) => args.filter(Boolean).join(' '),
}));

// Mock child components
jest.mock('@/components/starmap/settings/display-settings', () => ({
  DisplaySettings: () => <div data-testid="display-settings">DisplaySettings</div>,
}));

jest.mock('@/components/starmap/settings/equipment-settings', () => ({
  EquipmentSettings: () => <div data-testid="equipment-settings">EquipmentSettings</div>,
}));

jest.mock('@/components/starmap/settings/fov-settings', () => ({
  FOVSettings: () => <div data-testid="fov-settings">FOVSettings</div>,
}));

jest.mock('@/components/starmap/settings/exposure-settings', () => ({
  ExposureSettings: () => <div data-testid="exposure-settings">ExposureSettings</div>,
}));

jest.mock('@/components/starmap/settings/location-settings', () => ({
  LocationSettings: () => <div data-testid="location-settings">LocationSettings</div>,
}));

jest.mock('@/components/starmap/settings/connection-settings', () => ({
  ConnectionSettings: () => <div data-testid="connection-settings">ConnectionSettings</div>,
}));

jest.mock('@/components/starmap/settings/general-settings', () => ({
  GeneralSettings: () => <div data-testid="general-settings">GeneralSettings</div>,
}));

jest.mock('@/components/starmap/settings/appearance-settings', () => ({
  AppearanceSettings: () => <div data-testid="appearance-settings">AppearanceSettings</div>,
}));

jest.mock('@/components/starmap/settings/performance-settings', () => ({
  PerformanceSettings: () => <div data-testid="performance-settings">PerformanceSettings</div>,
}));

jest.mock('@/components/starmap/settings/accessibility-settings', () => ({
  AccessibilitySettings: () => <div data-testid="accessibility-settings">AccessibilitySettings</div>,
}));

jest.mock('@/components/starmap/settings/about-settings', () => ({
  AboutSettings: () => <div data-testid="about-settings">AboutSettings</div>,
}));

jest.mock('@/components/starmap/settings/event-sources-settings', () => ({
  EventSourcesSettings: () => <div data-testid="event-sources-settings">EventSourcesSettings</div>,
}));

jest.mock('@/components/starmap/map', () => ({
  MapProviderSettings: () => <div data-testid="map-provider-settings">MapProviderSettings</div>,
  MapHealthMonitor: () => <div data-testid="map-health-monitor">MapHealthMonitor</div>,
}));

jest.mock('@/components/starmap/management/data-manager', () => ({
  DataManager: () => <div data-testid="data-manager">DataManager</div>,
}));

jest.mock('@/components/starmap/setup-wizard', () => ({
  SetupWizardButton: () => <button data-testid="setup-wizard-button">Setup Wizard</button>,
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

    it('renders tabs component', () => {
      render(<UnifiedSettings />);
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
    });

    it('renders all 5 tab triggers', () => {
      render(<UnifiedSettings />);
      expect(screen.getByTestId('tabs-trigger-display')).toBeInTheDocument();
      expect(screen.getByTestId('tabs-trigger-equipment')).toBeInTheDocument();
      expect(screen.getByTestId('tabs-trigger-preferences')).toBeInTheDocument();
      expect(screen.getByTestId('tabs-trigger-data')).toBeInTheDocument();
      expect(screen.getByTestId('tabs-trigger-about')).toBeInTheDocument();
    });
  });

  describe('Child Components Integration', () => {
    it('renders DisplaySettings, ConnectionSettings, LocationSettings in display tab', () => {
      render(<UnifiedSettings />);
      expect(screen.getByTestId('display-settings')).toBeInTheDocument();
      expect(screen.getByTestId('connection-settings')).toBeInTheDocument();
      expect(screen.getByTestId('location-settings')).toBeInTheDocument();
    });

    it('renders EquipmentSettings, FOVSettings, ExposureSettings in equipment tab', () => {
      render(<UnifiedSettings />);
      expect(screen.getByTestId('equipment-settings')).toBeInTheDocument();
      expect(screen.getByTestId('fov-settings')).toBeInTheDocument();
      expect(screen.getByTestId('exposure-settings')).toBeInTheDocument();
    });

    it('renders GeneralSettings, AppearanceSettings, PerformanceSettings, AccessibilitySettings, EventSourcesSettings in preferences tab', () => {
      render(<UnifiedSettings />);
      expect(screen.getByTestId('general-settings')).toBeInTheDocument();
      expect(screen.getByTestId('appearance-settings')).toBeInTheDocument();
      expect(screen.getByTestId('performance-settings')).toBeInTheDocument();
      expect(screen.getByTestId('accessibility-settings')).toBeInTheDocument();
      expect(screen.getByTestId('event-sources-settings')).toBeInTheDocument();
    });

    it('renders data management components in data tab', () => {
      render(<UnifiedSettings />);
      expect(screen.getByTestId('map-provider-settings')).toBeInTheDocument();
      expect(screen.getByTestId('map-health-monitor')).toBeInTheDocument();
      expect(screen.getByTestId('data-manager')).toBeInTheDocument();
      expect(screen.getByTestId('setup-wizard-button')).toBeInTheDocument();
    });

    it('renders AboutSettings in about tab', () => {
      render(<UnifiedSettings />);
      expect(screen.getByTestId('about-settings')).toBeInTheDocument();
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

    it('renders preferences tab content', () => {
      render(<UnifiedSettings />);
      expect(screen.getByTestId('tabs-content-preferences')).toBeInTheDocument();
    });

    it('renders data tab content', () => {
      render(<UnifiedSettings />);
      expect(screen.getByTestId('tabs-content-data')).toBeInTheDocument();
    });

    it('renders about tab content', () => {
      render(<UnifiedSettings />);
      expect(screen.getByTestId('tabs-content-about')).toBeInTheDocument();
    });
  });
});

describe('UnifiedSettings Store Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should read settings and equipment stores', () => {
    render(<UnifiedSettings />);
    expect(mockUseSettingsStore).toHaveBeenCalled();
    expect(mockUseEquipmentStore).toHaveBeenCalled();
  });
});

describe('UnifiedSettings Export', () => {
  it('exports the UnifiedSettings component', () => {
    expect(UnifiedSettings).toBeDefined();
    expect(typeof UnifiedSettings).toBe('function');
  });
});
