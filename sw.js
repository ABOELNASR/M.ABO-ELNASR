// sw.js - Service Worker محسّن للإشعارات والمزامنة

const CACHE_NAME = 'bakery-pwa-v3';
const STATIC_CACHE_NAME = 'bakery-static-v3';
const DYNAMIC_CACHE_NAME = 'bakery-dynamic-v3';

// الملفات الأساسية التي سيتم تخزينها مؤقتاً
const STATIC_URLS_TO_CACHE = [
  './',
  './index.html',
  './css/main.css',
  './css/variables.css',
  './css/dark-mode.css',
  './css/layout.css',
  './css/buttons.css',
  './css/forms.css',
  './css/table.css',
  './css/cards.css',
  './css/modals.css',
  './css/splash.css',
  './css/fullscreen.css',
  './css/misc.css',
  './css/animations.css',
  './css/responsive.css',
  './js/app.js',
  './js/config.js',
  './js/env.js',
  './js/data.js',
  './js/users.js',
  './js/subscribers.js',
  './js/helpers/helpers-ui.js',
  './js/helpers/helpers-text.js',
  './js/helpers/helpers-date.js',
  './js/helpers/helpers-calc.js',
  './js/helpers/helpers-search.js',
  './js/helpers/helpers-misc.js',
  './js/reports/reports-cards.js',
  './js/reports/reports-excel.js',
  './js/reports/reports-backup.js',
  './js/reports/reports-other.js',
  './js/ui/ui-main.js',
  './js/ui/ui-table.js',
  './js/ui/ui-cards.js',
  './js/ui/ui-permissions.js',
  './js/ui/ui-modals.js',
  './js/ui/ui-reports.js',
  './js/ui/ui-fullscreen.js',
  './manifest.json',
  './icons/launchericon-48x48.png',
  './icons/launchericon-72x72.png',
  './icons/launchericon-96x96.png',
  './icons/launchericon-144x144.png',
  './icons/launchericon-192x192.png',
  './icons/launchericon-512x512.png'
];

// المكتبات الخارجية (سيتم تخزينها مؤقتاً بشكل منفصل)
const EXTERNAL_URLS_TO_CACHE = [
  'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js',
  'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'
];

// ========== تثبيت Service Worker ==========
self.addEventListener('install', event => {
  console.log('✅ SW - install event');
  
  event.waitUntil(
    (async () => {
      // تخزين الملفات الأساسية
      const staticCache = await caches.open(STATIC_CACHE_NAME);
      await staticCache.addAll(STATIC_URLS_TO_CACHE);
      console.log('📦 تم تخزين الملفات الأساسية');
      
      // تخزين المكتبات الخارجية بشكل منفصل
      const dynamicCache = await caches.open(DYNAMIC_CACHE_NAME);
      for (const url of EXTERNAL_URLS_TO_CACHE) {
        try {
          const response = await fetch(url, { mode: 'cors' });
          if (response.ok) {
            await dynamicCache.put(url, response);
          }
        } catch (err) {
          console.warn(`⚠️ فشل تخزين ${url}:`, err);
        }
      }
      console.log('📦 تم تخزين المكتبات الخارجية');
    })()
  );
  
  self.skipWaiting();
});

// ========== تفعيل Service Worker ==========
self.addEventListener('activate', event => {
  console.log('✅ SW - activate event');
  
  event.waitUntil(
    (async () => {
      // حذف الكاش القديم
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => 
        name !== STATIC_CACHE_NAME && 
        name !== DYNAMIC_CACHE_NAME &&
        !name.includes('bakery-pwa-v')
      );
      
      await Promise.all(oldCaches.map(name => {
        console.log('🗑️ حذف الكاش القديم:', name);
        return caches.delete(name);
      }));
      
      // التحكم في جميع الصفحات المفتوحة
      await self.clients.claim();
      console.log('✅ SW now controls all clients');
    })()
  );
});

// ========== استقبال رسائل من الصفحة ==========
self.addEventListener('message', (event) => {
  console.log('📨 SW received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      (async () => {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('🗑️ تم مسح جميع الكاش');
        if (event.ports[0]) {
          event.ports[0].postMessage({ success: true });
        }
      })()
    );
  }
  
  if (event.data && event.data.type === 'FORCE_REFRESH') {
    // إعادة تحميل جميع الصفحات المفتوحة
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.navigate(client.url);
      });
    });
  }
});

// ========== إشعار فوري من FCM ==========
self.addEventListener('push', event => {
  console.log('📬 Push event received');
  
  if (!(self.Notification && self.Notification.permission === 'granted')) {
    console.log('⚠️ Notification permission not granted');
    return;
  }

  let title = 'المخبز';
  let body = '';
  let icon = './icons/launchericon-192x192.png';
  let tag = 'bakery-notification';
  let data = { url: './' };

  if (event.data) {
    try {
      // محاولة قراءة البيانات كـ JSON
      const payload = event.data.json();
      console.log('📦 Push payload:', payload);
      
      if (payload.notification) {
        title = payload.notification.title || title;
        body = payload.notification.body || body;
        icon = payload.notification.icon || icon;
        tag = payload.notification.tag || tag;
      } else if (payload.title) {
        title = payload.title;
        body = payload.body || '';
        data = payload.data || data;
      } else if (typeof payload === 'string') {
        body = payload;
      }
    } catch (e) {
      // إذا لم يكن JSON، استخدم النص مباشرة
      body = event.data.text();
    }
  }

  const options = {
    body: body,
    icon: icon,
    badge: './icons/launchericon-72x72.png',
    vibrate: [200, 100, 200],
    tag: tag,
    renotify: true,
    requireInteraction: false,
    silent: false,
    data: data,
    actions: [
      {
        action: 'open',
        title: '📊 فتح التطبيق'
      },
      {
        action: 'dismiss',
        title: '❌ إغلاق'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ========== عند النقر على الإشعار ==========
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.notification);
  event.notification.close();
  
  const action = event.action;
  const notificationData = event.notification.data || {};
  const urlToOpen = notificationData.url || './';
  
  if (action === 'dismiss') {
    // فقط أغلق الإشعار
    return;
  }
  
  event.waitUntil(
    (async () => {
      // البحث عن نافذة مفتوحة للتطبيق
      const clientList = await self.clients.matchAll({ 
        type: 'window', 
        includeUncontrolled: true 
      });
      
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          await client.focus();
          return;
        }
      }
      
      // فتح نافذة جديدة إذا لم يتم العثور على نافذة
      if (self.clients.openWindow) {
        await self.clients.openWindow(urlToOpen);
      }
    })()
  );
});

// ========== استراتيجية fetch: Network First مع Fallback للكاش ==========
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // ⭐ تخطي طلبات Google Apps Script و Firebase (لا يتم تخزينها)
  if (requestUrl.href.includes('script.google.com') || 
      requestUrl.href.includes('firebase') ||
      requestUrl.href.includes('googleapis') ||
      requestUrl.href.includes('fcm.googleapis.com') ||
      requestUrl.href.includes('emailjs')) {
    return;
  }
  
  // تخطي طلبات POST و PUT و DELETE
  if (event.request.method !== 'GET') return;
  
  // تخطي طلبات التحليلات والإحصائيات
  if (requestUrl.pathname.includes('analytics') || 
      requestUrl.pathname.includes('tracking')) {
    return;
  }
  
  event.respondWith(
    (async () => {
      try {
        // محاولة Network First
        const networkResponse = await fetch(event.request);
        
        // إذا كان الطلب ناجحاً، قم بتخزينه في الكاش
        if (networkResponse && networkResponse.status === 200) {
          const cache = await caches.open(DYNAMIC_CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
        }
        
        return networkResponse;
      } catch (networkError) {
        console.log('⚠️ Network failed, trying cache:', requestUrl.pathname);
        
        // محاولة الحصول من الكاش
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // إذا كان طلب HTML، إرجاع الصفحة الرئيسية
        if (event.request.headers.get('accept').includes('text/html')) {
          const fallbackResponse = await caches.match('./index.html');
          if (fallbackResponse) {
            return fallbackResponse;
          }
        }
        
        // إرجاع رسالة خطأ بسيطة
        return new Response('غير متصل بالإنترنت', { 
          status: 503, 
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain; charset=utf-8'
          })
        });
      }
    })()
  );
});

// ========== معالجة الأخطاء العامة ==========
self.addEventListener('error', (event) => {
  console.error('SW Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('SW Unhandled Rejection:', event.reason);
});

// ========== تسجيل أن SW جاهز ==========
console.log('✅ Service Worker loaded and ready - Version 3');
