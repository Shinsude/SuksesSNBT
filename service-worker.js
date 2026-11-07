const CACHE_VERSION = "snbt-learning-center-v1";
const PRECACHE = `${CACHE_VERSION}-precache`;
const RUNTIME = `${CACHE_VERSION}-runtime`;

const CORE_ASSETS = [
  "/",
  "/index.html",
  "/materi.html",
  "/latihan.html",
  "/paket-latihan.html",
  "/latihan-paket.html",
  "/latihan-demo.html",
  "/tryout.html",
  "/offline.html",
  "/materi/penalaran-umum.html",
  "/materi/pbm.html",
  "/materi/pk.html",
  "/materi/ppu.html",
  "/materi/pu-pertemuan-1.html",
  "/materi/pu-pertemuan-2.html",
  "/materi/pu-pertemuan-3.html",
  "/materi/pu-pertemuan-4.html",
  "/materi/pu-pertemuan-5.html",
  "/materi/pu-pertemuan-6.html",
  "/materi/pu-pertemuan-7.html",
  "/materi/pu-pertemuan-8.html",
  "/materi/pu-pertemuan-9.html",
  "/materi/pbm-pertemuan-1.html",
  "/materi/pk-pertemuan-1.html",
  "/materi/ppu-pertemuan-1.html",
  "/manifest.webmanifest",
  "/css/style.css",
  "/css/materi.css",
  "/css/latihan.css",
  "/css/paket-latihan.css",
  "/css/latihan-paket.css",
  "/css/latihan-demo.css",
  "/css/tryout.css",
  "/js/main.js",
  "/js/latihan.js",
  "/js/paket-latihan.js",
  "/js/latihan-paket.js",
  "/js/latihan-demo.js",
  "/js/tryout.js",
  "/data/latihan-pu.js",
  "/data/paket-latihan.js",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PRECACHE)
      .then((cache) => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith("snbt-learning-center-") && ![PRECACHE, RUNTIME].includes(key))
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || caches.match("/offline.html");
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const refresh = fetch(request)
    .then((response) => {
      if (response.ok) {
        return caches.open(RUNTIME).then((cache) => {
          cache.put(request, response.clone());
          return response;
        });
      }
      return response;
    })
    .catch(() => cached);
  return cached || refresh;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});
