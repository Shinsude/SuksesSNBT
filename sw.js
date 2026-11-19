/* Service Worker — SNBT Learning Center
 * Strategi:
 * - Navigasi (HTML): network-first, fallback cache, lalu halaman offline
 * - Aset statis (CSS/JS/gambar/font): stale-while-revalidate
 */
const VERSION = "v2";
const CORE_CACHE = `snbt-core-${VERSION}`;
const RUNTIME_CACHE = `snbt-runtime-${VERSION}`;

/* Halaman privat: jangan pernah disimpan di cache */
const PRIVATE_PATHS = ["/login.html", "/dashboard.html"];

const CORE_ASSETS = [
  "/",
  "/index.html",
  "/materi.html",
  "/offline.html",
  "/css/style.css",
  "/css/materi.css",
  "/js/main.js",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-192.png",
  "/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CORE_CACHE)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CORE_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Aset eksternal (Google Fonts): stale-while-revalidate
  if (url.origin !== self.location.origin) {
    if (
      url.hostname === "fonts.googleapis.com" ||
      url.hostname === "fonts.gstatic.com"
    ) {
      event.respondWith(staleWhileRevalidate(event, request));
    }
    return;
  }

  // Halaman privat: selalu dari jaringan, tanpa cache
  if (PRIVATE_PATHS.includes(url.pathname)) {
    event.respondWith(networkOnly(request));
    return;
  }

  // Navigasi halaman: network-first
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  // Aset statis: stale-while-revalidate
  if (/\.(css|js|png|jpe?g|svg|webp|gif|ico|woff2?)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(event, request));
  }
});

async function networkFirst(request) {
  const runtime = await caches.open(RUNTIME_CACHE);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) {
      runtime.put(request, fresh.clone());
    }
    return fresh;
  } catch (error) {
    const cached = await runtime.match(request);
    if (cached) return cached;

    const core = await caches.open(CORE_CACHE);
    const offline = await core.match("/offline.html");
    return offline || Response.error();
  }
}

async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const core = await caches.open(CORE_CACHE);
    const offline = await core.match("/offline.html");
    return offline || Response.error();
  }
}

async function staleWhileRevalidate(event, request) {
  const runtime = await caches.open(RUNTIME_CACHE);
  const cached = await runtime.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response && (response.ok || response.type === "opaque")) {
        runtime.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    event.waitUntil(networkPromise);
    return cached;
  }

  return (await networkPromise) || Response.error();
}
