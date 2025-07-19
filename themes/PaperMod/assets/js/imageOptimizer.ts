interface ImageConfig {
  src: string;
  alt: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  placeholder?: string;
}

class ImageOptimizer {
  private observer: IntersectionObserver | null = null;
  private loadedImages = new Set<string>();

  constructor() {
    this.initIntersectionObserver();
    this.addGlobalStyles();
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

  private loadImage(img: HTMLImageElement): void {
    const src = img.dataset.src;
    if (!src || this.loadedImages.has(src)) return;

    // Add loading class
    img.classList.add('lazy-image');

    // Create a new image to test loading
    const tempImg = new Image();
    
    tempImg.onload = () => {
      img.src = src;
      img.classList.remove('lazy-image');
      img.classList.add('loaded');
      this.loadedImages.add(src);
      
      // Remove data-src attribute
      img.removeAttribute('data-src');
    };

    tempImg.onerror = () => {
      this.handleImageError(img);
    };

    tempImg.src = src;
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
        placeholder: img.getAttribute('data-placeholder') || undefined
      };
      
      this.optimizeImage(img as HTMLImageElement, config);
    });
  }

  public destroy(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.loadedImages.clear();
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