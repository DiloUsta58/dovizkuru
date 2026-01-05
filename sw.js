/* =========================================================
   SERVICE WORKER – FINAL / UPDATE-SICHER
   App-Shell Cache + saubere Update-Erkennung
========================================================= */

/* ===============================
   VERSION / BUILD
   ⚠️ BEI JEDEM RELEASE ÄNDERN
================================ */
const CACHE_VERSION = "1.26";
const SW_BUILD = "2026-01-06T00:30";
const CACHE_NAME = `dilousta58-${CACHE_VERSION}`;

/* ===============================
   APP-SHELL ASSETS
   (müssen exakt zu index.html passen)
================================ */
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./funkScript.js",
  "./assets/fonts/DejaVuSans.ttf"
];

/* ===============================
   INSTALL
================================ */
self.addEventListener("install", event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CORE_ASSETS);
    })
  );
});

/* ===============================
   ACTIVATE
   - alte Caches löschen
   - Clients übernehmen
   - Update-Meldung senden
================================ */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
     .then(() => {
        return self.clients.matchAll();
     })
     .then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: "SW_UPDATED",
            version: CACHE_VERSION,
            build: SW_BUILD
          });
        });
     })
  );
});

/* ===============================
   FETCH
   Cache-First + Network Fallback
================================ */
self.addEventListener("fetch", event => {

  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cached => {

      if (cached) {
        return cached;
      }

      return fetch(event.request)
        .then(response => {

          // Nur gültige Responses cachen
          if (
            response &&
            response.status === 200 &&
            response.type === "basic"
          ) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }

          return response;
        })
        .catch(() => {
          // Offline & nicht im Cache → nichts erzwingen
          return cached;
        });
    })
  );
});
