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
  /** Whether to suppress duplicate log bursts */
  suppressionEnabled: boolean;
  /** Suppression time window in ms for duplicate entries */
  suppressionWindowMs: number;
}

const DEFAULT_CONFIG: MemoryTransportConfig = {
  maxLogs: 1000,
  autoTrim: true,
  suppressionEnabled: true,
  suppressionWindowMs: 2000,
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
  private changeNotifyTimer: ReturnType<typeof setTimeout> | null = null;
  private changeNotifyPending = false;
  
  /** Throttle interval for batching logsChanged notifications (ms) */
  private static readonly NOTIFY_THROTTLE_MS = 100;
  
  constructor(config: Partial<MemoryTransportConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  write(entry: LogEntry): void {
    // Suppress noisy duplicates while preserving occurrence counts.
    if (this.config.suppressionEnabled) {
      const lastEntry = this.logs[this.logs.length - 1];
      if (lastEntry && this.isDuplicateWithinWindow(lastEntry, entry)) {
        const previousCount = Math.max(1, lastEntry.occurrenceCount ?? 1);
        const incomingCount = Math.max(1, entry.occurrenceCount ?? 1);
        const newCount = previousCount + incomingCount;
        const incomingFirst = entry.firstTimestamp ?? entry.timestamp;
        const incomingLast = entry.lastTimestamp ?? entry.timestamp;

        lastEntry.occurrenceCount = newCount;
        lastEntry.firstTimestamp = lastEntry.firstTimestamp ?? lastEntry.timestamp;
        if (incomingFirst < lastEntry.firstTimestamp) {
          lastEntry.firstTimestamp = incomingFirst;
        }

        lastEntry.lastTimestamp = lastEntry.lastTimestamp ?? lastEntry.timestamp;
        if (incomingLast > lastEntry.lastTimestamp) {
          lastEntry.lastTimestamp = incomingLast;
        }

        // Preserve the newest context tags if previous entry had none.
        if ((!lastEntry.tags || lastEntry.tags.length === 0) && entry.tags && entry.tags.length > 0) {
          lastEntry.tags = [...entry.tags];
        }

        this.notifyListeners(lastEntry);
        this.scheduleLogsChanged();
        return;
      }
    }

    const normalizedEntry: LogEntry = {
      ...entry,
      occurrenceCount: Math.max(1, entry.occurrenceCount ?? 1),
      firstTimestamp: entry.firstTimestamp ?? entry.timestamp,
      lastTimestamp: entry.lastTimestamp ?? entry.timestamp,
    };

    this.logs.push(normalizedEntry);
    
    // Trim old logs if needed
    if (this.config.autoTrim && this.logs.length > this.config.maxLogs) {
      const trimCount = this.logs.length - this.config.maxLogs;
      this.logs.splice(0, trimCount);
    }
    
    // Notify per-entry listeners immediately
    this.notifyListeners(normalizedEntry);
    // Throttle bulk change notifications to reduce GC pressure
    this.scheduleLogsChanged();
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
    // Clear immediately on explicit action (not throttled)
    this.cancelPendingNotify();
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
   * Get suppression snapshot statistics.
   */
  getSuppressionStats(): {
    enabled: boolean;
    windowMs: number;
    groupedEntries: number;
    suppressedDuplicates: number;
  } {
    let groupedEntries = 0;
    let suppressedDuplicates = 0;

    for (const entry of this.logs) {
      const count = Math.max(1, entry.occurrenceCount ?? 1);
      if (count > 1) {
        groupedEntries += 1;
        suppressedDuplicates += count - 1;
      }
    }

    return {
      enabled: this.config.suppressionEnabled,
      windowMs: this.config.suppressionWindowMs,
      groupedEntries,
      suppressedDuplicates,
    };
  }
  
  /**
   * Dispose and clean up
   */
  dispose(): void {
    this.cancelPendingNotify();
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

  private isDuplicateWithinWindow(previous: LogEntry, next: LogEntry): boolean {
    if (
      previous.level !== next.level
      || previous.module !== next.module
      || previous.message !== next.message
      || (previous.eventCode ?? '') !== (next.eventCode ?? '')
    ) {
      return false;
    }

    const previousLast = previous.lastTimestamp ?? previous.timestamp;
    return next.timestamp.getTime() - previousLast.getTime() <= this.config.suppressionWindowMs;
  }
  
  /**
   * Schedule a throttled logsChanged notification.
   * Multiple writes within NOTIFY_THROTTLE_MS are batched into one notification.
   */
  private scheduleLogsChanged(): void {
    this.changeNotifyPending = true;
    if (!this.changeNotifyTimer) {
      this.changeNotifyTimer = setTimeout(() => {
        this.changeNotifyTimer = null;
        if (this.changeNotifyPending) {
          this.changeNotifyPending = false;
          this.notifyLogsChanged();
        }
      }, MemoryTransport.NOTIFY_THROTTLE_MS);
    }
  }
  
  private cancelPendingNotify(): void {
    if (this.changeNotifyTimer) {
      clearTimeout(this.changeNotifyTimer);
      this.changeNotifyTimer = null;
    }
    this.changeNotifyPending = false;
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
