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
  LogContext,
  LogContextPayload,
  LogPolicyState,
  LogSuppressionStats,
} from './types';
import {
  generateLogId,
  extractErrorInfo,
  sanitizeLogEntry,
} from './utils';
import { ConsoleTransport, MemoryTransport, TauriTransport } from './transports';

const CONTEXT_KEYS = new Set(['eventCode', 'operationId', 'sessionId', 'tags', 'context', 'data']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeContext(context?: LogContext): LogContext | undefined {
  if (!context) {
    return undefined;
  }

  const normalized: LogContext = {};
  if (context.eventCode) normalized.eventCode = context.eventCode;
  if (context.operationId) normalized.operationId = context.operationId;
  if (context.sessionId) normalized.sessionId = context.sessionId;
  if (context.tags && context.tags.length > 0) {
    normalized.tags = [...new Set(context.tags.filter(Boolean))];
  }

  if (Object.keys(normalized).length === 0) {
    return undefined;
  }

  return normalized;
}

/**
 * Central log manager singleton
 */
class LogManager {
  private static instance: LogManager | null = null;

  private config: LogManagerConfig;
  private readonly environmentDefaultLevel: LogLevel;
  private transports: Map<string, LogTransport> = new Map();
  private consoleTransport: ConsoleTransport;
  private memoryTransport: MemoryTransport;
  private tauriTransport: TauriTransport;
  private loggers: Map<string, Logger> = new Map();

  private constructor(config: Partial<LogManagerConfig> = {}) {
    this.environmentDefaultLevel = DEFAULT_CONFIG.level;
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      moduleLevels: { ...DEFAULT_CONFIG.moduleLevels, ...config.moduleLevels },
      redactionKeys: config.redactionKeys ? [...config.redactionKeys] : [...DEFAULT_CONFIG.redactionKeys],
    };

    // Initialize built-in transports
    this.consoleTransport = new ConsoleTransport({
      timestamps: this.config.consoleTimestamps,
      modules: this.config.consoleModules,
    });

    this.memoryTransport = new MemoryTransport({
      maxLogs: this.config.maxLogs,
      suppressionEnabled: this.config.suppressionEnabled,
      suppressionWindowMs: this.config.suppressionWindowMs,
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
      debug: (message: string, data?: unknown, context?: LogContext) => {
        this.log(LogLevel.DEBUG, module, message, data, context);
      },
      info: (message: string, data?: unknown, context?: LogContext) => {
        this.log(LogLevel.INFO, module, message, data, context);
      },
      warn: (message: string, data?: unknown, context?: LogContext) => {
        this.log(LogLevel.WARN, module, message, data, context);
      },
      error: (message: string, error?: Error | unknown, context?: LogContext) => {
        this.logError(module, message, error, context);
      },
      getModule: () => module,
    };

    this.loggers.set(module, logger);
    return logger;
  }

  /**
   * Log a message
   */
  private log(level: LogLevel, module: string, message: string, data?: unknown, contextArg?: LogContext): void {
    // Check effective level filter
    if (level < this.getEffectiveLevel(module)) {
      return;
    }

    const { payload, context } = this.parseDataAndContext(data, contextArg);

    const entry: LogEntry = {
      id: generateLogId(),
      timestamp: new Date(),
      level,
      module,
      message,
      data: payload,
      occurrenceCount: 1,
      ...context,
    };

    this.writeToTransports(entry);
  }

  /**
   * Log an error
   */
  private logError(module: string, message: string, error?: Error | unknown, contextArg?: LogContext): void {
    if (LogLevel.ERROR < this.getEffectiveLevel(module)) {
      return;
    }

    const errorInfo = error ? extractErrorInfo(error) : undefined;
    const context = normalizeContext(contextArg);

    const entry: LogEntry = {
      id: generateLogId(),
      timestamp: new Date(),
      level: LogLevel.ERROR,
      module,
      message: errorInfo ? `${message}: ${errorInfo.message}` : message,
      data: error instanceof Error
        ? {
            name: error.name,
            message: error.message,
          }
        : error,
      stack: errorInfo?.stack,
      errorName: errorInfo?.name,
      occurrenceCount: 1,
      ...context,
    };

    this.writeToTransports(entry);
  }

  /**
   * Write entry to all transports
   */
  private writeToTransports(entry: LogEntry): void {
    const processedEntry = this.config.redactionEnabled
      ? sanitizeLogEntry(entry, { redactionKeys: this.config.redactionKeys })
      : {
          ...entry,
          occurrenceCount: Math.max(1, entry.occurrenceCount ?? 1),
          firstTimestamp: entry.firstTimestamp ?? entry.timestamp,
          lastTimestamp: entry.lastTimestamp ?? entry.timestamp,
        };

    for (const transport of this.transports.values()) {
      try {
        transport.write(processedEntry);
      } catch {
        // Ignore transport errors
      }
    }
  }

  /**
   * Parse backward-compatible contextual payload shapes.
   */
  private parseDataAndContext(input?: unknown, contextArg?: LogContext): { payload?: unknown; context?: LogContext } {
    let payload = input;
    const context: LogContext = { ...(contextArg ?? {}) };

    if (!isRecord(input)) {
      return {
        payload,
        context: normalizeContext(context),
      };
    }

    // Explicit nested `context` envelope.
    if (isRecord(input.context)) {
      const nested = input.context as LogContext;
      if (nested.eventCode) context.eventCode = nested.eventCode;
      if (nested.operationId) context.operationId = nested.operationId;
      if (nested.sessionId) context.sessionId = nested.sessionId;
      if (Array.isArray(nested.tags)) context.tags = nested.tags.filter(Boolean) as string[];
      payload = 'data' in input ? input.data : undefined;
      return {
        payload,
        context: normalizeContext(context),
      };
    }

    // Flat envelope if keys are context-only (plus optional `data`).
    const payloadShape = input as LogContextPayload;
    const hasContextKey = Boolean(
      payloadShape.eventCode
      || payloadShape.operationId
      || payloadShape.sessionId
      || (Array.isArray(payloadShape.tags) && payloadShape.tags.length > 0)
    );
    const keys = Object.keys(input);
    const isContextOnlyObject = keys.length > 0 && keys.every((key) => CONTEXT_KEYS.has(key));

    if (hasContextKey && isContextOnlyObject) {
      if (payloadShape.eventCode) context.eventCode = payloadShape.eventCode;
      if (payloadShape.operationId) context.operationId = payloadShape.operationId;
      if (payloadShape.sessionId) context.sessionId = payloadShape.sessionId;
      if (Array.isArray(payloadShape.tags)) context.tags = payloadShape.tags.filter(Boolean) as string[];
      payload = payloadShape.data;
      return {
        payload,
        context: normalizeContext(context),
      };
    }

    return {
      payload,
      context: normalizeContext(context),
    };
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
    return {
      ...this.config,
      moduleLevels: { ...this.config.moduleLevels },
      redactionKeys: [...this.config.redactionKeys],
    };
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<LogManagerConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      moduleLevels: config.moduleLevels ? { ...config.moduleLevels } : this.config.moduleLevels,
      redactionKeys: config.redactionKeys ? [...config.redactionKeys] : this.config.redactionKeys,
    };

    // Update transports
    this.consoleTransport.setConfig({
      timestamps: this.config.consoleTimestamps,
      modules: this.config.consoleModules,
    });

    this.memoryTransport.setConfig({
      maxLogs: this.config.maxLogs,
      suppressionEnabled: this.config.suppressionEnabled,
      suppressionWindowMs: this.config.suppressionWindowMs,
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
   * Set global log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Get global log level
   */
  getLevel(): LogLevel {
    return this.config.level;
  }

  /**
   * Set or clear module-level log override.
   */
  setModuleLevel(module: string, level?: LogLevel): void {
    if (!module.trim()) {
      return;
    }

    if (level === undefined) {
      delete this.config.moduleLevels[module];
      return;
    }

    this.config.moduleLevels[module] = level;
  }

  /**
   * Get module-level overrides.
   */
  getModuleLevels(): Record<string, LogLevel> {
    return { ...this.config.moduleLevels };
  }

  /**
   * Get effective level with precedence: module > global > env default.
   */
  getEffectiveLevel(module: string): LogLevel {
    const moduleLevel = this.config.moduleLevels[module];
    if (moduleLevel !== undefined) {
      return moduleLevel;
    }

    if (this.config.level !== undefined) {
      return this.config.level;
    }

    return this.environmentDefaultLevel;
  }

  /**
   * Get runtime policy state.
   */
  getPolicyState(): LogPolicyState {
    return {
      environmentDefaultLevel: this.environmentDefaultLevel,
      globalLevel: this.config.level,
      moduleLevels: this.getModuleLevels(),
    };
  }

  /**
   * Toggle duplicate suppression.
   */
  setSuppressionEnabled(enabled: boolean): void {
    this.config.suppressionEnabled = enabled;
    this.memoryTransport.setConfig({ suppressionEnabled: enabled });
  }

  /**
   * Get suppression snapshot.
   */
  getSuppressionStats(): LogSuppressionStats {
    const memoryStats = this.memoryTransport.getSuppressionStats();
    return {
      ...memoryStats,
      droppedTransportLogs: this.tauriTransport.getDroppedCount(),
    };
  }

  /**
   * Reset dropped transport counters.
   */
  resetTransportDropStats(): void {
    this.tauriTransport.resetDroppedCount();
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
 * Set global log level
 */
export function setLogLevel(level: LogLevel): void {
  LogManager.getInstance().setLevel(level);
}

/**
 * Get global log level
 */
export function getLogLevel(): LogLevel {
  return LogManager.getInstance().getLevel();
}

/**
 * Set module-specific log level override.
 */
export function setModuleLogLevel(module: string, level?: LogLevel): void {
  LogManager.getInstance().setModuleLevel(module, level);
}

/**
 * Get module-specific log level overrides.
 */
export function getModuleLogLevels(): Record<string, LogLevel> {
  return LogManager.getInstance().getModuleLevels();
}

/**
 * Get effective level for a module.
 */
export function getEffectiveLogLevel(module: string): LogLevel {
  return LogManager.getInstance().getEffectiveLevel(module);
}

/**
 * Get runtime policy state.
 */
export function getLogPolicyState(): LogPolicyState {
  return LogManager.getInstance().getPolicyState();
}

/**
 * Enable/disable duplicate suppression.
 */
export function setLogSuppressionEnabled(enabled: boolean): void {
  LogManager.getInstance().setSuppressionEnabled(enabled);
}

/**
 * Get duplicate suppression stats.
 */
export function getLogSuppressionStats(): LogSuppressionStats {
  return LogManager.getInstance().getSuppressionStats();
}

/**
 * Reset transport drop statistics.
 */
export function resetLogTransportDropStats(): void {
  LogManager.getInstance().resetTransportDropStats();
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
