import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
      },
      
      setConnection: (connection) => set((state) => ({
        connection: { ...state.connection, ...connection }
      })),
      
      setBackendProtocol: (backendProtocol) => set({ backendProtocol }),
      
      setStellariumSetting: (key, value) => set((state) => ({
        stellarium: { ...state.stellarium, [key]: value }
      })),
      
      setStellariumSettings: (settings) => set({ stellarium: settings }),
      
      toggleStellariumSetting: (key) => set((state) => ({
        stellarium: { ...state.stellarium, [key]: !state.stellarium[key] }
      })),
    }),
    {
      name: 'starmap-settings',
    }
  )
);
