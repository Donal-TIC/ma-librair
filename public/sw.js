const CACHE_NAME = 'ma-librair-v1';
const PAGES_A_METTRE_EN_CACHE = ['/login', '/caisse', '/caisse/depenses'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PAGES_A_METTRE_EN_CACHE).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cles) =>
      Promise.all(cles.filter((c) => c !== CACHE_NAME).map((c) => caches.delete(c)))
    )
  );
  self.clients.claim();
});

// Stratégie : réseau en priorité, secours sur le cache si hors-ligne
// (le vrai stockage des ventes/dépenses hors-ligne se fait via IndexedDB, voir lib/offline-db.ts)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((reponse) => {
        const copie = reponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copie));
        return reponse;
      })
      .catch(() => caches.match(event.request))
  );
});
