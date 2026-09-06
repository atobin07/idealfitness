// Minimal, safe service worker: enables PWA install and caches static assets.
// Scripts/styles use network-first — a fresh copy is always preferred so a
// new deploy's chunks are never masked by one cached from a previous build;
// the cache is only an offline fallback. Images/fonts use cache-first
// (stale-while-revalidate) since serving those stale is harmless. HTML
// documents and API/auth requests are left to the network so nothing
// authenticated is ever served from cache.
const CACHE = "ideal-static-v2";
const NETWORK_FIRST = ["script", "style"];
const CACHE_FIRST = ["image", "font"];

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll())
      // A tab that's been open since before this update is still running the
      // old build's JS in memory; once we take over its network layer, tell
      // it to reload rather than risk mismatched old-code/new-cache errors.
      .then((clients) => clients.forEach((c) => c.postMessage("sw-updated")))
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  if (NETWORK_FIRST.includes(request.destination)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.status === 200) caches.open(CACHE).then((cache) => cache.put(request, res.clone()));
          return res;
        })
        .catch(() => caches.open(CACHE).then((cache) => cache.match(request)))
    );
    return;
  }

  if (CACHE_FIRST.includes(request.destination)) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            if (res && res.status === 200) cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
  // Everything else (docs/api) → network only.
});

self.addEventListener("push", (event) => {
  let data = { title: "iDEAL FITNESS", body: "", link: "/" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { link: data.link || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      return self.clients.openWindow(link);
    })
  );
});
