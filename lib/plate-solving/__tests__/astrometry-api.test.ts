/**
 * Tests for astrometry-api.ts
 */

import { AstrometryApiClient } from '../astrometry-api';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('AstrometryApiClient', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('constructor', () => {
    it('should create client with required config', () => {
      const client = new AstrometryApiClient({ apiKey: 'test-key' });
      expect(client).toBeDefined();
    });

    it('should use default baseUrl if not provided', () => {
      const client = new AstrometryApiClient({ apiKey: 'test-key' });
      expect(client).toBeDefined();
    });

    it('should use custom baseUrl if provided', () => {
      const client = new AstrometryApiClient({
        apiKey: 'test-key',
        baseUrl: 'https://custom.astrometry.net',
      });
      expect(client).toBeDefined();
    });

    it('should use custom timeout if provided', () => {
      const client = new AstrometryApiClient({
        apiKey: 'test-key',
        timeout: 60000,
      });
      expect(client).toBeDefined();
    });

    it('should use custom pollInterval if provided', () => {
      const client = new AstrometryApiClient({
        apiKey: 'test-key',
        pollInterval: 10000,
      });
      expect(client).toBeDefined();
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'success', session: 'test-session' }),
      });

      const client = new AstrometryApiClient({ apiKey: 'test-key' });
      const session = await client.login();
      
      expect(session.sessionKey).toBe('test-session');
    });

    it('should throw error on login failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'error', message: 'Invalid API key' }),
      });

      const client = new AstrometryApiClient({ apiKey: 'invalid-key' });
      
      await expect(client.login()).rejects.toThrow('Invalid API key');
    });
  });

  describe('cancel', () => {
    it('should cancel ongoing operations', () => {
      const client = new AstrometryApiClient({ apiKey: 'test-key' });
      expect(() => client.cancel()).not.toThrow();
    });
  });
});
