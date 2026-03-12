/**
 * @jest-environment jsdom
 */

jest.mock('@/lib/storage/platform', () => ({
  isTauri: jest.fn(() => false),
}));

import { secretVaultApi } from '../secret-vault-api';

describe('secretVaultApi', () => {
  it('reports web-session fallback when tauri is unavailable', async () => {
    await expect(secretVaultApi.getStatus()).resolves.toEqual(
      expect.objectContaining({
        available: false,
        mode: 'web',
        state: 'web-session',
      })
    );
  });

  it('stores plate-solver secret in memory only for the current session', async () => {
    await secretVaultApi.setPlateSolverApiKey('session-secret');

    await expect(secretVaultApi.getPlateSolverApiKey()).resolves.toBe('session-secret');

    await secretVaultApi.deletePlateSolverApiKey();
    await expect(secretVaultApi.getPlateSolverApiKey()).resolves.toBeNull();
  });

  it('stores event-source secrets independently', async () => {
    await secretVaultApi.setEventSourceApiKey('astronomyapi', 'alpha');
    await secretVaultApi.setEventSourceApiKey('n2yo', 'beta');

    await expect(secretVaultApi.getEventSourceApiKey('astronomyapi')).resolves.toBe('alpha');
    await expect(secretVaultApi.getEventSourceApiKey('n2yo')).resolves.toBe('beta');
  });
});
