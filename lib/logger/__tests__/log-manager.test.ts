/**
 * Tests for log-manager.ts
 * Central log manager singleton
 */

import { createLogger, getLogs, clearLogs, setLogLevel, getLogLevel } from '../log-manager';
import { LogLevel } from '../types';

describe('LogManager', () => {
  afterEach(() => {
    clearLogs();
  });

  it('should create a logger with a module name', () => {
    const logger = createLogger('test-module');
    expect(logger.getModule()).toBe('test-module');
  });

  it('should log messages at different levels', () => {
    const logger = createLogger('test');
    logger.debug('debug msg');
    logger.info('info msg');
    logger.warn('warn msg');
    logger.error('error msg');

    const logs = getLogs();
    expect(logs.length).toBeGreaterThanOrEqual(4);
  });

  it('should clear logs', () => {
    const logger = createLogger('test');
    logger.info('test message');
    clearLogs();
    const logs = getLogs();
    expect(logs.length).toBe(0);
  });

  it('should get and set log level', () => {
    const original = getLogLevel();
    setLogLevel(LogLevel.ERROR);
    expect(getLogLevel()).toBe(LogLevel.ERROR);
    setLogLevel(original);
  });

  it('should filter logs below current level', () => {
    setLogLevel(LogLevel.ERROR);
    const logger = createLogger('test');
    logger.debug('should be filtered');
    logger.info('should be filtered');
    logger.error('should appear');

    const logs = getLogs();
    const errorLogs = logs.filter((l) => l.module === 'test');
    expect(errorLogs.length).toBe(1);
    expect(errorLogs[0].message).toBe('should appear');

    setLogLevel(LogLevel.DEBUG);
  });
});
