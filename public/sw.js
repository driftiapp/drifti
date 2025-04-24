const CACHE_NAME = 'drifti-cache-v1'
const TRANSLATION_CACHE = 'drifti-translations-v1'

// Assets to cache immediately on service worker installation
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
]

// Cache translation files based on locale and namespace
const cacheTranslation = async (locale, namespace) => {
  const response = await fetch(`/api/translations/${locale}/${namespace}`)
  const cache = await caches.open(TRANSLATION_CACHE)
  await cache.put(`/api/translations/${locale}/${namespace}`, response.clone())
  return response
}

// Install event - precache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS)
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return (
              cacheName.startsWith('drifti-') &&
              cacheName !== CACHE_NAME &&
              cacheName !== TRANSLATION_CACHE
            )
          })
          .map((cacheName) => {
            return caches.delete(cacheName)
          })
      )
    })
  )
})

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  // Handle translation requests
  if (event.request.url.includes('/api/translations/')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return (
          response ||
          fetch(event.request).then((response) => {
            // Cache the translation for future use
            const cache = caches.open(TRANSLATION_CACHE)
            cache.then((cache) => {
              cache.put(event.request, response.clone())
            })
            return response
          })
        )
      })
    )
    return
  }

  // Handle other requests
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found
      if (response) {
        return response
      }

      // Clone the request because it's a stream and can only be consumed once
      const fetchRequest = event.request.clone()

      return fetch(fetchRequest).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        // Clone the response because it's a stream and can only be consumed once
        const responseToCache = response.clone()

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return response
      })
    })
  )
}) 