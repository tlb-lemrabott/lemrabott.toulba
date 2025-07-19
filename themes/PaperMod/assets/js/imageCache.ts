// IndexedDB Cache Management for Progressive Image Preloading
// Handles image storage, retrieval, and cache lifecycle management

export interface CachedImage {
  url: string;
  blob: Blob;
  size: number;
  cachedAt: number;
  lastAccessed: number;
  accessCount: number;
  expiresAt: number;
  section: string;
  priority: 'high' | 'medium' | 'low';
}

export interface CacheStats {
  totalImages: number;
  totalSize: number;
  oldestImage: number;
  newestImage: number;
  averageSize: number;
  sections: Record<string, number>;
  priorities: Record<string, number>;
}

export class ImageCacheManager {
  private dbName = 'ProgressiveImageCache';
  private dbVersion = 1;
  private storeName = 'images';
  private db: IDBDatabase | null = null;
  private maxCacheSize = 50 * 1024 * 1024; // 50MB
  private defaultExpiration = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor(maxCacheSize?: number, defaultExpiration?: number) {
    if (maxCacheSize) this.maxCacheSize = maxCacheSize;
    if (defaultExpiration) this.defaultExpiration = defaultExpiration;
  }

  // Initialize IndexedDB
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('[ImageCache] Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[ImageCache] IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'url' });
          
          // Create indexes for efficient querying
          store.createIndex('cachedAt', 'cachedAt', { unique: false });
          store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
          store.createIndex('expiresAt', 'expiresAt', { unique: false });
          store.createIndex('section', 'section', { unique: false });
          store.createIndex('priority', 'priority', { unique: false });
          store.createIndex('size', 'size', { unique: false });
          
          console.log('[ImageCache] Object store and indexes created');
        }
      };
    });
  }

  // Store image in cache
  async storeImage(url: string, blob: Blob, section: string, priority: 'high' | 'medium' | 'low'): Promise<boolean> {
    if (!this.db) {
      console.error('[ImageCache] Database not initialized');
      return false;
    }

    try {
      // Check if we need to make space
      await this.ensureCacheSpace(blob.size);

      const cachedImage: CachedImage = {
        url,
        blob,
        size: blob.size,
        cachedAt: Date.now(),
        lastAccessed: Date.now(),
        accessCount: 0,
        expiresAt: Date.now() + this.defaultExpiration,
        section,
        priority
      };

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.put(cachedImage);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      console.log(`[ImageCache] Stored image: ${url} (${(blob.size / 1024).toFixed(1)}KB)`);
      return true;
    } catch (error) {
      console.error(`[ImageCache] Failed to store image ${url}:`, error);
      return false;
    }
  }

  // Retrieve image from cache
  async getImage(url: string): Promise<CachedImage | null> {
    if (!this.db) {
      console.error('[ImageCache] Database not initialized');
      return null;
    }

    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const cachedImage = await new Promise<CachedImage | null>((resolve, reject) => {
        const request = store.get(url);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });

      if (cachedImage) {
        // Check if expired
        if (Date.now() > cachedImage.expiresAt) {
          console.log(`[ImageCache] Image expired: ${url}`);
          await this.removeImage(url);
          return null;
        }

        // Update access statistics
        cachedImage.lastAccessed = Date.now();
        cachedImage.accessCount++;
        
        const updateTransaction = this.db!.transaction([this.storeName], 'readwrite');
        const updateStore = updateTransaction.objectStore(this.storeName);
        updateStore.put(cachedImage);

        console.log(`[ImageCache] Retrieved image: ${url} (accessed ${cachedImage.accessCount} times)`);
        return cachedImage;
      }

      return null;
    } catch (error) {
      console.error(`[ImageCache] Failed to retrieve image ${url}:`, error);
      return null;
    }
  }

  // Check if image exists in cache
  async hasImage(url: string): Promise<boolean> {
    const cachedImage = await this.getImage(url);
    return cachedImage !== null;
  }

  // Remove specific image from cache
  async removeImage(url: string): Promise<boolean> {
    if (!this.db) {
      console.error('[ImageCache] Database not initialized');
      return false;
    }

    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(url);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      console.log(`[ImageCache] Removed image: ${url}`);
      return true;
    } catch (error) {
      console.error(`[ImageCache] Failed to remove image ${url}:`, error);
      return false;
    }
  }

  // Clear all cached images
  async clearCache(): Promise<number> {
    if (!this.db) {
      console.error('[ImageCache] Database not initialized');
      return 0;
    }

    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const count = await new Promise<number>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => {
          const countRequest = store.count();
          countRequest.onsuccess = () => resolve(countRequest.result);
        };
        request.onerror = () => reject(request.error);
      });

      console.log(`[ImageCache] Cleared all cached images (${count} remaining)`);
      return count;
    } catch (error) {
      console.error('[ImageCache] Failed to clear cache:', error);
      return 0;
    }
  }

  // Get cache statistics
  async getStats(): Promise<CacheStats> {
    if (!this.db) {
      console.error('[ImageCache] Database not initialized');
      return this.getEmptyStats();
    }

    try {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      const images = await new Promise<CachedImage[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });

      const stats: CacheStats = {
        totalImages: images.length,
        totalSize: 0,
        oldestImage: Date.now(),
        newestImage: 0,
        averageSize: 0,
        sections: {},
        priorities: { high: 0, medium: 0, low: 0 }
      };

      images.forEach(image => {
        stats.totalSize += image.size;
        stats.oldestImage = Math.min(stats.oldestImage, image.cachedAt);
        stats.newestImage = Math.max(stats.newestImage, image.cachedAt);
        
        stats.sections[image.section] = (stats.sections[image.section] || 0) + 1;
        stats.priorities[image.priority]++;
      });

      stats.averageSize = stats.totalImages > 0 ? stats.totalSize / stats.totalImages : 0;

      return stats;
    } catch (error) {
      console.error('[ImageCache] Failed to get stats:', error);
      return this.getEmptyStats();
    }
  }

  // Clean up expired images
  async cleanupExpired(): Promise<number> {
    if (!this.db) {
      console.error('[ImageCache] Database not initialized');
      return 0;
    }

    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('expiresAt');
      
      const now = Date.now();
      const range = IDBKeyRange.upperBound(now);
      
      const expiredImages = await new Promise<CachedImage[]>((resolve, reject) => {
        const request = index.getAll(range);
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });

      let removedCount = 0;
      for (const image of expiredImages) {
        await this.removeImage(image.url);
        removedCount++;
      }

      console.log(`[ImageCache] Cleaned up ${removedCount} expired images`);
      return removedCount;
    } catch (error) {
      console.error('[ImageCache] Failed to cleanup expired images:', error);
      return 0;
    }
  }

  // Ensure cache has enough space
  private async ensureCacheSpace(requiredSize: number): Promise<void> {
    const stats = await this.getStats();
    const availableSpace = this.maxCacheSize - stats.totalSize;

    if (availableSpace >= requiredSize) {
      return; // Enough space available
    }

    console.log(`[ImageCache] Need to free space. Required: ${(requiredSize / 1024).toFixed(1)}KB, Available: ${(availableSpace / 1024).toFixed(1)}KB`);

    // Remove least recently used images until we have enough space
    const imagesToRemove = await this.getLRUImages();
    let freedSpace = 0;

    for (const image of imagesToRemove) {
      if (freedSpace + requiredSize <= this.maxCacheSize) {
        break;
      }

      await this.removeImage(image.url);
      freedSpace += image.size;
    }

    console.log(`[ImageCache] Freed ${(freedSpace / 1024).toFixed(1)}KB of space`);
  }

  // Get least recently used images
  private async getLRUImages(): Promise<CachedImage[]> {
    if (!this.db) return [];

    try {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('lastAccessed');
      
      const images = await new Promise<CachedImage[]>((resolve, reject) => {
        const request = index.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });

      // Sort by last accessed time (oldest first)
      return images.sort((a, b) => a.lastAccessed - b.lastAccessed);
    } catch (error) {
      console.error('[ImageCache] Failed to get LRU images:', error);
      return [];
    }
  }

  // Get empty stats object
  private getEmptyStats(): CacheStats {
    return {
      totalImages: 0,
      totalSize: 0,
      oldestImage: Date.now(),
      newestImage: 0,
      averageSize: 0,
      sections: {},
      priorities: { high: 0, medium: 0, low: 0 }
    };
  }

  // Close database connection
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('[ImageCache] Database connection closed');
    }
  }
}

// Export singleton instance
export const imageCacheManager = new ImageCacheManager(); 