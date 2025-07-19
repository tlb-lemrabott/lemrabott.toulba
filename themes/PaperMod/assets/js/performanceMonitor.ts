// Performance Monitoring and Optimization for Image Preloading
// Tracks performance metrics and provides optimization insights

export interface PerformanceMetrics {
  totalImages: number;
  cachedImages: number;
  networkImages: number;
  averageLoadTime: number;
  cacheHitRate: number;
  totalDataTransferred: number;
  dataSaved: number;
  performanceScore: number;
  recommendations: string[];
}

export interface LoadEvent {
  url: string;
  startTime: number;
  endTime: number;
  loadTime: number;
  size: number;
  source: 'cache' | 'network';
  success: boolean;
  error?: string;
}

export interface PerformanceConfig {
  enableMonitoring: boolean;
  trackLoadTimes: boolean;
  trackDataUsage: boolean;
  trackCachePerformance: boolean;
  performanceThreshold: number; // Performance score threshold (0-100)
  maxEvents: number; // Maximum number of events to store
  autoOptimize: boolean; // Enable automatic optimization
}

export class PerformanceMonitor {
  private config: PerformanceConfig;
  private loadEvents: LoadEvent[] = [];
  private startTime: number;
  private isMonitoring: boolean = false;

  constructor(config?: Partial<PerformanceConfig>) {
    this.config = {
      enableMonitoring: true,
      trackLoadTimes: true,
      trackDataUsage: true,
      trackCachePerformance: true,
      performanceThreshold: 80,
      maxEvents: 1000,
      autoOptimize: true,
      ...config
    };

    this.startTime = Date.now();
    this.init();
  }

  // Initialize performance monitor
  private init(): void {
    if (this.config.enableMonitoring) {
      this.startMonitoring();
    }
    console.log('[PerformanceMonitor] Performance monitor initialized');
  }

  // Start performance monitoring
  public startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('[PerformanceMonitor] Performance monitoring started');
  }

  // Stop performance monitoring
  public stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('[PerformanceMonitor] Performance monitoring stopped');
  }

  // Record image load event
  public recordLoadEvent(event: Omit<LoadEvent, 'loadTime'>): void {
    if (!this.isMonitoring) return;

    const loadEvent: LoadEvent = {
      ...event,
      loadTime: event.endTime - event.startTime
    };

    this.loadEvents.push(loadEvent);

    // Limit the number of stored events
    if (this.loadEvents.length > this.config.maxEvents) {
      this.loadEvents.shift();
    }

    // Log performance data
    console.log(`[PerformanceMonitor] Image loaded: ${event.url} (${loadEvent.loadTime}ms, ${(event.size / 1024).toFixed(1)}KB, ${event.source})`);

    // Auto-optimize if enabled
    if (this.config.autoOptimize) {
      this.checkAndOptimize();
    }
  }

  // Get performance metrics
  public getPerformanceMetrics(): PerformanceMetrics {
    if (this.loadEvents.length === 0) {
      return this.getEmptyMetrics();
    }

    const totalImages = this.loadEvents.length;
    const cachedImages = this.loadEvents.filter(e => e.source === 'cache').length;
    const networkImages = this.loadEvents.filter(e => e.source === 'network').length;
    const successfulLoads = this.loadEvents.filter(e => e.success);
    
    const averageLoadTime = successfulLoads.length > 0 
      ? successfulLoads.reduce((sum, e) => sum + e.loadTime, 0) / successfulLoads.length 
      : 0;

    const cacheHitRate = totalImages > 0 ? (cachedImages / totalImages) * 100 : 0;
    
    const totalDataTransferred = this.loadEvents.reduce((sum, e) => sum + e.size, 0);
    const dataSaved = this.loadEvents
      .filter(e => e.source === 'cache')
      .reduce((sum, e) => sum + e.size, 0);

    const performanceScore = this.calculatePerformanceScore({
      cacheHitRate,
      averageLoadTime,
      totalImages,
      dataSaved
    });

    const recommendations = this.generateRecommendations({
      cacheHitRate,
      averageLoadTime,
      performanceScore,
      totalImages
    });

    return {
      totalImages,
      cachedImages,
      networkImages,
      averageLoadTime,
      cacheHitRate,
      totalDataTransferred,
      dataSaved,
      performanceScore,
      recommendations
    };
  }

  // Calculate performance score (0-100)
  private calculatePerformanceScore(metrics: {
    cacheHitRate: number;
    averageLoadTime: number;
    totalImages: number;
    dataSaved: number;
  }): number {
    let score = 0;

    // Cache hit rate contributes 40% to the score
    score += (metrics.cacheHitRate / 100) * 40;

    // Load time contributes 30% to the score
    // Lower load times get higher scores
    const loadTimeScore = Math.max(0, 100 - (metrics.averageLoadTime / 10));
    score += (loadTimeScore / 100) * 30;

    // Data savings contributes 20% to the score
    const dataSavingsScore = Math.min(100, (metrics.dataSaved / (1024 * 1024)) * 10); // 1MB = 10 points
    score += (dataSavingsScore / 100) * 20;

    // Number of images loaded contributes 10% to the score
    const imageCountScore = Math.min(100, metrics.totalImages * 2); // 50 images = 100 points
    score += (imageCountScore / 100) * 10;

    return Math.round(score);
  }

  // Generate optimization recommendations
  private generateRecommendations(metrics: {
    cacheHitRate: number;
    averageLoadTime: number;
    performanceScore: number;
    totalImages: number;
  }): string[] {
    const recommendations: string[] = [];

    if (metrics.cacheHitRate < 50) {
      recommendations.push('Low cache hit rate - consider preloading more images');
    }

    if (metrics.averageLoadTime > 1000) {
      recommendations.push('Slow image loading - consider optimizing image sizes or using CDN');
    }

    if (metrics.performanceScore < this.config.performanceThreshold) {
      recommendations.push('Performance below threshold - review image optimization strategy');
    }

    if (metrics.totalImages < 10) {
      recommendations.push('Limited image data - consider testing with more images');
    }

    if (metrics.cacheHitRate > 90) {
      recommendations.push('Excellent cache performance - consider reducing preload frequency');
    }

    return recommendations;
  }

  // Check and apply optimizations
  private checkAndOptimize(): void {
    const metrics = this.getPerformanceMetrics();
    
    if (metrics.performanceScore < this.config.performanceThreshold) {
      console.log('[PerformanceMonitor] Performance below threshold, applying optimizations...');
      this.applyOptimizations(metrics);
    }
  }

  // Apply performance optimizations
  private applyOptimizations(metrics: PerformanceMetrics): void {
    // Import optimization modules
    import('./dataOptimizer').then(({ dataOptimizer }) => {
      if (metrics.cacheHitRate < 50) {
        // Increase preloading for better cache hit rate
        console.log('[PerformanceMonitor] Increasing preload frequency for better cache performance');
      }

      if (metrics.averageLoadTime > 1000) {
        // Optimize for faster loading
        console.log('[PerformanceMonitor] Optimizing for faster image loading');
        dataOptimizer.updateConfig({
          enableCompression: true,
          respectNetworkQuality: true
        });
      }
    }).catch(error => {
      console.error('[PerformanceMonitor] Failed to apply optimizations:', error);
    });
  }

  // Get load events for analysis
  public getLoadEvents(limit?: number): LoadEvent[] {
    const events = [...this.loadEvents];
    return limit ? events.slice(-limit) : events;
  }

  // Get events by source
  public getEventsBySource(source: 'cache' | 'network'): LoadEvent[] {
    return this.loadEvents.filter(e => e.source === source);
  }

  // Get events by time range
  public getEventsByTimeRange(startTime: number, endTime: number): LoadEvent[] {
    return this.loadEvents.filter(e => e.startTime >= startTime && e.endTime <= endTime);
  }

  // Get slowest loads
  public getSlowestLoads(count: number = 10): LoadEvent[] {
    return [...this.loadEvents]
      .sort((a, b) => b.loadTime - a.loadTime)
      .slice(0, count);
  }

  // Get largest images
  public getLargestImages(count: number = 10): LoadEvent[] {
    return [...this.loadEvents]
      .sort((a, b) => b.size - a.size)
      .slice(0, count);
  }

  // Get failed loads
  public getFailedLoads(): LoadEvent[] {
    return this.loadEvents.filter(e => !e.success);
  }

  // Clear performance data
  public clearData(): void {
    this.loadEvents = [];
    this.startTime = Date.now();
    console.log('[PerformanceMonitor] Performance data cleared');
  }

  // Export performance data
  public exportData(): {
    metrics: PerformanceMetrics;
    events: LoadEvent[];
    config: PerformanceConfig;
    exportTime: number;
  } {
    return {
      metrics: this.getPerformanceMetrics(),
      events: this.getLoadEvents(),
      config: this.getConfig(),
      exportTime: Date.now()
    };
  }

  // Get monitoring status
  public getMonitoringStatus(): {
    isMonitoring: boolean;
    eventsCount: number;
    startTime: number;
    uptime: number;
  } {
    return {
      isMonitoring: this.isMonitoring,
      eventsCount: this.loadEvents.length,
      startTime: this.startTime,
      uptime: Date.now() - this.startTime
    };
  }

  // Update configuration
  public updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('[PerformanceMonitor] Configuration updated:', this.config);
  }

  // Get current configuration
  public getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  // Get empty metrics object
  private getEmptyMetrics(): PerformanceMetrics {
    return {
      totalImages: 0,
      cachedImages: 0,
      networkImages: 0,
      averageLoadTime: 0,
      cacheHitRate: 0,
      totalDataTransferred: 0,
      dataSaved: 0,
      performanceScore: 0,
      recommendations: ['No performance data available']
    };
  }

  // Generate performance report
  public generateReport(): string {
    const metrics = this.getPerformanceMetrics();
    const status = this.getMonitoringStatus();
    
    return `
Performance Report
==================

Monitoring Status:
- Active: ${status.isMonitoring}
- Events: ${status.eventsCount}
- Uptime: ${(status.uptime / 1000 / 60).toFixed(1)} minutes

Performance Metrics:
- Total Images: ${metrics.totalImages}
- Cache Hit Rate: ${metrics.cacheHitRate.toFixed(1)}%
- Average Load Time: ${metrics.averageLoadTime.toFixed(0)}ms
- Performance Score: ${metrics.performanceScore}/100
- Data Transferred: ${(metrics.totalDataTransferred / 1024 / 1024).toFixed(1)}MB
- Data Saved: ${(metrics.dataSaved / 1024 / 1024).toFixed(1)}MB

Recommendations:
${metrics.recommendations.map(rec => `- ${rec}`).join('\n')}
    `.trim();
  }

  // Destroy performance monitor
  public destroy(): void {
    this.stopMonitoring();
    this.clearData();
    console.log('[PerformanceMonitor] Performance monitor destroyed');
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor(); 