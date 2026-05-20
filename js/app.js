// ========== app.js - تهيئة التطبيق وربط الأحداث الرئيسية مع مزامنة فورية ==========

// Initialize Firebase
firebase.initializeApp(FIREBASE_CONFIG);

const messaging = firebase.messaging();

setInterval(updateDateTime, 1000);

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
        console.warn('⚠️ المتصفح لا يدعم الإشعارات.');
        return;
    }

    try {
        const registration = await navigator.serviceWorker.register('./sw.js');
        console.log('✅ SW مسجل:', registration);

        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'FORCE_REFRESH') {
                console.log('🔄 أمر بالتحديث من SW');
                loadData();
            }
        });

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const currentToken = await messaging.getToken({
            vapidKey: VAPID_PUBLIC_KEY,
            serviceWorkerRegistration: registration
        });

        if (currentToken) {
            console.log('✅ FCM Token:', currentToken);
            await savePushSubscription({ token: currentToken, platform: 'web' });
        }
    } catch (err) {
        console.error('⚠️ فشل إعداد الإشعارات:', err);
    }
}

// ========== إعادة ترتيب month-picker للوضع الأفقي ==========
function organizeMonthPickerForLandscape() {
    const monthPicker = document.querySelector('.month-picker');
    if (!monthPicker) return;
    
    const isLandscapeMobile = window.innerWidth <= 900 && window.matchMedia('(orientation: landscape)').matches;
    
    if (!isLandscapeMobile) {
        const rowOne = monthPicker.querySelector('.row-one');
        const rowTwo = monthPicker.querySelector('.row-two');
        if (rowOne || rowTwo) {
            const monthControl = rowOne ? rowOne.querySelector('.month-control') : null;
            const daysInfo = rowOne ? rowOne.querySelector('.days-info') : null;
            const dateTimeInfo = rowOne ? rowOne.querySelector('.datetime-info') : null;
            const actionsContainer = rowTwo ? rowTwo.querySelector('#actionsContainer') : null;
            
            monthPicker.innerHTML = '';
            
            if (monthControl) monthPicker.appendChild(monthControl);
            if (daysInfo) monthPicker.appendChild(daysInfo);
            if (dateTimeInfo) monthPicker.appendChild(dateTimeInfo);
            if (actionsContainer) monthPicker.appendChild(actionsContainer);
        }
        return;
    }
    
    if (monthPicker.querySelector('.row-one') && monthPicker.querySelector('.row-two')) return;
    
    const monthControl = monthPicker.querySelector('.month-control');
    const daysInfo = monthPicker.querySelector('.days-info');
    const dateTimeInfo = monthPicker.querySelector('.datetime-info');
    const actionsContainer = document.getElementById('actionsContainer');
    
    if (!monthControl || !daysInfo || !dateTimeInfo || !actionsContainer) return;
    
    const rowOne = document.createElement('div');
    rowOne.className = 'row-one';
    rowOne.appendChild(monthControl);
    rowOne.appendChild(daysInfo);
    rowOne.appendChild(dateTimeInfo);
    
    const rowTwo = document.createElement('div');
    rowTwo.className = 'row-two';
    rowTwo.appendChild(actionsContainer);
    
    monthPicker.innerHTML = '';
    monthPicker.appendChild(rowOne);
    monthPicker.appendChild(rowTwo);
}

// ========== إعدادات المزامنة الفورية ==========
function setupRealTimeSync() {
    setupAutoSync();
    
    window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_DATA) {
            console.log('📦 تم اكتشاف تغيير في localStorage من تبويب آخر');
            loadLocalData();
            renderAll();
            showBellNotification('تحديث البيانات', 'تم تحديث البيانات من تبويب آخر');
        }
    });
    
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && navigator.onLine) {
            console.log('👁️ الصفحة أصبحت مرئية - تحميل من السحابة');
            loadData();
        }
    });
    
    console.log('✅ تم إعداد نظام المزامنة الفورية');
}

// ========== تهيئة التطبيق بالكامل ==========
async function initApp() {
    console.log('🚀 بدء تهيئة التطبيق...');

    // ⭐ 1. تهيئة المستخدمين المحليين فورًا
    initUsers();

    // ⭐ 2. الوضع الليلي
    const dark = localStorage.getItem('darkMode') === 'enabled';
    if (dark) document.body.classList.add('dark-mode');
    const darkToggle = document.getElementById('darkModeToggle');
    if (darkToggle) {
        darkToggle.onclick = () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', document.body.classList.contains('dark-mode') ? 'enabled' : 'disabled');
        };
    }

    // ⭐ 3. تحميل المستخدمين من السحابة في الخلفية (لا ننتظرها)
    loadUsersFromCloud().catch(err => {
        console.warn('⚠️ فشل تحميل المستخدمين من السحابة:', err);
    });

    // ⭐ 4. التحقق من الجلسة
    const hasSession = checkSession();
    console.log('🔑 حالة الجلسة:', hasSession);

    // ⭐ 5. لو مفيش جلسة → اعرض تسجيل الدخول فورًا بدون شاشة تحميل
    if (!hasSession) {
        console.log('🔐 لا توجد جلسة - عرض شاشة تسجيل الدخول');

        // تأكد إن شاشة التحميل مختفية
        const splash = document.getElementById('splashScreen');
        if (splash) {
            splash.style.display = 'none';
            splash.classList.add('hidden');
        }

        // إظهار الحاوية الرئيسية
        const appContainer = document.getElementById('appContainer');
        if (appContainer) {
            appContainer.style.display = 'block';
        }

        // عرض تسجيل الدخول
        if (typeof showLoginScreen === 'function') {
            showLoginScreen();
        } else {
            console.error('❌ showLoginScreen غير معرفة!');
        }
        return;
    }

    // ⭐ 6. فيه جلسة → التطبيق الطبيعي مع شاشة تحميل
    console.log('✅ جلسة موجودة - تحميل البيانات...');

    const appContainer = document.getElementById('appContainer');
    if (!appContainer) {
        console.error('❌ appContainer غير موجود في الصفحة!');
        return;
    }
    appContainer.style.display = 'block';

    // ⭐ إظهار شاشة التحميل
    const splashScreen = document.getElementById('splashScreen');
    if (splashScreen) {
        splashScreen.style.display = 'flex';
        splashScreen.classList.remove('hidden');
        console.log('⏳ شاشة التحميل ظاهرة');
    }

    // ⭐ تحميل البيانات
    try {
        await loadData();
        console.log('✅ تم تحميل البيانات بنجاح');
    } catch (err) {
        console.error('❌ فشل تحميل البيانات:', err);
    }

    // ⭐ إظهار أقسام التطبيق
    const statsSection = document.getElementById('statsSection');
    if (statsSection) statsSection.style.display = 'grid';
    const tableSection = document.getElementById('tableSection');
    if (tableSection) tableSection.style.display = 'block';
    const toolbar = document.getElementById('toolbarRow');
    if (toolbar) toolbar.style.display = 'flex';
    const cardsCountHeader = document.getElementById('cardsCountHeader');
    if (cardsCountHeader) cardsCountHeader.style.display = 'block';

    // ⭐ تطبيق الصلاحيات
    applyPermissions();
    
    // ⭐ إعداد المزامنة
    setupRealTimeSync();

    // ⭐ إخفاء شاشة التحميل بعد تجهيز كل شيء
    if (splashScreen) {
        setTimeout(() => {
            splashScreen.classList.add('hidden');
            console.log('✅ شاشة التحميل مختفية');
            setTimeout(() => {
                if (splashScreen.parentNode) {
                    splashScreen.remove();
                }
            }, 500);
        }, 300);
    }

    // ⭐ ========== إعدادات النموذج ==========
    const toggleFormBtn = document.getElementById('toggleFormBtn');
    const formTitle = document.getElementById('formTitle');
    const addSubscriberCard = document.getElementById('addSubscriberCard');

    if (toggleFormBtn && addSubscriberCard) {
        toggleFormBtn.onclick = (e) => {
            e.stopPropagation();
            addSubscriberCard.classList.toggle('form-collapsed');
            const isCollapsed = addSubscriberCard.classList.contains('form-collapsed');
            toggleFormBtn.innerText = isCollapsed ? '▼' : '▲';
            toggleFormBtn.title = isCollapsed ? 'فتح النموذج' : 'طي النموذج';
        };
    }
    if (formTitle && addSubscriberCard) {
        formTitle.onclick = (e) => {
            e.stopPropagation();
            addSubscriberCard.classList.toggle('form-collapsed');
            const isCollapsed = addSubscriberCard.classList.contains('form-collapsed');
            if (toggleFormBtn) {
                toggleFormBtn.innerText = isCollapsed ? '▼' : '▲';
                toggleFormBtn.title = isCollapsed ? 'فتح النموذج' : 'طي النموذج';
            }
        };
    }

    // ⭐ ========== زر إضافة بطاقة ==========
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

    // ⭐ ========== القائمة المنسدلة للإدارة ==========
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

    // ⭐ ========== زر مسح الفلتر ==========
    safeSetOnclick('clearFilterBtn', () => {
        currentFilter = 'all';
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
        if (allBtn) allBtn.classList.add('active');
        if (typeof renderAll === 'function') renderAll();
    });

    // ⭐ ========== مربع البحث ==========
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const searchInput = document.getElementById('searchInput');
    
    if (clearSearchBtn && searchInput) {
        clearSearchBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            searchInput.value = '';
            currentSearch = '';
            searchInput.blur();
            clearSearchBtn.style.display = 'none';
            
            if (typeof renderAll === 'function') renderAll();
        });
    }

    if (searchInput) {
        searchInput.oninput = e => {
            currentSearch = e.target.value;
            
            const clearBtn = document.getElementById('clearSearchBtn');
            if (clearBtn) {
                clearBtn.style.display = e.target.value ? 'flex' : 'none';
            }
            
            if (typeof renderAll === 'function') renderAll();
        };
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchInput.blur();
            }
        });
    }

    // ⭐ ========== أزرار الفلتر ==========
    document.querySelectorAll('.filter-btn').forEach(b => b.onclick = () => {
        document.querySelectorAll('.filter-btn').forEach(f => f.classList.remove('active'));
        b.classList.add('active');
        currentFilter = b.dataset.filter;
        if (typeof renderAll === 'function') renderAll();
    });

    // ⭐ ========== ربط الأحداث العامة ==========
    safeSetOnclick('saveBtn', addOrUpdate);
    safeSetOnclick('cancelEditBtn', cancelEdit);
    safeSetOnclick('prevMonthBtn', () => changeMonth(-1));
    safeSetOnclick('nextMonthBtn', () => changeMonth(1));
    safeSetOnclick('logoutBtn', logout);
    safeSetOnclick('addCardBtn', addNewCard);

    // ⭐ ========== تهيئة النموذج ==========
    tempCardsList = [];
    if (typeof renderTempCards === 'function') renderTempCards();
    updateDateTime();
    if (typeof updateDuplicateWarnings === 'function') updateDuplicateWarnings();

    // ⭐ ========== تنظيم الشاشة الأفقية ==========
    organizeMonthPickerForLandscape();
    
    window.addEventListener('resize', () => {
        organizeMonthPickerForLandscape();
    });
    
    window.matchMedia('(orientation: landscape)').addEventListener('change', () => {
        organizeMonthPickerForLandscape();
    });

    // ⭐ ========== إشعارات الويب ==========
    setupPushNotifications();

    console.log('✅ تم تهيئة التطبيق بنجاح');
}

// ⭐ ========== بدء التطبيق عند تحميل الصفحة ==========
window.addEventListener('DOMContentLoaded', () => {
    console.log('📄 الصفحة جاهزة - بدء initApp');
    initApp().catch(err => {
        console.error('❌ حدث خطأ أثناء بدء التطبيق:', err);
        
        // ⭐ حل طوارئ: لو حصل خطأ، نخفي شاشة التحميل
        const splash = document.getElementById('splashScreen');
        if (splash) {
            splash.style.display = 'none';
            splash.classList.add('hidden');
        }
        const appContainer = document.getElementById('appContainer');
        if (appContainer) {
            appContainer.style.display = 'block';
        }
    });
});

// ⭐ ========== زر الرجوع للأعلى ==========
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
