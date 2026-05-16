// sw.js - Service Worker محسّن للإشعارات والمزامنة
const CACHE_NAME = 'bakery-pwa-v2';
const urlsToCache = [
  './',
  './index.html',
  'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js'
];

self.addEventListener('install', event => {
  console.log('✅ SW - install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching files...');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('Cache failed:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('✅ SW - activate event');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            console.log('🗑️ Removing old cache:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// استقبال رسائل من الصفحة
self.addEventListener('message', (event) => {
  console.log('📨 SW received message:', event.data);
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// إشعار فوري من FCM
self.addEventListener('push', event => {
  console.log('📬 Push event received');
  
  if (!(self.Notification && self.Notification.permission === 'granted')) {
    console.log('⚠️ Notification permission not granted');
    return;
  }

  let title = 'المخبز';
  let body = '';

  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('📦 Push payload:', payload);
      
      if (payload.notification) {
        title = payload.notification.title || title;
        body = payload.notification.body || body;
      } else if (payload.title) {
        title = payload.title;
        body = payload.body || '';
      } else if (typeof payload === 'string') {
        body = payload;
      }
    } catch (e) {
      body = event.data.text();
    }
  }

const options = {
    body: body,
    icon: './icons/launchericon-192x192.png',
    badge: './icons/launchericon-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'bakery-group',
    renotify: true,
    requireInteraction: false,
    silent: false,
    data: {
      url: './',
      timestamp: Date.now()
    }
  };

  // ⭐ إظهار إشعار المتصفح (البنر) فقط
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// عند النقر على الإشعار
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.notification);
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || './';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// استراتيجية fetch: cache first ثم network
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // تخطي طلبات Google Scripts و Firebase و APIs الخارجية
  if (requestUrl.href.includes('script.google.com') || 
      requestUrl.href.includes('firebase') ||
      requestUrl.href.includes('googleapis') ||
      requestUrl.href.includes('fcm.googleapis.com')) {
    return;
  }
  
  // تخطي طلبات POST
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          fetch(event.request)
            .then(networkResponse => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, networkResponse.clone());
                });
              }
            })
            .catch(() => {});
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return response;
          })
          .catch(() => {
            return caches.match('./index.html');
          });
      })
  );
});

// تسجيل أن SW جاهز
console.log('✅ Service Worker loaded and ready');
