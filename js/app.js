// ========== app.js - تهيئة التطبيق وربط الأحداث الرئيسية (مع Web Push Notifications) ==========

// Initialize Firebase
firebase.initializeApp(FIREBASE_CONFIG);

const messaging = firebase.messaging();

// تحديث الساعة والتاريخ
function updateDateTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'م' : 'ص';
    hours = hours % 12 || 12;
    const timeStr = `${hours}:${minutes}:${seconds} ${ampm}`;
    
    const clockElement = document.getElementById('liveClock');
    if (clockElement) clockElement.innerText = timeStr;
    
    const dateElement = document.getElementById('currentDateDisplay');
    if (dateElement) {
        dateElement.innerText = `${now.getDate()} ${MONTHS_AR[now.getMonth()]} ${now.getFullYear()}`;
    }
}
setInterval(updateDateTime, 1000);

// دالة مساعدة لربط حدث مع التحقق من وجود العنصر
function safeAddEventListener(id, event, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
}

function safeSetOnclick(id, handler) {
    const el = document.getElementById(id);
    if (el) el.onclick = handler;
}

// ========== تفعيل Web Push Notifications ==========
async function setupPushNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('⚠️ المتصفح لا يدعم الإشعارات أو Service Worker.');
        return;
    }

    try {
        // 1. تسجيل Service Worker المخصص (sw.js)
        const registration = await navigator.serviceWorker.register('./sw.js');
        console.log('✅ Service Worker تم تسجيله:', registration);

        // 2. طلب الإذن من المستخدم
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('⚠️ لم يتم منح إذن الإشعارات.');
            return;
        }

        // 3. الحصول على رمز FCM مع تمرير التسجيل يدوياً
        const currentToken = await messaging.getToken({
            vapidKey: VAPID_PUBLIC_KEY,
            serviceWorkerRegistration: registration
        });

        if (currentToken) {
            console.log('✅ FCM Token:', currentToken);
            // حفظ الرمز في الخادم
            await savePushSubscription({ token: currentToken, platform: 'web' });

            // استقبال رسائل المقدمة (Foreground)
            messaging.onMessage((payload) => {
                console.log('📩 رسالة في المقدمة:', payload);
                const notification = payload.notification || {};
                showToast(`🔔 ${notification.title || 'إشعار'}: ${notification.body || ''}`);
            });
        } else {
            console.log('⚠️ تعذر الحصول على رمز FCM.');
        }

    } catch (err) {
        console.error('❌ فشل إعداد الإشعارات:', err);
    }
}

// تهيئة التطبيق عند تحميل الصفحة
window.addEventListener('DOMContentLoaded', async () => {
    // تفعيل Web Push Notifications
    setupPushNotifications();
    
    // تهيئة المستخدمين
    initUsers();
    
    // الوضع الداكن
    const dark = localStorage.getItem('darkMode') === 'enabled';
    if (dark) document.body.classList.add('dark-mode');
    const darkToggle = document.getElementById('darkModeToggle');
    if (darkToggle) {
        darkToggle.onclick = () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', document.body.classList.contains('dark-mode') ? 'enabled' : 'disabled');
        };
    }
    
    // تحميل المستخدمين من السحابة
    await loadUsersFromCloud();
    
    // التحقق من الجلسة
    if (!checkSession()) {
        showLoginScreen();
    } else {
        const appContainer = document.getElementById('appContainer');
        if (appContainer) appContainer.style.display = 'block';
        applyPermissions();
        await loadData();
    }
    
    // ----- ربط عناصر واجهة المستخدم -----
    const addCardBtn = document.getElementById('addCardBtn');
    const subNameInput = document.getElementById('subName');
    if (addCardBtn && subNameInput) {
        addCardBtn.disabled = true;
        addCardBtn.style.opacity = '0.6';
        addCardBtn.style.cursor = 'not-allowed';
        subNameInput.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                addCardBtn.disabled = false;
                addCardBtn.style.opacity = '1';
                addCardBtn.style.cursor = 'pointer';
            } else {
                addCardBtn.disabled = true;
                addCardBtn.style.opacity = '0.6';
                addCardBtn.style.cursor = 'not-allowed';
            }
            if (typeof updateDuplicateWarnings === 'function') updateDuplicateWarnings();
        });
    }
    
    // القائمة المنسدلة للإدارة
    const adminDropdown = document.getElementById('adminDropdown');
    if (adminDropdown) {
        adminDropdown.addEventListener('click', (e) => {
            if (e.target.classList.contains('admin-dropdown-btn')) {
                adminDropdown.classList.toggle('active');
                e.stopPropagation();
            }
        });
        document.addEventListener('click', () => {
            adminDropdown.classList.remove('active');
        });
    }
    
    // أزرار التصفية والبحث
    safeSetOnclick('clearFilterBtn', () => {
        currentFilter = 'all';
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
        if (allBtn) allBtn.classList.add('active');
        if (typeof renderTable === 'function') renderTable();
    });
    
    safeSetOnclick('clearSearchBtn', () => {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
        currentSearch = '';
        if (typeof renderTable === 'function') renderTable();
    });
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.oninput = e => {
            currentSearch = e.target.value;
            if (typeof renderTable === 'function') renderTable();
        };
    }
    
    document.querySelectorAll('.filter-btn').forEach(b => b.onclick = () => {
        document.querySelectorAll('.filter-btn').forEach(f => f.classList.remove('active'));
        b.classList.add('active');
        currentFilter = b.dataset.filter;
        if (typeof renderTable === 'function') renderTable();
    });
    
    // أزرار العمليات الرئيسية
    safeSetOnclick('saveBtn', addOrUpdate);
    safeSetOnclick('cancelEditBtn', cancelEdit);
    safeSetOnclick('prevMonthBtn', () => changeMonth(-1));
    safeSetOnclick('nextMonthBtn', () => changeMonth(1));
    safeSetOnclick('logoutBtn', logout);
    safeSetOnclick('addCardBtn', addNewCard);
    
    // تهيئة البطاقات المؤقتة
    tempCardsList = [];
    if (typeof renderTempCards === 'function') renderTempCards();
    updateDateTime();
    if (typeof updateDuplicateWarnings === 'function') updateDuplicateWarnings();
});

// ========== زر العودة للأعلى ==========
const scrollBtn = document.getElementById('scrollToTopBtn');
if (scrollBtn) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollBtn.style.display = 'flex';
        } else {
            scrollBtn.style.display = 'none';
        }
    });

    scrollBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}