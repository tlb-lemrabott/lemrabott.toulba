// Offline Support Manager for Image Preloading
// Handles offline functionality, cache management, and offline detection

export interface OfflineConfig {
  enableOfflineMode: boolean; // Enable offline functionality
  cacheCriticalImages: boolean; // Cache critical images for offline use
  showOfflineIndicator: boolean; // Show offline status indicator
  syncOnReconnect: boolean; // Sync when connection is restored
  maxOfflineCacheSize: number; // Maximum offline cache size in MB
}

export interface OfflineStatus {
  isOnline: boolean;
  lastOnline: number;
  lastOffline: number;
  offlineDuration: number;
  cachedImagesCount: number;
  offlineCacheSize: number;
  canWorkOffline: boolean;
}

export interface SyncResult {
  success: boolean;
  syncedImages: number;
  failedImages: number;
  totalSize: number;
  duration: number;
}

export class OfflineManager {
  private config: OfflineConfig;
  private isOnline: boolean = navigator.onLine;
  private lastOnline: number = Date.now();
  private lastOffline: number = 0;
  private offlineIndicator: HTMLElement | null = null;
  private syncQueue: string[] = [];
  private isSyncing: boolean = false;

  constructor(config?: Partial<OfflineConfig>) {
    this.config = {
      enableOfflineMode: true,
      cacheCriticalImages: true,
      showOfflineIndicator: true,
      syncOnReconnect: true,
      maxOfflineCacheSize: 20, // 20MB for offline cache
      ...config
    };

    this.init();
  }

  // Initialize offline manager
  private init(): void {
    this.setupNetworkListeners();
    this.createOfflineIndicator();
    this.checkOfflineCapability();
    
    console.log('[OfflineManager] Offline manager initialized');
  }

  // Setup network status listeners
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      this.handleOffline();
    });

    // Listen for visibility changes to check network status
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.updateOnlineStatus();
      }
    });
  }

  // Handle online event
  private handleOnline(): void {
    this.isOnline = true;
    this.lastOnline = Date.now();
    
    console.log('[OfflineManager] Connection restored');
    
    // Update offline indicator
    this.updateOfflineIndicator();
    
    // Sync cached data if enabled
    if (this.config.syncOnReconnect && this.syncQueue.length > 0) {
      this.syncOfflineData();
    }
  }

  // Handle offline event
  private handleOffline(): void {
    this.isOnline = false;
    this.lastOffline = Date.now();
    
    console.log('[OfflineManager] Connection lost');
    
    // Update offline indicator
    this.updateOfflineIndicator();
  }

  // Update online status
  private updateOnlineStatus(): void {
    const wasOnline = this.isOnline;
    this.isOnline = navigator.onLine;
    
    if (wasOnline && !this.isOnline) {
      this.handleOffline();
    } else if (!wasOnline && this.isOnline) {
      this.handleOnline();
    }
  }

  // Create offline status indicator
  private createOfflineIndicator(): void {
    if (!this.config.showOfflineIndicator) return;

    this.offlineIndicator = document.createElement('div');
    this.offlineIndicator.id = 'offline-indicator';
    this.offlineIndicator.innerHTML = `
      <div class="offline-status">
        <span class="status-icon">📶</span>
        <span class="status-text">Online</span>
      </div>
    `;
    
    this.offlineIndicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      transition: all 0.3s ease;
      opacity: 0;
      transform: translateY(-20px);
    `;
    
    document.body.appendChild(this.offlineIndicator);
    this.updateOfflineIndicator();
  }

  // Update offline indicator
  private updateOfflineIndicator(): void {
    if (!this.offlineIndicator) return;

    const statusText = this.offlineIndicator.querySelector('.status-text');
    const statusIcon = this.offlineIndicator.querySelector('.status-icon');
    
    if (this.isOnline) {
      this.offlineIndicator.style.background = '#4CAF50';
      this.offlineIndicator.style.opacity = '0';
      this.offlineIndicator.style.transform = 'translateY(-20px)';
      if (statusText) statusText.textContent = 'Online';
      if (statusIcon) statusIcon.textContent = '📶';
    } else {
      this.offlineIndicator.style.background = '#f44336';
      this.offlineIndicator.style.opacity = '1';
      this.offlineIndicator.style.transform = 'translateY(0)';
      if (statusText) statusText.textContent = 'Offline';
      if (statusIcon) statusIcon.textContent = '📴';
    }
  }

  // Check if the app can work offline
  private async checkOfflineCapability(): Promise<void> {
    try {
      // Check if service worker is available
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          console.log('[OfflineManager] Service worker available for offline support');
        }
      }

      // Check if IndexedDB is available
      if ('indexedDB' in window) {
        console.log('[OfflineManager] IndexedDB available for offline cache');
      }

      // Check available storage
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const availableSpace = estimate.quota ? estimate.quota - (estimate.usage || 0) : 0;
        console.log(`[OfflineManager] Available storage: ${(availableSpace / 1024 / 1024).toFixed(1)}MB`);
      }
    } catch (error) {
      console.error('[OfflineManager] Error checking offline capability:', error);
    }
  }

  // Cache image for offline use
  public async cacheImageForOffline(url: string, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<boolean> {
    if (!this.config.enableOfflineMode) {
      return false;
    }

    try {
      // Import cache manager dynamically
      const { imageCacheManager } = await import('./imageCache');
      
      // Check if already cached
      const existingImage = await imageCacheManager.getImage(url);
      if (existingImage) {
        console.log(`[OfflineManager] Image already cached for offline: ${url}`);
        return true;
      }

      // Fetch and cache image
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      
      // Check cache size limit
      const cacheStats = await imageCacheManager.getStats();
      const maxSize = this.config.maxOfflineCacheSize * 1024 * 1024;
      
      if (cacheStats.totalSize + blob.size > maxSize) {
        console.warn(`[OfflineManager] Cache size limit reached, cannot cache: ${url}`);
        return false;
      }

      // Store in cache
      await imageCacheManager.storeImage(url, blob, 'offline', priority);
      
      console.log(`[OfflineManager] Cached image for offline: ${url} (${(blob.size / 1024).toFixed(1)}KB)`);
      return true;
    } catch (error) {
      console.error(`[OfflineManager] Failed to cache image for offline: ${url}`, error);
      return false;
    }
  }

  // Cache critical images for offline use
  public async cacheCriticalImages(): Promise<number> {
    if (!this.config.cacheCriticalImages) {
      return 0;
    }

    try {
      // Import image registry
      const { imageRegistryManager } = await import('./imageRegistry');
      
      const criticalImages = imageRegistryManager.getImagesByPriority('high');
      let cachedCount = 0;

      for (const image of criticalImages) {
        const success = await this.cacheImageForOffline(image.url, 'high');
        if (success) {
          cachedCount++;
        }
      }

      console.log(`[OfflineManager] Cached ${cachedCount} critical images for offline use`);
      return cachedCount;
    } catch (error) {
      console.error('[OfflineManager] Failed to cache critical images:', error);
      return 0;
    }
  }

  // Get offline status
  public async getOfflineStatus(): Promise<OfflineStatus> {
    try {
      const { imageCacheManager } = await import('./imageCache');
      const cacheStats = await imageCacheManager.getStats();
      
      const now = Date.now();
      const offlineDuration = this.isOnline ? 0 : now - this.lastOffline;

      return {
        isOnline: this.isOnline,
        lastOnline: this.lastOnline,
        lastOffline: this.lastOffline,
        offlineDuration,
        cachedImagesCount: cacheStats.totalImages,
        offlineCacheSize: cacheStats.totalSize,
        canWorkOffline: cacheStats.totalImages > 0 && 'serviceWorker' in navigator
      };
    } catch (error) {
      console.error('[OfflineManager] Error getting offline status:', error);
      return {
        isOnline: this.isOnline,
        lastOnline: this.lastOnline,
        lastOffline: this.lastOffline,
        offlineDuration: 0,
        cachedImagesCount: 0,
        offlineCacheSize: 0,
        canWorkOffline: false
      };
    }
  }

  // Sync offline data when connection is restored
  public async syncOfflineData(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('[OfflineManager] Sync already in progress');
      return { success: false, syncedImages: 0, failedImages: 0, totalSize: 0, duration: 0 };
    }

    this.isSyncing = true;
    const startTime = Date.now();
    
    try {
      console.log('[OfflineManager] Starting offline data sync...');
      
      const { imageCacheManager } = await import('./imageCache');
      const cacheStats = await imageCacheManager.getStats();
      
      // For now, we'll just log the sync operation
      // In a real implementation, this would sync with a server
      const result: SyncResult = {
        success: true,
        syncedImages: cacheStats.totalImages,
        failedImages: 0,
        totalSize: cacheStats.totalSize,
        duration: Date.now() - startTime
      };

      console.log(`[OfflineManager] Sync completed: ${result.syncedImages} images, ${(result.totalSize / 1024 / 1024).toFixed(1)}MB`);
      return result;
    } catch (error) {
      console.error('[OfflineManager] Sync failed:', error);
      return {
        success: false,
        syncedImages: 0,
        failedImages: 0,
        totalSize: 0,
        duration: Date.now() - startTime
      };
    } finally {
      this.isSyncing = false;
    }
  }

  // Check if image is available offline
  public async isImageAvailableOffline(url: string): Promise<boolean> {
    try {
      const { imageCacheManager } = await import('./imageCache');
      return await imageCacheManager.hasImage(url);
    } catch (error) {
      console.error('[OfflineManager] Error checking offline availability:', error);
      return false;
    }
  }

  // Get offline cache statistics
  public async getOfflineCacheStats() {
    try {
      const { imageCacheManager } = await import('./imageCache');
      return await imageCacheManager.getStats();
    } catch (error) {
      console.error('[OfflineManager] Error getting cache stats:', error);
      return null;
    }
  }

  // Clear offline cache
  public async clearOfflineCache(): Promise<number> {
    try {
      const { imageCacheManager } = await import('./imageCache');
      return await imageCacheManager.clearCache();
    } catch (error) {
      console.error('[OfflineManager] Error clearing cache:', error);
      return 0;
    }
  }

  // Update configuration
  public updateConfig(newConfig: Partial<OfflineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('[OfflineManager] Configuration updated:', this.config);
  }

  // Get current configuration
  public getConfig(): OfflineConfig {
    return { ...this.config };
  }

  // Check if currently online
  public isCurrentlyOnline(): boolean {
    return this.isOnline;
  }

  // Get offline duration
  public getOfflineDuration(): number {
    if (this.isOnline) return 0;
    return Date.now() - this.lastOffline;
  }

  // Destroy offline manager
  public destroy(): void {
    if (this.offlineIndicator) {
      document.body.removeChild(this.offlineIndicator);
      this.offlineIndicator = null;
    }
    console.log('[OfflineManager] Offline manager destroyed');
  }
}

// Export singleton instance
export const offlineManager = new OfflineManager(); 