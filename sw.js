const CACHE_NAME = 'flyra-v1.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/final.html',
  '/about.html',
  '/final.js',
  '/flyra_plus.js',
];

const API_CACHE = 'flyra-api-v1';
const API_ROUTES = [
  '/api/products',
  '/api/stats',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== API_CACHE)
            .map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // API caching — stale-while-revalidate
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(API_CACHE).then(cache => {
        return cache.match(event.request).then(cached => {
          const fetchPromise = fetch(event.request).then(response => {
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          }).catch(() => cached);
          return cached || fetchPromise;
        });
      })
    );
    return;
  }

  // Static assets — cache first
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok && (response.type === 'basic' || response.type === 'cors')) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => {
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html') || new Response('Offline', { status: 503 });
          }
        });
      })
    );
  }
});

// Push notification support
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

// Background sync for orders
self.addEventListener('sync', event => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

async function syncOrders() {
  const pending = localStorage.getItem('flyra_pending_orders');
  if (!pending) return;
  try {
    const orders = JSON.parse(pending);
    for (const order of orders) {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
    }
    localStorage.removeItem('flyra_pending_orders');
  } catch(e) {
    console.log('[SW] Sync failed, will retry');
  }
}

// Periodic sync for price updates
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-products') {
    event.waitUntil(updateProducts());
  }
});

async function updateProducts() {
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      const products = await res.json();
      localStorage.setItem('flyra_cached_products', JSON.stringify(products));
    }
  } catch(e) {
    // offline
  }
}