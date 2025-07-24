// Service Worker for Travel Stories App
const CACHE_NAME = 'travel-stories-v1';
const CACHE_URLS = [
    '/',
    '/index.html',
    '/app.js',
    '/config.js',
    '/style.css',
    '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching files');
                return cache.addAll(CACHE_URLS);
            })
            .then(() => {
                console.log('Service Worker: All files cached');
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Activated');
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip external API calls (let them go to network)
    if (
        event.request.url.includes('generativelanguage.googleapis.com') ||
        event.request.url.includes('nominatim.openstreetmap.org')
    ) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version or fetch from network
                return response || fetch(event.request).catch(() => {
                    // If both cache and network fail, return offline page
                    if (event.request.destination === 'document') {
                        return caches.match('/index.html');
                    }
                });
            })
    );
});

// Background sync for caching stories
self.addEventListener('sync', event => {
    if (event.tag === 'story-cache') {
        event.waitUntil(
            // Could implement background story pre-caching here
            console.log('Background sync: story-cache')
        );
    }
});

// Push notifications (for future use)
self.addEventListener('push', event => {
    if (event.data) {
        const options = {
            body: event.data.text(),
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'travel-stories',
            renotify: true
        };

        event.waitUntil(
            self.registration.showNotification('Travel Stories', options)
        );
    }
});