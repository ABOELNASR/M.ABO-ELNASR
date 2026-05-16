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
    initUsers();

    const dark = localStorage.getItem('darkMode') === 'enabled';
    if (dark) document.body.classList.add('dark-mode');
    const darkToggle = document.getElementById('darkModeToggle');
    if (darkToggle) {
        darkToggle.onclick = () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', document.body.classList.contains('dark-mode') ? 'enabled' : 'disabled');
        };
    }

    await loadUsersFromCloud();

    if (!checkSession()) {
        showLoginScreen();
        return;
    }

    const appContainer = document.getElementById('appContainer');
    if (!appContainer) {
        console.error('❌ appContainer غير موجود في الصفحة!');
        return;
    }
    appContainer.style.display = 'block';
    console.log('📦 appContainer ظاهر');

    await loadData();

    const statsSection = document.getElementById('statsSection');
    if (statsSection) statsSection.style.display = 'grid';
    const tableSection = document.getElementById('tableSection');
    if (tableSection) tableSection.style.display = 'block';
    const toolbar = document.getElementById('toolbarRow');
    if (toolbar) toolbar.style.display = 'flex';
    const cardsCountHeader = document.getElementById('cardsCountHeader');
    if (cardsCountHeader) cardsCountHeader.style.display = 'block';

    applyPermissions();
    
    setupRealTimeSync();
    
    const splashScreen = document.getElementById('splashScreen');
    if (splashScreen) {
        setTimeout(() => {
            splashScreen.classList.add('hidden');
            setTimeout(() => {
                splashScreen.remove();
            }, 500);
        }, 300);
    }

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

    safeSetOnclick('clearFilterBtn', () => {
        currentFilter = 'all';
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
        if (allBtn) allBtn.classList.add('active');
        if (typeof renderAll === 'function') renderAll();
    });

    // ⭐ زر ✖ بتاع مربع البحث - يمسح النص ويقفل المربع ويخرج من وضع البحث
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const searchInput = document.getElementById('searchInput');
    
    if (clearSearchBtn && searchInput) {
        clearSearchBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // مسح النص
            searchInput.value = '';
            currentSearch = '';
            
            // إغلاق المربع (فقدان التركيز)
            searchInput.blur();
            
            // إخفاء زر ✖
            clearSearchBtn.style.display = 'none';
            
            // تحديث العرض
            if (typeof renderAll === 'function') renderAll();
        });
    }

    if (searchInput) {
        searchInput.oninput = e => {
            currentSearch = e.target.value;
            
            // ⭐ إظهار/إخفاء زر ✖ حسب وجود نص
            const clearBtn = document.getElementById('clearSearchBtn');
            if (clearBtn) {
                clearBtn.style.display = e.target.value ? 'flex' : 'none';
            }
            
            if (typeof renderAll === 'function') renderAll();
        };
        
        // ⭐ لما المستخدم يضغط Enter أو يفقد التركيز، يقفل المربع
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchInput.blur();
            }
        });
    }

    document.querySelectorAll('.filter-btn').forEach(b => b.onclick = () => {
        document.querySelectorAll('.filter-btn').forEach(f => f.classList.remove('active'));
        b.classList.add('active');
        currentFilter = b.dataset.filter;
        if (typeof renderAll === 'function') renderAll();
    });

    safeSetOnclick('saveBtn', addOrUpdate);
    safeSetOnclick('cancelEditBtn', cancelEdit);
    safeSetOnclick('prevMonthBtn', () => changeMonth(-1));
    safeSetOnclick('nextMonthBtn', () => changeMonth(1));
    safeSetOnclick('logoutBtn', logout);
    safeSetOnclick('addCardBtn', addNewCard);

    tempCardsList = [];
    if (typeof renderTempCards === 'function') renderTempCards();
    updateDateTime();
    if (typeof updateDuplicateWarnings === 'function') updateDuplicateWarnings();

    organizeMonthPickerForLandscape();
    
    window.addEventListener('resize', () => {
        organizeMonthPickerForLandscape();
    });
    
    window.matchMedia('(orientation: landscape)').addEventListener('change', () => {
        organizeMonthPickerForLandscape();
    });

    setupPushNotifications();
}

window.addEventListener('DOMContentLoaded', () => {
    initApp().catch(err => {
        console.error('حدث خطأ أثناء بدء التطبيق:', err);
    });
});

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
