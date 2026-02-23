/**
 * @jest-environment jsdom
 */

jest.mock('@/lib/stores', () => ({
  useStellariumStore: jest.fn((selector) => {
    const state = { stel: null, activeEngine: 'stellarium', engineReady: false };
    return selector(state);
  }),
  useSettingsStore: Object.assign(
    jest.fn((selector) => {
      const state = { preferences: {}, display: {} };
      return selector(state);
    }),
    { getState: jest.fn(() => ({ preferences: {}, display: {} })) }
  ),
  useMountStore: jest.fn((selector) => {
    const state = { profileInfo: { AstrometrySettings: { Latitude: 40, Longitude: -74, Elevation: 0 } } };
    return selector(state);
  }),
}));

jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));

describe('useStellariumViewState', () => {
  it('module can be imported', async () => {
    const mod = await import('../use-stellarium-view-state');
    expect(mod).toBeDefined();
  });
});
