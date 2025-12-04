import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getZustandStorage } from '@/lib/storage';
import type { StellariumSettings } from '../types';

interface SettingsState {
  // Connection settings
  connection: {
    ip: string;
    port: string;
  };
  backendProtocol: 'http' | 'https';
  
  // Stellarium display settings
  stellarium: StellariumSettings;
  
  // Actions
  setConnection: (connection: Partial<SettingsState['connection']>) => void;
  setBackendProtocol: (protocol: 'http' | 'https') => void;
  setStellariumSetting: <K extends keyof StellariumSettings>(key: K, value: StellariumSettings[K]) => void;
  setStellariumSettings: (settings: StellariumSettings) => void;
  toggleStellariumSetting: (key: keyof StellariumSettings) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
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
        surveyId: 'dss', // Default to DSS
        surveyUrl: undefined, // Direct URL for online surveys
        skyCultureLanguage: 'native', // Default to native (Latin) names
      },
      
      setConnection: (connection) => set((state) => ({
        connection: { ...state.connection, ...connection }
      })),
      
      setBackendProtocol: (backendProtocol) => set({ backendProtocol }),
      
      setStellariumSetting: (key, value) => set((state) => ({
        stellarium: { ...state.stellarium, [key]: value }
      })),
      
      setStellariumSettings: (settings) => set({ stellarium: settings }),
      
      toggleStellariumSetting: (key) => set((state) => {
        const currentValue = state.stellarium[key];
        // Only toggle boolean values
        if (typeof currentValue === 'boolean') {
          return {
            stellarium: { ...state.stellarium, [key]: !currentValue }
          };
        }
        return state;
      }),
    }),
    {
      name: 'starmap-settings',
      storage: getZustandStorage(),
      version: 3, // Bump version to add skyCultureLanguage
      migrate: (persistedState, version) => {
        const state = persistedState as SettingsState;
        if (version < 2) {
          // Ensure surveyUrl exists in migrated state
          return {
            ...state,
            stellarium: {
              ...state.stellarium,
              surveyUrl: undefined,
              skyCultureLanguage: 'native',
            },
          };
        }
        if (version < 3) {
          // Add skyCultureLanguage setting
          return {
            ...state,
            stellarium: {
              ...state.stellarium,
              skyCultureLanguage: 'native',
            },
          };
        }
        return state;
      },
    }
  )
);
