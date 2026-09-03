const CACHE = "gym-tonic-shell-v4";
const APP_SHELL = ["/", "/today", "/plan", "/progress", "/meals", "/settings", "/workout", "/privacy", "/data", "/safety", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => event.waitUntil(
  caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()),
));

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);

    // HTML is network-first so a deploy becomes visible after the next reload.
    // Cached pages remain available when the device is offline.
    if (request.mode === "navigate") {
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch {
        return cached || cache.match("/today") || Response.error();
      }
    }

    try {
      const response = await fetch(request);
      if (response.ok && (request.destination === "image" || request.destination === "script" || request.destination === "style")) {
        await cache.put(request, response.clone());
      }
      return response;
    } catch {
      return cached || Response.error();
    }
  })());
});
