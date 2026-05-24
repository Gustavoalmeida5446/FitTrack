const CACHE_NAME = 'fittrack-v6';
const APP_BASE_URL = new URL(self.registration.scope);
const APP_SHELL_URL = new URL('index.html', APP_BASE_URL).href;
const APP_SHELL = [
  'index.html',
  'manifest.webmanifest',
  'favicon/favicon-32x32.png',
  'favicon/favicon-16x16.png',
  'favicon/apple-touch-icon.png',
  'favicon/android-chrome-192x192.png',
  'favicon/android-chrome-512x512.png'
].map((path) => new URL(path, APP_BASE_URL).href);

async function getAppShell() {
  const cached = await caches.match(APP_SHELL_URL);

  if (cached) {
    return cached;
  }

  return fetch(APP_SHELL_URL);
}

async function refreshAppShell() {
  const response = await fetch(APP_SHELL_URL, { cache: 'no-store' });

  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(APP_SHELL_URL, response.clone());
  }

  return response.ok ? response : getAppShell();
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      refreshAppShell().catch(getAppShell)
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (!isSameOrigin || !response.ok) return response;

          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => Response.error());
    })
  );
});
