// Versioned cache name - bump this when you change assets
const CACHE_NAME = 'bus-timetable-v2';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './bus-icon.png'
];

// Install: cache core assets and activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// Activate: remove old caches and take control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
    .then(() => self.clients.claim())
  );
});

// Fetch: network-first for navigation requests (index.html), cache-first for others
self.addEventListener('fetch', (event) => {
  const request = event.request;
  // Treat navigation requests (HTML) as network-first so we get updates quickly
  if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(request).then((response) => {
        // Put a copy in cache for offline fallback
        const resClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, resClone));
        return response;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // For other requests, try cache first then fallback to network
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
