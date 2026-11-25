// Service Worker minimaliste pour activer l'installation PWA
// tout en garantissant le chargement immédiat des mises à jour Vercel.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});