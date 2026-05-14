// sw.js - Service Worker محسّن للإشعارات والمزامنة
const CACHE_NAME = 'bakery-pwa-v2';
const urlsToCache = [
  './',
  './index.html',
  'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js'
];

// مصفوفة لتخزين الإشعارات مؤقتاً
let notificationsLog = [];

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
  if (event.data && event.data.type === 'CLEAR_NOTIFICATIONS') {
    notificationsLog = [];
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
  let link = './';

  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('📦 Push payload:', payload);
      
      if (payload.notification) {
        title = payload.notification.title || title;
        body = payload.notification.body || body;
        link = payload.notification.click_action || link;
      } else if (payload.title) {
        title = payload.title;
        body = payload.body || '';
        link = payload.link || link;
      } else if (typeof payload === 'string') {
        body = payload;
      } else {
        body = JSON.stringify(payload);
      }
    } catch (e) {
      body = event.data.text();
    }
  }

  // تخزين الإشعار للسجل
  notificationsLog.unshift({ title, body, time: new Date().toISOString() });
  if (notificationsLog.length > 20) notificationsLog.pop();

  // تجميع الإشعارات إذا كان هناك أكثر من واحد
  let finalTitle = title;
  let finalBody = body;
  
  if (notificationsLog.length > 1) {
    finalTitle = `📢 ${notificationsLog.length} إشعارات جديدة`;
    const lines = notificationsLog.slice(0, 5).map(item => item.body);
    finalBody = lines.join('\n');
    if (notificationsLog.length > 5) {
      finalBody += `\n... و${notificationsLog.length - 5} إشعارات أخرى`;
    }
  }

  const options = {
    body: finalBody,
    icon: './icons/launchericon-192x192.png',
    badge: './icons/launchericon-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'bakery-notification',
    renotify: true,
    data: {
      url: link,
      timestamp: Date.now(),
      originalTitle: title,
      originalBody: body
    }
  };

  event.waitUntil(
    self.registration.showNotification(finalTitle, options)
      .then(() => {
        // إرسال الإشعار لجميع الصفحات المفتوحة لعرضه داخلياً
        return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      })
      .then(clientList => {
        clientList.forEach(client => {
          client.postMessage({
            type: 'SHOW_TOAST',
            title: title,
            body: body
          });
        });
      })
  );
});

// عند النقر على الإشعار
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.notification);
  event.notification.close();
  
  // تنظيف سجل الإشعارات عند النقر
  notificationsLog = [];
  
  const urlToOpen = event.notification.data?.url || './';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // البحث عن نافذة مفتوحة بالفعل
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              notification: {
                title: event.notification.title,
                body: event.notification.body
              }
            });
            return client.focus();
          }
        }
        // فتح نافذة جديدة إذا لم توجد نافذة مفتوحة
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
          // إرجاع النسخة المخزنة مؤقتاً، وتحديثها في الخلفية
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
            // عدم تخزين الاستجابات غير الناجحة
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
            // إرجاع صفحة offline إذا كانت متاحة
            return caches.match('./index.html');
          });
      })
  );
});

// تسجيل أن SW جاهز
console.log('✅ Service Worker loaded and ready');

// تحديث دوري لجلب الإشعارات المعلقة (اختياري)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(
      (async () => {
        console.log('🔄 Periodic sync: fetching updates...');
        // يمكن إضافة منطق لجلب التحديثات هنا
      })()
    );
  }
});
