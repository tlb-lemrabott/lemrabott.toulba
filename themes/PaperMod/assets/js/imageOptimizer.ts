import { imageRegistryManager } from './imageRegistry';
import { priorityQueue } from './priorityQueue';
import { imageCacheManager } from './imageCache';
import { errorHandler } from './errorHandler';

interface ImageConfig {
  src: string;
  alt: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  placeholder?: string;
  section?: string;
  priority?: 'high' | 'medium' | 'low';
}

class ImageOptimizer {
  private observer: IntersectionObserver | null = null;
  private loadedImages = new Set<string>();
  private serviceWorker: ServiceWorker | null = null;
  private isPreloadingEnabled = true;

  constructor() {
    this.initIntersectionObserver();
    this.addGlobalStyles();
    this.initServiceWorker();
    this.initCache();
  }

  private initIntersectionObserver(): void {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              this.loadImage(img);
              this.observer?.unobserve(img);
            }
          });
        },
        {
          rootMargin: '50px 0px',
          threshold: 0.1
        }
      );
    }
  }

  private addGlobalStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .lazy-image {
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
        background: #f0f0f0;
        position: relative;
      }
      
      .lazy-image.loaded {
        opacity: 1;
      }
      
      .lazy-image::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        margin: -10px 0 0 -10px;
        border: 2px solid #ddd;
        border-top: 2px solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        z-index: 1;
      }
      
      .lazy-image.loaded::before {
        display: none;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .image-error {
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f8f9fa;
        color: #6c757d;
        font-size: 14px;
        min-height: 100px;
      }
      
      .responsive-image {
        max-width: 100%;
        height: auto;
        display: block;
      }
    `;
    document.head.appendChild(style);
  }

  // Initialize service worker for progressive preloading
  private async initServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        this.serviceWorker = registration.active;
        
        // Listen for service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event.data);
        });
        
        console.log('[ImageOptimizer] Service worker registered successfully');
      } catch (error) {
        console.error('[ImageOptimizer] Service worker registration failed:', error);
        this.isPreloadingEnabled = false;
      }
    } else {
      console.warn('[ImageOptimizer] Service worker not supported');
      this.isPreloadingEnabled = false;
    }
  }

  // Initialize IndexedDB cache
  private async initCache(): Promise<void> {
    try {
      await imageCacheManager.init();
      console.log('[ImageOptimizer] Cache initialized successfully');
    } catch (error) {
      console.error('[ImageOptimizer] Cache initialization failed:', error);
    }
  }

  // Handle service worker messages
  private handleServiceWorkerMessage(data: any): void {
    switch (data.type) {
      case 'PRELOAD_PROGRESS':
        console.log(`[ImageOptimizer] Preload progress: ${data.data.progress.percentage}%`);
        break;
      case 'PRELOAD_COMPLETE':
        console.log('[ImageOptimizer] Preloading completed:', data.data);
        break;
    }
  }

  private async loadImage(img: HTMLImageElement): Promise<void> {
    const src = img.dataset.src;
    if (!src || this.loadedImages.has(src)) return;

    // Add loading class
    img.classList.add('lazy-image');

    try {
      // First, try to get from cache
      const cachedImage = await imageCacheManager.getImage(src);
      
      if (cachedImage) {
        // Use cached image
        const objectUrl = URL.createObjectURL(cachedImage.blob);
        img.src = objectUrl;
        img.classList.remove('lazy-image');
        img.classList.add('loaded');
        this.loadedImages.add(src);
        img.removeAttribute('data-src');
        
        console.log(`[ImageOptimizer] Loaded from cache: ${src}`);
        return;
      }

      // If not in cache, fetch with retry
      const response = await errorHandler.fetchWithRetry(src);
      const blob = await response.blob();
      
      // Store in cache for future use
      const section = img.dataset.section || 'unknown';
      const priority = (img.dataset.priority as 'high' | 'medium' | 'low') || 'medium';
      await imageCacheManager.storeImage(src, blob, section, priority);
      
      // Display image
      const objectUrl = URL.createObjectURL(blob);
      img.src = objectUrl;
      img.classList.remove('lazy-image');
      img.classList.add('loaded');
      this.loadedImages.add(src);
      img.removeAttribute('data-src');
      
      console.log(`[ImageOptimizer] Loaded and cached: ${src}`);
    } catch (error) {
      console.error(`[ImageOptimizer] Failed to load image: ${src}`, error);
      this.handleImageError(img);
    }
  }

  private handleImageError(img: HTMLImageElement): void {
    img.classList.remove('lazy-image');
    img.classList.add('image-error');
    
    const fallback = img.dataset.fallback || '/static/images/placeholder.svg';
    if (fallback && fallback !== img.src) {
      img.src = fallback;
    } else {
      img.innerHTML = 'Image unavailable';
    }
  }

  public optimizeImage(img: HTMLImageElement, config: ImageConfig): void {
    // Set basic attributes
    img.alt = config.alt;
    img.classList.add('responsive-image');

    // Set loading attribute
    if (config.loading === 'eager' || !this.observer) {
      img.src = config.src;
      img.classList.add('loaded');
    } else {
      // Lazy load
      img.dataset.src = config.src;
      if (config.placeholder) {
        img.src = config.placeholder;
      }
      this.observer?.observe(img);
    }

    // Set sizes attribute for responsive images
    if (config.sizes) {
      img.sizes = config.sizes;
    }
  }

  public optimizeAllImages(): void {
    const images = document.querySelectorAll('img[data-optimize]');
    images.forEach(img => {
      const config: ImageConfig = {
        src: img.getAttribute('src') || '',
        alt: img.getAttribute('alt') || '',
        sizes: img.getAttribute('data-sizes') || undefined,
        loading: img.getAttribute('data-loading') as 'lazy' | 'eager' || 'lazy',
        placeholder: img.getAttribute('data-placeholder') || undefined,
        section: img.getAttribute('data-section') || undefined,
        priority: (img.getAttribute('data-priority') as 'high' | 'medium' | 'low') || 'medium'
      };
      
      this.optimizeImage(img as HTMLImageElement, config);
    });
  }

  // Start progressive preloading
  public async startProgressivePreloading(): Promise<void> {
    if (!this.isPreloadingEnabled || !this.serviceWorker) {
      console.warn('[ImageOptimizer] Progressive preloading not available');
      return;
    }

    try {
      // Get all images for progressive loading
      const images = imageRegistryManager.getImagesForProgressiveLoading();
      const imageUrls = images.map(img => img.url);

      // Send preload request to service worker
      this.serviceWorker.postMessage({
        type: 'PRELOAD_IMAGES',
        images: imageUrls,
        priority: 'low' // Start with low priority to not interfere with current page
      });

      console.log(`[ImageOptimizer] Started progressive preloading of ${imageUrls.length} images`);
    } catch (error) {
      console.error('[ImageOptimizer] Failed to start progressive preloading:', error);
    }
  }

  // Preload specific section
  public async preloadSection(sectionName: string): Promise<void> {
    if (!this.isPreloadingEnabled || !this.serviceWorker) {
      return;
    }

    try {
      const images = imageRegistryManager.getImagesBySection(sectionName);
      const imageUrls = images.map(img => img.url);

      if (imageUrls.length > 0) {
        this.serviceWorker.postMessage({
          type: 'PRELOAD_IMAGES',
          images: imageUrls,
          priority: 'medium'
        });

        console.log(`[ImageOptimizer] Preloading section: ${sectionName} (${imageUrls.length} images)`);
      }
    } catch (error) {
      console.error(`[ImageOptimizer] Failed to preload section ${sectionName}:`, error);
    }
  }

  // Get cache statistics
  public async getCacheStats() {
    return await imageCacheManager.getStats();
  }

  // Clear cache
  public async clearCache(): Promise<number> {
    return await imageCacheManager.clearCache();
  }

  // Get system status
  public getSystemStatus() {
    return {
      preloadingEnabled: this.isPreloadingEnabled,
      serviceWorkerActive: !!this.serviceWorker,
      errorHandler: errorHandler.getSystemStatus(),
      cacheStats: imageCacheManager.getStats()
    };
  }

  public destroy(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.loadedImages.clear();
    
    // Clean up service worker
    if (this.serviceWorker) {
      this.serviceWorker.postMessage({ type: 'CLEAR_CACHE' });
    }
    
    // Close cache connection
    imageCacheManager.close();
    
    console.log('[ImageOptimizer] Destroyed and cleaned up resources');
  }
}

// Initialize image optimizer
const imageOptimizer = new ImageOptimizer();

// Auto-optimize images when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    imageOptimizer.optimizeAllImages();
  });
} else {
  imageOptimizer.optimizeAllImages();
}

export { imageOptimizer, ImageOptimizer, ImageConfig }; 