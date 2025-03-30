const CACHE_NAME = 'drifti-cache-v1';
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/main.js',
  '/static/css/main.css',
  '/manifest.json',
  OFFLINE_URL
];

// Security headers for fetch requests
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block'
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      }),
      // Pre-cache offline page
      fetch(OFFLINE_URL).then((response) => {
        return caches.open(CACHE_NAME).then((cache) => {
          return cache.put(OFFLINE_URL, response);
        });
      })
    ])
  );
  // Force waiting service worker to become active
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all pages immediately
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Handle different types of requests differently
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Add security headers
          const headers = new Headers(response.headers);
          Object.keys(securityHeaders).forEach((key) => {
            headers.set(key, securityHeaders[key]);
          });

          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: headers
          });
        })
        .catch(() => {
          return caches.match(OFFLINE_URL);
        })
    );
  } else {
    // Cache-first strategy for static assets
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200) {
            return response;
          }

          // Clone the response as it can only be consumed once
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            // Add security headers before caching
            const headers = new Headers(responseToCache.headers);
            Object.keys(securityHeaders).forEach((key) => {
              headers.set(key, securityHeaders[key]);
            });

            cache.put(event.request, new Response(
              responseToCache.body,
              {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers: headers
              }
            ));
          });

          return response;
        });
      })
    );
  }
});

// Error handling
self.addEventListener('error', (event) => {
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...securityHeaders
      },
      body: JSON.stringify({
        type: 'service-worker-error',
        error: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date().toISOString(),
        url: self.location.href
      })
    }).catch(() => {
      // Silently fail if error logging fails
    });
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: data.data
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow('/');
    })
  );
}); 