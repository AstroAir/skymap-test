/**
 * @jest-environment jsdom
 */
import { useSettingsStore } from '../settings-store';

// Mock zustand persist middleware
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

const DEFAULT_STELLARIUM = {
  constellationsLinesVisible: true,
  constellationArtVisible: false,
  constellationLabelsVisible: true,
  starLabelsVisible: true,
  planetLabelsVisible: true,
  azimuthalLinesVisible: false,
  equatorialLinesVisible: false,
  meridianLinesVisible: false,
  eclipticLinesVisible: false,
  atmosphereVisible: false,
  landscapesVisible: false,
  dsosVisible: true,
  milkyWayVisible: true,
  fogVisible: false,
  surveyEnabled: true,
  surveyId: 'dss',
  surveyUrl: undefined,
  skyCultureLanguage: 'native' as const,
  nightMode: false,
  sensorControl: false,
  crosshairVisible: true,
  crosshairColor: 'rgba(255, 255, 255, 0.3)',
  projectionType: 'stereographic' as const,
  bortleIndex: 3,
  starLinearScale: 0.8,
  starRelativeScale: 1.1,
  displayLimitMag: 99,
  flipViewVertical: false,
  flipViewHorizontal: false,
  exposureScale: 2,
};

const DEFAULT_PREFERENCES = {
  locale: 'en' as const,
  timeFormat: '24h' as const,
  dateFormat: 'iso' as const,
  coordinateFormat: 'dms' as const,
  distanceUnit: 'metric' as const,
  temperatureUnit: 'celsius' as const,
  skipCloseConfirmation: false,
  rightPanelCollapsed: false,
  startupView: 'last' as const,
  showSplash: true,
  autoConnectBackend: true,
};

const DEFAULT_PERFORMANCE = {
  renderQuality: 'high' as const,
  enableAnimations: true,
  reducedMotion: false,
  maxStarsRendered: 50000,
  enableAntialiasing: true,
  showFPS: false,
};

const DEFAULT_ACCESSIBILITY = {
  highContrast: false,
  largeText: false,
  screenReaderOptimized: false,
  reduceTransparency: false,
  focusIndicators: true,
};

const DEFAULT_NOTIFICATIONS = {
  enableSounds: false,
  enableToasts: true,
  toastDuration: 4000,
  showObjectAlerts: true,
  showSatelliteAlerts: true,
};

const DEFAULT_SEARCH = {
  autoSearchDelay: 300,
  enableFuzzySearch: true,
  maxSearchResults: 50,
  includeMinorObjects: false,
  rememberSearchHistory: true,
  maxHistoryItems: 20,
};

describe('Settings Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useSettingsStore.setState({
      connection: { ip: 'localhost', port: '1888' },
      backendProtocol: 'http',
      stellarium: DEFAULT_STELLARIUM,
      preferences: DEFAULT_PREFERENCES,
      performance: DEFAULT_PERFORMANCE,
      accessibility: DEFAULT_ACCESSIBILITY,
      notifications: DEFAULT_NOTIFICATIONS,
      search: DEFAULT_SEARCH,
    });
  });

  // ============================================================================
  // Initial state
  // ============================================================================
  describe('initial state', () => {
    it('has default connection settings', () => {
      const state = useSettingsStore.getState();
      expect(state.connection.ip).toBe('localhost');
      expect(state.connection.port).toBe('1888');
    });

    it('has default backend protocol', () => {
      const state = useSettingsStore.getState();
      expect(state.backendProtocol).toBe('http');
    });

    it('has default stellarium settings', () => {
      const state = useSettingsStore.getState();
      expect(state.stellarium).toBeDefined();
      expect(state.stellarium.constellationsLinesVisible).toBe(true);
      expect(state.stellarium.dsosVisible).toBe(true);
    });

    it('has default survey settings', () => {
      const state = useSettingsStore.getState();
      expect(state.stellarium.surveyEnabled).toBe(true);
      expect(state.stellarium.surveyId).toBe('dss');
    });

    it('has default sky culture language', () => {
      const state = useSettingsStore.getState();
      expect(state.stellarium.skyCultureLanguage).toBe('native');
    });
  });

  // ============================================================================
  // setConnection
  // ============================================================================
  describe('setConnection', () => {
    it('updates IP', () => {
      useSettingsStore.getState().setConnection({ ip: '192.168.1.100' });
      const state = useSettingsStore.getState();
      expect(state.connection.ip).toBe('192.168.1.100');
      expect(state.connection.port).toBe('1888'); // Port should remain unchanged
    });

    it('updates port', () => {
      useSettingsStore.getState().setConnection({ port: '8080' });
      const state = useSettingsStore.getState();
      expect(state.connection.port).toBe('8080');
      expect(state.connection.ip).toBe('localhost'); // IP should remain unchanged
    });

    it('updates both IP and port', () => {
      useSettingsStore.getState().setConnection({ ip: '10.0.0.1', port: '3000' });
      const state = useSettingsStore.getState();
      expect(state.connection.ip).toBe('10.0.0.1');
      expect(state.connection.port).toBe('3000');
    });
  });

  // ============================================================================
  // setBackendProtocol
  // ============================================================================
  describe('setBackendProtocol', () => {
    it('changes protocol to https', () => {
      useSettingsStore.getState().setBackendProtocol('https');
      expect(useSettingsStore.getState().backendProtocol).toBe('https');
    });

    it('changes protocol to http', () => {
      useSettingsStore.getState().setBackendProtocol('https');
      useSettingsStore.getState().setBackendProtocol('http');
      expect(useSettingsStore.getState().backendProtocol).toBe('http');
    });
  });

  // ============================================================================
  // setStellariumSetting
  // ============================================================================
  describe('setStellariumSetting', () => {
    it('updates boolean setting', () => {
      useSettingsStore.getState().setStellariumSetting('atmosphereVisible', true);
      expect(useSettingsStore.getState().stellarium.atmosphereVisible).toBe(true);
    });

    it('updates string setting', () => {
      useSettingsStore.getState().setStellariumSetting('surveyId', 'panstarrs');
      expect(useSettingsStore.getState().stellarium.surveyId).toBe('panstarrs');
    });

    it('updates sky culture language', () => {
      useSettingsStore.getState().setStellariumSetting('skyCultureLanguage', 'zh');
      expect(useSettingsStore.getState().stellarium.skyCultureLanguage).toBe('zh');
    });

    it('preserves other settings', () => {
      const originalSettings = { ...useSettingsStore.getState().stellarium };
      useSettingsStore.getState().setStellariumSetting('atmosphereVisible', true);
      
      const state = useSettingsStore.getState();
      expect(state.stellarium.constellationsLinesVisible).toBe(originalSettings.constellationsLinesVisible);
      expect(state.stellarium.dsosVisible).toBe(originalSettings.dsosVisible);
    });
  });

  // ============================================================================
  // setStellariumSettings
  // ============================================================================
  describe('setStellariumSettings', () => {
    it('replaces all settings', () => {
      const newSettings = {
        constellationsLinesVisible: false,
        constellationArtVisible: true,
        constellationLabelsVisible: false,
        starLabelsVisible: false,
        planetLabelsVisible: false,
        azimuthalLinesVisible: true,
        equatorialLinesVisible: true,
        meridianLinesVisible: true,
        eclipticLinesVisible: true,
        atmosphereVisible: true,
        landscapesVisible: true,
        dsosVisible: false,
        milkyWayVisible: true,
        fogVisible: false,
        surveyEnabled: false,
        surveyId: 'mellinger',
        surveyUrl: 'https://example.com',
        skyCultureLanguage: 'en' as const,
        nightMode: true,
        sensorControl: true,
        crosshairVisible: false,
        crosshairColor: '#ff0000',
        projectionType: 'stereographic' as const,
        bortleIndex: 5,
        starLinearScale: 1.0,
        starRelativeScale: 1.5,
        displayLimitMag: 15,
        flipViewVertical: true,
        flipViewHorizontal: false,
        exposureScale: 3,
      };

      useSettingsStore.getState().setStellariumSettings(newSettings);
      const state = useSettingsStore.getState();

      expect(state.stellarium).toEqual(newSettings);
    });
  });

  // ============================================================================
  // toggleStellariumSetting
  // ============================================================================
  describe('toggleStellariumSetting', () => {
    it('toggles boolean from false to true', () => {
      expect(useSettingsStore.getState().stellarium.atmosphereVisible).toBe(false);
      useSettingsStore.getState().toggleStellariumSetting('atmosphereVisible');
      expect(useSettingsStore.getState().stellarium.atmosphereVisible).toBe(true);
    });

    it('toggles boolean from true to false', () => {
      expect(useSettingsStore.getState().stellarium.constellationsLinesVisible).toBe(true);
      useSettingsStore.getState().toggleStellariumSetting('constellationsLinesVisible');
      expect(useSettingsStore.getState().stellarium.constellationsLinesVisible).toBe(false);
    });

    it('does not change non-boolean settings', () => {
      const originalSurveyId = useSettingsStore.getState().stellarium.surveyId;
      useSettingsStore.getState().toggleStellariumSetting('surveyId');
      expect(useSettingsStore.getState().stellarium.surveyId).toBe(originalSurveyId);
    });
  });

  // ============================================================================
  // Preferences
  // ============================================================================
  describe('preferences', () => {
    it('has default preferences', () => {
      const state = useSettingsStore.getState();
      expect(state.preferences.locale).toBe('en');
      expect(state.preferences.timeFormat).toBe('24h');
      expect(state.preferences.dateFormat).toBe('iso');
      expect(state.preferences.coordinateFormat).toBe('dms');
      expect(state.preferences.distanceUnit).toBe('metric');
      expect(state.preferences.temperatureUnit).toBe('celsius');
      expect(state.preferences.startupView).toBe('last');
      expect(state.preferences.showSplash).toBe(true);
      expect(state.preferences.autoConnectBackend).toBe(true);
      expect(state.preferences.skipCloseConfirmation).toBe(false);
    });

    it('setPreference updates single preference', () => {
      useSettingsStore.getState().setPreference('locale', 'zh');
      expect(useSettingsStore.getState().preferences.locale).toBe('zh');
      expect(useSettingsStore.getState().preferences.timeFormat).toBe('24h');
    });

    it('setPreferences updates multiple preferences', () => {
      useSettingsStore.getState().setPreferences({
        locale: 'zh',
        timeFormat: '12h',
        distanceUnit: 'imperial',
      });
      const state = useSettingsStore.getState();
      expect(state.preferences.locale).toBe('zh');
      expect(state.preferences.timeFormat).toBe('12h');
      expect(state.preferences.distanceUnit).toBe('imperial');
      expect(state.preferences.dateFormat).toBe('iso');
    });
  });

  // ============================================================================
  // Performance
  // ============================================================================
  describe('performance', () => {
    it('has default performance settings', () => {
      const state = useSettingsStore.getState();
      expect(state.performance.renderQuality).toBe('high');
      expect(state.performance.enableAnimations).toBe(true);
      expect(state.performance.maxStarsRendered).toBe(50000);
    });

    it('setPerformanceSetting updates single setting', () => {
      useSettingsStore.getState().setPerformanceSetting('renderQuality', 'ultra');
      expect(useSettingsStore.getState().performance.renderQuality).toBe('ultra');
    });

    it('setPerformanceSetting updates boolean setting', () => {
      useSettingsStore.getState().setPerformanceSetting('showFPS', true);
      expect(useSettingsStore.getState().performance.showFPS).toBe(true);
    });

    it('setPerformanceSettings updates multiple settings', () => {
      useSettingsStore.getState().setPerformanceSettings({
        renderQuality: 'low',
        maxStarsRendered: 10000,
        enableAntialiasing: false,
      });
      const state = useSettingsStore.getState();
      expect(state.performance.renderQuality).toBe('low');
      expect(state.performance.maxStarsRendered).toBe(10000);
      expect(state.performance.enableAntialiasing).toBe(false);
      expect(state.performance.enableAnimations).toBe(true);
    });
  });

  // ============================================================================
  // Accessibility
  // ============================================================================
  describe('accessibility', () => {
    it('has default accessibility settings', () => {
      const state = useSettingsStore.getState();
      expect(state.accessibility.highContrast).toBe(false);
      expect(state.accessibility.largeText).toBe(false);
      expect(state.accessibility.focusIndicators).toBe(true);
    });

    it('setAccessibilitySetting updates single setting', () => {
      useSettingsStore.getState().setAccessibilitySetting('highContrast', true);
      expect(useSettingsStore.getState().accessibility.highContrast).toBe(true);
    });

    it('setAccessibilitySettings updates multiple settings', () => {
      useSettingsStore.getState().setAccessibilitySettings({
        highContrast: true,
        largeText: true,
        reduceTransparency: true,
      });
      const state = useSettingsStore.getState();
      expect(state.accessibility.highContrast).toBe(true);
      expect(state.accessibility.largeText).toBe(true);
      expect(state.accessibility.reduceTransparency).toBe(true);
      expect(state.accessibility.focusIndicators).toBe(true);
    });
  });

  // ============================================================================
  // Notifications
  // ============================================================================
  describe('notifications', () => {
    it('has default notification settings', () => {
      const state = useSettingsStore.getState();
      expect(state.notifications.enableSounds).toBe(false);
      expect(state.notifications.enableToasts).toBe(true);
      expect(state.notifications.toastDuration).toBe(4000);
    });

    it('setNotificationSetting updates single setting', () => {
      useSettingsStore.getState().setNotificationSetting('enableSounds', true);
      expect(useSettingsStore.getState().notifications.enableSounds).toBe(true);
    });

    it('setNotificationSetting updates numeric setting', () => {
      useSettingsStore.getState().setNotificationSetting('toastDuration', 5000);
      expect(useSettingsStore.getState().notifications.toastDuration).toBe(5000);
    });

    it('setNotificationSettings updates multiple settings', () => {
      useSettingsStore.getState().setNotificationSettings({
        enableSounds: true,
        toastDuration: 3000,
        showObjectAlerts: false,
      });
      const state = useSettingsStore.getState();
      expect(state.notifications.enableSounds).toBe(true);
      expect(state.notifications.toastDuration).toBe(3000);
      expect(state.notifications.showObjectAlerts).toBe(false);
      expect(state.notifications.enableToasts).toBe(true);
    });
  });

  // ============================================================================
  // Search
  // ============================================================================
  describe('search', () => {
    it('has default search settings', () => {
      const state = useSettingsStore.getState();
      expect(state.search.autoSearchDelay).toBe(300);
      expect(state.search.enableFuzzySearch).toBe(true);
      expect(state.search.maxSearchResults).toBe(50);
    });

    it('setSearchSetting updates single setting', () => {
      useSettingsStore.getState().setSearchSetting('maxSearchResults', 100);
      expect(useSettingsStore.getState().search.maxSearchResults).toBe(100);
    });

    it('setSearchSettings updates multiple settings', () => {
      useSettingsStore.getState().setSearchSettings({
        autoSearchDelay: 500,
        enableFuzzySearch: false,
        maxHistoryItems: 50,
      });
      const state = useSettingsStore.getState();
      expect(state.search.autoSearchDelay).toBe(500);
      expect(state.search.enableFuzzySearch).toBe(false);
      expect(state.search.maxHistoryItems).toBe(50);
      expect(state.search.maxSearchResults).toBe(50);
    });
  });

  // ============================================================================
  // resetToDefaults
  // ============================================================================
  describe('resetToDefaults', () => {
    it('resets all settings to defaults', () => {
      // Modify all settings
      useSettingsStore.getState().setPreference('locale', 'zh');
      useSettingsStore.getState().setPerformanceSetting('renderQuality', 'low');
      useSettingsStore.getState().setAccessibilitySetting('highContrast', true);
      useSettingsStore.getState().setNotificationSetting('enableSounds', true);
      useSettingsStore.getState().setSearchSetting('maxSearchResults', 200);
      useSettingsStore.getState().setStellariumSetting('atmosphereVisible', true);

      // Reset
      useSettingsStore.getState().resetToDefaults();

      // Verify defaults are restored
      const state = useSettingsStore.getState();
      expect(state.preferences.locale).toBe('en');
      expect(state.performance.renderQuality).toBe('high');
      expect(state.accessibility.highContrast).toBe(false);
      expect(state.notifications.enableSounds).toBe(false);
      expect(state.search.maxSearchResults).toBe(50);
      expect(state.stellarium.atmosphereVisible).toBe(false);
    });

    it('does not reset connection settings', () => {
      useSettingsStore.getState().setConnection({ ip: '192.168.1.1' });
      useSettingsStore.getState().resetToDefaults();
      
      // Connection should remain changed
      expect(useSettingsStore.getState().connection.ip).toBe('192.168.1.1');
    });
  });
});
