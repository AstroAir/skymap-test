/**
 * Logger Types
 * 
 * Core type definitions for the unified logging system.
 */

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

/**
 * String representation of log levels
 */
export type LogLevelName = 'debug' | 'info' | 'warn' | 'error';

/**
 * A single log entry
 */
export interface LogEntry {
  /** Unique identifier for the log entry */
  id: string;
  /** Timestamp when the log was created */
  timestamp: Date;
  /** Log level */
  level: LogLevel;
  /** Module/component that created the log */
  module: string;
  /** Log message */
  message: string;
  /** Additional data associated with the log */
  data?: unknown;
  /** Error stack trace if available */
  stack?: string;
  /** Error name if this is an error log */
  errorName?: string;
}

/**
 * Logger interface for creating logs
 */
export interface Logger {
  /** Log a debug message */
  debug(message: string, data?: unknown): void;
  /** Log an info message */
  info(message: string, data?: unknown): void;
  /** Log a warning message */
  warn(message: string, data?: unknown): void;
  /** Log an error message */
  error(message: string, error?: Error | unknown): void;
  /** Get the module name for this logger */
  getModule(): string;
}

/**
 * Transport interface for outputting logs
 */
export interface LogTransport {
  /** Transport name */
  name: string;
  /** Write a log entry */
  write(entry: LogEntry): void;
  /** Flush any buffered logs */
  flush?(): void;
  /** Clean up resources */
  dispose?(): void;
}

/**
 * Filter for querying logs
 */
export interface LogFilter {
  /** Filter by minimum log level */
  level?: LogLevel;
  /** Filter by module name (exact match or prefix) */
  module?: string;
  /** Filter by search text in message */
  search?: string;
  /** Filter by start time */
  startTime?: Date;
  /** Filter by end time */
  endTime?: Date;
  /** Maximum number of entries to return */
  limit?: number;
}

/**
 * Log manager configuration
 */
export interface LogManagerConfig {
  /** Minimum log level to record */
  level: LogLevel;
  /** Maximum number of logs to keep in memory */
  maxLogs: number;
  /** Whether to output to console */
  enableConsole: boolean;
  /** Whether to persist logs (for Tauri) */
  enablePersistence: boolean;
  /** Whether to include timestamps in console output */
  consoleTimestamps: boolean;
  /** Whether to include module names in console output */
  consoleModules: boolean;
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: LogManagerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG,
  maxLogs: 1000,
  enableConsole: true,
  enablePersistence: true,
  consoleTimestamps: true,
  consoleModules: true,
};

/**
 * Log level to string mapping
 */
export const LOG_LEVEL_NAMES: Record<LogLevel, LogLevelName | 'none'> = {
  [LogLevel.DEBUG]: 'debug',
  [LogLevel.INFO]: 'info',
  [LogLevel.WARN]: 'warn',
  [LogLevel.ERROR]: 'error',
  [LogLevel.NONE]: 'none',
};

/**
 * String to log level mapping
 */
export const LOG_LEVEL_VALUES: Record<string, LogLevel> = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
  none: LogLevel.NONE,
};

/**
 * Log level colors for console output
 */
export const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: '#9E9E9E', // Gray
  [LogLevel.INFO]: '#2196F3',  // Blue
  [LogLevel.WARN]: '#FF9800',  // Orange
  [LogLevel.ERROR]: '#F44336', // Red
  [LogLevel.NONE]: '#000000',  // Black
};

/**
 * Log level console methods
 */
export const LOG_LEVEL_METHODS: Record<LogLevel, 'debug' | 'info' | 'warn' | 'error' | 'log'> = {
  [LogLevel.DEBUG]: 'debug',
  [LogLevel.INFO]: 'info',
  [LogLevel.WARN]: 'warn',
  [LogLevel.ERROR]: 'error',
  [LogLevel.NONE]: 'log',
};
