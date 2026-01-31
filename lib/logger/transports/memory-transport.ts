/**
 * Memory Transport
 * 
 * Stores logs in memory for later retrieval and display in UI.
 */

import { LogEntry, LogTransport, LogFilter } from '../types';
import { filterLogs } from '../utils';

export interface MemoryTransportConfig {
  /** Maximum number of logs to keep */
  maxLogs: number;
  /** Whether to automatically trim old logs when limit is reached */
  autoTrim: boolean;
}

const DEFAULT_CONFIG: MemoryTransportConfig = {
  maxLogs: 1000,
  autoTrim: true,
};

export type LogListener = (entry: LogEntry) => void;
export type LogsChangedListener = (logs: LogEntry[]) => void;

/**
 * Memory transport for storing logs in memory
 */
export class MemoryTransport implements LogTransport {
  readonly name = 'memory';
  private config: MemoryTransportConfig;
  private logs: LogEntry[] = [];
  private listeners: Set<LogListener> = new Set();
  private logsChangedListeners: Set<LogsChangedListener> = new Set();
  
  constructor(config: Partial<MemoryTransportConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  write(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Trim old logs if needed
    if (this.config.autoTrim && this.logs.length > this.config.maxLogs) {
      const trimCount = this.logs.length - this.config.maxLogs;
      this.logs.splice(0, trimCount);
    }
    
    // Notify listeners
    this.notifyListeners(entry);
    this.notifyLogsChanged();
  }
  
  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }
  
  /**
   * Get logs with filtering
   */
  getFilteredLogs(filter: LogFilter): LogEntry[] {
    let result = filterLogs(this.logs, filter);
    
    if (filter.limit && result.length > filter.limit) {
      result = result.slice(-filter.limit);
    }
    
    return result;
  }
  
  /**
   * Get the number of logs
   */
  getLogCount(): number {
    return this.logs.length;
  }
  
  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = [];
    this.notifyLogsChanged();
  }
  
  /**
   * Subscribe to new log entries
   */
  subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  /**
   * Subscribe to logs changed events (add/clear)
   */
  onLogsChanged(listener: LogsChangedListener): () => void {
    this.logsChangedListeners.add(listener);
    return () => {
      this.logsChangedListeners.delete(listener);
    };
  }
  
  /**
   * Update configuration
   */
  setConfig(config: Partial<MemoryTransportConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Trim if needed after config change
    if (this.config.autoTrim && this.logs.length > this.config.maxLogs) {
      const trimCount = this.logs.length - this.config.maxLogs;
      this.logs.splice(0, trimCount);
      this.notifyLogsChanged();
    }
  }
  
  /**
   * Get current configuration
   */
  getConfig(): MemoryTransportConfig {
    return { ...this.config };
  }
  
  /**
   * Dispose and clean up
   */
  dispose(): void {
    this.logs = [];
    this.listeners.clear();
    this.logsChangedListeners.clear();
  }
  
  private notifyListeners(entry: LogEntry): void {
    for (const listener of this.listeners) {
      try {
        listener(entry);
      } catch {
        // Ignore listener errors
      }
    }
  }
  
  private notifyLogsChanged(): void {
    const logs = this.getLogs();
    for (const listener of this.logsChangedListeners) {
      try {
        listener(logs);
      } catch {
        // Ignore listener errors
      }
    }
  }
}

/**
 * Create a memory transport instance
 */
export function createMemoryTransport(config?: Partial<MemoryTransportConfig>): MemoryTransport {
  return new MemoryTransport(config);
}
