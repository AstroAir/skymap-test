/**
 * @jest-environment jsdom
 */

import { useSettingsStore } from '../settings-store';

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

describe('useSettingsStore launchOnStartup', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      preferences: {
        ...useSettingsStore.getState().preferences,
        launchOnStartup: false,
      },
    });
  });

  it('defaults launchOnStartup to false', () => {
    expect(useSettingsStore.getState().preferences.launchOnStartup).toBe(false);
  });

  it('updates launchOnStartup through setPreference', () => {
    useSettingsStore.getState().setPreference('launchOnStartup', true);

    expect(useSettingsStore.getState().preferences.launchOnStartup).toBe(true);
  });
});
