/**
 * Console Transport
 * 
 * Outputs logs to the browser console with formatting and colors.
 */

import { LogEntry, LogTransport, LogLevel, LOG_LEVEL_COLORS, LOG_LEVEL_METHODS } from '../types';
import { formatTimestamp, serializeData } from '../utils';

export interface ConsoleTransportConfig {
  /** Whether to include timestamps */
  timestamps: boolean;
  /** Whether to include module names */
  modules: boolean;
  /** Whether to use colors */
  colors: boolean;
  /** Whether to group similar logs */
  grouping: boolean;
}

const DEFAULT_CONFIG: ConsoleTransportConfig = {
  timestamps: true,
  modules: true,
  colors: true,
  grouping: false,
};

/**
 * Console transport for outputting logs to browser console
 */
export class ConsoleTransport implements LogTransport {
  readonly name = 'console';
  private config: ConsoleTransportConfig;
  
  constructor(config: Partial<ConsoleTransportConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  write(entry: LogEntry): void {
    const method = LOG_LEVEL_METHODS[entry.level];
    const color = LOG_LEVEL_COLORS[entry.level];
    
    // Build the prefix parts
    const prefixParts: string[] = [];
    const styleParts: string[] = [];
    
    if (this.config.timestamps) {
      prefixParts.push(`%c[${formatTimestamp(entry.timestamp)}]`);
      styleParts.push('color: #666');
    }
    
    if (this.config.modules) {
      prefixParts.push(`%c[${entry.module}]`);
      styleParts.push(`color: ${color}; font-weight: bold`);
    }
    
    // Build the message
    const prefix = prefixParts.join(' ');
    const message = entry.message;
    
    // Prepare arguments
    const args: unknown[] = [];
    
    if (this.config.colors && prefixParts.length > 0) {
      args.push(`${prefix} %c${message}`, ...styleParts, 'color: inherit');
    } else {
      // Fallback without colors
      const plainPrefix = this.config.timestamps 
        ? `[${formatTimestamp(entry.timestamp)}] ` 
        : '';
      const modulePrefix = this.config.modules 
        ? `[${entry.module}] ` 
        : '';
      args.push(`${plainPrefix}${modulePrefix}${message}`);
    }
    
    // Add data if present
    if (entry.data !== undefined) {
      if (entry.data instanceof Error) {
        args.push(entry.data);
      } else if (typeof entry.data === 'object' && entry.data !== null) {
        args.push(entry.data);
      } else {
        args.push(serializeData(entry.data));
      }
    }
    
    // Add stack trace for errors
    if (entry.stack && entry.level === LogLevel.ERROR) {
      // Stack is usually already in the error object
      if (!(entry.data instanceof Error)) {
        args.push('\n' + entry.stack);
      }
    }
    
    // Output to console
    console[method](...args);
  }
  
  /**
   * Update configuration
   */
  setConfig(config: Partial<ConsoleTransportConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Get current configuration
   */
  getConfig(): ConsoleTransportConfig {
    return { ...this.config };
  }
}

/**
 * Create a console transport instance
 */
export function createConsoleTransport(config?: Partial<ConsoleTransportConfig>): ConsoleTransport {
  return new ConsoleTransport(config);
}
