/**
 * Tests for console-transport.ts
 * Console transport for log output
 */

import { ConsoleTransport } from '../transports/console-transport';
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

describe('ConsoleTransport', () => {
  it('should have name "console"', () => {
    const transport = new ConsoleTransport();
    expect(transport.name).toBe('console');
  });

  it('should write a log entry without error', () => {
    const transport = new ConsoleTransport();
    expect(() => transport.write(makeEntry())).not.toThrow();
  });

  it('should write at different levels', () => {
    const transport = new ConsoleTransport();
    expect(() => transport.write(makeEntry(LogLevel.DEBUG))).not.toThrow();
    expect(() => transport.write(makeEntry(LogLevel.WARN))).not.toThrow();
    expect(() => transport.write(makeEntry(LogLevel.ERROR))).not.toThrow();
  });

  it('should accept custom config', () => {
    const transport = new ConsoleTransport({
      timestamps: false,
      modules: false,
      colors: false,
    });
    expect(() => transport.write(makeEntry())).not.toThrow();
  });
});
