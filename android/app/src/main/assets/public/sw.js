/* web2apk service worker — offline-first PWA shell.
 *
 * Strategy:
 *   - Precache the app shell (index, css, js, manifest, offline page).
 *   - Cache-first for static shell assets.
 *   - Network-first for navigations, falling back to cache then offline.html.
 *   - Stale-while-revalidate for other same-origin GETs.
 *
 * Replace/extend with your own caching strategy as needed.
 */

const VERSION = 'v2.0.0';
const SHELL_CACHE = `web2apk-shell-${VERSION}`;
const RUNTIME_CACHE = `web2apk-runtime-${VERSION}`;

const SHELL_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './offline.html',
  './assets/icon-192.png',
  './assets/icon-512.png',
];
const SHELL_ASSET_PATHS = new Set(
  SHELL_ASSETS.map((asset) => new URL(asset, self.registration.scope).pathname),
);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('web2apk-') && k !== SHELL_CACHE && k !== RUNTIME_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations → network-first, fallback to cache, then offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          event.waitUntil(
            caches
              .open(RUNTIME_CACHE)
              .then((cache) => cache.put(request, response.clone()))
              .catch(() => {}),
          );
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || (await caches.match('./offline.html'));
        }),
    );
    return;
  }

  // Shell assets → cache-first.
  if (SHELL_ASSET_PATHS.has(url.pathname)) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
    return;
  }

  // Everything else same-origin → stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          event.waitUntil(
            caches
              .open(RUNTIME_CACHE)
              .then((cache) => cache.put(request, response.clone()))
              .catch(() => {}),
          );
          return response;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    }),
  );
});

// Allow the page to trigger an immediate update.
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
