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

// Mock keybinding store
jest.mock('@/lib/stores/keybinding-store', () => {
  const defaultBindings: Record<string, { key: string; ctrl?: boolean }> = {
    ZOOM_IN: { key: '+' },
    ZOOM_OUT: { key: '-' },
    RESET_VIEW: { key: 'r' },
    TOGGLE_SEARCH: { key: 'f', ctrl: true },
    TOGGLE_SESSION_PANEL: { key: 'p' },
    TOGGLE_FOV: { key: 'o' },
    TOGGLE_CONSTELLATIONS: { key: 'l' },
    TOGGLE_GRID: { key: 'g' },
    TOGGLE_DSO: { key: 'd' },
    TOGGLE_ATMOSPHERE: { key: 'a' },
    PAUSE_TIME: { key: ' ' },
    SPEED_UP: { key: ']' },
    SLOW_DOWN: { key: '[' },
    RESET_TIME: { key: 't' },
    CLOSE_PANEL: { key: 'Escape' },
  };
  return {
    useKeybindingStore: (selector: (state: unknown) => unknown) => {
      const state = {
        customBindings: {},
        getBinding: (id: string) => defaultBindings[id] || { key: '?' },
        setBinding: jest.fn(),
        resetBinding: jest.fn(),
        resetAllBindings: jest.fn(),
        isCustom: () => false,
        findConflict: () => null,
      };
      return selector ? selector(state) : state;
    },
    formatKeyBinding: (b: { key: string; ctrl?: boolean; shift?: boolean; alt?: boolean }) => {
      const parts: string[] = [];
      if (b.ctrl) parts.push('Ctrl');
      if (b.alt) parts.push('Alt');
      if (b.shift) parts.push('Shift');
      parts.push(b.key.length === 1 ? b.key.toUpperCase() : b.key);
      return parts.join('+');
    },
    eventToKeyBinding: jest.fn(),
    DEFAULT_KEYBINDINGS: defaultBindings,
  };
});

// Mock theme store for export-import
jest.mock('@/lib/stores/theme-store', () => ({
  useThemeStore: Object.assign(
    (selector: (state: unknown) => unknown) => {
      const state = {
        customization: { radius: 0.5, fontFamily: 'default', fontSize: 'default', animationsEnabled: true, activePreset: null },
        setRadius: jest.fn(),
        setFontFamily: jest.fn(),
        setFontSize: jest.fn(),
        setAnimationsEnabled: jest.fn(),
        setActivePreset: jest.fn(),
        resetCustomization: jest.fn(),
      };
      return selector ? selector(state) : state;
    },
    {
      getState: () => ({
        customization: { radius: 0.5, fontFamily: 'default', fontSize: 'default', animationsEnabled: true, activePreset: null },
        setRadius: jest.fn(),
        setFontFamily: jest.fn(),
        setFontSize: jest.fn(),
        setActivePreset: jest.fn(),
      }),
    }
  ),
  themePresets: [
    { id: 'default', name: 'Default', colors: { light: { primary: '#000', secondary: '#666', accent: '#999' }, dark: { primary: '#fff', secondary: '#999', accent: '#666' } } },
  ],
}));

// Import components after mocks
import { GeneralSettings } from '../general-settings';
import { PerformanceSettings } from '../performance-settings';
import { AccessibilitySettings } from '../accessibility-settings';
import { NotificationSettings } from '../notification-settings';
import { SearchBehaviorSettings } from '../search-settings';
import { KeyboardSettings } from '../keyboard-settings';
import { SettingsExportImport } from '../settings-export-import';
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
        skipCloseConfirmation: false,
        startupView: 'last',
        showSplash: true,
        autoConnectBackend: true,
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

  describe('NotificationSettings', () => {
    it('renders without crashing', () => {
      const { container } = render(<NotificationSettings />);
      expect(container).toBeInTheDocument();
    });

    it('renders switch controls for notification toggles', () => {
      render(<NotificationSettings />);
      const switches = screen.getAllByRole('switch');
      expect(switches.length).toBeGreaterThanOrEqual(2);
    });

    it('renders collapsible sections', () => {
      render(<NotificationSettings />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('SearchBehaviorSettings', () => {
    it('renders without crashing', () => {
      const { container } = render(<SearchBehaviorSettings />);
      expect(container).toBeInTheDocument();
    });

    it('renders switch controls for search toggles', () => {
      render(<SearchBehaviorSettings />);
      const switches = screen.getAllByRole('switch');
      expect(switches.length).toBeGreaterThanOrEqual(2);
    });

    it('renders collapsible sections', () => {
      render(<SearchBehaviorSettings />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('KeyboardSettings', () => {
    it('renders without crashing', () => {
      const { container } = render(<KeyboardSettings />);
      expect(container).toBeInTheDocument();
    });

    it('renders collapsible sections for shortcut groups', () => {
      render(<KeyboardSettings />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('SettingsExportImport', () => {
    it('renders without crashing', () => {
      const { container } = render(<SettingsExportImport />);
      expect(container).toBeInTheDocument();
    });

    it('renders export and import buttons', () => {
      render(<SettingsExportImport />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
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
      expect(screen.getByText(/v\d+\.\d+\.\d+/)).toBeInTheDocument();
    });

    it('renders Stellarium Web Engine text', () => {
      render(<AboutSettings />);
      expect(screen.getByText('Stellarium Web Engine')).toBeInTheDocument();
    });
  });
});
