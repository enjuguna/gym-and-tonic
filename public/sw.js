const CACHE = "gym-tonic-shell-v3";
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
  event.respondWith(caches.match(request).then((cached) => {
    const network = fetch(request).then((response) => {
      if (response.ok && (request.destination === "image" || request.destination === "script" || request.destination === "style")) {
        caches.open(CACHE).then((cache) => cache.put(request, response.clone()));
      }
      return response;
    });
    return cached || network.catch(() => request.mode === "navigate" ? caches.match("/plan") : Response.error());
  }));
});
