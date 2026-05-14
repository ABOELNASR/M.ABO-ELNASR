// ========== data.js - إدارة البيانات المحلية والسحابية (حل FormData) ==========

// تحميل البيانات من LocalStorage
function loadLocalData() {
    const stored = localStorage.getItem(STORAGE_DATA);
    if (stored) {
        try {
            const d = JSON.parse(stored);
            subscribers = d.subscribers || [];
            subscribers = subscribers.map(s => migrateSubscriber(s)).filter(s => s !== null);
            monthlyPayments = d.monthlyPayments || {};
            paymentDates = d.paymentDates || {};
            breadOverrides = d.breadOverrides || {};
            availableCards = d.availableCards || [];
        } catch (e) {
            console.error('خطأ في قراءة البيانات المحلية:', e);
        }
    }
    subscribers = subscribers.filter(s => s && s.id);
    subscribers.forEach(s => { if (!s.cardsList) s.cardsList = []; });
    
    const notes = localStorage.getItem(STORAGE_SYSTEM_NOTES);
    if (notes) systemNotes = notes;
    
    loadActivityLogFromLocal();
}

function saveLocalData() {
    const dataToStore = {
        subscribers: subscribers,
        monthlyPayments: monthlyPayments,
        paymentDates: paymentDates,
        breadOverrides: breadOverrides,
        availableCards: availableCards
    };
    localStorage.setItem(STORAGE_DATA, JSON.stringify(dataToStore));
    localStorage.setItem(STORAGE_SYSTEM_NOTES, systemNotes);
    saveActivityLogToLocal();
}

// حفظ البيانات على Google Apps Script باستخدام FormData لتجاوز CORS
async function saveDataToCloud() {
    const cleanSubscribers = subscribers.map(s => sanitizeSubscriber(s));
    
    const payload = {
        subscribers: cleanSubscribers,
        monthlyPayments: monthlyPayments,
        paymentDates: paymentDates,
        breadOverrides: breadOverrides,
        availableCards: availableCards,
        users: usersList.map(u => ({
            username: u.username,
            password: u.password,
            role: u.role,
            email: u.email,
            createdAt: u.createdAt,
            updatedAt: u.updatedAt
        })),
        systemNotes: systemNotes,
        activityLog: activityLog
    };

    // استخدام FormData لإرسال البيانات كـ multipart/form-data
    const formData = new FormData();
    formData.append('data', JSON.stringify(payload));

    try {
        await fetch(API_URL, {
            method: 'POST',
            body: formData,
            mode: 'no-cors'
        });
        return true;
    } catch (e) {
        console.error('❌ فشل الحفظ السحابي:', e);
        throw e;
    }
}

async function saveData() {
    saveLocalData();
    saveUsersToLocal();
    
    if (navigator.onLine && window.location.protocol !== 'file:') {
        try {
            await saveDataToCloud();
            document.getElementById('syncStatus').innerHTML = '🟢 متزامن';
            syncNeeded = false;
        } catch (e) {
            document.getElementById('syncStatus').innerHTML = '⚠️ حفظ محلي فقط';
            syncNeeded = true;
            showToast(`⚠️ فشل الاتصال بالسحابة: ${e.message}`, true);
        }
    } else if (window.location.protocol === 'file:') {
        document.getElementById('syncStatus').innerHTML = '⚠️ مطلوب خادم HTTP';
    } else {
        document.getElementById('syncStatus').innerHTML = '⚠️ غير متصل (حفظ محلي)';
        syncNeeded = true;
    }
}

async function loadDataFromCloud() {
    const response = await fetch(`${API_URL}?action=load`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data;
}

async function loadData() {
    if (window.location.protocol === 'file:') {
        showToast('⚠️ التطبيق يعمل من ملف محلي. استخدم Live Server للمزامنة.', true);
        document.getElementById('syncStatus').innerHTML = '⚠️ مطلوب خادم HTTP';
        loadLocalData();
        renderAll();
        return;
    }

    if (navigator.onLine) {
        try {
            document.getElementById('syncStatus').innerHTML = '⏳ جاري التحميل...';
            const data = await loadDataFromCloud();
            
            subscribers = (data.subscribers || []).map(s => migrateSubscriber(s)).filter(s => s !== null);
            monthlyPayments = data.monthlyPayments || {};
            paymentDates = data.paymentDates || {};
            breadOverrides = data.breadOverrides || {};
            availableCards = data.availableCards || [];
            
            if (data.users && Array.isArray(data.users) && data.users.length) {
                usersList = data.users.map(u => ({
                    username: u.username,
                    password: u.password,
                    role: u.role || ROLES.READ,
                    email: u.email || '',
                    createdAt: u.createdAt || new Date().toISOString(),
                    updatedAt: u.updatedAt || new Date().toISOString()
                }));
                saveUsersToLocal();
            }
            
            if (data.systemNotes) systemNotes = data.systemNotes;
            if (data.activityLog) {
                activityLog = data.activityLog;
                saveActivityLogToLocal();
            }
            
            document.getElementById('syncStatus').innerHTML = '🟢 متزامن';
            saveLocalData();
            renderAll();
            showToast('✅ تم تحميل البيانات من السحابة');
            return;
        } catch (e) {
            console.warn('فشل التحميل من السحابة:', e);
            document.getElementById('syncStatus').innerHTML = '⚠️ سحابة غير متصلة (محلي)';
            showToast(`⚠️ فشل الاتصال بالسحابة: ${e.message}`, true);
        }
    } else {
        document.getElementById('syncStatus').innerHTML = '⚠️ غير متصل (محلي)';
    }
    
    loadLocalData();
    renderAll();
}

async function testConnection() {
    if (!navigator.onLine) {
        showToast('❌ لا يوجد اتصال بالإنترنت', true);
        return;
    }
    if (window.location.protocol === 'file:') {
        showToast('❌ لا يمكن الاتصال بالسحابة من ملف محلي.', true);
        return;
    }
    showToast('⏳ جاري اختبار الاتصال...');
    try {
        const data = await loadDataFromCloud();
        showToast(`✅ الاتصال بالسحابة ناجح. عدد المشتركين: ${data.subscribers?.length || 0}`);
    } catch (err) {
        showToast(`❌ فشل الاتصال: ${err.message}`, true);
    }
}

// ========== دوال الحماية من تلف البيانات ==========
function sanitizeSubscriber(sub) {
    const clean = {
        id: sub.id,
        name: String(sub.name || '').trim(),
        balance: Number(sub.balance) || 0,
        cardsList: [],
        createdAt: sub.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        history: Array.isArray(sub.history) ? sub.history : []
    };
    
    if (Array.isArray(sub.cardsList)) {
        clean.cardsList = sub.cardsList.map(card => ({
            cardName: String(card.cardName || '').trim(),
            individuals: parseInt(card.individuals) || 1,
            dailyBreadOverride: card.dailyBreadOverride || null,
            createdAt: card.createdAt || clean.createdAt,
            updatedAt: card.updatedAt || clean.updatedAt,
            history: Array.isArray(card.history) ? card.history : [],
            notes: String(card.notes || '')
        })).filter(card => card.cardName !== '');
    }
    
    return clean;
}

function migrateSubscriber(sub) {
    if (!sub) return null;
    if (!sub.id) {
        console.warn('تم تجاهل مشترك بدون ID:', sub);
        return null;
    }
    
    if (typeof sub.cardsList === 'string') {
        console.warn('إصلاح cardsList التالفة للمشترك:', sub.name);
        try {
            sub.cardsList = JSON.parse(sub.cardsList);
        } catch (e) {
            sub.cardsList = [];
        }
    }
    
    if (!Array.isArray(sub.cardsList)) sub.cardsList = [];
    
    sub.cardsList = sub.cardsList.map(card => {
        let cardName = card.cardName;
        if (!cardName || cardName === 'individuals' || cardName === 'monthlyPayments' || cardName === 'activityLog' || cardName === 'user') {
            cardName = 'بطاقة غير مسماة';
        }
        return {
            cardName: String(cardName).trim(),
            individuals: parseInt(card.individuals) || 1,
            dailyBreadOverride: card.dailyBreadOverride || null,
            createdAt: card.createdAt || sub.createdAt || new Date().toISOString(),
            updatedAt: card.updatedAt || new Date().toISOString(),
            history: Array.isArray(card.history) ? card.history : [],
            notes: String(card.notes || '')
        };
    });
    
    sub.cardsList = sub.cardsList.filter(card => card.cardName !== '');
    if (sub.balance === undefined) sub.balance = 0;
    if (!sub.createdAt) sub.createdAt = new Date().toISOString();
    if (!sub.updatedAt) sub.updatedAt = new Date().toISOString();
    if (!Array.isArray(sub.history)) sub.history = [];
    
    return sub;
}

// ========== إدارة المستخدمين ==========
function initUsers() {
    const localUsers = localStorage.getItem(STORAGE_USERS);
    if (localUsers) {
        try {
            usersList = JSON.parse(localUsers);
        } catch (e) {
            usersList = JSON.parse(JSON.stringify(DEFAULT_USERS));
        }
    } else {
        usersList = JSON.parse(JSON.stringify(DEFAULT_USERS));
    }
}

function saveUsersToLocal() {
    localStorage.setItem(STORAGE_USERS, JSON.stringify(usersList));
}

async function loadUsersFromCloud() {
    if (window.location.protocol === 'file:') return;
    if (!navigator.onLine) return;
    try {
        const data = await loadDataFromCloud();
        if (data.users && Array.isArray(data.users) && data.users.length) {
            usersList = data.users.map(u => ({
                username: u.username,
                password: u.password,
                role: u.role || ROLES.READ,
                email: u.email || '',
                createdAt: u.createdAt || new Date().toISOString(),
                updatedAt: u.updatedAt || new Date().toISOString()
            }));
            saveUsersToLocal();
        }
    } catch (e) {
        console.warn('لم يتم تحميل المستخدمين من السحابة:', e);
    }
}

// ========== سجل العمليات ==========
function addActivityLog(action, details) {
    const entry = {
        timestamp: new Date().toISOString(),
        user: currentUser ? currentUser.username : 'system',
        action: action,
        details: details
    };
    activityLog.unshift(entry);
    if (activityLog.length > 500) activityLog.pop();
    saveActivityLogToLocal();
}

function saveActivityLogToLocal() {
    localStorage.setItem(STORAGE_ACTIVITY_LOG, JSON.stringify(activityLog));
}

function loadActivityLogFromLocal() {
    const stored = localStorage.getItem(STORAGE_ACTIVITY_LOG);
    if (stored) {
        try {
            activityLog = JSON.parse(stored);
        } catch (e) {
            activityLog = [];
        }
    }
}

// ========== إدارة اشتراكات Push Notifications ==========
async function savePushSubscription(subscription) {
    if (!subscription || !subscription.token) return;
    try {
        const formData = new FormData();
        formData.append('action', 'saveSubscription');
        formData.append('data', JSON.stringify(subscription));
        await fetch(API_URL, {
            method: 'POST',
            body: formData,
            mode: 'no-cors'
        });
        console.log('✅ تم حفظ رمز الاشتراك في الخادم');
    } catch (e) {
        console.error('فشل حفظ رمز الاشتراك:', e);
    }
}
