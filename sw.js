const CACHE_NAME = 'controle-veiculos-v1';
const APP_SHELL = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// App shell: cache-first. API calls (webhook.servidorwall.online): always network, never cached.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.hostname.includes('webhook.servidorwall.online')) return; // let it hit network directly
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
