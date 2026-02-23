/**
 * Tests for storage/types.ts
 * Storage type definitions and constants
 */

import { KNOWN_STORES } from '../types';

describe('KNOWN_STORES', () => {
  it('should be a non-empty array', () => {
    expect(KNOWN_STORES.length).toBeGreaterThan(0);
  });

  it('should contain starmap-settings', () => {
    expect(KNOWN_STORES).toContain('starmap-settings');
  });

  it('should contain starmap-target-list', () => {
    expect(KNOWN_STORES).toContain('starmap-target-list');
  });

  it('should contain skymap-offline', () => {
    expect(KNOWN_STORES).toContain('skymap-offline');
  });

  it('should have unique entries', () => {
    const unique = new Set(KNOWN_STORES);
    expect(unique.size).toBe(KNOWN_STORES.length);
  });
});
