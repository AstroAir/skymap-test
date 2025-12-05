/**
 * @jest-environment jsdom
 */
import {
  isTauri,
  isWeb,
  isServer,
  getPlatform,
  onlyInTauri,
  onlyInWeb,
} from '../platform';

describe('Platform Detection', () => {
  // ============================================================================
  // isTauri
  // ============================================================================
  describe('isTauri', () => {
    it('returns false when __TAURI__ is not present', () => {
      expect(isTauri()).toBe(false);
    });

    it('returns true when __TAURI__ is present', () => {
      // @ts-expect-error - Adding __TAURI__ for testing
      window.__TAURI__ = {};
      expect(isTauri()).toBe(true);
      // @ts-expect-error - Cleaning up
      delete window.__TAURI__;
    });

    it('returns true when __TAURI_INTERNALS__ is present', () => {
      // @ts-expect-error - Adding for testing
      window.__TAURI_INTERNALS__ = {};
      expect(isTauri()).toBe(true);
      // @ts-expect-error - Cleaning up
      delete window.__TAURI_INTERNALS__;
    });
  });

  // ============================================================================
  // isWeb
  // ============================================================================
  describe('isWeb', () => {
    it('returns true when not in Tauri', () => {
      expect(isWeb()).toBe(true);
    });

    it('returns false when in Tauri', () => {
      // @ts-expect-error - Adding __TAURI__ for testing
      window.__TAURI__ = {};
      expect(isWeb()).toBe(false);
      // @ts-expect-error - Cleaning up
      delete window.__TAURI__;
    });

    it('is opposite of isTauri', () => {
      expect(isWeb()).toBe(!isTauri());
    });
  });

  // ============================================================================
  // isServer
  // ============================================================================
  describe('isServer', () => {
    it('returns false in jsdom environment', () => {
      expect(isServer()).toBe(false);
    });
  });

  // ============================================================================
  // getPlatform
  // ============================================================================
  describe('getPlatform', () => {
    it('returns "web" when in web environment', () => {
      expect(getPlatform()).toBe('web');
    });

    it('returns "tauri" when in Tauri environment', () => {
      // @ts-expect-error - Adding __TAURI__ for testing
      window.__TAURI__ = {};
      expect(getPlatform()).toBe('tauri');
      // @ts-expect-error - Cleaning up
      delete window.__TAURI__;
    });

    it('returns valid platform type', () => {
      const validPlatforms = ['tauri', 'web', 'server'];
      expect(validPlatforms).toContain(getPlatform());
    });
  });

  // ============================================================================
  // onlyInTauri
  // ============================================================================
  describe('onlyInTauri', () => {
    it('returns null when not in Tauri', async () => {
      const fn = jest.fn().mockResolvedValue('result');
      const result = await onlyInTauri(fn);
      
      expect(result).toBeNull();
      expect(fn).not.toHaveBeenCalled();
    });

    it('executes function when in Tauri', async () => {
      // @ts-expect-error - Adding __TAURI__ for testing
      window.__TAURI__ = {};
      
      const fn = jest.fn().mockResolvedValue('result');
      const result = await onlyInTauri(fn);
      
      expect(result).toBe('result');
      expect(fn).toHaveBeenCalled();
      
      // @ts-expect-error - Cleaning up
      delete window.__TAURI__;
    });
  });

  // ============================================================================
  // onlyInWeb
  // ============================================================================
  describe('onlyInWeb', () => {
    it('executes function when in web environment', async () => {
      const fn = jest.fn().mockResolvedValue('result');
      const result = await onlyInWeb(fn);
      
      expect(result).toBe('result');
      expect(fn).toHaveBeenCalled();
    });

    it('returns null when in Tauri', async () => {
      // @ts-expect-error - Adding __TAURI__ for testing
      window.__TAURI__ = {};
      
      const fn = jest.fn().mockResolvedValue('result');
      const result = await onlyInWeb(fn);
      
      expect(result).toBeNull();
      expect(fn).not.toHaveBeenCalled();
      
      // @ts-expect-error - Cleaning up
      delete window.__TAURI__;
    });
  });
});
