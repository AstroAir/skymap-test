/**
 * Memory Transport Tests
 */

import { MemoryTransport } from '../transports/memory-transport';
import { LogLevel, LogEntry } from '../types';
import { generateLogId } from '../utils';

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: overrides.id ?? generateLogId(),
    timestamp: overrides.timestamp ?? new Date(),
    level: overrides.level ?? LogLevel.INFO,
    module: overrides.module ?? 'test',
    message: overrides.message ?? 'test message',
    data: overrides.data,
    stack: overrides.stack,
  };
}

describe('MemoryTransport', () => {
  let transport: MemoryTransport;

  beforeEach(() => {
    transport = new MemoryTransport({ maxLogs: 100, autoTrim: true });
  });

  afterEach(() => {
    transport.dispose();
  });

  describe('write and getLogs', () => {
    it('stores written entries', () => {
      const entry = makeEntry();
      transport.write(entry);
      const logs = transport.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('test message');
    });

    it('returns copies of the array', () => {
      transport.write(makeEntry());
      const a = transport.getLogs();
      const b = transport.getLogs();
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });
  });

  describe('auto-trim', () => {
    it('trims old logs when exceeding maxLogs', () => {
      const small = new MemoryTransport({ maxLogs: 3, autoTrim: true });
      small.write(makeEntry({ message: 'a' }));
      small.write(makeEntry({ message: 'b' }));
      small.write(makeEntry({ message: 'c' }));
      small.write(makeEntry({ message: 'd' }));
      const logs = small.getLogs();
      expect(logs).toHaveLength(3);
      expect(logs[0].message).toBe('b');
      expect(logs[2].message).toBe('d');
      small.dispose();
    });

    it('does not trim when autoTrim is false', () => {
      const noTrim = new MemoryTransport({ maxLogs: 2, autoTrim: false });
      noTrim.write(makeEntry({ message: 'a' }));
      noTrim.write(makeEntry({ message: 'b' }));
      noTrim.write(makeEntry({ message: 'c' }));
      expect(noTrim.getLogs()).toHaveLength(3);
      noTrim.dispose();
    });
  });

  describe('getLogCount', () => {
    it('returns the number of logs', () => {
      expect(transport.getLogCount()).toBe(0);
      transport.write(makeEntry());
      expect(transport.getLogCount()).toBe(1);
      transport.write(makeEntry());
      expect(transport.getLogCount()).toBe(2);
    });
  });

  describe('clear', () => {
    it('removes all logs', () => {
      transport.write(makeEntry());
      transport.write(makeEntry());
      transport.clear();
      expect(transport.getLogs()).toHaveLength(0);
      expect(transport.getLogCount()).toBe(0);
    });
  });

  describe('getFilteredLogs', () => {
    it('filters by level', () => {
      transport.write(makeEntry({ level: LogLevel.DEBUG }));
      transport.write(makeEntry({ level: LogLevel.ERROR }));
      const result = transport.getFilteredLogs({ level: LogLevel.ERROR });
      expect(result).toHaveLength(1);
      expect(result[0].level).toBe(LogLevel.ERROR);
    });

    it('filters by module', () => {
      transport.write(makeEntry({ module: 'auth' }));
      transport.write(makeEntry({ module: 'api' }));
      const result = transport.getFilteredLogs({ module: 'auth' });
      expect(result).toHaveLength(1);
      expect(result[0].module).toBe('auth');
    });

    it('applies limit', () => {
      for (let i = 0; i < 10; i++) {
        transport.write(makeEntry({ message: `msg-${i}` }));
      }
      const result = transport.getFilteredLogs({ limit: 3 });
      expect(result).toHaveLength(3);
    });
  });

  describe('subscribe', () => {
    it('calls listener on new entry', () => {
      const listener = jest.fn();
      transport.subscribe(listener);
      const entry = makeEntry();
      transport.write(entry);
      expect(listener).toHaveBeenCalledWith(entry);
    });

    it('unsubscribes correctly', () => {
      const listener = jest.fn();
      const unsub = transport.subscribe(listener);
      unsub();
      transport.write(makeEntry());
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('onLogsChanged', () => {
    it('calls listener after clear', () => {
      const listener = jest.fn();
      transport.onLogsChanged(listener);
      transport.write(makeEntry());
      transport.clear();
      // clear() calls notifyLogsChanged immediately
      expect(listener).toHaveBeenCalledWith([]);
    });

    it('throttles notifications from write', () => {
      jest.useFakeTimers();
      const listener = jest.fn();
      transport.onLogsChanged(listener);

      transport.write(makeEntry({ message: 'a' }));
      transport.write(makeEntry({ message: 'b' }));
      transport.write(makeEntry({ message: 'c' }));

      // Not yet called — throttled
      expect(listener).not.toHaveBeenCalled();

      // Advance past throttle interval
      jest.advanceTimersByTime(150);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ message: 'a' }),
        expect.objectContaining({ message: 'b' }),
        expect.objectContaining({ message: 'c' }),
      ]));

      jest.useRealTimers();
    });

    it('unsubscribes correctly', () => {
      jest.useFakeTimers();
      const listener = jest.fn();
      const unsub = transport.onLogsChanged(listener);
      unsub();
      transport.write(makeEntry());
      jest.advanceTimersByTime(150);
      expect(listener).not.toHaveBeenCalled();
      jest.useRealTimers();
    });
  });

  describe('setConfig', () => {
    it('trims logs after reducing maxLogs', () => {
      for (let i = 0; i < 5; i++) {
        transport.write(makeEntry());
      }
      expect(transport.getLogCount()).toBe(5);
      transport.setConfig({ maxLogs: 3 });
      expect(transport.getLogCount()).toBe(3);
    });
  });

  describe('dispose', () => {
    it('clears all state', () => {
      const listener = jest.fn();
      transport.subscribe(listener);
      transport.write(makeEntry());
      transport.dispose();
      expect(transport.getLogCount()).toBe(0);
    });
  });
});
