// sw.js - Service Worker (إشعار تراكمي)
const CACHE_NAME = 'bakery-pwa-final';
const urlsToCache = [
  './',
  './index.html',
  'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js'
];

if (!self._notificationsLog) {
  self._notificationsLog = [];
}

self.addEventListener('install', event => {
  console.log('✅ SW final - install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(err => console.error('Cache failed:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('✅ SW final - activate');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('push', event => {
  if (!(self.Notification && self.Notification.permission === 'granted')) {
    return;
  }

  let title = 'إشعار';
  let body = '';

  if (event.data) {
    try {
      const payload = event.data.json();
      if (payload.notification) {
        title = payload.notification.title || title;
        body = payload.notification.body || body;
      }
    } catch (e) {
      body = event.data.text();
    }
  }

  self._notificationsLog.unshift({ title, body });
  if (self._notificationsLog.length > 15) self._notificationsLog.pop();

  // النص من غير العنوان
  const lines = self._notificationsLog.map(item => item.body);
  const groupTitle = 'المخبز';
  const groupBody = lines.join('\n');

  event.waitUntil(
    self.registration.showNotification(groupTitle, {
      body: groupBody,
      icon: './icons/launchericon-192x192.png',
      badge: './icons/launchericon-72x72.png',
      vibrate: [200, 100, 200],
      tag: 'bakery-summary',
      renotify: true
    }).then(() => {
      return clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
        clientList.forEach(client => {
          client.postMessage({
            type: 'SHOW_TOAST',
            title: title,
            body: body
          });
        });
      });
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  self._notificationsLog = [];
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./');
      }
    })
  );
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  if (requestUrl.href.includes('script.google.com')) return;
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
