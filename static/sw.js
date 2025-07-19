const CACHE_NAME = 'leetcode-stats-v1';
const API_CACHE_NAME = 'leetcode-api-v1';
const STATIC_CACHE_NAME = 'static-assets-v1';

const STATIC_ASSETS = [
  '/',
  '/assets/css/',
  '/assets/js/',
  '/themes/PaperMod/assets/'
];

const API_ENDPOINTS = [
  'https://82ci0zfx68.execute-api.us-east-1.amazonaws.com/api/v1/leetcode/'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && 
              cacheName !== API_CACHE_NAME && 
              cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - handle API requests with caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle LeetCode API requests
  if (API_ENDPOINTS.some(endpoint => url.href.includes(endpoint))) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (request.method === 'GET' && STATIC_ASSETS.some(asset => url.pathname.startsWith(asset))) {
    event.respondWith(handleStaticRequest(request));
    return;
  }
});

// Handle API requests with cache-first strategy
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the successful response
      const responseClone = networkResponse.clone();
      cache.put(request, responseClone);
      console.log('API response cached successfully');
      return networkResponse;
    } else {
      throw new Error('Network response not ok');
    }
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    
    // Try cache as fallback
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('Serving from cache');
      return cachedResponse;
    }
    
    // Return error response if both network and cache fail
    return new Response(JSON.stringify({
      error: 'Service unavailable',
      message: 'Both network and cache failed'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle static requests with cache-first strategy
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Fallback to network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      cache.put(request, responseClone);
    }
    return networkResponse;
  } catch (error) {
    console.error('Failed to fetch static asset:', error);
    return new Response('Not found', { status: 404 });
  }
}

// Background sync for API updates
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-leetcode') {
    console.log('Background sync triggered');
    event.waitUntil(backgroundSyncLeetCode());
  }
});

async function backgroundSyncLeetCode() {
  try {
    const response = await fetch('https://82ci0zfx68.execute-api.us-east-1.amazonaws.com/api/v1/leetcode/vRCcb0Nnvp');
    if (response.ok) {
      const cache = await caches.open(API_CACHE_NAME);
      await cache.put(
        'https://82ci0zfx68.execute-api.us-east-1.amazonaws.com/api/v1/leetcode/vRCcb0Nnvp',
        response.clone()
      );
      console.log('Background sync completed successfully');
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Message handling for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
}); 