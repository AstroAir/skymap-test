import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getZustandStorage } from '@/lib/storage';
import type { StellariumSettings, SkyEngineType, AladinDisplaySettings } from '@/lib/core/types';
import { DEFAULT_ALADIN_DISPLAY_SETTINGS } from '@/lib/core/types/stellarium';
import { DEFAULT_STELLARIUM_SETTINGS } from '@/components/starmap/settings/settings-constants';

// ============================================================================
// Types
// ============================================================================

export type AppLocale = 'en' | 'zh';
export type TimeFormat = '12h' | '24h';
export type DateFormat = 'iso' | 'us' | 'eu';
export type CoordinateFormat = 'degrees' | 'dms' | 'hms';
export type DistanceUnit = 'metric' | 'imperial';
export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type RenderQuality = 'low' | 'medium' | 'high' | 'ultra';
export type StartupView = 'last' | 'default' | 'custom';

export interface AppPreferences {
  locale: AppLocale;
  timeFormat: TimeFormat;
  dateFormat: DateFormat;
  coordinateFormat: CoordinateFormat;
  distanceUnit: DistanceUnit;
  temperatureUnit: TemperatureUnit;
  skipCloseConfirmation: boolean;
  rightPanelCollapsed: boolean;
  startupView: StartupView;
  showSplash: boolean;
  autoConnectBackend: boolean;
}

export interface PerformanceSettings {
  renderQuality: RenderQuality;
  enableAnimations: boolean;
  reducedMotion: boolean;
  maxStarsRendered: number;
  enableAntialiasing: boolean;
  showFPS: boolean;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  screenReaderOptimized: boolean;
  reduceTransparency: boolean;
  focusIndicators: boolean;
}

export interface NotificationSettings {
  enableSounds: boolean;
  enableToasts: boolean;
  toastDuration: number;
  showObjectAlerts: boolean;
  showSatelliteAlerts: boolean;
}

export interface SearchSettings {
  autoSearchDelay: number;
  enableFuzzySearch: boolean;
  maxSearchResults: number;
  includeMinorObjects: boolean;
  rememberSearchHistory: boolean;
  maxHistoryItems: number;
}

interface SettingsState {
  // Connection settings
  connection: {
    ip: string;
    port: string;
  };
  backendProtocol: 'http' | 'https';
  
  // Sky engine selection
  skyEngine: SkyEngineType;
  
  // Stellarium display settings
  stellarium: StellariumSettings;
  
  // App preferences
  preferences: AppPreferences;
  
  // Performance settings
  performance: PerformanceSettings;
  
  // Accessibility settings
  accessibility: AccessibilitySettings;
  
  // Notification settings
  notifications: NotificationSettings;
  
  // Search settings
  search: SearchSettings;
  
  // Aladin display settings
  aladinDisplay: AladinDisplaySettings;
  
  // Actions - Connection
  setConnection: (connection: Partial<SettingsState['connection']>) => void;
  setBackendProtocol: (protocol: 'http' | 'https') => void;
  
  // Actions - Sky Engine
  setSkyEngine: (engine: SkyEngineType) => void;
  
  // Actions - Stellarium
  setStellariumSetting: <K extends keyof StellariumSettings>(key: K, value: StellariumSettings[K]) => void;
  setStellariumSettings: (settings: StellariumSettings) => void;
  toggleStellariumSetting: (key: keyof StellariumSettings) => void;
  
  // Actions - Preferences
  setPreference: <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => void;
  setPreferences: (preferences: Partial<AppPreferences>) => void;
  
  // Actions - Performance
  setPerformanceSetting: <K extends keyof PerformanceSettings>(key: K, value: PerformanceSettings[K]) => void;
  setPerformanceSettings: (settings: Partial<PerformanceSettings>) => void;
  
  // Actions - Accessibility
  setAccessibilitySetting: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void;
  setAccessibilitySettings: (settings: Partial<AccessibilitySettings>) => void;
  
  // Actions - Notifications
  setNotificationSetting: <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => void;
  setNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  
  // Actions - Search
  setSearchSetting: <K extends keyof SearchSettings>(key: K, value: SearchSettings[K]) => void;
  setSearchSettings: (settings: Partial<SearchSettings>) => void;
  
  // Actions - Aladin Display
  setAladinDisplaySetting: <K extends keyof AladinDisplaySettings>(key: K, value: AladinDisplaySettings[K]) => void;
  setAladinDisplaySettings: (settings: Partial<AladinDisplaySettings>) => void;
  toggleAladinDisplaySetting: (key: keyof AladinDisplaySettings) => void;
  
  // Actions - Reset
  resetToDefaults: () => void;
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_PREFERENCES: AppPreferences = {
  locale: 'en',
  timeFormat: '24h',
  dateFormat: 'iso',
  coordinateFormat: 'dms',
  distanceUnit: 'metric',
  temperatureUnit: 'celsius',
  skipCloseConfirmation: false,
  rightPanelCollapsed: false,
  startupView: 'last',
  showSplash: true,
  autoConnectBackend: true,
};

const DEFAULT_PERFORMANCE: PerformanceSettings = {
  renderQuality: 'high',
  enableAnimations: true,
  reducedMotion: false,
  maxStarsRendered: 50000,
  enableAntialiasing: true,
  showFPS: false,
};

const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  screenReaderOptimized: false,
  reduceTransparency: false,
  focusIndicators: true,
};

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  enableSounds: false,
  enableToasts: true,
  toastDuration: 4000,
  showObjectAlerts: true,
  showSatelliteAlerts: true,
};

const DEFAULT_SEARCH: SearchSettings = {
  autoSearchDelay: 300,
  enableFuzzySearch: true,
  maxSearchResults: 50,
  includeMinorObjects: false,
  rememberSearchHistory: true,
  maxHistoryItems: 20,
};

const DEFAULT_STELLARIUM: StellariumSettings = DEFAULT_STELLARIUM_SETTINGS;

// ============================================================================
// Store
// ============================================================================

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Initial state
      connection: {
        ip: 'localhost',
        port: '1888',
      },
      backendProtocol: 'http',
      skyEngine: 'stellarium' as SkyEngineType,
      stellarium: DEFAULT_STELLARIUM,
      preferences: DEFAULT_PREFERENCES,
      performance: DEFAULT_PERFORMANCE,
      accessibility: DEFAULT_ACCESSIBILITY,
      notifications: DEFAULT_NOTIFICATIONS,
      search: DEFAULT_SEARCH,
      aladinDisplay: DEFAULT_ALADIN_DISPLAY_SETTINGS,
      
      // Actions - Connection
      setConnection: (connection) => set((state) => ({
        connection: { ...state.connection, ...connection }
      })),
      
      setBackendProtocol: (backendProtocol) => set({ backendProtocol }),
      
      // Actions - Sky Engine
      setSkyEngine: (skyEngine) => set({ skyEngine }),
      
      // Actions - Stellarium
      setStellariumSetting: (key, value) => set((state) => ({
        stellarium: { ...state.stellarium, [key]: value }
      })),
      
      setStellariumSettings: (settings) => set({ stellarium: settings }),
      
      toggleStellariumSetting: (key) => set((state) => {
        const currentValue = state.stellarium[key];
        if (typeof currentValue === 'boolean') {
          return {
            stellarium: { ...state.stellarium, [key]: !currentValue }
          };
        }
        return state;
      }),
      
      // Actions - Preferences
      setPreference: (key, value) => set((state) => ({
        preferences: { ...state.preferences, [key]: value }
      })),
      
      setPreferences: (preferences) => set((state) => ({
        preferences: { ...state.preferences, ...preferences }
      })),
      
      // Actions - Performance
      setPerformanceSetting: (key, value) => set((state) => ({
        performance: { ...state.performance, [key]: value }
      })),
      
      setPerformanceSettings: (settings) => set((state) => ({
        performance: { ...state.performance, ...settings }
      })),
      
      // Actions - Accessibility
      setAccessibilitySetting: (key, value) => set((state) => ({
        accessibility: { ...state.accessibility, [key]: value }
      })),
      
      setAccessibilitySettings: (settings) => set((state) => ({
        accessibility: { ...state.accessibility, ...settings }
      })),
      
      // Actions - Notifications
      setNotificationSetting: (key, value) => set((state) => ({
        notifications: { ...state.notifications, [key]: value }
      })),
      
      setNotificationSettings: (settings) => set((state) => ({
        notifications: { ...state.notifications, ...settings }
      })),
      
      // Actions - Search
      setSearchSetting: (key, value) => set((state) => ({
        search: { ...state.search, [key]: value }
      })),
      
      setSearchSettings: (settings) => set((state) => ({
        search: { ...state.search, ...settings }
      })),
      
      // Actions - Aladin Display
      setAladinDisplaySetting: (key, value) => set((state) => ({
        aladinDisplay: { ...state.aladinDisplay, [key]: value }
      })),
      
      setAladinDisplaySettings: (settings) => set((state) => ({
        aladinDisplay: { ...state.aladinDisplay, ...settings }
      })),
      
      toggleAladinDisplaySetting: (key) => set((state) => {
        const currentValue = state.aladinDisplay[key];
        if (typeof currentValue === 'boolean') {
          return {
            aladinDisplay: { ...state.aladinDisplay, [key]: !currentValue }
          };
        }
        return state;
      }),
      
      // Actions - Reset
      resetToDefaults: () => set({
        skyEngine: 'stellarium' as SkyEngineType,
        stellarium: DEFAULT_STELLARIUM,
        preferences: DEFAULT_PREFERENCES,
        performance: DEFAULT_PERFORMANCE,
        accessibility: DEFAULT_ACCESSIBILITY,
        notifications: DEFAULT_NOTIFICATIONS,
        search: DEFAULT_SEARCH,
        aladinDisplay: DEFAULT_ALADIN_DISPLAY_SETTINGS,
      }),
    }),
    {
      name: 'starmap-settings',
      storage: getZustandStorage(),
      version: 9, // Add skyEngine field for dual-engine support
      migrate: (persistedState, version) => {
        const state = persistedState as Partial<SettingsState>;
        
        // Migration from older versions
        if (version < 7) {
          return {
            ...state,
            skyEngine: 'stellarium' as SkyEngineType,
            stellarium: {
              ...DEFAULT_STELLARIUM,
              ...state.stellarium,
            },
            preferences: {
              ...DEFAULT_PREFERENCES,
              ...state.preferences,
            },
            performance: {
              ...DEFAULT_PERFORMANCE,
              ...state.performance,
            },
            accessibility: {
              ...DEFAULT_ACCESSIBILITY,
              ...state.accessibility,
            },
            notifications: {
              ...DEFAULT_NOTIFICATIONS,
              ...state.notifications,
            },
            search: {
              ...DEFAULT_SEARCH,
              ...state.search,
            },
          };
        }
        
        // Migration from v7 to v8: add skyEngine
        if (version < 8) {
          return {
            ...state,
            skyEngine: state.skyEngine ?? ('stellarium' as SkyEngineType),
          };
        }
        
        // Migration from v8 to v9: add aladinDisplay
        if (version < 9) {
          return {
            ...state,
            aladinDisplay: {
              ...DEFAULT_ALADIN_DISPLAY_SETTINGS,
              ...(state as Record<string, unknown>).aladinDisplay as Partial<AladinDisplaySettings> | undefined,
            },
          };
        }
        
        return state;
      },
      partialize: (state) => ({
        connection: state.connection,
        backendProtocol: state.backendProtocol,
        skyEngine: state.skyEngine,
        stellarium: state.stellarium,
        preferences: state.preferences,
        performance: state.performance,
        accessibility: state.accessibility,
        notifications: state.notifications,
        search: state.search,
        aladinDisplay: state.aladinDisplay,
      }),
    }
  )
);
