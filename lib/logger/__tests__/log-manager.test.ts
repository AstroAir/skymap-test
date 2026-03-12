/**
 * Tests for log-manager.ts
 * Central log manager singleton
 */

import {
  createLogger,
  getLogs,
  clearLogs,
  setLogLevel,
  getLogLevel,
  setModuleLogLevel,
  getEffectiveLogLevel,
  getLogPolicyState,
  setLogSuppressionEnabled,
  getLogSuppressionStats,
} from '../log-manager';
import { LogLevel } from '../types';

describe('LogManager', () => {
  afterEach(() => {
    clearLogs();
    setLogLevel(LogLevel.DEBUG);
    setModuleLogLevel('test');
    setModuleLogLevel('test-module');
    setLogSuppressionEnabled(true);
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

  it('applies module-level overrides over global level', () => {
    setLogLevel(LogLevel.WARN);
    setModuleLogLevel('test-module', LogLevel.DEBUG);

    const logger = createLogger('test-module');
    logger.debug('debug with module override');

    const logs = getLogs().filter((entry) => entry.module === 'test-module');
    expect(logs).toHaveLength(1);
    expect(logs[0].message).toContain('debug with module override');
  });

  it('accepts contextual payload in second argument', () => {
    const logger = createLogger('test');
    logger.info('context test', {
      data: { foo: 'bar' },
      eventCode: 'TEST_EVENT',
      operationId: 'op-1',
      sessionId: 'sess-1',
      tags: ['alpha', 'beta'],
    });

    const entry = getLogs().find((log) => log.message.includes('context test'));
    expect(entry).toBeDefined();
    expect(entry?.eventCode).toBe('TEST_EVENT');
    expect(entry?.operationId).toBe('op-1');
    expect(entry?.sessionId).toBe('sess-1');
    expect(entry?.tags).toEqual(['alpha', 'beta']);
  });

  it('redacts sensitive values before storing entries', () => {
    const logger = createLogger('test');
    logger.info('token=abcd1234', { password: 'secret123' });

    const entry = getLogs().find((log) => log.module === 'test');
    expect(entry).toBeDefined();
    expect(entry?.message).toContain('[REDACTED]');
    expect(JSON.stringify(entry?.data)).toContain('[REDACTED]');
    expect(JSON.stringify(entry?.data)).not.toContain('secret123');
  });

  it('exposes policy and suppression stats', () => {
    setLogLevel(LogLevel.ERROR);
    setModuleLogLevel('test', LogLevel.DEBUG);

    const policy = getLogPolicyState();
    expect(policy.globalLevel).toBe(LogLevel.ERROR);
    expect(policy.moduleLevels.test).toBe(LogLevel.DEBUG);
    expect(getEffectiveLogLevel('test')).toBe(LogLevel.DEBUG);

    const logger = createLogger('test');
    logger.warn('repeat');
    logger.warn('repeat');
    const suppression = getLogSuppressionStats();
    expect(suppression.enabled).toBe(true);
    expect(suppression.suppressedDuplicates).toBeGreaterThanOrEqual(1);
  });
});
