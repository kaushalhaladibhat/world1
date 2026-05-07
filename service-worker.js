// WorldSim 3D v5 service worker — offline-first, lightweight
const CACHE = 'worldsim-v5-cache-v1';
const ASSETS = [
  './',
  './WorldSim_3D_v5.html',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.all(
        ASSETS.map((u) =>
          c.add(u).catch((err) => console.warn('SW cache miss:', u, err))
        )
      )
    )
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          // cache successful basic/cors GETs
          const copy = res.clone();
          if (res.ok && (res.type === 'basic' || res.type === 'cors')) {
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached || new Response('Offline', { status: 503 }));
    })
  );
});
