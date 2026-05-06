const SITE_PWA_CACHE = "wa7shstore-pwa-v20260506-50";
const SITE_PWA_SHELL = [
  "/",
  "/index.html",
  "/header.css?v=20260506-01",
  "/site-core.js",
  "/header.js?v=20260506-26",
  "/manifest.webmanifest"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => {
        if (key === SITE_PWA_CACHE || !/^(?:wa7shstore|njad|hack4store4)-pwa-/i.test(String(key || ""))) return Promise.resolve(false);
        return caches.delete(key);
      }));
    } catch (_) {}
    try { await self.clients.claim(); } catch (_) {}
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (!request || request.method !== "GET") return;
  let url = null;
  try {
    url = new URL(request.url);
  } catch (_) {
    return;
  }
  if (!url || url.origin !== self.location.origin) return;
  const pathname = String(url.pathname || "");
  const shouldHandle =
    pathname === "/" ||
    pathname === "/index.html" ||
    pathname === "/header.css" ||
    pathname === "/site-core.js" ||
    pathname === "/header.js" ||
    pathname === "/manifest.webmanifest";
  if (!shouldHandle) return;
  event.respondWith((async () => {
    try {
      const cache = await caches.open(SITE_PWA_CACHE);
      if (pathname === "/" || pathname === "/index.html") {
        const cached = await cache.match(request, { ignoreSearch: false })
          || await cache.match("/index.html", { ignoreSearch: false })
          || await cache.match("/", { ignoreSearch: false });
        if (cached) {
          event.waitUntil((async () => {
            try {
              const fresh = await fetch(request, { cache: "reload" });
              if (fresh && fresh.ok) {
                await cache.put(request, fresh.clone());
                try { await cache.put("/index.html", fresh.clone()); } catch (_) {}
              }
            } catch (_) {}
          })());
          return cached;
        }
        try {
          const fresh = await fetch(request, { cache: "reload" });
          if (fresh && fresh.ok) {
            try { await cache.put(request, fresh.clone()); } catch (_) {}
            return fresh;
          }
        } catch (_) {}
      }
      const cached = await cache.match(request, { ignoreSearch: false });
      if (cached) {
        if (pathname === "/header.css" || pathname === "/site-core.js" || pathname === "/header.js" || pathname === "/manifest.webmanifest") {
          event.waitUntil((async () => {
            try {
              const response = await fetch(request, { cache: "reload" });
              if (response && response.ok) await cache.put(request, response.clone());
            } catch (_) {}
          })());
        }
        return cached;
      }
      const response = await fetch(request, { cache: "reload" });
      if (response && response.ok) {
        try { await cache.put(request, response.clone()); } catch (_) {}
      }
      return response;
    } catch (_) {
      try {
        const cache = await caches.open(SITE_PWA_CACHE);
        const fallback = await cache.match(request, { ignoreSearch: false });
        if (fallback) return fallback;
      } catch (__){}
      return new Response("", { status: 504, statusText: "Gateway Timeout" });
    }
  })());
});
