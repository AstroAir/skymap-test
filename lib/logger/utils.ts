/**
 * Logger Utilities
 * 
 * Helper functions for the logging system.
 */

import { LogLevel, LogEntry, LOG_LEVEL_NAMES } from './types';

/**
 * Generate a unique ID for log entries
 */
export function generateLogId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Format a timestamp for display
 */
export function formatTimestamp(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${ms}`;
}

/**
 * Format a full timestamp for export
 */
export function formatFullTimestamp(date: Date): string {
  return date.toISOString();
}

/**
 * Format a log level for display
 */
export function formatLogLevel(level: LogLevel): string {
  const name = LOG_LEVEL_NAMES[level];
  return name.toUpperCase().padEnd(5);
}

/**
 * Serialize data for logging
 */
export function serializeData(data: unknown): string {
  if (data === undefined) {
    return '';
  }
  
  if (data === null) {
    return 'null';
  }
  
  if (typeof data === 'string') {
    return data;
  }
  
  if (typeof data === 'number' || typeof data === 'boolean') {
    return String(data);
  }
  
  if (data instanceof Error) {
    return `${data.name}: ${data.message}${data.stack ? `\n${data.stack}` : ''}`;
  }
  
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

/**
 * Extract error information
 */
export function extractErrorInfo(error: unknown): { message: string; stack?: string; name?: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name,
    };
  }
  
  if (typeof error === 'string') {
    return { message: error };
  }
  
  if (error && typeof error === 'object') {
    const obj = error as Record<string, unknown>;
    return {
      message: String(obj.message || obj.error || JSON.stringify(error)),
      stack: typeof obj.stack === 'string' ? obj.stack : undefined,
      name: typeof obj.name === 'string' ? obj.name : undefined,
    };
  }
  
  return { message: String(error) };
}

/**
 * Format a log entry as a single line string
 */
export function formatLogLine(entry: LogEntry, includeTimestamp = true, includeModule = true): string {
  const parts: string[] = [];
  
  if (includeTimestamp) {
    parts.push(`[${formatTimestamp(entry.timestamp)}]`);
  }
  
  parts.push(`[${formatLogLevel(entry.level)}]`);
  
  if (includeModule) {
    parts.push(`[${entry.module}]`);
  }
  
  parts.push(entry.message);
  
  if (entry.data !== undefined) {
    const dataStr = serializeData(entry.data);
    if (dataStr) {
      parts.push(dataStr);
    }
  }
  
  return parts.join(' ');
}

/**
 * Format a log entry as JSON
 */
export function formatLogJson(entry: LogEntry): string {
  return JSON.stringify({
    id: entry.id,
    timestamp: entry.timestamp.toISOString(),
    level: LOG_LEVEL_NAMES[entry.level],
    module: entry.module,
    message: entry.message,
    data: entry.data,
    stack: entry.stack,
    errorName: entry.errorName,
  });
}

/**
 * Export logs to a downloadable text format
 */
export function exportLogsAsText(logs: LogEntry[]): string {
  const header = `SkyMap Application Logs
Generated: ${new Date().toISOString()}
Total Entries: ${logs.length}
${'='.repeat(80)}

`;

  const body = logs
    .map(entry => {
      let line = `[${formatFullTimestamp(entry.timestamp)}] [${formatLogLevel(entry.level)}] [${entry.module}] ${entry.message}`;
      
      if (entry.data !== undefined) {
        line += `\n  Data: ${serializeData(entry.data)}`;
      }
      
      if (entry.stack) {
        line += `\n  Stack:\n${entry.stack.split('\n').map(l => `    ${l}`).join('\n')}`;
      }
      
      return line;
    })
    .join('\n\n');

  return header + body;
}

/**
 * Export logs to JSON format
 */
export function exportLogsAsJson(logs: LogEntry[]): string {
  return JSON.stringify({
    generated: new Date().toISOString(),
    totalEntries: logs.length,
    logs: logs.map(entry => ({
      id: entry.id,
      timestamp: entry.timestamp.toISOString(),
      level: LOG_LEVEL_NAMES[entry.level],
      module: entry.module,
      message: entry.message,
      data: entry.data,
      stack: entry.stack,
      errorName: entry.errorName,
    })),
  }, null, 2);
}

/**
 * Format a log entry as copyable text (for clipboard)
 */
export function formatLogEntryToText(entry: LogEntry): string {
  return [
    `[${entry.timestamp.toISOString()}] [${LOG_LEVEL_NAMES[entry.level].toUpperCase()}] [${entry.module}]`,
    entry.message,
    entry.data !== undefined ? `Data: ${serializeData(entry.data)}` : '',
    entry.stack ? `Stack: ${entry.stack}` : '',
  ].filter(Boolean).join('\n');
}

/**
 * Filter logs based on criteria
 */
export function filterLogs(logs: LogEntry[], filter: {
  level?: LogLevel;
  module?: string;
  search?: string;
  startTime?: Date;
  endTime?: Date;
}): LogEntry[] {
  return logs.filter(entry => {
    // Level filter
    if (filter.level !== undefined && entry.level < filter.level) {
      return false;
    }
    
    // Module filter (prefix match)
    if (filter.module && !entry.module.toLowerCase().startsWith(filter.module.toLowerCase())) {
      return false;
    }
    
    // Search filter
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const messageMatch = entry.message.toLowerCase().includes(searchLower);
      const moduleMatch = entry.module.toLowerCase().includes(searchLower);
      const dataMatch = entry.data ? serializeData(entry.data).toLowerCase().includes(searchLower) : false;
      
      if (!messageMatch && !moduleMatch && !dataMatch) {
        return false;
      }
    }
    
    // Time range filter
    if (filter.startTime && entry.timestamp < filter.startTime) {
      return false;
    }
    
    if (filter.endTime && entry.timestamp > filter.endTime) {
      return false;
    }
    
    return true;
  });
}

/**
 * Get unique modules from logs
 */
export function getUniqueModules(logs: LogEntry[]): string[] {
  const modules = new Set<string>();
  for (const entry of logs) {
    modules.add(entry.module);
  }
  return Array.from(modules).sort();
}

/**
 * Get log statistics
 */
export function getLogStats(logs: LogEntry[]): {
  total: number;
  byLevel: Record<string, number>;
  byModule: Record<string, number>;
} {
  const byLevel: Record<string, number> = {
    debug: 0,
    info: 0,
    warn: 0,
    error: 0,
  };
  
  const byModule: Record<string, number> = {};
  
  for (const entry of logs) {
    const levelName = LOG_LEVEL_NAMES[entry.level];
    if (levelName !== 'none') {
      byLevel[levelName]++;
    }
    
    byModule[entry.module] = (byModule[entry.module] || 0) + 1;
  }
  
  return {
    total: logs.length,
    byLevel,
    byModule,
  };
}

/**
 * Grouped log entry — represents one or more consecutive identical logs
 */
export interface GroupedLogEntry {
  /** The representative log entry */
  entry: LogEntry;
  /** Number of consecutive duplicates (1 = no duplicates) */
  count: number;
  /** Timestamps of all occurrences */
  timestamps: Date[];
}

/**
 * Group consecutive duplicate log entries.
 * Two entries are considered duplicates if they share the same module and message.
 */
export function groupConsecutiveLogs(logs: LogEntry[]): GroupedLogEntry[] {
  if (logs.length === 0) return [];
  
  const groups: GroupedLogEntry[] = [];
  let current: GroupedLogEntry = {
    entry: logs[0],
    count: 1,
    timestamps: [logs[0].timestamp],
  };
  
  for (let i = 1; i < logs.length; i++) {
    const entry = logs[i];
    if (entry.module === current.entry.module && entry.message === current.entry.message) {
      current.count++;
      current.timestamps.push(entry.timestamp);
    } else {
      groups.push(current);
      current = { entry, count: 1, timestamps: [entry.timestamp] };
    }
  }
  
  groups.push(current);
  return groups;
}
