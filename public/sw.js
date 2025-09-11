// Progressive Image Preloading Service Worker
// Version: 1.0.0

const CACHE_NAME = 'image-cache-v1';
const IMAGE_CACHE_NAME = 'progressive-images-v1';
const CACHE_SIZE_LIMIT = 50 * 1024 * 1024; // 50MB
const CACHE_EXPIRATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// Service Worker Lifecycle Events
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache opened');
        return cache;
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Main image preloading logic
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PRELOAD_IMAGES') {
    console.log('[SW] Received preload request:', event.data.images.length, 'images');
    event.waitUntil(preloadImages(event.data.images, event.data.priority));
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[SW] Clearing image cache...');
    event.waitUntil(clearImageCache());
  }
});

// Image preloading function
async function preloadImages(images, priority = 'low') {
  const imageCache = await caches.open(IMAGE_CACHE_NAME);
  const results = {
    success: 0,
    failed: 0,
    skipped: 0,
    total: images.length
  };

  console.log(`[SW] Starting to preload ${images.length} images with priority: ${priority}`);

  for (const imageUrl of images) {
    try {
      // Check if already cached
      const existingResponse = await imageCache.match(imageUrl);
      if (existingResponse) {
        console.log(`[SW] Image already cached: ${imageUrl}`);
        results.skipped++;
        continue;
      }

      // Check cache size before adding new images
      const cacheSize = await getCacheSize(imageCache);
      if (cacheSize > CACHE_SIZE_LIMIT) {
        console.log('[SW] Cache size limit reached, skipping remaining images');
        break;
      }

      // Fetch and cache image
      const response = await fetch(imageUrl, {
        method: 'GET',
        mode: 'cors',
        cache: 'force-cache'
      });

      if (response.ok) {
        // Only cache if the URL is cacheable (not chrome-extension://)
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
          await imageCache.put(imageUrl, response.clone());
          console.log(`[SW] Successfully cached: ${imageUrl}`);
        } else {
          console.log(`[SW] Skipping cache for non-HTTP URL: ${imageUrl}`);
        }
        results.success++;
        
        // Send progress update to main thread
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'PRELOAD_PROGRESS',
              data: {
                url: imageUrl,
                status: 'success',
                progress: {
                  current: results.success + results.failed,
                  total: images.length,
                  percentage: Math.round(((results.success + results.failed) / images.length) * 100)
                }
              }
            });
          });
        });
      } else {
        console.warn(`[SW] Failed to fetch image: ${imageUrl}`, response.status);
        results.failed++;
      }
    } catch (error) {
      console.error(`[SW] Error preloading image: ${imageUrl}`, error);
      results.failed++;
    }

    // Add small delay to prevent overwhelming the network
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`[SW] Preloading completed:`, results);
  
  // Send completion message to main thread
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'PRELOAD_COMPLETE',
        data: results
      });
    });
  });

  return results;
}

// Get cache size in bytes
async function getCacheSize(cache) {
  const keys = await cache.keys();
  let totalSize = 0;
  
  for (const request of keys) {
    const response = await cache.match(request);
    if (response) {
      const blob = await response.blob();
      totalSize += blob.size;
    }
  }
  
  return totalSize;
}

// Clear image cache
async function clearImageCache() {
  const imageCache = await caches.open(IMAGE_CACHE_NAME);
  const keys = await imageCache.keys();
  
  for (const request of keys) {
    await imageCache.delete(request);
  }
  
  console.log('[SW] Image cache cleared');
  return { cleared: keys.length };
}

// Handle fetch events for cached images
self.addEventListener('fetch', (event) => {
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            console.log(`[SW] Serving cached image: ${event.request.url}`);
            return response;
          }
          
          // If not in cache, fetch and cache for next time
          return fetch(event.request)
            .then((fetchResponse) => {
              if (fetchResponse.ok) {
                const responseClone = fetchResponse.clone();
                caches.open(IMAGE_CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseClone);
                  });
              }
              return fetchResponse;
            });
        })
    );
  }
}); 