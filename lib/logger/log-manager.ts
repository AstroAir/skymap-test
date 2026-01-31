/**
 * Log Manager
 * 
 * Central manager for the logging system. Provides logger creation,
 * configuration, and access to log entries.
 */

import {
  LogLevel,
  LogEntry,
  Logger,
  LogTransport,
  LogFilter,
  LogManagerConfig,
  DEFAULT_CONFIG,
} from './types';
import { generateLogId, extractErrorInfo } from './utils';
import { ConsoleTransport, MemoryTransport, TauriTransport } from './transports';

/**
 * Central log manager singleton
 */
class LogManager {
  private static instance: LogManager | null = null;
  
  private config: LogManagerConfig;
  private transports: Map<string, LogTransport> = new Map();
  private consoleTransport: ConsoleTransport;
  private memoryTransport: MemoryTransport;
  private tauriTransport: TauriTransport;
  private loggers: Map<string, Logger> = new Map();
  
  private constructor(config: Partial<LogManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize built-in transports
    this.consoleTransport = new ConsoleTransport({
      timestamps: this.config.consoleTimestamps,
      modules: this.config.consoleModules,
    });
    
    this.memoryTransport = new MemoryTransport({
      maxLogs: this.config.maxLogs,
    });
    
    this.tauriTransport = new TauriTransport({
      enabled: this.config.enablePersistence,
    });
    
    // Register built-in transports
    if (this.config.enableConsole) {
      this.transports.set('console', this.consoleTransport);
    }
    this.transports.set('memory', this.memoryTransport);
    if (this.config.enablePersistence) {
      this.transports.set('tauri', this.tauriTransport);
    }
  }
  
  /**
   * Get the singleton instance
   */
  static getInstance(): LogManager {
    if (!LogManager.instance) {
      LogManager.instance = new LogManager();
    }
    return LogManager.instance;
  }
  
  /**
   * Initialize with custom config (must be called before first getInstance)
   */
  static initialize(config: Partial<LogManagerConfig>): LogManager {
    if (LogManager.instance) {
      // Update existing instance
      LogManager.instance.setConfig(config);
    } else {
      LogManager.instance = new LogManager(config);
    }
    return LogManager.instance;
  }
  
  /**
   * Reset the singleton (for testing)
   */
  static reset(): void {
    if (LogManager.instance) {
      LogManager.instance.dispose();
      LogManager.instance = null;
    }
  }
  
  /**
   * Create a logger for a specific module
   */
  createLogger(module: string): Logger {
    // Return cached logger if exists
    if (this.loggers.has(module)) {
      return this.loggers.get(module)!;
    }
    
    const logger: Logger = {
      debug: (message: string, data?: unknown) => {
        this.log(LogLevel.DEBUG, module, message, data);
      },
      info: (message: string, data?: unknown) => {
        this.log(LogLevel.INFO, module, message, data);
      },
      warn: (message: string, data?: unknown) => {
        this.log(LogLevel.WARN, module, message, data);
      },
      error: (message: string, error?: Error | unknown) => {
        this.logError(module, message, error);
      },
      getModule: () => module,
    };
    
    this.loggers.set(module, logger);
    return logger;
  }
  
  /**
   * Log a message
   */
  private log(level: LogLevel, module: string, message: string, data?: unknown): void {
    // Check level filter
    if (level < this.config.level) {
      return;
    }
    
    const entry: LogEntry = {
      id: generateLogId(),
      timestamp: new Date(),
      level,
      module,
      message,
      data,
    };
    
    this.writeToTransports(entry);
  }
  
  /**
   * Log an error
   */
  private logError(module: string, message: string, error?: Error | unknown): void {
    if (LogLevel.ERROR < this.config.level) {
      return;
    }
    
    const errorInfo = error ? extractErrorInfo(error) : undefined;
    
    const entry: LogEntry = {
      id: generateLogId(),
      timestamp: new Date(),
      level: LogLevel.ERROR,
      module,
      message: errorInfo ? `${message}: ${errorInfo.message}` : message,
      data: error instanceof Error ? error : undefined,
      stack: errorInfo?.stack,
      errorName: errorInfo?.name,
    };
    
    this.writeToTransports(entry);
  }
  
  /**
   * Write entry to all transports
   */
  private writeToTransports(entry: LogEntry): void {
    for (const transport of this.transports.values()) {
      try {
        transport.write(entry);
      } catch {
        // Ignore transport errors
      }
    }
  }
  
  /**
   * Get all logs from memory
   */
  getLogs(): LogEntry[] {
    return this.memoryTransport.getLogs();
  }
  
  /**
   * Get filtered logs
   */
  getFilteredLogs(filter: LogFilter): LogEntry[] {
    return this.memoryTransport.getFilteredLogs(filter);
  }
  
  /**
   * Get log count
   */
  getLogCount(): number {
    return this.memoryTransport.getLogCount();
  }
  
  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.memoryTransport.clear();
  }
  
  /**
   * Subscribe to new log entries
   */
  subscribe(listener: (entry: LogEntry) => void): () => void {
    return this.memoryTransport.subscribe(listener);
  }
  
  /**
   * Subscribe to logs changed events
   */
  onLogsChanged(listener: (logs: LogEntry[]) => void): () => void {
    return this.memoryTransport.onLogsChanged(listener);
  }
  
  /**
   * Get current configuration
   */
  getConfig(): LogManagerConfig {
    return { ...this.config };
  }
  
  /**
   * Update configuration
   */
  setConfig(config: Partial<LogManagerConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Update transports
    this.consoleTransport.setConfig({
      timestamps: this.config.consoleTimestamps,
      modules: this.config.consoleModules,
    });
    
    this.memoryTransport.setConfig({
      maxLogs: this.config.maxLogs,
    });
    
    this.tauriTransport.setConfig({
      enabled: this.config.enablePersistence,
    });
    
    // Enable/disable console transport
    if (this.config.enableConsole && !this.transports.has('console')) {
      this.transports.set('console', this.consoleTransport);
    } else if (!this.config.enableConsole && this.transports.has('console')) {
      this.transports.delete('console');
    }
    
    // Enable/disable tauri transport
    if (this.config.enablePersistence && !this.transports.has('tauri')) {
      this.transports.set('tauri', this.tauriTransport);
    } else if (!this.config.enablePersistence && this.transports.has('tauri')) {
      this.transports.delete('tauri');
    }
  }
  
  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }
  
  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.config.level;
  }
  
  /**
   * Add a custom transport
   */
  addTransport(transport: LogTransport): void {
    this.transports.set(transport.name, transport);
  }
  
  /**
   * Remove a transport
   */
  removeTransport(name: string): void {
    const transport = this.transports.get(name);
    if (transport?.dispose) {
      transport.dispose();
    }
    this.transports.delete(name);
  }
  
  /**
   * Get transport by name
   */
  getTransport(name: string): LogTransport | undefined {
    return this.transports.get(name);
  }
  
  /**
   * Get memory transport (for direct access)
   */
  getMemoryTransport(): MemoryTransport {
    return this.memoryTransport;
  }
  
  /**
   * Flush all transports
   */
  flush(): void {
    for (const transport of this.transports.values()) {
      if (transport.flush) {
        transport.flush();
      }
    }
  }
  
  /**
   * Dispose all resources
   */
  dispose(): void {
    this.flush();
    
    for (const transport of this.transports.values()) {
      if (transport.dispose) {
        transport.dispose();
      }
    }
    
    this.transports.clear();
    this.loggers.clear();
  }
}

// Export singleton access functions
export const logManager = {
  /**
   * Get the log manager instance
   */
  getInstance: LogManager.getInstance,
  
  /**
   * Initialize with custom config
   */
  initialize: LogManager.initialize,
  
  /**
   * Reset (for testing)
   */
  reset: LogManager.reset,
};

/**
 * Create a logger for a module
 */
export function createLogger(module: string): Logger {
  return LogManager.getInstance().createLogger(module);
}

/**
 * Get all logs
 */
export function getLogs(): LogEntry[] {
  return LogManager.getInstance().getLogs();
}

/**
 * Get filtered logs
 */
export function getFilteredLogs(filter: LogFilter): LogEntry[] {
  return LogManager.getInstance().getFilteredLogs(filter);
}

/**
 * Clear all logs
 */
export function clearLogs(): void {
  LogManager.getInstance().clearLogs();
}

/**
 * Set log level
 */
export function setLogLevel(level: LogLevel): void {
  LogManager.getInstance().setLevel(level);
}

/**
 * Get current log level
 */
export function getLogLevel(): LogLevel {
  return LogManager.getInstance().getLevel();
}

/**
 * Subscribe to new log entries
 */
export function subscribeToLogs(listener: (entry: LogEntry) => void): () => void {
  return LogManager.getInstance().subscribe(listener);
}

/**
 * Subscribe to logs changed events
 */
export function onLogsChanged(listener: (logs: LogEntry[]) => void): () => void {
  return LogManager.getInstance().onLogsChanged(listener);
}

/**
 * Flush all transports
 */
export function flushLogs(): void {
  LogManager.getInstance().flush();
}

export { LogManager };
