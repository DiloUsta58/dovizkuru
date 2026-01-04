/* ===============================
   SERVICE WORKER – CACHE
================================ */

const CACHE_NAME = "dilousta58-v.1.2";

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
   - KEIN cache.addAll (fehleranfällig)
================================ */

self.addEventListener("install", event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(
        CORE_ASSETS.map(url =>
          fetch(url)
            .then(res => {
              if (!res.ok) throw new Error(url);
              return cache.put(url, res.clone());
            })
            .catch(() => {
              // Datei fehlt / 404 → bewusst ignorieren
            })
        )
      )
    )
  );
});

/* ===============================
   ACTIVATE
   - alte Caches löschen
   - Update-Meldung senden
================================ */

self.addEventListener("activate", event => {
  event.waitUntil(
    Promise.all([
      // Alte Caches entfernen
      caches.keys().then(keys =>
        Promise.all(
          keys
            .filter(k => k !== CACHE_NAME)
            .map(k => caches.delete(k))
        )
      ),

      // Clients über Update informieren
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage("update");
        });
      })
    ])
  );

  self.clients.claim();
});

/* ===============================
   FETCH
   - Cache First
   - Network Fallback
================================ */

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(res => {
          if (!res || res.status !== 200 || res.type !== "basic") {
            return res;
          }

          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache =>
            cache.put(event.request, clone)
          );

          return res;
        })
        .catch(() => cached);
    })
  );
});
