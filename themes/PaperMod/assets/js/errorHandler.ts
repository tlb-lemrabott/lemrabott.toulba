// Error Handling and Retry Logic for Image Preloading
// Manages errors, retries, and fallback strategies

import { debug, info, warn, error } from './logger';

export interface ErrorInfo {
  type: 'network' | 'timeout' | 'storage' | 'permission' | 'quota' | 'unknown';
  message: string;
  url?: string;
  retryCount: number;
  maxRetries: number;
  timestamp: number;
  context?: any;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

export interface ErrorStats {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByUrl: Record<string, number>;
  retrySuccessRate: number;
  averageRetries: number;
  lastError?: ErrorInfo;
}

export class ErrorHandler {
  private errors: ErrorInfo[] = [];
  private retryConfig: RetryConfig;
  private isOnline: boolean = navigator.onLine;
  private networkQuality: 'good' | 'fair' | 'poor' = 'good';

  constructor(config?: Partial<RetryConfig>) {
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      jitter: true,
      ...config
    };

    this.setupNetworkMonitoring();
  }

  // Setup network status monitoring
  private setupNetworkMonitoring(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('[ErrorHandler] Network connection restored');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('[ErrorHandler] Network connection lost');
    });

    // Monitor network quality using navigator.connection if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        connection.addEventListener('change', () => {
          this.updateNetworkQuality(connection);
        });
        this.updateNetworkQuality(connection);
      }
    }
  }

  // Update network quality based on connection info
  private updateNetworkQuality(connection: any): void {
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      this.networkQuality = 'poor';
    } else if (connection.effectiveType === '3g') {
      this.networkQuality = 'fair';
    } else {
      this.networkQuality = 'good';
    }
    debug(`[ErrorHandler] Network quality: ${this.networkQuality}`);
  }

  // Handle image loading error
  async handleImageError(url: string, error: Error, retryCount: number = 0): Promise<ErrorInfo> {
    const errorInfo: ErrorInfo = {
      type: this.categorizeError(error),
      message: error.message,
      url,
      retryCount,
      maxRetries: this.retryConfig.maxRetries,
      timestamp: Date.now(),
      context: {
        networkQuality: this.networkQuality,
        isOnline: this.isOnline,
        userAgent: navigator.userAgent
      }
    };

    this.errors.push(errorInfo);
    console.error(`[ErrorHandler] Image loading error: ${url}`, errorInfo);

    // Check if we should retry
    if (this.shouldRetry(errorInfo)) {
      const delay = this.calculateRetryDelay(retryCount);
      console.log(`[ErrorHandler] Retrying ${url} in ${delay}ms (attempt ${retryCount + 1}/${this.retryConfig.maxRetries})`);
      
      await this.delay(delay);
      return errorInfo;
    } else {
      console.warn(`[ErrorHandler] Max retries reached for ${url}`);
      return errorInfo;
    }
  }

  // Categorize error type
  private categorizeError(error: Error): ErrorInfo['type'] {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('cors')) {
      return 'network';
    }
    if (message.includes('timeout') || message.includes('abort')) {
      return 'timeout';
    }
    if (message.includes('quota') || message.includes('storage')) {
      return 'quota';
    }
    if (message.includes('permission') || message.includes('denied')) {
      return 'permission';
    }
    
    return 'unknown';
  }

  // Determine if error should be retried
  private shouldRetry(errorInfo: ErrorInfo): boolean {
    // Don't retry if offline
    if (!this.isOnline) {
      return false;
    }

    // Don't retry if max retries reached
    if (errorInfo.retryCount >= this.retryConfig.maxRetries) {
      return false;
    }

    // Don't retry certain error types
    if (errorInfo.type === 'permission' || errorInfo.type === 'quota') {
      return false;
    }

    // Adjust retry strategy based on network quality
    if (this.networkQuality === 'poor') {
      // Reduce max retries for poor network
      return errorInfo.retryCount < Math.min(this.retryConfig.maxRetries, 2);
    }

    return true;
  }

  // Calculate retry delay with exponential backoff
  private calculateRetryDelay(retryCount: number): number {
    let delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, retryCount);
    
    // Cap at max delay
    delay = Math.min(delay, this.retryConfig.maxDelay);
    
    // Add jitter to prevent thundering herd
    if (this.retryConfig.jitter) {
      const jitter = delay * 0.1 * Math.random();
      delay += jitter;
    }
    
    // Adjust based on network quality
    if (this.networkQuality === 'poor') {
      delay *= 1.5;
    } else if (this.networkQuality === 'fair') {
      delay *= 1.2;
    }
    
    return Math.round(delay);
  }

  // Utility delay function
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Handle fetch with timeout and retry
  async fetchWithRetry(url: string, options: RequestInit = {}): Promise<Response> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        // Add timeout to fetch
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 10000);
        });

        const fetchPromise = fetch(url, {
          ...options,
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        const response = await Promise.race([fetchPromise, timeoutPromise]);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.retryConfig.maxRetries) {
          const errorInfo = await this.handleImageError(url, lastError, attempt);
          
          // If error handler says not to retry, break
          if (!this.shouldRetry(errorInfo)) {
            break;
          }
        }
      }
    }
    
    throw lastError!;
  }

  // Handle IndexedDB errors
  async handleStorageError(operation: string, error: Error): Promise<void> {
    const errorInfo: ErrorInfo = {
      type: 'storage',
      message: `Storage operation failed: ${operation}`,
      retryCount: 0,
      maxRetries: 0,
      timestamp: Date.now(),
      context: { operation, originalError: error.message }
    };

    this.errors.push(errorInfo);
    console.error(`[ErrorHandler] Storage error: ${operation}`, errorInfo);

    // For quota errors, try to free space
    if (error.message.includes('quota') || error.message.includes('QuotaExceededError')) {
      console.log('[ErrorHandler] Quota exceeded, attempting to free space...');
      // This would trigger cache cleanup in the main system
    }
  }

  // Get error statistics
  getErrorStats(): ErrorStats {
    const totalErrors = this.errors.length;
    const errorsByType: Record<string, number> = {};
    const errorsByUrl: Record<string, number> = {};
    let totalRetries = 0;
    let successfulRetries = 0;

    this.errors.forEach(error => {
      // Count by type
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      
      // Count by URL
      if (error.url) {
        errorsByUrl[error.url] = (errorsByUrl[error.url] || 0) + 1;
      }
      
      // Count retries
      totalRetries += error.retryCount;
      if (error.retryCount > 0) {
        successfulRetries++;
      }
    });

    return {
      totalErrors,
      errorsByType,
      errorsByUrl,
      retrySuccessRate: totalRetries > 0 ? (successfulRetries / totalRetries) * 100 : 0,
      averageRetries: totalErrors > 0 ? totalRetries / totalErrors : 0,
      lastError: this.errors[this.errors.length - 1]
    };
  }

  // Clear error history
  clearErrors(): void {
    this.errors = [];
    console.log('[ErrorHandler] Error history cleared');
  }

  // Get recent errors
  getRecentErrors(limit: number = 10): ErrorInfo[] {
    return this.errors.slice(-limit);
  }

  // Check if system is healthy
  isSystemHealthy(): boolean {
    const stats = this.getErrorStats();
    const errorRate = stats.totalErrors > 0 ? stats.errorsByType['network'] / stats.totalErrors : 0;
    
    // System is unhealthy if:
    // - High error rate (>30%)
    // - Poor network quality
    // - Offline
    return !this.isOnline || this.networkQuality === 'poor' || errorRate > 0.3;
  }

  // Get system status report
  getSystemStatus(): {
    isOnline: boolean;
    networkQuality: string;
    isHealthy: boolean;
    errorStats: ErrorStats;
  } {
    return {
      isOnline: this.isOnline,
      networkQuality: this.networkQuality,
      isHealthy: this.isSystemHealthy(),
      errorStats: this.getErrorStats()
    };
  }

  // Update retry configuration
  updateRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
    console.log('[ErrorHandler] Retry configuration updated:', this.retryConfig);
  }

  // Get current retry configuration
  getRetryConfig(): RetryConfig {
    return { ...this.retryConfig };
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler(); 