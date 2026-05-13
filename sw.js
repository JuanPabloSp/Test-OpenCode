const CACHE = 'fruteria-v2';
const ASSETS = [
    './',
    './index.html',
    './script.js',
    './css/styles.css',
    './data/products.json',
    './manifest.json'
];

self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE).then((cache) => {
            return cache.addAll(ASSETS).catch(() => {});
        })
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
            );
        })
    );
});

self.addEventListener('fetch', (e) => {
    if (e.request.url.startsWith('chrome-extension') || e.request.url.includes('hot-update')) return;
    e.respondWith(
        caches.match(e.request).then((cached) => {
            const fetchPromise = fetch(e.request).then((response) => {
                if (response && response.status === 200 && response.type === 'basic') {
                    const copy = response.clone();
                    caches.open(CACHE).then((cache) => cache.put(e.request, copy));
                }
                return response;
            }).catch(() => cached);
            return cached || fetchPromise;
        })
    );
});
