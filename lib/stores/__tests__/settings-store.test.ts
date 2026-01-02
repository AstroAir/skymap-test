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

describe('Settings Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useSettingsStore.setState({
      connection: { ip: 'localhost', port: '1888' },
      backendProtocol: 'http',
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
        azimuthalLinesVisible: true,
        equatorialLinesVisible: true,
        meridianLinesVisible: true,
        eclipticLinesVisible: true,
        atmosphereVisible: true,
        landscapesVisible: true,
        dsosVisible: false,
        surveyEnabled: false,
        surveyId: 'mellinger',
        surveyUrl: 'https://example.com',
        skyCultureLanguage: 'en' as const,
        nightMode: true,
        sensorControl: true,
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
});
