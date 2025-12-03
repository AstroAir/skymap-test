/**
 * @jest-environment jsdom
 */
import { useSettingsStore } from '../settings-store';

// Mock zustand persist
jest.mock('zustand/middleware', () => ({
  persist: (config: unknown) => config,
}));

describe('useSettingsStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useSettingsStore.setState({
      connection: {
        ip: 'localhost',
        port: '1888',
      },
      backendProtocol: 'http',
      stellarium: {
        constellationsLinesVisible: true,
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
      },
    });
  });

  describe('initial state', () => {
    it('has default connection settings', () => {
      const { connection } = useSettingsStore.getState();
      expect(connection.ip).toBe('localhost');
      expect(connection.port).toBe('1888');
    });

    it('has default backend protocol', () => {
      const { backendProtocol } = useSettingsStore.getState();
      expect(backendProtocol).toBe('http');
    });

    it('has default stellarium settings', () => {
      const { stellarium } = useSettingsStore.getState();
      expect(stellarium.constellationsLinesVisible).toBe(true);
      expect(stellarium.dsosVisible).toBe(true);
      expect(stellarium.surveyEnabled).toBe(true);
      expect(stellarium.surveyId).toBe('dss');
      expect(stellarium.skyCultureLanguage).toBe('native');
    });
  });

  describe('setConnection', () => {
    it('updates connection settings partially', () => {
      useSettingsStore.getState().setConnection({ ip: '192.168.1.100' });
      
      const { connection } = useSettingsStore.getState();
      expect(connection.ip).toBe('192.168.1.100');
      expect(connection.port).toBe('1888'); // unchanged
    });

    it('updates port', () => {
      useSettingsStore.getState().setConnection({ port: '8080' });
      
      const { connection } = useSettingsStore.getState();
      expect(connection.port).toBe('8080');
    });
  });

  describe('setBackendProtocol', () => {
    it('sets protocol to https', () => {
      useSettingsStore.getState().setBackendProtocol('https');
      
      expect(useSettingsStore.getState().backendProtocol).toBe('https');
    });

    it('sets protocol to http', () => {
      useSettingsStore.getState().setBackendProtocol('https');
      useSettingsStore.getState().setBackendProtocol('http');
      
      expect(useSettingsStore.getState().backendProtocol).toBe('http');
    });
  });

  describe('setStellariumSetting', () => {
    it('sets individual stellarium setting', () => {
      useSettingsStore.getState().setStellariumSetting('constellationsLinesVisible', false);
      
      expect(useSettingsStore.getState().stellarium.constellationsLinesVisible).toBe(false);
    });

    it('sets survey ID', () => {
      useSettingsStore.getState().setStellariumSetting('surveyId', 'panstarrs');
      
      expect(useSettingsStore.getState().stellarium.surveyId).toBe('panstarrs');
    });

    it('sets sky culture language', () => {
      useSettingsStore.getState().setStellariumSetting('skyCultureLanguage', 'zh');
      
      expect(useSettingsStore.getState().stellarium.skyCultureLanguage).toBe('zh');
    });
  });

  describe('setStellariumSettings', () => {
    it('replaces all stellarium settings', () => {
      const newSettings = {
        constellationsLinesVisible: false,
        azimuthalLinesVisible: true,
        equatorialLinesVisible: true,
        meridianLinesVisible: true,
        eclipticLinesVisible: true,
        atmosphereVisible: true,
        landscapesVisible: true,
        dsosVisible: false,
        surveyEnabled: false,
        surveyId: '2mass',
        skyCultureLanguage: 'en' as const,
      };
      
      useSettingsStore.getState().setStellariumSettings(newSettings);
      
      const { stellarium } = useSettingsStore.getState();
      expect(stellarium.constellationsLinesVisible).toBe(false);
      expect(stellarium.azimuthalLinesVisible).toBe(true);
      expect(stellarium.surveyId).toBe('2mass');
      expect(stellarium.skyCultureLanguage).toBe('en');
    });
  });

  describe('toggleStellariumSetting', () => {
    it('toggles boolean setting from true to false', () => {
      useSettingsStore.getState().toggleStellariumSetting('constellationsLinesVisible');
      
      expect(useSettingsStore.getState().stellarium.constellationsLinesVisible).toBe(false);
    });

    it('toggles boolean setting from false to true', () => {
      useSettingsStore.getState().toggleStellariumSetting('azimuthalLinesVisible');
      
      expect(useSettingsStore.getState().stellarium.azimuthalLinesVisible).toBe(true);
    });

    it('does not toggle non-boolean settings', () => {
      const originalSurveyId = useSettingsStore.getState().stellarium.surveyId;
      useSettingsStore.getState().toggleStellariumSetting('surveyId');
      
      expect(useSettingsStore.getState().stellarium.surveyId).toBe(originalSurveyId);
    });
  });
});
