// Cache Cleanup and Expiration Management
// Handles automatic cache cleanup, expiration, and size management

export interface CleanupConfig {
  maxAge: number; // Maximum age in milliseconds (default: 7 days)
  maxSize: number; // Maximum cache size in bytes (default: 50MB)
  cleanupInterval: number; // Cleanup interval in milliseconds (default: 1 hour)
  enableAutoCleanup: boolean; // Enable automatic cleanup (default: true)
  aggressiveCleanup: boolean; // More aggressive cleanup for low storage (default: false)
}

export interface CleanupStats {
  totalRemoved: number;
  sizeFreed: number;
  expiredRemoved: number;
  lruRemoved: number;
  cleanupTime: number;
  nextCleanup: number;
}

export class CacheCleanupManager {
  private config: CleanupConfig;
  private cleanupTimer: number | null = null;
  private isRunning = false;
  private lastCleanup = 0;

  constructor(config?: Partial<CleanupConfig>) {
    this.config = {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      maxSize: 50 * 1024 * 1024, // 50MB
      cleanupInterval: 60 * 60 * 1000, // 1 hour
      enableAutoCleanup: true,
      aggressiveCleanup: false,
      ...config
    };

    this.init();
  }

  // Initialize cleanup manager
  private init(): void {
    if (this.config.enableAutoCleanup) {
      this.startAutoCleanup();
    }

    // Listen for storage pressure events
    if ('storage' in navigator && navigator.storage) {
      // Note: Storage API events are not widely supported yet
      // This is a placeholder for future implementation
      console.log('[CacheCleanup] Storage API available');
    }

    // Listen for visibility changes to perform cleanup when tab becomes visible
    document.addEventListener('visibilitychange', async () => {
      if (!document.hidden && await this.shouldPerformCleanup()) {
        this.performCleanup();
      }
    });

    console.log('[CacheCleanup] Cache cleanup manager initialized');
  }

  // Start automatic cleanup timer
  private startAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = window.setInterval(() => {
      if (!this.isRunning) {
        this.performCleanup();
      }
    }, this.config.cleanupInterval);

    console.log(`[CacheCleanup] Auto cleanup started (interval: ${this.config.cleanupInterval}ms)`);
  }

  // Stop automatic cleanup
  public stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
      console.log('[CacheCleanup] Auto cleanup stopped');
    }
  }

  // Check if cleanup should be performed
  private async shouldPerformCleanup(): Promise<boolean> {
    const now = Date.now();
    const timeSinceLastCleanup = now - this.lastCleanup;
    
    // Perform cleanup if:
    // - More than 1 hour since last cleanup, OR
    // - Storage is under pressure
    return timeSinceLastCleanup > this.config.cleanupInterval || await this.isStorageUnderPressure();
  }

  // Check if storage is under pressure
  private async isStorageUnderPressure(): Promise<boolean> {
    // Check available storage if supported
    if ('storage' in navigator && navigator.storage && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const usageRatio = estimate.usage && estimate.quota ? estimate.usage / estimate.quota : 0;
        return usageRatio > 0.8; // 80% usage threshold
      } catch {
        return false;
      }
    }
    
    return false;
  }

  // Perform comprehensive cache cleanup
  public async performCleanup(): Promise<CleanupStats> {
    if (this.isRunning) {
      console.log('[CacheCleanup] Cleanup already in progress');
      return this.getEmptyStats();
    }

    this.isRunning = true;
    const startTime = Date.now();
    
    try {
      console.log('[CacheCleanup] Starting cache cleanup...');
      
      const stats: CleanupStats = {
        totalRemoved: 0,
        sizeFreed: 0,
        expiredRemoved: 0,
        lruRemoved: 0,
        cleanupTime: 0,
        nextCleanup: Date.now() + this.config.cleanupInterval
      };

      // Import cache manager dynamically to avoid circular dependencies
      const { imageCacheManager } = await import('./imageCache');
      
      // Step 1: Remove expired images
      const expiredCount = await imageCacheManager.cleanupExpired();
      stats.expiredRemoved = expiredCount;
      stats.totalRemoved += expiredCount;

      // Step 2: Check cache size and remove LRU if needed
      const cacheStats = await imageCacheManager.getStats();
      if (cacheStats.totalSize > this.config.maxSize) {
        const lruRemoved = await this.removeLRUImages(cacheStats.totalSize - this.config.maxSize);
        stats.lruRemoved = lruRemoved;
        stats.totalRemoved += lruRemoved;
      }

      // Step 3: Calculate freed space
      const newStats = await imageCacheManager.getStats();
      stats.sizeFreed = cacheStats.totalSize - newStats.totalSize;

      stats.cleanupTime = Date.now() - startTime;
      this.lastCleanup = Date.now();

      console.log(`[CacheCleanup] Cleanup completed:`, {
        removed: stats.totalRemoved,
        sizeFreed: `${(stats.sizeFreed / 1024 / 1024).toFixed(2)}MB`,
        time: `${stats.cleanupTime}ms`
      });

      return stats;
    } catch (error) {
      console.error('[CacheCleanup] Cleanup failed:', error);
      return this.getEmptyStats();
    } finally {
      this.isRunning = false;
    }
  }

  // Perform aggressive cleanup for low storage situations
  public async performAggressiveCleanup(): Promise<CleanupStats> {
    console.log('[CacheCleanup] Performing aggressive cleanup...');
    
    // Temporarily enable aggressive mode
    const originalConfig = { ...this.config };
    this.config.aggressiveCleanup = true;
    this.config.maxSize = Math.floor(this.config.maxSize * 0.5); // Reduce to 50%
    
    const stats = await this.performCleanup();
    
    // Restore original config
    this.config = originalConfig;
    
    return stats;
  }

  // Remove least recently used images
  private async removeLRUImages(targetSize: number): Promise<number> {
    try {
      const { imageCacheManager } = await import('./imageCache');
      
      // Get all cached images sorted by last accessed time
      const images = await this.getCachedImagesSortedByAccess();
      let removedCount = 0;
      let freedSize = 0;

      for (const image of images) {
        if (freedSize >= targetSize) break;
        
        await imageCacheManager.removeImage(image.url);
        freedSize += image.size;
        removedCount++;
      }

      console.log(`[CacheCleanup] Removed ${removedCount} LRU images, freed ${(freedSize / 1024 / 1024).toFixed(2)}MB`);
      return removedCount;
    } catch (error) {
      console.error('[CacheCleanup] Failed to remove LRU images:', error);
      return 0;
    }
  }

  // Get cached images sorted by last accessed time
  private async getCachedImagesSortedByAccess(): Promise<any[]> {
    try {
      const { imageCacheManager } = await import('./imageCache');
      
      // This would require adding a method to get all images from cache manager
      // For now, we'll use a placeholder implementation
      return [];
    } catch (error) {
      console.error('[CacheCleanup] Failed to get cached images:', error);
      return [];
    }
  }

  // Get cleanup statistics
  public getCleanupStats(): {
    isRunning: boolean;
    lastCleanup: number;
    nextCleanup: number;
    config: CleanupConfig;
  } {
    return {
      isRunning: this.isRunning,
      lastCleanup: this.lastCleanup,
      nextCleanup: this.lastCleanup + this.config.cleanupInterval,
      config: { ...this.config }
    };
  }

  // Update cleanup configuration
  public updateConfig(newConfig: Partial<CleanupConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart auto cleanup if interval changed
    if (newConfig.cleanupInterval && this.config.enableAutoCleanup) {
      this.stopAutoCleanup();
      this.startAutoCleanup();
    }
    
    console.log('[CacheCleanup] Configuration updated:', this.config);
  }

  // Force immediate cleanup
  public async forceCleanup(): Promise<CleanupStats> {
    console.log('[CacheCleanup] Force cleanup requested');
    return this.performCleanup();
  }

  // Get empty stats object
  private getEmptyStats(): CleanupStats {
    return {
      totalRemoved: 0,
      sizeFreed: 0,
      expiredRemoved: 0,
      lruRemoved: 0,
      cleanupTime: 0,
      nextCleanup: Date.now() + this.config.cleanupInterval
    };
  }

  // Destroy cleanup manager
  public destroy(): void {
    this.stopAutoCleanup();
    this.isRunning = false;
    console.log('[CacheCleanup] Cleanup manager destroyed');
  }
}

// Export singleton instance
export const cacheCleanupManager = new CacheCleanupManager(); 