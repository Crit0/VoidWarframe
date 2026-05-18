const CACHE_VERSION = "v1";
const STATIC_CACHE = `vw-static-${CACHE_VERSION}`;
const DATA_CACHE   = `vw-data-${CACHE_VERSION}`;
const IMG_CACHE    = `vw-images-${CACHE_VERSION}`;

const STATIC_PRECACHE = [
  "./",
  "./index.html",
  "./pages/tracker.html",
  "./pages/inventory.html",
  "./manifest.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(STATIC_CACHE)
      .then((c) => c.addAll(STATIC_PRECACHE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.endsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  let url;
  try { url = new URL(req.url); } catch { return; }

  // Warframe CDN images: cache-first, long-lived.
  if (url.hostname === "cdn.warframestat.us") {
    event.respondWith(cacheFirst(req, IMG_CACHE));
    return;
  }

  // Warframe API (worldstate, mods, etc.): network-first, fallback cache.
  if (url.hostname === "api.warframestat.us") {
    event.respondWith(networkFirst(req, DATA_CACHE));
    return;
  }

  // Same-origin assets: stale-while-revalidate for JS/CSS/data, cache-first for fonts/images.
  if (url.origin === self.location.origin) {
    if (req.destination === "font" || /\.(woff2?|ttf|otf|png|jpg|jpeg|webp|svg|ico)$/i.test(url.pathname)) {
      event.respondWith(cacheFirst(req, STATIC_CACHE));
    } else {
      event.respondWith(staleWhileRevalidate(req, STATIC_CACHE));
    }
  }
});

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const resp = await fetch(req);
    if (resp && resp.ok) cache.put(req, resp.clone());
    return resp;
  } catch (err) {
    if (hit) return hit;
    throw err;
  }
}

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const resp = await fetch(req);
    if (resp && resp.ok) cache.put(req, resp.clone());
    return resp;
  } catch (err) {
    const hit = await cache.match(req);
    if (hit) return hit;
    throw err;
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  const fetchPromise = fetch(req)
    .then((resp) => {
      if (resp && resp.ok) cache.put(req, resp.clone());
      return resp;
    })
    .catch(() => hit);
  return hit || fetchPromise;
}
