/**
 * Connectivity testing service for map providers
 * Monitors API health, response times, and provides intelligent failover
 */

import type { BaseMapProvider, ConnectivityStatus } from './map-providers/base-map-provider';
import { mapConfig } from './map-config';

export interface ProviderHealthStatus {
  provider: 'openstreetmap' | 'google' | 'mapbox' | 'other';
  isHealthy: boolean;
  responseTime: number;
  lastChecked: number;
  errorCount: number;
  successRate: number; // 0-1
  status: ConnectivityStatus;
}

export interface ConnectivityTestResult {
  success: boolean;
  responseTime: number;
  error?: string;
  statusCode?: number;
  timestamp: number;
}

export interface NetworkQualityMetrics {
  averageResponseTime: number;
  successRate: number;
  isOnline: boolean;
  effectiveConnectionType?: 'slow-2g' | '2g' | '3g' | '4g';
  downlink?: number;
  rtt?: number;
}

class ConnectivityChecker {
  private healthStatuses: Map<string, ProviderHealthStatus> = new Map();
  private testHistory: Map<string, ConnectivityTestResult[]> = new Map();
  private intervalIds: Map<string, ReturnType<typeof setInterval>> = new Map();
  private listeners: Array<(status: ProviderHealthStatus) => void> = [];
  private lastCheckTime: Map<string, number> = new Map();
  private isPageVisible = true;
  
  private readonly MAX_HISTORY_SIZE = 50;
  private readonly ERROR_THRESHOLD = 0.7; // Consider unhealthy if success rate < 70%
  private readonly SLOW_RESPONSE_THRESHOLD = 5000; // 5 seconds
  private readonly MIN_CHECK_INTERVAL = 30000; // Minimum 30 seconds between checks
  private readonly BACKGROUND_MULTIPLIER = 3; // Slow down checks when page is not visible

  constructor() {
    this.initializeNetworkMonitoring();
    this.initializeVisibilityMonitoring();
  }

  private initializeNetworkMonitoring(): void {
    // Monitor online/offline status
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleNetworkChange.bind(this));
      window.addEventListener('offline', this.handleNetworkChange.bind(this));
    }
  }

  private initializeVisibilityMonitoring(): void {
    // Reduce health check frequency when page is not visible
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.isPageVisible = document.visibilityState === 'visible';
        
        // Resume checks immediately when page becomes visible
        if (this.isPageVisible) {
          this.checkAllProvidersHealth();
        }
      });
    }
  }

  private handleNetworkChange(): void {
    // Re-check all providers when network status changes
    setTimeout(() => {
      this.checkAllProvidersHealth();
    }, 1000);
  }

  /**
   * Start monitoring a provider's connectivity
   */
  startMonitoring(provider: BaseMapProvider): void {
    const providerType = provider.getProviderType();
    const interval = mapConfig.getConfiguration().healthCheckInterval;
    
    // Stop existing monitoring if any
    this.stopMonitoring(providerType);
    
    // Initialize health status
    this.healthStatuses.set(providerType, {
      provider: providerType,
      isHealthy: true,
      responseTime: 0,
      lastChecked: 0,
      errorCount: 0,
      successRate: 1,
      status: {
        isConnected: false,
        lastChecked: 0,
      },
    });

    // Start periodic health checks
    const intervalId = setInterval(async () => {
      await this.checkProviderHealth(provider);
    }, interval);
    
    this.intervalIds.set(providerType, intervalId);
    
    // Initial health check
    this.checkProviderHealth(provider);
  }

  /**
   * Stop monitoring a provider
   */
  stopMonitoring(providerType: 'openstreetmap' | 'google' | 'mapbox' | 'other'): void {
    const intervalId = this.intervalIds.get(providerType);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervalIds.delete(providerType);
    }
  }

  /**
   * Check if enough time has passed since last check
   */
  private shouldSkipCheck(providerType: string): boolean {
    const lastCheck = this.lastCheckTime.get(providerType) || 0;
    const timeSinceLastCheck = Date.now() - lastCheck;
    const minInterval = this.isPageVisible 
      ? this.MIN_CHECK_INTERVAL 
      : this.MIN_CHECK_INTERVAL * this.BACKGROUND_MULTIPLIER;
    
    return timeSinceLastCheck < minInterval;
  }

  /**
   * Check health of a specific provider
   */
  async checkProviderHealth(provider: BaseMapProvider): Promise<ProviderHealthStatus> {
    const providerType = provider.getProviderType();
    
    // Skip if checked too recently (unless forced)
    if (this.shouldSkipCheck(providerType)) {
      const existingStatus = this.healthStatuses.get(providerType);
      if (existingStatus) {
        return existingStatus;
      }
    }
    
    this.lastCheckTime.set(providerType, Date.now());
    const startTime = Date.now();
    
    try {
      const status = await provider.checkConnectivity();
      const responseTime = Date.now() - startTime;
      
      // Record test result
      this.recordTestResult(providerType, {
        success: status.isConnected,
        responseTime,
        error: status.errorMessage,
        statusCode: status.statusCode,
        timestamp: Date.now(),
      });
      
      // Update health status
      const healthStatus = this.updateHealthStatus(providerType, {
        success: status.isConnected,
        responseTime,
        status,
      });
      
      this.notifyListeners(healthStatus);
      return healthStatus;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Record failed test
      this.recordTestResult(providerType, {
        success: false,
        responseTime,
        error: errorMessage,
        timestamp: Date.now(),
      });
      
      // Update health status
      const healthStatus = this.updateHealthStatus(providerType, {
        success: false,
        responseTime,
        status: {
          isConnected: false,
          lastChecked: Date.now(),
          errorMessage,
        },
      });
      
      this.notifyListeners(healthStatus);
      return healthStatus;
    }
  }

  /**
   * Check health of all enabled providers
   */
  async checkAllProvidersHealth(): Promise<ProviderHealthStatus[]> {
    // This would need to be implemented with actual provider instances
    // For now, return empty array as placeholder
    return [];
  }

  private recordTestResult(providerType: string, result: ConnectivityTestResult): void {
    if (!this.testHistory.has(providerType)) {
      this.testHistory.set(providerType, []);
    }
    
    const history = this.testHistory.get(providerType)!;
    history.push(result);
    
    // Keep only recent history
    if (history.length > this.MAX_HISTORY_SIZE) {
      history.splice(0, history.length - this.MAX_HISTORY_SIZE);
    }
  }

  private updateHealthStatus(
    providerType: string,
    testResult: {
      success: boolean;
      responseTime: number;
      status: ConnectivityStatus;
    }
  ): ProviderHealthStatus {
    let healthStatus = this.healthStatuses.get(providerType);
    
    if (!healthStatus) {
      healthStatus = {
        provider: providerType as ProviderHealthStatus['provider'],
        isHealthy: true,
        responseTime: 0,
        lastChecked: 0,
        errorCount: 0,
        successRate: 1,
        status: testResult.status,
      };
    }
    
    // Update basic metrics
    healthStatus.lastChecked = Date.now();
    healthStatus.responseTime = testResult.responseTime;
    healthStatus.status = testResult.status;
    
    // Update error count
    if (!testResult.success) {
      healthStatus.errorCount++;
    }
    
    // Calculate success rate from recent history
    const history = this.testHistory.get(providerType) || [];
    if (history.length > 0) {
      const successCount = history.filter(h => h.success).length;
      healthStatus.successRate = successCount / history.length;
    }
    
    // Determine overall health
    healthStatus.isHealthy = this.determineHealth(healthStatus, history);
    
    this.healthStatuses.set(providerType, healthStatus);
    return healthStatus;
  }

  private determineHealth(
    status: ProviderHealthStatus,
    history: ConnectivityTestResult[]
  ): boolean {
    // Consider unhealthy if success rate is below threshold
    if (status.successRate < this.ERROR_THRESHOLD) {
      return false;
    }
    
    // Consider unhealthy if current request failed and recent performance is poor
    if (!status.status.isConnected) {
      const recentHistory = history.slice(-5); // Last 5 requests
      const recentSuccessRate = recentHistory.length > 0 
        ? recentHistory.filter(h => h.success).length / recentHistory.length 
        : 0;
      
      if (recentSuccessRate < 0.5) {
        return false;
      }
    }
    
    // Consider unhealthy if response time is consistently slow
    const recentResponseTimes = history.slice(-10).map(h => h.responseTime);
    if (recentResponseTimes.length >= 5) {
      const avgResponseTime = recentResponseTimes.reduce((a, b) => a + b, 0) / recentResponseTimes.length;
      if (avgResponseTime > this.SLOW_RESPONSE_THRESHOLD) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get current health status of a provider
   */
  getProviderHealth(providerType: 'openstreetmap' | 'google' | 'mapbox' | 'other'): ProviderHealthStatus | undefined {
    return this.healthStatuses.get(providerType);
  }

  /**
   * Get health status of all monitored providers
   */
  getAllProviderHealth(): ProviderHealthStatus[] {
    return Array.from(this.healthStatuses.values());
  }

  /**
   * Get test history for a provider
   */
  getTestHistory(providerType: 'openstreetmap' | 'google' | 'mapbox' | 'other'): ConnectivityTestResult[] {
    return this.testHistory.get(providerType) || [];
  }

  /**
   * Get network quality metrics
   */
  getNetworkQuality(): NetworkQualityMetrics {
    const allHistory = Array.from(this.testHistory.values()).flat();
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    
    if (allHistory.length === 0) {
      return {
        averageResponseTime: 0,
        successRate: 0,
        isOnline,
      };
    }
    
    const successCount = allHistory.filter(h => h.success).length;
    const successRate = successCount / allHistory.length;
    const avgResponseTime = allHistory.reduce((sum, h) => sum + h.responseTime, 0) / allHistory.length;
    
    const metrics: NetworkQualityMetrics = {
      averageResponseTime: avgResponseTime,
      successRate,
      isOnline,
    };
    
    // Add connection info if available
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as unknown as { connection: { effectiveType: string; downlink: number; rtt: number } }).connection;
      metrics.effectiveConnectionType = connection.effectiveType as NetworkQualityMetrics['effectiveConnectionType'];
      metrics.downlink = connection.downlink;
      metrics.rtt = connection.rtt;
    }
    
    return metrics;
  }

  /**
   * Get recommended provider based on health status
   */
  getRecommendedProvider(): 'openstreetmap' | 'google' | 'mapbox' | 'other' | null {
    const enabledProviders = mapConfig.getEnabledProviders();
    const config = mapConfig.getConfiguration();
    
    // Filter to healthy providers only
    const healthyProviders = enabledProviders.filter(provider => {
      const health = this.getProviderHealth(provider.provider);
      return health?.isHealthy !== false;
    });
    
    if (healthyProviders.length === 0) {
      return null;
    }
    
    // Apply fallback strategy
    switch (config.fallbackStrategy) {
      case 'priority':
        return healthyProviders[0].provider;
      
      case 'fastest': {
        const fastest = healthyProviders.reduce((best, current) => {
          const currentHealth = this.getProviderHealth(current.provider);
          const bestHealth = this.getProviderHealth(best.provider);
          
          if (!currentHealth) return best;
          if (!bestHealth) return current;
          
          return currentHealth.responseTime < bestHealth.responseTime ? current : best;
        });
        return fastest.provider;
      }
      
      case 'random': {
        const randomIndex = Math.floor(Math.random() * healthyProviders.length);
        return healthyProviders[randomIndex].provider;
      }
      
      case 'round-robin': {
        // Simple round-robin based on timestamp
        const index = Math.floor(Date.now() / 60000) % healthyProviders.length;
        return healthyProviders[index].provider;
      }
      
      default:
        return healthyProviders[0].provider;
    }
  }

  /**
   * Perform a quick connectivity test
   */
  async quickConnectivityTest(): Promise<boolean> {
    try {
      const testUrls = [
        'https://www.google.com/favicon.ico',
        'https://httpbin.org/status/200',
        'https://jsonplaceholder.typicode.com/posts/1',
      ];
      
      const promises = testUrls.map(async url => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        
        try {
          const response = await fetch(url, {
            signal: controller.signal,
            mode: 'no-cors',
          });
          clearTimeout(timeout);
          return true;
        } catch {
          clearTimeout(timeout);
          return false;
        }
      });
      
      const results = await Promise.allSettled(promises);
      const successCount = results.filter(
        result => result.status === 'fulfilled' && result.value
      ).length;
      
      return successCount >= 1; // At least one test must pass
    } catch {
      return false;
    }
  }

  /**
   * Add listener for health status changes
   */
  addHealthListener(listener: (status: ProviderHealthStatus) => void): () => void {
    this.listeners.push(listener);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(status: ProviderHealthStatus): void {
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in health status listener:', error);
      }
    });
  }

  /**
   * Reset all health data
   */
  reset(): void {
    // Clear all intervals
    this.intervalIds.forEach(intervalId => clearInterval(intervalId));
    this.intervalIds.clear();
    
    // Clear data
    this.healthStatuses.clear();
    this.testHistory.clear();
  }

  /**
   * Get connectivity statistics
   */
  getStatistics(): {
    totalTests: number;
    successRate: number;
    averageResponseTime: number;
    providerStats: Array<{
      provider: string;
      tests: number;
      successRate: number;
      avgResponseTime: number;
    }>;
  } {
    const allHistory = Array.from(this.testHistory.entries());
    let totalTests = 0;
    let totalSuccesses = 0;
    let totalResponseTime = 0;
    
    const providerStats = allHistory.map(([provider, history]) => {
      const successes = history.filter(h => h.success).length;
      const avgResponseTime = history.length > 0 
        ? history.reduce((sum, h) => sum + h.responseTime, 0) / history.length 
        : 0;
      
      totalTests += history.length;
      totalSuccesses += successes;
      totalResponseTime += history.reduce((sum, h) => sum + h.responseTime, 0);
      
      return {
        provider,
        tests: history.length,
        successRate: history.length > 0 ? successes / history.length : 0,
        avgResponseTime,
      };
    });
    
    return {
      totalTests,
      successRate: totalTests > 0 ? totalSuccesses / totalTests : 0,
      averageResponseTime: totalTests > 0 ? totalResponseTime / totalTests : 0,
      providerStats,
    };
  }
}

// Singleton instance
export const connectivityChecker = new ConnectivityChecker();
