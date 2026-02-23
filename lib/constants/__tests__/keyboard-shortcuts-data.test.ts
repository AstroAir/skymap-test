/**
 * Tests for keyboard-shortcuts-data.ts
 * Shortcut display formatting and group definitions
 */

import { displayKey, SHORTCUT_GROUP_DEFINITIONS } from '../keyboard-shortcuts-data';

describe('displayKey', () => {
  it('should convert space to "Space"', () => {
    expect(displayKey(' ')).toBe('Space');
  });

  it('should convert Escape to "Esc"', () => {
    expect(displayKey('Escape')).toBe('Esc');
  });

  it('should uppercase single characters', () => {
    expect(displayKey('a')).toBe('A');
    expect(displayKey('z')).toBe('Z');
  });

  it('should return multi-char keys as-is', () => {
    expect(displayKey('ArrowUp')).toBe('ArrowUp');
  });
});

describe('SHORTCUT_GROUP_DEFINITIONS', () => {
  it('should be a non-empty array', () => {
    expect(SHORTCUT_GROUP_DEFINITIONS.length).toBeGreaterThan(0);
  });

  it('should have titleKey and shortcuts for each group', () => {
    for (const group of SHORTCUT_GROUP_DEFINITIONS) {
      expect(typeof group.titleKey).toBe('string');
      expect(Array.isArray(group.shortcuts)).toBe(true);
    }
  });
});
