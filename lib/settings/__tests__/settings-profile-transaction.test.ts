/**
 * @jest-environment jsdom
 */

jest.mock('zustand/middleware', () => ({
  persist: (config: unknown) => config,
}));

jest.mock('@/lib/storage', () => ({
  getZustandStorage: () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  }),
}));

interface MockSettingsDraft {
  connection: typeof settingsStoreState.connection;
  backendProtocol: typeof settingsStoreState.backendProtocol;
  preferences: typeof settingsStoreState.preferences;
  performance: typeof settingsStoreState.performance;
  accessibility: typeof settingsStoreState.accessibility;
  notifications: typeof settingsStoreState.notifications;
  search: typeof settingsStoreState.search;
  location: { latitude: number; longitude: number; elevation: number };
}

const mockApplySettingsTransaction = jest.fn((draft: MockSettingsDraft, options: { domainOrder?: string[] } = {}) => {
  const domainOrder = options.domainOrder ?? [];
  if (domainOrder.includes('connection')) {
    settingsStoreState.connection = draft.connection;
    settingsStoreState.backendProtocol = draft.backendProtocol;
  }
  if (domainOrder.includes('preferences')) {
    settingsStoreState.preferences = draft.preferences;
  }
  if (domainOrder.includes('performance')) {
    settingsStoreState.performance = draft.performance;
  }
  if (domainOrder.includes('accessibility')) {
    settingsStoreState.accessibility = draft.accessibility;
  }
  if (domainOrder.includes('notifications')) {
    settingsStoreState.notifications = draft.notifications;
  }
  if (domainOrder.includes('search')) {
    settingsStoreState.search = draft.search;
  }
  if (domainOrder.includes('location')) {
    mountStoreState.profileInfo = {
      ...mountStoreState.profileInfo,
      AstrometrySettings: {
        Latitude: draft.location.latitude,
        Longitude: draft.location.longitude,
        Elevation: draft.location.elevation,
      },
    };
  }
  return {
    success: true,
    appliedDomains: domainOrder,
    failedDomains: [],
    rolledBackDomains: [],
  };
});

const settingsStoreState = {
  connection: { ip: 'localhost', port: '1888' },
  backendProtocol: 'http',
  skyEngine: 'stellarium-web-engine',
  stellarium: { nightMode: false },
  preferences: { locale: 'en' },
  performance: { reducedMotion: false },
  accessibility: { highContrast: false },
  notifications: { enableToasts: true },
  search: { maxSearchResults: 20 },
  aladinDisplay: { showGrid: false },
  setConnection: jest.fn(function (value) { settingsStoreState.connection = value; }),
  setBackendProtocol: jest.fn(function (value) { settingsStoreState.backendProtocol = value; }),
  setSkyEngine: jest.fn(function (value) { settingsStoreState.skyEngine = value; }),
  setStellariumSettings: jest.fn(function (value) { settingsStoreState.stellarium = value; }),
  setPreferences: jest.fn(function (value) { settingsStoreState.preferences = value; }),
  setPerformanceSettings: jest.fn(function (value) { settingsStoreState.performance = value; }),
  setAccessibilitySettings: jest.fn(function (value) { settingsStoreState.accessibility = value; }),
  setNotificationSettings: jest.fn(function (value) { settingsStoreState.notifications = value; }),
  setSearchSettings: jest.fn(function (value) { settingsStoreState.search = value; }),
  setAladinDisplaySettings: jest.fn(function (value) { settingsStoreState.aladinDisplay = value; }),
};

const mountStoreState = {
  profileInfo: { AstrometrySettings: { Latitude: 0, Longitude: 0, Elevation: 0 } },
  setProfileInfo: jest.fn(function (value) { mountStoreState.profileInfo = value; }),
};

const themeStoreState = {
  customization: {
    radius: 0.5,
    fontFamily: 'default',
    fontSize: 'default',
    animationsEnabled: true,
    activePreset: null,
    customColors: { light: {}, dark: {} },
  },
  userPresets: [],
  replaceUserPresets: jest.fn(function (value) {
    themeStoreState.userPresets = value;
  }),
  setCustomization: jest.fn(function (value) {
    themeStoreState.customization = { ...themeStoreState.customization, ...value };
  }),
};

const keybindingStoreState = {
  customBindings: {},
  resetAllBindings: jest.fn(function () { keybindingStoreState.customBindings = {}; }),
  setBinding: jest.fn(function (actionId, binding) {
    keybindingStoreState.customBindings = { ...keybindingStoreState.customBindings, [actionId]: binding };
  }),
};

const globalShortcutStoreState = {
  enabled: false,
  customBindings: {},
  resetAllBindings: jest.fn(function () { globalShortcutStoreState.customBindings = {}; }),
  setBinding: jest.fn(function (actionId, binding) {
    globalShortcutStoreState.customBindings = { ...globalShortcutStoreState.customBindings, [actionId]: binding };
  }),
  setEnabled: jest.fn(function (enabled) { globalShortcutStoreState.enabled = enabled; }),
};

const equipmentStoreState = {
  sensorWidth: 10,
  sensorHeight: 8,
  focalLength: 400,
  pixelSize: 3.76,
  aperture: 72,
  rotationAngle: 0,
  mosaic: { enabled: false, rows: 1, cols: 1, overlap: 10, overlapUnit: 'percent' },
  fovDisplay: { showGrid: true },
  ocularDisplay: { enabled: false, opacity: 70, showCrosshair: true, appliedFov: null },
  exposureDefaults: { exposureTime: 60 },
  customCameras: [],
  customTelescopes: [],
  customEyepieces: [],
  customBarlows: [],
  customOcularTelescopes: [],
  selectedOcularTelescopeId: 't1',
  selectedEyepieceId: 'e1',
  selectedBarlowId: 'b0',
  setSensorWidth: jest.fn(function (value) { equipmentStoreState.sensorWidth = value; }),
  setSensorHeight: jest.fn(function (value) { equipmentStoreState.sensorHeight = value; }),
  setFocalLength: jest.fn(function (value) { equipmentStoreState.focalLength = value; }),
  setPixelSize: jest.fn(function (value) { equipmentStoreState.pixelSize = value; }),
  setAperture: jest.fn(function (value) { equipmentStoreState.aperture = value; }),
  setRotationAngle: jest.fn(function (value) { equipmentStoreState.rotationAngle = value; }),
  setMosaic: jest.fn(function (value) { equipmentStoreState.mosaic = value; }),
  setFOVDisplay: jest.fn(function (value) { equipmentStoreState.fovDisplay = value; }),
  setOcularDisplay: jest.fn(function (value) { equipmentStoreState.ocularDisplay = value; }),
  setExposureDefaults: jest.fn(function (value) { equipmentStoreState.exposureDefaults = value; }),
  removeCustomCamera: jest.fn(),
  addCustomCamera: jest.fn(),
  removeCustomTelescope: jest.fn(),
  addCustomTelescope: jest.fn(),
  removeCustomEyepiece: jest.fn(),
  addCustomEyepiece: jest.fn(),
  removeCustomBarlow: jest.fn(),
  addCustomBarlow: jest.fn(),
  removeCustomOcularTelescope: jest.fn(),
  addCustomOcularTelescope: jest.fn(),
  setSelectedOcularTelescopeId: jest.fn(function (value) { equipmentStoreState.selectedOcularTelescopeId = value; }),
  setSelectedEyepieceId: jest.fn(function (value) { equipmentStoreState.selectedEyepieceId = value; }),
  setSelectedBarlowId: jest.fn(function (value) { equipmentStoreState.selectedBarlowId = value; }),
};

const eventSourcesStoreState = {
  sources: [
    {
      id: 'astronomyapi',
      name: 'Astronomy API',
      apiUrl: 'https://api.astronomyapi.com/api/v2',
      apiKey: 'previous-secret',
      hasStoredSecret: true,
      enabled: true,
      priority: 1,
      cacheMinutes: 60,
    },
  ],
  resetToDefaults: jest.fn(function () {
    eventSourcesStoreState.sources = [];
  }),
  updateSource: jest.fn(function (_id, source) {
    eventSourcesStoreState.sources = [...eventSourcesStoreState.sources.filter((item) => item.id !== source.id), source];
  }),
};

const dailyKnowledgeStoreState = {
  favorites: [{ itemId: 'fav-1', createdAt: 1 }],
  history: [],
  lastShownDate: null,
  snoozedDate: null,
  lastSeenItemId: null,
  hydrateFromImport: jest.fn(function (payload) {
    dailyKnowledgeStoreState.favorites = payload.favorites;
    dailyKnowledgeStoreState.history = payload.history;
    dailyKnowledgeStoreState.lastShownDate = payload.lastShownDate;
    dailyKnowledgeStoreState.snoozedDate = payload.snoozedDate;
    dailyKnowledgeStoreState.lastSeenItemId = payload.lastSeenItemId;
  }),
};

const mockSetLocale = jest.fn();
const mockApplyThemeMode = jest.fn();

jest.mock('@/lib/stores', () => ({
  useSettingsStore: { getState: () => settingsStoreState },
  useEquipmentStore: { getState: () => equipmentStoreState },
  useMountStore: { getState: () => mountStoreState },
  useEventSourcesStore: { getState: () => eventSourcesStoreState },
  useDailyKnowledgeStore: { getState: () => dailyKnowledgeStoreState },
  useGlobalShortcutStore: { getState: () => globalShortcutStoreState },
}));

jest.mock('@/lib/stores/theme-store', () => ({
  useThemeStore: { getState: () => themeStoreState },
}));

jest.mock('@/lib/stores/keybinding-store', () => ({
  useKeybindingStore: { getState: () => keybindingStoreState },
}));

jest.mock('@/lib/i18n/locale-store', () => ({
  useLocaleStore: { getState: () => ({ setLocale: mockSetLocale }) },
}));

jest.mock('@/lib/storage/platform', () => ({
  isServer: jest.fn(() => false),
  isTauri: jest.fn(() => true),
}));

jest.mock('../apply-settings-transaction', () => ({
  applySettingsTransaction: (draft: MockSettingsDraft, options?: { domainOrder?: string[] }) => mockApplySettingsTransaction(draft, options),
}));

import type { SettingsProfileData } from '../settings-profile';
import { useSettingsImportRestoreStore } from '@/lib/stores/settings-import-restore-store';
import { applySettingsProfileImport, restoreLastSettingsImport } from '@/lib/settings/settings-profile-transaction';

describe('settings-profile-transaction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSettingsImportRestoreStore.getState().clearRestorePoint();
    settingsStoreState.connection = { ip: 'localhost', port: '1888' };
    themeStoreState.customization.radius = 0.5;
    themeStoreState.userPresets = [];
    eventSourcesStoreState.sources = [{
      id: 'astronomyapi',
      name: 'Astronomy API',
      apiUrl: 'https://api.astronomyapi.com/api/v2',
      apiKey: 'previous-secret',
      hasStoredSecret: true,
      enabled: true,
      priority: 1,
      cacheMinutes: 60,
    }];
  });

  it('stores a restore point and applies only selected domains', () => {
    const result = applySettingsProfileImport({
      version: 6,
      exportedAt: '2026-01-01T00:00:00.000Z',
      metadata: { schemaVersion: 6, domains: ['settings', 'theme'] },
      settings: {
        connection: { ip: '10.0.0.5', port: '1889' },
        backendProtocol: 'https',
        skyEngine: 'aladin',
        stellarium: { nightMode: true },
        preferences: { locale: 'zh' },
        performance: { reducedMotion: true },
        accessibility: { highContrast: true },
        notifications: { enableToasts: false },
        search: { maxSearchResults: 15 },
        aladinDisplay: { showGrid: true },
      },
      themeMode: 'dark',
      theme: { radius: 0.8 },
    } as unknown as SettingsProfileData, {
      domains: ['theme'],
      applyThemeMode: mockApplyThemeMode,
    });

    expect(result.success).toBe(true);
    expect(settingsStoreState.connection).toEqual({ ip: 'localhost', port: '1888' });
    expect(themeStoreState.customization.radius).toBe(0.8);
    expect(mockApplyThemeMode).toHaveBeenCalledWith('dark');
    expect(useSettingsImportRestoreStore.getState().restorePoint).toEqual(
      expect.objectContaining({
        domains: ['theme'],
      })
    );
  });

  it('rolls back earlier domain changes when a later domain apply fails', () => {
    const result = applySettingsProfileImport({
      version: 6,
      exportedAt: '2026-01-01T00:00:00.000Z',
      metadata: { schemaVersion: 6, domains: ['settings', 'theme'] },
      settings: {
        connection: { ip: '10.0.0.5', port: '1889' },
        backendProtocol: 'https',
        skyEngine: 'aladin',
        stellarium: { nightMode: true },
        preferences: { locale: 'zh' },
        performance: { reducedMotion: true },
        accessibility: { highContrast: true },
        notifications: { enableToasts: false },
        search: { maxSearchResults: 15 },
        aladinDisplay: { showGrid: true },
      },
      theme: { radius: 0.8 },
    } as unknown as SettingsProfileData, {
      domains: ['settings', 'theme'],
      domainAppliers: {
        theme: () => {
          throw new Error('boom');
        },
      },
    });

    expect(result.success).toBe(false);
    expect(result.failedDomain).toBe('theme');
    expect(settingsStoreState.connection).toEqual({ ip: 'localhost', port: '1888' });
    expect(themeStoreState.customization.radius).toBe(0.5);
    expect(useSettingsImportRestoreStore.getState().restorePoint).toBeNull();
  });

  it('restores the last successful import snapshot', () => {
    applySettingsProfileImport({
      version: 6,
      exportedAt: '2026-01-01T00:00:00.000Z',
      metadata: { schemaVersion: 6, domains: ['theme', 'eventSources'] },
      themeMode: 'dark',
      theme: { radius: 0.8 },
      eventSources: [{
        id: 'astronomyapi',
        name: 'Astronomy API',
        apiUrl: 'https://api.astronomyapi.com/api/v2',
        apiKey: '',
        hasStoredSecret: false,
        enabled: false,
        priority: 1,
        cacheMinutes: 30,
      }],
    } as unknown as SettingsProfileData, {
      domains: ['theme', 'eventSources'],
      applyThemeMode: mockApplyThemeMode,
    });

    const restoreResult = restoreLastSettingsImport({
      applyThemeMode: mockApplyThemeMode,
    });

    expect(restoreResult.success).toBe(true);
    expect(themeStoreState.customization.radius).toBe(0.5);
    expect(eventSourcesStoreState.sources[0].apiKey).toBe('previous-secret');
  });
});
