/**
 * Tests for tauri-transport.ts
 * Tauri backend log transport
 */

import { TauriTransport } from '../transports/tauri-transport';
import { LogLevel } from '../types';
import type { LogEntry } from '../types';

function makeEntry(level: LogLevel = LogLevel.INFO): LogEntry {
  return {
    id: 'test-1',
    timestamp: new Date(),
    level,
    module: 'test',
    message: 'Test message',
  };
}

describe('TauriTransport', () => {
  it('should have name "tauri"', () => {
    const transport = new TauriTransport();
    expect(transport.name).toBe('tauri');
  });

  it('should write without error in non-Tauri env', () => {
    const transport = new TauriTransport({ enabled: false });
    expect(() => transport.write(makeEntry())).not.toThrow();
  });

  it('should accept custom config', () => {
    const transport = new TauriTransport({
      enabled: false,
      minLevel: LogLevel.WARN,
      batching: false,
      maxQueueSize: 10,
    });
    expect(transport.name).toBe('tauri');
  });

  it('should flush without error', () => {
    const transport = new TauriTransport({ enabled: false });
    expect(() => transport.flush?.()).not.toThrow();
  });

  it('tracks dropped items when queue exceeds max size', () => {
    const transport = new TauriTransport({
      enabled: true,
      batching: true,
      maxQueueSize: 2,
      dropWarnInterval: 1,
    });

    // Force runtime availability for test without Tauri environment.
    Object.assign(transport as object, { isTauri: true, logFns: { [LogLevel.INFO]: jest.fn(async () => {}) } });

    transport.write(makeEntry(LogLevel.INFO));
    transport.write(makeEntry(LogLevel.INFO));
    transport.write(makeEntry(LogLevel.INFO));

    expect(transport.getDroppedCount()).toBe(1);
  });

  it('disables backend forwarding after an intentional plugin failure', async () => {
    const failingLogFn = jest.fn(async () => {
      throw new Error('plugin unavailable');
    });
    const transport = new TauriTransport({
      enabled: true,
      batching: false,
    });

    Object.assign(transport as object, {
      isTauri: true,
      logFns: { [LogLevel.INFO]: failingLogFn },
    });

    transport.write(makeEntry(LogLevel.INFO));
    await Promise.resolve();
    transport.write(makeEntry(LogLevel.INFO));

    expect(failingLogFn).toHaveBeenCalledTimes(1);
    expect(transport.isAvailable()).toBe(false);
  });
});
