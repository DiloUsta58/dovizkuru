
/*
=================================================
 UPDATE-SICHERER SERVICE WORKER
 - Update-Hinweis NUR bei echter Änderung
=================================================
*/

const CACHE_VERSION = "1.11";
const CACHE_NAME = `dilousta58-${CACHE_VERSION}`;

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./java/funkScript.js",
  "./manifest.json",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png"
];

/* ===============================
   INSTALL
================================ */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(CORE_ASSETS)
    )
  );
  self.skipWaiting();
});

/* ===============================
   ACTIVATE
   - Update-Nachricht NUR bei neuer Version
================================ */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() =>
      self.clients.matchAll().then(clients => {
        clients.forEach(client =>
          client.postMessage({ type: "update" })
        );
      })
    )
  );
  self.clients.claim();
});

/* ===============================
   FETCH
================================ */
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request);
    })
  );
});
