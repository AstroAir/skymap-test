/**
 * Tests for logger/types.ts
 * Log level enums, constants, and default config
 */

import {
  LogLevel,
  DEFAULT_CONFIG,
  LOG_LEVEL_NAMES,
  LOG_LEVEL_VALUES,
  LOG_LEVEL_COLORS,
  LOG_LEVEL_METHODS,
} from '../types';

describe('LogLevel enum', () => {
  it('should have ordered severity', () => {
    expect(LogLevel.DEBUG).toBeLessThan(LogLevel.INFO);
    expect(LogLevel.INFO).toBeLessThan(LogLevel.WARN);
    expect(LogLevel.WARN).toBeLessThan(LogLevel.ERROR);
    expect(LogLevel.ERROR).toBeLessThan(LogLevel.NONE);
  });
});

describe('DEFAULT_CONFIG', () => {
  it('should have reasonable defaults', () => {
    expect(DEFAULT_CONFIG.maxLogs).toBeGreaterThan(0);
    expect(DEFAULT_CONFIG.enableConsole).toBe(true);
    expect(typeof DEFAULT_CONFIG.level).toBe('number');
  });
});

describe('LOG_LEVEL_NAMES', () => {
  it('should map all levels to strings', () => {
    expect(LOG_LEVEL_NAMES[LogLevel.DEBUG]).toBe('debug');
    expect(LOG_LEVEL_NAMES[LogLevel.INFO]).toBe('info');
    expect(LOG_LEVEL_NAMES[LogLevel.WARN]).toBe('warn');
    expect(LOG_LEVEL_NAMES[LogLevel.ERROR]).toBe('error');
  });
});

describe('LOG_LEVEL_VALUES', () => {
  it('should reverse-map strings to levels', () => {
    expect(LOG_LEVEL_VALUES['debug']).toBe(LogLevel.DEBUG);
    expect(LOG_LEVEL_VALUES['error']).toBe(LogLevel.ERROR);
  });
});

describe('LOG_LEVEL_COLORS', () => {
  it('should have a color for each level', () => {
    expect(typeof LOG_LEVEL_COLORS[LogLevel.DEBUG]).toBe('string');
    expect(typeof LOG_LEVEL_COLORS[LogLevel.ERROR]).toBe('string');
  });
});

describe('LOG_LEVEL_METHODS', () => {
  it('should map levels to console methods', () => {
    expect(LOG_LEVEL_METHODS[LogLevel.DEBUG]).toBe('debug');
    expect(LOG_LEVEL_METHODS[LogLevel.ERROR]).toBe('error');
  });
});
