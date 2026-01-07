/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock zustand persist
jest.mock('zustand/middleware', () => ({
  persist: (config: unknown) => config,
}));

// Mock storage
jest.mock('@/lib/storage', () => ({
  getZustandStorage: () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  }),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => '/starmap',
}));

// Mock next-intl
jest.mock('@/components/starmap/settings/general-settings', () => ({
  GeneralSettings: () => <div data-testid="general-settings">General Settings</div>,
}));

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'dark',
    setTheme: jest.fn(),
    resolvedTheme: 'dark',
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock theme store
jest.mock('@/lib/stores/theme-store', () => ({
  useThemeStore: () => ({
    customization: {
      radius: 0.5,
      fontFamily: 'default',
      fontSize: 'default',
      animationsEnabled: true,
      activePreset: null,
    },
    setRadius: jest.fn(),
    setFontFamily: jest.fn(),
    setFontSize: jest.fn(),
    setAnimationsEnabled: jest.fn(),
    setActivePreset: jest.fn(),
    resetCustomization: jest.fn(),
  }),
  themePresets: [
    { id: 'default', name: 'Default', colors: { light: { primary: '#000', secondary: '#666', accent: '#999' }, dark: { primary: '#fff', secondary: '#999', accent: '#666' } } },
  ],
}));

// Import components after mocks
import { GeneralSettings } from '../general-settings';
import { PerformanceSettings } from '../performance-settings';
import { AccessibilitySettings } from '../accessibility-settings';
import { AboutSettings } from '../about-settings';
import { useSettingsStore } from '@/lib/stores';

describe('Settings Components', () => {
  beforeEach(() => {
    // Reset store state
    useSettingsStore.setState({
      preferences: {
        locale: 'en',
        timeFormat: '24h',
        dateFormat: 'iso',
        coordinateFormat: 'dms',
        distanceUnit: 'metric',
        temperatureUnit: 'celsius',
      },
      performance: {
        renderQuality: 'high',
        enableAnimations: true,
        reducedMotion: false,
        maxStarsRendered: 50000,
        enableAntialiasing: true,
        showFPS: false,
      },
      accessibility: {
        highContrast: false,
        largeText: false,
        screenReaderOptimized: false,
        reduceTransparency: false,
        focusIndicators: true,
      },
      notifications: {
        enableSounds: false,
        enableToasts: true,
        toastDuration: 4000,
        showObjectAlerts: true,
        showSatelliteAlerts: true,
      },
      search: {
        autoSearchDelay: 300,
        enableFuzzySearch: true,
        maxSearchResults: 50,
        includeMinorObjects: false,
        rememberSearchHistory: true,
        maxHistoryItems: 20,
      },
    });
  });

  describe('GeneralSettings', () => {
    it('renders without crashing', () => {
      const { container } = render(<GeneralSettings />);
      expect(container).toBeInTheDocument();
    });

    it('renders collapsible sections', () => {
      render(<GeneralSettings />);
      // Check that buttons exist for collapsible sections
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('renders select elements for preferences', () => {
      render(<GeneralSettings />);
      // ComboBox role for Select components
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(0);
    });
  });

  describe('PerformanceSettings', () => {
    it('renders without crashing', () => {
      const { container } = render(<PerformanceSettings />);
      expect(container).toBeInTheDocument();
    });

    it('renders collapsible sections', () => {
      render(<PerformanceSettings />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('renders quality select', () => {
      render(<PerformanceSettings />);
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(0);
    });

    it('renders separator elements', () => {
      render(<PerformanceSettings />);
      const separators = screen.getAllByRole('none');
      expect(separators.length).toBeGreaterThan(0);
    });
  });

  describe('AccessibilitySettings', () => {
    it('renders without crashing', () => {
      const { container } = render(<AccessibilitySettings />);
      expect(container).toBeInTheDocument();
    });

    it('renders collapsible sections', () => {
      render(<AccessibilitySettings />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('renders switch controls for accessibility options', () => {
      render(<AccessibilitySettings />);
      const switches = screen.getAllByRole('switch');
      expect(switches.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('AboutSettings', () => {
    it('renders without crashing', () => {
      const { container } = render(<AboutSettings />);
      expect(container).toBeInTheDocument();
    });

    it('renders collapsible sections', () => {
      render(<AboutSettings />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('renders version badge', () => {
      render(<AboutSettings />);
      expect(screen.getByText(/v1\.0\.0/)).toBeInTheDocument();
    });

    it('renders Stellarium Web Engine text', () => {
      render(<AboutSettings />);
      expect(screen.getByText('Stellarium Web Engine')).toBeInTheDocument();
    });
  });
});
