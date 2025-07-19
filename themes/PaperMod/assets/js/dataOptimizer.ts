// Data Usage Optimization for Image Preloading
// Manages data consumption based on user preferences and network conditions

export interface DataUsageConfig {
  respectSaveData: boolean; // Respect 'Save Data' mode
  respectBattery: boolean; // Consider battery level
  respectNetworkQuality: boolean; // Adapt to network quality
  maxDataUsage: number; // Maximum data usage per session in MB
  lowBatteryThreshold: number; // Battery level threshold (0-1)
  poorNetworkThreshold: number; // Network quality threshold
  enableCompression: boolean; // Enable image compression
  enableProgressiveLoading: boolean; // Enable progressive JPEG loading
}

export interface DataUsageStats {
  totalDataUsed: number; // Total data used in bytes
  imagesLoaded: number; // Number of images loaded
  averageImageSize: number; // Average image size in bytes
  dataSaved: number; // Data saved through optimization
  sessionStart: number; // Session start timestamp
  lastUpdate: number; // Last update timestamp
}

export interface NetworkInfo {
  effectiveType: string; // 'slow-2g', '2g', '3g', '4g'
  downlink: number; // Download speed in Mbps
  rtt: number; // Round trip time in ms
  saveData: boolean; // Save data mode enabled
}

export class DataOptimizer {
  private config: DataUsageConfig;
  private stats: DataUsageStats;
  private networkInfo: NetworkInfo | null = null;
  private batteryLevel: number | null = null;
  private isCharging: boolean = false;
  private dataUsageLimit: number;

  constructor(config?: Partial<DataUsageConfig>) {
    this.config = {
      respectSaveData: true,
      respectBattery: true,
      respectNetworkQuality: true,
      maxDataUsage: 100, // 100MB per session
      lowBatteryThreshold: 0.2, // 20%
      poorNetworkThreshold: 2, // 2 Mbps
      enableCompression: true,
      enableProgressiveLoading: true,
      ...config
    };

    this.stats = this.getEmptyStats();
    this.dataUsageLimit = this.config.maxDataUsage * 1024 * 1024; // Convert to bytes

    this.init();
  }

  // Initialize data optimizer
  private init(): void {
    this.updateNetworkInfo();
    this.updateBatteryInfo();
    this.setupEventListeners();
    console.log('[DataOptimizer] Data optimizer initialized');
  }

  // Setup event listeners for network and battery changes
  private setupEventListeners(): void {
    // Network information changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        connection.addEventListener('change', () => {
          this.updateNetworkInfo();
        });
      }
    }

    // Battery status changes
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        this.updateBatteryInfo(battery);
        
        battery.addEventListener('levelchange', () => {
          this.updateBatteryInfo(battery);
        });
        
        battery.addEventListener('chargingchange', () => {
          this.updateBatteryInfo(battery);
        });
      }).catch(() => {
        console.log('[DataOptimizer] Battery API not available');
      });
    }

    // Online/offline status
    window.addEventListener('online', () => {
      this.updateNetworkInfo();
    });

    window.addEventListener('offline', () => {
      this.updateNetworkInfo();
    });
  }

  // Update network information
  private updateNetworkInfo(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        this.networkInfo = {
          effectiveType: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0,
          saveData: connection.saveData || false
        };
        
        console.log('[DataOptimizer] Network info updated:', this.networkInfo);
      }
    }
  }

  // Update battery information
  private updateBatteryInfo(battery?: any): void {
    if (battery) {
      this.batteryLevel = battery.level;
      this.isCharging = battery.charging;
    }
    
    console.log(`[DataOptimizer] Battery: ${this.batteryLevel ? Math.round(this.batteryLevel * 100) : 'unknown'}%, Charging: ${this.isCharging}`);
  }

  // Check if data usage should be optimized
  public shouldOptimizeDataUsage(): boolean {
    // Check save data mode
    if (this.config.respectSaveData && this.networkInfo && this.networkInfo.saveData) {
      console.log('[DataOptimizer] Save data mode enabled - optimizing');
      return true;
    }

    // Check battery level
    if (this.config.respectBattery && this.batteryLevel !== null && this.batteryLevel < this.config.lowBatteryThreshold && !this.isCharging) {
      console.log('[DataOptimizer] Low battery - optimizing data usage');
      return true;
    }

    // Check network quality
    if (this.config.respectNetworkQuality && this.networkInfo && this.networkInfo.downlink < this.config.poorNetworkThreshold) {
      console.log('[DataOptimizer] Poor network quality - optimizing');
      return true;
    }

    // Check data usage limit
    if (this.stats.totalDataUsed > this.dataUsageLimit) {
      console.log('[DataOptimizer] Data usage limit reached - optimizing');
      return true;
    }

    return false;
  }

  // Get optimization level (0-1, where 1 is maximum optimization)
  public getOptimizationLevel(): number {
    if (!this.shouldOptimizeDataUsage()) {
      return 0;
    }

    let level = 0;

    // Save data mode adds 0.5
    if (this.config.respectSaveData && this.networkInfo && this.networkInfo.saveData) {
      level += 0.5;
    }

    // Low battery adds 0.3
    if (this.config.respectBattery && this.batteryLevel !== null && this.batteryLevel < this.config.lowBatteryThreshold && !this.isCharging) {
      level += 0.3;
    }

    // Poor network adds 0.2
    if (this.config.respectNetworkQuality && this.networkInfo && this.networkInfo.downlink < this.config.poorNetworkThreshold) {
      level += 0.2;
    }

    // Data limit reached adds 0.5
    if (this.stats.totalDataUsed > this.dataUsageLimit) {
      level += 0.5;
    }

    return Math.min(level, 1);
  }

  // Record data usage
  public recordDataUsage(bytes: number, imageUrl?: string): void {
    this.stats.totalDataUsed += bytes;
    this.stats.imagesLoaded++;
    this.stats.averageImageSize = this.stats.totalDataUsed / this.stats.imagesLoaded;
    this.stats.lastUpdate = Date.now();

    console.log(`[DataOptimizer] Data usage recorded: ${(bytes / 1024).toFixed(1)}KB, Total: ${(this.stats.totalDataUsed / 1024 / 1024).toFixed(1)}MB`);
  }

  // Calculate data savings
  public calculateDataSavings(originalSize: number, optimizedSize: number): number {
    const savings = originalSize - optimizedSize;
    this.stats.dataSaved += savings;
    return savings;
  }

  // Get optimized image URL or configuration
  public getOptimizedImageConfig(imageUrl: string, originalSize?: number): {
    url: string;
    quality: number;
    format: string;
    priority: 'high' | 'medium' | 'low';
  } {
    const optimizationLevel = this.getOptimizationLevel();
    
    let quality = 1;
    let format = 'original';
    let priority: 'high' | 'medium' | 'low' = 'medium';

    if (optimizationLevel > 0.7) {
      // High optimization
      quality = 0.6;
      format = 'webp';
      priority = 'low';
    } else if (optimizationLevel > 0.4) {
      // Medium optimization
      quality = 0.8;
      format = 'webp';
      priority = 'medium';
    } else if (optimizationLevel > 0.1) {
      // Low optimization
      quality = 0.9;
      format = 'original';
      priority = 'medium';
    }

    // Adjust based on network quality
    if (this.networkInfo && (this.networkInfo.effectiveType === 'slow-2g' || this.networkInfo.effectiveType === '2g')) {
      quality *= 0.5;
      priority = 'low';
    }

    return {
      url: imageUrl, // In a real implementation, this would be a CDN URL with quality parameters
      quality,
      format,
      priority
    };
  }

  // Check if image should be preloaded
  public shouldPreloadImage(priority: 'high' | 'medium' | 'low'): boolean {
    const optimizationLevel = this.getOptimizationLevel();

    // Don't preload if optimization level is high
    if (optimizationLevel > 0.7) {
      return priority === 'high';
    }

    // Don't preload low priority images if optimization level is medium
    if (optimizationLevel > 0.4) {
      return priority === 'high' || priority === 'medium';
    }

    // Preload all images if optimization level is low
    return true;
  }

  // Get data usage statistics
  public getDataUsageStats(): DataUsageStats {
    return { ...this.stats };
  }

  // Get network information
  public getNetworkInfo(): NetworkInfo | null {
    return this.networkInfo ? { ...this.networkInfo } : null;
  }

  // Get battery information
  public getBatteryInfo(): { level: number | null; charging: boolean } {
    return {
      level: this.batteryLevel,
      charging: this.isCharging
    };
  }

  // Reset data usage statistics
  public resetDataUsageStats(): void {
    this.stats = this.getEmptyStats();
    console.log('[DataOptimizer] Data usage statistics reset');
  }

  // Update configuration
  public updateConfig(newConfig: Partial<DataUsageConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.dataUsageLimit = this.config.maxDataUsage * 1024 * 1024;
    console.log('[DataOptimizer] Configuration updated:', this.config);
  }

  // Get current configuration
  public getConfig(): DataUsageConfig {
    return { ...this.config };
  }

  // Check if data usage is within limits
  public isDataUsageWithinLimits(): boolean {
    return this.stats.totalDataUsed <= this.dataUsageLimit;
  }

  // Get remaining data allowance
  public getRemainingDataAllowance(): number {
    return Math.max(0, this.dataUsageLimit - this.stats.totalDataUsed);
  }

  // Get optimization recommendations
  public getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.networkInfo && this.networkInfo.saveData) {
      recommendations.push('Save Data mode is enabled - consider using compressed images');
    }

    if (this.batteryLevel !== null && this.batteryLevel < this.config.lowBatteryThreshold && !this.isCharging) {
      recommendations.push('Low battery detected - reducing image quality to save power');
    }

    if (this.networkInfo && this.networkInfo.downlink < this.config.poorNetworkThreshold) {
      recommendations.push('Poor network detected - using lower quality images');
    }

    if (this.stats.totalDataUsed > this.dataUsageLimit * 0.8) {
      recommendations.push('Approaching data usage limit - consider reducing image quality');
    }

    return recommendations;
  }

  // Get empty stats object
  private getEmptyStats(): DataUsageStats {
    return {
      totalDataUsed: 0,
      imagesLoaded: 0,
      averageImageSize: 0,
      dataSaved: 0,
      sessionStart: Date.now(),
      lastUpdate: Date.now()
    };
  }

  // Destroy data optimizer
  public destroy(): void {
    console.log('[DataOptimizer] Data optimizer destroyed');
  }
}

// Export singleton instance
export const dataOptimizer = new DataOptimizer(); 