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
    });
    expect(transport.name).toBe('tauri');
  });

  it('should flush without error', () => {
    const transport = new TauriTransport({ enabled: false });
    expect(() => transport.flush?.()).not.toThrow();
  });
});
