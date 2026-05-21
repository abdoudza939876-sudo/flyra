const CACHE_VERSION = 'flyra-v2.0';
const STATIC_CACHE = CACHE_VERSION + '-static';
const API_CACHE = CACHE_VERSION + '-api';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/final.html',
  '/about.html',
  '/app.html',
  '/admin.html',
  '/final.js',
  '/flyra_plus.js',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== STATIC_CACHE && key !== API_CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isGET = event.request.method === 'GET';
  if (!isGET) return;

  const isHTML = event.request.headers.get('accept')?.includes('text/html');
  const isAPI = url.pathname.startsWith('/api/');
  const isStatic = STATIC_ASSETS.includes(url.pathname);

  if (isAPI) {
    event.respondWith(
      caches.open(API_CACHE).then(cache => {
        return fetch(event.request).then(response => {
          if (response.ok) {
            cache.put(event.request, response.clone());
          }
          return response;
        }).catch(() => cache.match(event.request));
      })
    );
    return;
  }

  if (isHTML) {
    event.respondWith(
      fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(STATIC_CACHE).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        return caches.match(event.request).then(cached => {
          return cached || caches.match('/index.html') || new Response('Offline', { status: 503 });
        });
      })
    );
    return;
  }

  if (isStatic) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => new Response('Offline', { status: 503 }));
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  const title = data.title || 'FLYRA';
  const body = data.body || 'صعود بلا حدود — Ascend Without Limits';
  const icon = data.icon || '/favicon.ico';
  const badge = data.badge || '/favicon.ico';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag: data.tag || 'flyra-notif',
      data: data.data || {},
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});
