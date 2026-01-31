/**
 * Tauri Transport
 * 
 * Bridges frontend logs to Tauri backend logging system.
 */

import { LogEntry, LogTransport, LogLevel, LOG_LEVEL_NAMES } from '../types';
import { serializeData } from '../utils';

export interface TauriTransportConfig {
  /** Whether the transport is enabled */
  enabled: boolean;
  /** Minimum level to send to Tauri */
  minLevel: LogLevel;
  /** Whether to batch logs */
  batching: boolean;
  /** Batch interval in ms */
  batchInterval: number;
}

const DEFAULT_CONFIG: TauriTransportConfig = {
  enabled: true,
  minLevel: LogLevel.INFO,
  batching: true,
  batchInterval: 1000,
};

interface LogBatch {
  level: string;
  module: string;
  message: string;
  data?: string;
}

/**
 * Tauri transport for sending logs to the Rust backend
 */
export class TauriTransport implements LogTransport {
  readonly name = 'tauri';
  private config: TauriTransportConfig;
  private batch: LogBatch[] = [];
  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  private isTauri: boolean = false;
  private invoke: ((cmd: string, args?: Record<string, unknown>) => Promise<unknown>) | null = null;
  
  constructor(config: Partial<TauriTransportConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initTauri();
  }
  
  private async initTauri(): Promise<void> {
    try {
      // Check if we're in Tauri environment
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        this.invoke = invoke;
        this.isTauri = true;
      }
    } catch {
      this.isTauri = false;
    }
  }
  
  write(entry: LogEntry): void {
    if (!this.config.enabled || !this.isTauri) {
      return;
    }
    
    // Filter by level
    if (entry.level < this.config.minLevel) {
      return;
    }
    
    const logData: LogBatch = {
      level: LOG_LEVEL_NAMES[entry.level] as string,
      module: entry.module,
      message: entry.message,
    };
    
    if (entry.data !== undefined) {
      logData.data = serializeData(entry.data);
    }
    
    if (entry.stack) {
      logData.message += `\n${entry.stack}`;
    }
    
    if (this.config.batching) {
      this.addToBatch(logData);
    } else {
      this.sendLog(logData);
    }
  }
  
  private addToBatch(log: LogBatch): void {
    this.batch.push(log);
    
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.flushBatch();
      }, this.config.batchInterval);
    }
  }
  
  private flushBatch(): void {
    if (this.batch.length === 0) {
      return;
    }
    
    const logsToSend = [...this.batch];
    this.batch = [];
    this.batchTimer = null;
    
    // Send each log
    for (const log of logsToSend) {
      this.sendLog(log);
    }
  }
  
  private async sendLog(log: LogBatch): Promise<void> {
    if (!this.invoke) {
      return;
    }
    
    try {
      await this.invoke('log_from_frontend', {
        level: log.level,
        module: log.module,
        message: log.message,
        data: log.data,
      });
    } catch {
      // Silently fail - we don't want logging errors to break the app
    }
  }
  
  flush(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    this.flushBatch();
  }
  
  dispose(): void {
    this.flush();
    this.invoke = null;
  }
  
  /**
   * Check if Tauri is available
   */
  isAvailable(): boolean {
    return this.isTauri;
  }
  
  /**
   * Update configuration
   */
  setConfig(config: Partial<TauriTransportConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Get current configuration
   */
  getConfig(): TauriTransportConfig {
    return { ...this.config };
  }
}

/**
 * Create a Tauri transport instance
 */
export function createTauriTransport(config?: Partial<TauriTransportConfig>): TauriTransport {
  return new TauriTransport(config);
}
