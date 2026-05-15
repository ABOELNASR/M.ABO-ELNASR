// sw.js - Service Worker مع تجميع الإشعارات في إشعار واحد
const CACHE_NAME = 'bakery-pwa-v2';
const urlsToCache = [
  './',
  './index.html',
  'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js'
];

// ⭐ مصفوفة لتجميع نصوص الإشعارات
let notificationBodies = [];
const MAX_BODIES = 10;

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

self.addEventListener('message', (event) => {
  console.log('📨 SW received message:', event.data);
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_NOTIFICATIONS') {
    notificationBodies = [];
  }
});

// إشعار فوري من FCM
self.addEventListener('push', event => {
  console.log('📬 Push event received');
  
  if (!(self.Notification && self.Notification.permission === 'granted')) {
    console.log('⚠️ Notification permission not granted');
    return;
  }

  let body = '';

  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('📦 Push payload:', payload);
      
      if (payload.notification) {
        body = payload.notification.body || '';
      } else if (payload.body) {
        body = payload.body;
      } else if (typeof payload === 'string') {
        body = payload;
      }
    } catch (e) {
      body = event.data.text();
    }
  }

  if (body) {
    // ⭐ أضف الإشعار الجديد للمجموعة
    notificationBodies.push(body);
    
    // ⭐ احتفظ بآخر 10 إشعارات فقط
    if (notificationBodies.length > MAX_BODIES) {
      notificationBodies.shift();
    }
    
    // ⭐ بناء عنوان ونص الإشعار المجمع
    const count = notificationBodies.length;
    const title = count === 1 ? 'المخبز' : `📢 المخبز (${count})`;
    const fullBody = notificationBodies.map((b, i) => `${i + 1}. ${b}`).join('\n');

    const options = {
      body: fullBody,
      icon: './icons/launchericon-192x192.png',
      badge: './icons/launchericon-72x72.png',
      vibrate: [200, 100, 200],
      tag: 'bakery-group',
      renotify: true,
      data: {
        url: './',
        count: count
      }
    };

    // ⭐ إظهار/تحديث الإشعار المجمع
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

// عند النقر على الإشعار
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.notification);
  
  // ⭐ مسح كل الإشعارات عند النقر
  notificationBodies = [];
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || './';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // ⭐ البحث عن نافذة مفتوحة وفتحها مع تحديث البيانات
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({ type: 'FORCE_REFRESH' });
            return client.focus();
          }
        }
        // ⭐ لو مفيش نافذة مفتوحة، افتح التطبيق
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// استراتيجية fetch: cache first ثم network
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  if (requestUrl.href.includes('script.google.com') || 
      requestUrl.href.includes('firebase') ||
      requestUrl.href.includes('googleapis') ||
      requestUrl.href.includes('fcm.googleapis.com')) {
    return;
  }
  
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

console.log('✅ Service Worker loaded and ready');
