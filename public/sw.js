/**
 * TinT PWA Service Worker
 * Version: 2.1.0
 * Provides robust offline support, asset caching, font caching, and seamless updates.
 */

const CACHE_VERSION = 'v2.1.0';
const STATIC_CACHE = `tint-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `tint-runtime-${CACHE_VERSION}`;
const FONT_CACHE = `tint-fonts-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

// Install Event: Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => {
      // Don't wait for old tabs unless desired
      return self.skipWaiting();
    })
  );
});

// Activate Event: Clean up outdated caches
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, RUNTIME_CACHE, FONT_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log('[SW] Purging old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Message Event: Allow skip waiting on user prompt
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch Event: Intelligent routing & caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Skip non-GET requests, Firebase, Firestore, and WebSocket connections
  if (
    request.method !== 'GET' ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('firebase') ||
    url.pathname.startsWith('/api/socket') ||
    url.pathname.startsWith('/socket.io')
  ) {
    return;
  }

  // 2. Google Fonts & Static Font Assets: Cache-First with long lifetime
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.open(FONT_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) return cachedResponse;

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          return cachedResponse || Response.error();
        }
      })
    );
    return;
  }

  // 3. App Shell Navigation (HTML documents): Network-First with Offline /index.html fallback
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put('/index.html', responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline fallback
          const cachedIndex = await caches.match('/index.html');
          return cachedIndex || caches.match('/');
        })
    );
    return;
  }

  // 4. Bundled Assets & Static Files (JS, CSS, SVGs, Images)
  // Stale-While-Revalidate Strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            const targetCache = url.pathname.startsWith('/assets/') ? RUNTIME_CACHE : STATIC_CACHE;
            caches.open(targetCache).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and not in cache, let it fail gracefully
          return null;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
