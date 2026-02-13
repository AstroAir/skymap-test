/**
 * Logger Utils Tests
 */

import {
  generateLogId,
  formatTimestamp,
  formatFullTimestamp,
  formatLogLevel,
  serializeData,
  extractErrorInfo,
  filterLogs,
  getUniqueModules,
  getLogStats,
  groupConsecutiveLogs,
} from '../utils';
import { LogLevel, LogEntry } from '../types';

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: overrides.id ?? generateLogId(),
    timestamp: overrides.timestamp ?? new Date('2025-01-15T10:30:00.123Z'),
    level: overrides.level ?? LogLevel.INFO,
    module: overrides.module ?? 'test',
    message: overrides.message ?? 'test message',
    data: overrides.data,
    stack: overrides.stack,
  };
}

describe('generateLogId', () => {
  it('generates unique IDs', () => {
    const id1 = generateLogId();
    const id2 = generateLogId();
    expect(id1).not.toBe(id2);
  });

  it('returns a string', () => {
    expect(typeof generateLogId()).toBe('string');
  });
});

describe('formatTimestamp', () => {
  it('formats HH:MM:SS.mmm', () => {
    const date = new Date('2025-01-15T08:05:09.007Z');
    const result = formatTimestamp(date);
    // Result depends on local timezone, so just check format
    expect(result).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3}$/);
  });
});

describe('formatFullTimestamp', () => {
  it('returns ISO string', () => {
    const date = new Date('2025-01-15T10:30:00.000Z');
    expect(formatFullTimestamp(date)).toBe('2025-01-15T10:30:00.000Z');
  });
});

describe('formatLogLevel', () => {
  it('formats DEBUG', () => {
    expect(formatLogLevel(LogLevel.DEBUG).trim()).toBe('DEBUG');
  });

  it('formats INFO', () => {
    expect(formatLogLevel(LogLevel.INFO).trim()).toBe('INFO');
  });

  it('formats WARN', () => {
    expect(formatLogLevel(LogLevel.WARN).trim()).toBe('WARN');
  });

  it('formats ERROR', () => {
    expect(formatLogLevel(LogLevel.ERROR).trim()).toBe('ERROR');
  });
});

describe('serializeData', () => {
  it('returns empty string for undefined', () => {
    expect(serializeData(undefined)).toBe('');
  });

  it('returns "null" for null', () => {
    expect(serializeData(null)).toBe('null');
  });

  it('returns string as-is', () => {
    expect(serializeData('hello')).toBe('hello');
  });

  it('converts number to string', () => {
    expect(serializeData(42)).toBe('42');
  });

  it('serializes objects as JSON', () => {
    const result = serializeData({ a: 1, b: 'two' });
    const parsed = JSON.parse(result);
    expect(parsed).toEqual({ a: 1, b: 'two' });
  });

  it('handles arrays', () => {
    const result = serializeData([1, 2, 3]);
    expect(JSON.parse(result)).toEqual([1, 2, 3]);
  });
});

describe('extractErrorInfo', () => {
  it('extracts from Error object', () => {
    const err = new Error('test error');
    const info = extractErrorInfo(err);
    expect(info.message).toBe('test error');
    expect(info.name).toBe('Error');
    expect(info.stack).toBeDefined();
  });

  it('handles string errors', () => {
    const info = extractErrorInfo('something went wrong');
    expect(info.message).toBe('something went wrong');
  });

  it('handles unknown types', () => {
    const info = extractErrorInfo(42);
    expect(info.message).toBeDefined();
  });
});

describe('filterLogs', () => {
  const logs: LogEntry[] = [
    makeEntry({ level: LogLevel.DEBUG, module: 'auth', message: 'debug msg' }),
    makeEntry({ level: LogLevel.INFO, module: 'auth', message: 'info msg' }),
    makeEntry({ level: LogLevel.WARN, module: 'api', message: 'warn msg' }),
    makeEntry({ level: LogLevel.ERROR, module: 'api', message: 'error msg' }),
  ];

  it('filters by level', () => {
    const result = filterLogs(logs, { level: LogLevel.WARN });
    expect(result.length).toBe(2);
    expect(result.every(e => e.level >= LogLevel.WARN)).toBe(true);
  });

  it('filters by module', () => {
    const result = filterLogs(logs, { module: 'auth' });
    expect(result.length).toBe(2);
    expect(result.every(e => e.module === 'auth')).toBe(true);
  });

  it('filters by search text', () => {
    const result = filterLogs(logs, { search: 'warn' });
    expect(result.length).toBe(1);
    expect(result[0].message).toBe('warn msg');
  });

  it('combines filters', () => {
    const result = filterLogs(logs, { level: LogLevel.INFO, module: 'api' });
    expect(result.length).toBe(2); // WARN and ERROR from api
  });

  it('returns all with empty filter', () => {
    const result = filterLogs(logs, {});
    expect(result.length).toBe(4);
  });

  it('filters by time range', () => {
    const now = new Date();
    const old = new Date(now.getTime() - 3600000);
    const logsWithTime = [
      makeEntry({ timestamp: old, message: 'old' }),
      makeEntry({ timestamp: now, message: 'new' }),
    ];
    const result = filterLogs(logsWithTime, {
      startTime: new Date(now.getTime() - 1000),
    });
    expect(result.length).toBe(1);
    expect(result[0].message).toBe('new');
  });
});

describe('getUniqueModules', () => {
  it('returns unique module names', () => {
    const logs = [
      makeEntry({ module: 'auth' }),
      makeEntry({ module: 'api' }),
      makeEntry({ module: 'auth' }),
    ];
    const modules = getUniqueModules(logs);
    expect(modules).toHaveLength(2);
    expect(modules).toContain('auth');
    expect(modules).toContain('api');
  });

  it('returns empty for no logs', () => {
    expect(getUniqueModules([])).toEqual([]);
  });
});

describe('getLogStats', () => {
  it('counts by level', () => {
    const logs = [
      makeEntry({ level: LogLevel.DEBUG }),
      makeEntry({ level: LogLevel.INFO }),
      makeEntry({ level: LogLevel.INFO }),
      makeEntry({ level: LogLevel.ERROR }),
    ];
    const stats = getLogStats(logs);
    expect(stats.total).toBe(4);
    expect(stats.byLevel.debug).toBe(1);
    expect(stats.byLevel.info).toBe(2);
    expect(stats.byLevel.warn).toBe(0);
    expect(stats.byLevel.error).toBe(1);
  });

  it('counts by module', () => {
    const logs = [
      makeEntry({ module: 'a' }),
      makeEntry({ module: 'b' }),
      makeEntry({ module: 'a' }),
    ];
    const stats = getLogStats(logs);
    expect(stats.byModule['a']).toBe(2);
    expect(stats.byModule['b']).toBe(1);
  });
});

describe('groupConsecutiveLogs', () => {
  it('returns empty for empty input', () => {
    expect(groupConsecutiveLogs([])).toEqual([]);
  });

  it('does not group different messages', () => {
    const logs = [
      makeEntry({ message: 'a' }),
      makeEntry({ message: 'b' }),
    ];
    const groups = groupConsecutiveLogs(logs);
    expect(groups).toHaveLength(2);
    expect(groups[0].count).toBe(1);
    expect(groups[1].count).toBe(1);
  });

  it('groups consecutive identical logs', () => {
    const logs = [
      makeEntry({ module: 'test', message: 'repeat' }),
      makeEntry({ module: 'test', message: 'repeat' }),
      makeEntry({ module: 'test', message: 'repeat' }),
    ];
    const groups = groupConsecutiveLogs(logs);
    expect(groups).toHaveLength(1);
    expect(groups[0].count).toBe(3);
    expect(groups[0].timestamps).toHaveLength(3);
  });

  it('does not group non-consecutive duplicates', () => {
    const logs = [
      makeEntry({ module: 'test', message: 'a' }),
      makeEntry({ module: 'test', message: 'b' }),
      makeEntry({ module: 'test', message: 'a' }),
    ];
    const groups = groupConsecutiveLogs(logs);
    expect(groups).toHaveLength(3);
  });

  it('does not group same message from different modules', () => {
    const logs = [
      makeEntry({ module: 'mod1', message: 'same' }),
      makeEntry({ module: 'mod2', message: 'same' }),
    ];
    const groups = groupConsecutiveLogs(logs);
    expect(groups).toHaveLength(2);
  });
});
