// ========== data.js - إدارة البيانات (السحابة هي الأساس) ==========

// ========== آلية القفل لمنع التداخل ==========
let isSavingToCloud = false;
let pendingSaveToCloud = false;
let lastSaveTime = 0;

// ========== تحميل البيانات المحلية (للقراءة السريعة فقط) ==========
function loadLocalData() {
    const stored = localStorage.getItem(STORAGE_DATA);
    if (stored) {
        try {
            const d = JSON.parse(stored);
            subscribers = (d.subscribers && Array.isArray(d.subscribers)) ? d.subscribers.map(s => migrateSubscriber(s)).filter(s => s !== null) : [];
            monthlyPayments = d.monthlyPayments || {};
            paymentDates = d.paymentDates || {};
            breadOverrides = d.breadOverrides || {};
            
            console.log('✅ تم تحميل البيانات المحلية. عدد المشتركين:', subscribers.length);
        } catch (e) {
            console.error('خطأ في قراءة البيانات المحلية:', e);
            subscribers = [];
            monthlyPayments = {};
            paymentDates = {};
            breadOverrides = {};
        }
    } else {
        console.log('لا توجد بيانات محلية، بدء بقائمة فارغة');
        subscribers = [];
        monthlyPayments = {};
        paymentDates = {};
        breadOverrides = {};
    }
    
    subscribers.forEach(s => { if (!s.cardsList) s.cardsList = []; });
    
    const notes = localStorage.getItem(STORAGE_SYSTEM_NOTES);
    if (notes) systemNotes = notes;
    
    loadActivityLogFromLocal();
}

// ========== حفظ محلي (نسخة احتياطية فقط) ==========
function saveLocalData() {
    try {
        const dataToStore = {
            subscribers: subscribers,
            monthlyPayments: monthlyPayments,
            paymentDates: paymentDates,
            breadOverrides: breadOverrides,
            lastSaved: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_DATA, JSON.stringify(dataToStore));
        localStorage.setItem(STORAGE_SYSTEM_NOTES, systemNotes);
        saveActivityLogToLocal();
        console.log('✅ تم حفظ نسخة محلية احتياطية');
    } catch (e) {
        console.error('خطأ في الحفظ المحلي:', e);
    }
}

// ========== رفع فوري إجباري للسحابة مع تأكيد ==========
async function saveDataToCloudForce() {
    if (isSavingToCloud) {
        pendingSaveToCloud = true;
        console.log('⏳ رفع سابق لسه شغال، الانتظار...');
        return false;
    }
    
    isSavingToCloud = true;
    let confirmed = false;
    
    try {
        const cleanSubscribers = subscribers.map(s => sanitizeSubscriber(s));
        const recentActivityLog = (activityLog || []).slice(0, 50);
        
        const payload = {
            subscribers: cleanSubscribers,
            monthlyPayments: monthlyPayments,
            paymentDates: paymentDates,
            breadOverrides: breadOverrides,
            users: usersList.map(u => ({
                username: u.username,
                password: u.password,
                role: u.role,
                email: u.email,
                createdAt: u.createdAt,
                updatedAt: u.updatedAt
            })),
            systemNotes: systemNotes,
            activityLog: recentActivityLog,
            version: APP_VERSION,
            timestamp: new Date().toISOString()
        };

        // ⭐ إرسال البيانات كـ JSON مباشر في جسم الطلب
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const result = await response.json();
        console.log('☁️☁️ رفع فوري ناجح:', result);
        
        // ⭐⭐ تأكيد الرفع: اسحب من السحابة وتأكد إن البيانات وصلت
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
            const verifyData = await loadDataFromCloud();
            if (verifyData && verifyData.subscribers && Array.isArray(verifyData.subscribers)) {
                if (verifyData.subscribers.length === cleanSubscribers.length) {
                    console.log(`✅ تم تأكيد الرفع`);
                    confirmed = true;
                } else {
                    console.log(`⏳ السحابة (${verifyData.subscribers.length}) ≠ المحلي (${cleanSubscribers.length})`);
                }
            }
        } catch (e) {
            console.log(`⚠️ فشل التحقق:`, e.message);
        }
        
        if (confirmed) {
            updateSyncStatusUI('success');
            lastSaveTime = Date.now();
            return true;
        } else {
            console.warn('⚠️ تعذر تأكيد الرفع');
            updateSyncStatusUI('failed');
            syncNeeded = true;
            localStorage.setItem('pending_sync', 'true');
            return false;
        }
    } catch (e) {
        console.error('❌ فشل الرفع الفوري:', e);
        updateSyncStatusUI('failed');
        syncNeeded = true;
        localStorage.setItem('pending_sync', 'true');
        throw e;
    } finally {
        isSavingToCloud = false;
        
        if (!confirmed && navigator.onLine) {
            showToast('⚠️ تعذر تأكيد الحفظ في السحابة. سيتم إعادة المحاولة.', true);
        }
        
        if (pendingSaveToCloud) {
            pendingSaveToCloud = false;
            console.log('🔄 تنفيذ الرفع المعلق...');
            setTimeout(() => saveDataToCloudForce(), 500);
        }
    }
}

// ========== رفع عادي (بدون إجباري) ==========
async function saveDataToCloud() {
    if (isSavingToCloud) {
        console.log('⏳ الرفع مؤجل لأن فيه رفع شغال حالياً');
        pendingSaveToCloud = true;
        return true;
    }
    return await saveDataToCloudForce();
}

// ========== حفظ مزدوج (سحابة فوراً + محلي احتياطي) ==========
async function saveData() {
    saveLocalData();
    saveUsersToLocal();
    updateSyncStatusUI('saving');
    
    if (navigator.onLine && window.location.protocol !== 'file:') {
        try {
            await saveDataToCloudForce();
            syncNeeded = false;
            localStorage.removeItem('pending_sync');
        } catch (e) {
            console.warn('⚠️ فشل الحفظ السحابي، تم الاحتفاظ بنسخة محلية:', e);
            updateSyncStatusUI('failed');
            syncNeeded = true;
            localStorage.setItem('pending_sync', 'true');
        }
    } else {
        updateSyncStatusUI(navigator.onLine ? 'offline' : 'no_connection');
        syncNeeded = true;
        localStorage.setItem('pending_sync', 'true');
    }
}

// ========== حفظ وانتظار التأكيد (إجباري) ==========
async function saveDataAndWait() {
    saveLocalData();
    saveUsersToLocal();
    updateSyncStatusUI('saving');
    
    if (navigator.onLine && window.location.protocol !== 'file:') {
        try {
            await saveDataToCloudForce();
            syncNeeded = false;
            localStorage.removeItem('pending_sync');
            return true;
        } catch (e) {
            updateSyncStatusUI('failed');
            syncNeeded = true;
            localStorage.setItem('pending_sync', 'true');
            return false;
        }
    }
    return false;
}

// ========== تحديث واجهة المزامنة ==========
function updateSyncStatusUI(status) {
    const syncStatus = document.getElementById('syncStatus');
    if (!syncStatus) return;
    
    switch(status) {
        case 'saving':
            syncStatus.innerHTML = '⏳ جاري الرفع للسحابة...';
            syncStatus.style.color = '#ff9800';
            break;
        case 'success':
            syncStatus.innerHTML = '☁️ متزامن مع السحابة';
            syncStatus.style.color = '#4caf50';
            setTimeout(() => {
                if (syncStatus.innerHTML === '☁️ متزامن مع السحابة') {
                    syncStatus.style.opacity = '0.7';
                }
            }, 2000);
            break;
        case 'failed':
            syncStatus.innerHTML = '⚠️ فشل الرفع - النسخة المحلية محفوظة';
            syncStatus.style.color = '#ef5350';
            break;
        case 'offline':
            syncStatus.innerHTML = '⚠️ غير متصل (حفظ محلي)';
            syncStatus.style.color = '#ff9800';
            break;
        case 'no_connection':
            syncStatus.innerHTML = '⚠️ مطلوب اتصال';
            syncStatus.style.color = '#ef5350';
            break;
        case 'syncing':
            syncStatus.innerHTML = '🔄 جاري التحميل من السحابة...';
            syncStatus.style.color = '#2196f3';
            break;
    }
    syncStatus.style.opacity = '1';
}

// ========== مزامنة الإجراءات المعلقة ==========
async function syncPendingActions() {
    if (!navigator.onLine) return false;
    if (!syncNeeded && !localStorage.getItem('pending_sync')) return false;
    
    console.log('🔄 رفع الإجراءات المعلقة إلى السحابة...');
    updateSyncStatusUI('syncing');
    
    try {
        await saveDataToCloudForce();
        updateSyncStatusUI('success');
        syncNeeded = false;
        localStorage.removeItem('pending_sync');
        showToast('✅ تم رفع جميع الإجراءات إلى السحابة');
        return true;
    } catch (e) {
        console.warn('فشل رفع الإجراءات المعلقة:', e);
        updateSyncStatusUI('failed');
        return false;
    }
}

// ========== إعدادات المزامنة التلقائية ==========
function setupAutoSync() {
    window.addEventListener('online', async () => {
        console.log('🌐 استعادة الاتصال - رفع البيانات للسحابة');
        showToast('📡 تم استعادة الاتصال، جاري رفع البيانات...');
        await syncPendingActions();
        if (typeof renderAll === 'function') renderAll();
    });
    
    window.addEventListener('offline', () => {
        console.log('⚠️ فقد الاتصال');
        updateSyncStatusUI('offline');
        showToast('⚠️ فقد الاتصال بالإنترنت، سيتم الحفظ محلياً', true);
    });
}

// ========== تحميل البيانات من السحابة ==========
async function loadDataFromCloud() {
    try {
        const response = await fetch(`${API_URL}?action=load&t=${Date.now()}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        return data;
    } catch (e) {
        throw e;
    }
}

// ========== التحميل الرئيسي (السحابة هي الأساس) ==========
async function loadData(forceLocal = false) {
    if (window.location.protocol === 'file:') {
        showToast('⚠️ التطبيق يعمل من ملف محلي', true);
        updateSyncStatusUI('no_connection');
        loadLocalData();
        renderAll();
        return;
    }

    if (forceLocal || !navigator.onLine) {
        loadLocalData();
        renderAll();
        updateSyncStatusUI('offline');
        return;
    }

    updateSyncStatusUI('syncing');
    
    try {
        const data = await loadDataFromCloud();
        
        if (data && data.subscribers && Array.isArray(data.subscribers)) {
            const cloudSubscribers = data.subscribers.map(s => migrateSubscriber(s)).filter(s => s !== null);
            
            // ⭐ استبدال كامل من السحابة
            subscribers = cloudSubscribers;
            monthlyPayments = data.monthlyPayments || {};
            paymentDates = data.paymentDates || {};
            breadOverrides = data.breadOverrides || {};
            
            if (data.users && Array.isArray(data.users) && data.users.length) {
                usersList = data.users;
                saveUsersToLocal();
            }
            
            if (data.systemNotes !== undefined) systemNotes = data.systemNotes;
            if (data.activityLog) {
                activityLog = data.activityLog;
                saveActivityLogToLocal();
            }
            
            saveLocalData();
            
            updateSyncStatusUI('success');
            console.log(`☁️ تم تحميل ${subscribers.length} مشترك من السحابة`);
            
            if (subscribers.length > 0) {
                showToast('☁️ تم الاتصال بالسحابة');
            }
        } else {
            console.log('☁️ السحابة فارغة، بدء بقائمة فارغة');
            subscribers = [];
            monthlyPayments = {};
            paymentDates = {};
            breadOverrides = {};
            saveLocalData();
            updateSyncStatusUI('success');
        }
    } catch (e) {
        console.warn('❌ فشل تحميل البيانات من السحابة:', e.message);
        
        loadLocalData();
        updateSyncStatusUI('failed');
        
        if (subscribers.length > 0) {
            showToast(`⚠️ تعذر الاتصال بالسحابة. عرض ${subscribers.length} مشترك من النسخة المحلية`, true);
        } else {
            showToast('❌ تعذر الاتصال بالسحابة ولا توجد نسخة محلية', true);
        }
    }
    
    renderAll();
}

// ========== مزامنة يدوية (تحديث من السحابة) ==========
async function manualSync() {
    if (!navigator.onLine) {
        showToast('❌ لا يوجد اتصال بالإنترنت', true);
        return false;
    }
    
    showToast('🔄 جاري تحميل البيانات من السحابة...');
    updateSyncStatusUI('syncing');
    
    try {
        await saveDataToCloudForce();
        
        const data = await loadDataFromCloud();
        
        if (data && data.subscribers && Array.isArray(data.subscribers)) {
            const cloudSubscribers = data.subscribers.map(s => migrateSubscriber(s)).filter(s => s !== null);
            
            subscribers = cloudSubscribers;
            monthlyPayments = data.monthlyPayments || {};
            paymentDates = data.paymentDates || {};
            breadOverrides = data.breadOverrides || {};
            
            if (data.users && Array.isArray(data.users) && data.users.length) {
                usersList = data.users;
                saveUsersToLocal();
            }
            
            if (data.systemNotes !== undefined) systemNotes = data.systemNotes;
            if (data.activityLog) {
                activityLog = data.activityLog;
                saveActivityLogToLocal();
            }
            
            saveLocalData();
            renderAll();
            
            showToast('☁️ تم الاتصال بالسحابة');
            updateSyncStatusUI('success');
            return true;
        }
        
        updateSyncStatusUI('success');
        showToast('✅ لا توجد تغييرات');
        return true;
    } catch (e) {
        updateSyncStatusUI('failed');
        showToast(`❌ فشل التحميل: ${e.message}`, true);
        return false;
    }
}

// ========== تنقية البيانات ==========
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

// ========== ترحيل البيانات القديمة ==========
function migrateSubscriber(sub) {
    if (!sub) return null;
    if (!sub.id) {
        console.warn('تم تجاهل مشترك بدون ID:', sub);
        return null;
    }
    
    if (typeof sub.cardsList === 'string') {
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
            usersList = data.users;
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

// ========== حفظ اشتراك Push ==========
async function savePushSubscription(subscription) {
    if (!subscription || !subscription.token) return;
    try {
        const formData = new FormData();
        formData.append('action', 'saveSubscription');
        formData.append('data', JSON.stringify(subscription));
        await fetch(API_URL, {
            method: 'POST',
            body: formData
        });
        console.log('✅ تم حفظ رمز الاشتراك في الخادم');
    } catch (e) {
        console.error('فشل حفظ رمز الاشتراك:', e);
    }
}
