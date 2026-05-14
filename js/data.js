// ========== data.js - إدارة البيانات المحلية والسحابية مع مزامنة فورية ==========

// تحميل البيانات من LocalStorage بشكل آمن
function loadLocalData() {
    const stored = localStorage.getItem(STORAGE_DATA);
    if (stored) {
        try {
            const d = JSON.parse(stored);
            subscribers = (d.subscribers && Array.isArray(d.subscribers)) ? d.subscribers.map(s => migrateSubscriber(s)).filter(s => s !== null) : [];
            monthlyPayments = d.monthlyPayments || {};
            paymentDates = d.paymentDates || {};
            breadOverrides = d.breadOverrides || {};
            
            console.log('✅ تم تحميل البيانات المحلية بنجاح. عدد المشتركين:', subscribers.length);
        } catch (e) {
            console.error('خطأ في قراءة البيانات المحلية:', e);
            if (subscribers.length === 0) {
                subscribers = [];
                monthlyPayments = {};
                paymentDates = {};
                breadOverrides = {};
            }
        }
    } else {
        console.log('لا توجد بيانات محلية مخزنة، بدء بقائمة فارغة');
        subscribers = [];
        monthlyPayments = {};
        paymentDates = {};
        breadOverrides = {};
    }
    
    subscribers.forEach(s => { 
        if (!s.cardsList) s.cardsList = []; 
    });
    
    const notes = localStorage.getItem(STORAGE_SYSTEM_NOTES);
    if (notes) systemNotes = notes;
    
    loadActivityLogFromLocal();
}

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
        console.log('✅ تم حفظ البيانات محلياً');
    } catch (e) {
        console.error('خطأ في حفظ البيانات المحلية:', e);
    }
}

// حفظ البيانات على Google Apps Script
async function saveDataToCloud() {
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

    try {
        const dataStr = JSON.stringify(payload);
        const formData = new FormData();
        formData.append('data', dataStr);
        
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });
        
        try {
            const result = await response.json();
            console.log('💾 استجابة الحفظ:', result);
        } catch(e) {
            console.log('تم الحفظ بنجاح');
        }
        
        return true;
    } catch (e) {
        console.error('❌ فشل الحفظ السحابي:', e);
        throw e;
    }
}

async function saveData() {
    saveLocalData();
    saveUsersToLocal();
    updateSyncStatusUI('saving');
    
    if (navigator.onLine && window.location.protocol !== 'file:') {
        try {
            await saveDataToCloud();
            updateSyncStatusUI('success');
            syncNeeded = false;
            localStorage.removeItem('pending_sync');
        } catch (e) {
            console.warn('⚠️ فشل الحفظ السحابي:', e);
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

async function saveDataAndWait() {
    saveLocalData();
    saveUsersToLocal();
    updateSyncStatusUI('saving');
    
    if (navigator.onLine && window.location.protocol !== 'file:') {
        try {
            await saveDataToCloud();
            updateSyncStatusUI('success');
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

function updateSyncStatusUI(status) {
    const syncStatus = document.getElementById('syncStatus');
    if (!syncStatus) return;
    
    switch(status) {
        case 'saving':
            syncStatus.innerHTML = '⏳ جاري الحفظ...';
            syncStatus.style.color = '#ff9800';
            break;
        case 'success':
            syncStatus.innerHTML = '🟢 متزامن';
            syncStatus.style.color = '#4caf50';
            setTimeout(() => {
                if (syncStatus.innerHTML === '🟢 متزامن') {
                    syncStatus.style.opacity = '0.7';
                }
            }, 2000);
            break;
        case 'failed':
            syncStatus.innerHTML = '⚠️ حفظ محلي فقط';
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
            syncStatus.innerHTML = '🔄 مزامنة...';
            syncStatus.style.color = '#2196f3';
            break;
    }
    syncStatus.style.opacity = '1';
}

async function syncPendingActions() {
    if (!navigator.onLine) return false;
    if (!syncNeeded && !localStorage.getItem('pending_sync')) return false;
    
    console.log('🔄 مزامنة الإجراءات المعلقة...');
    updateSyncStatusUI('syncing');
    
    try {
        await saveDataToCloud();
        updateSyncStatusUI('success');
        syncNeeded = false;
        localStorage.removeItem('pending_sync');
        showToast('✅ تمت مزامنة جميع الإجراءات مع السحابة');
        return true;
    } catch (e) {
        console.warn('فشلت مزامنة الإجراءات المعلقة:', e);
        updateSyncStatusUI('failed');
        return false;
    }
}

function setupAutoSync() {
    window.addEventListener('online', async () => {
        console.log('🌐 استعادة الاتصال - بدء المزامنة');
        showToast('📡 تم استعادة الاتصال، جاري المزامنة...');
        await syncPendingActions();
        await manualSync();
        if (typeof renderAll === 'function') renderAll();
    });
    
    window.addEventListener('offline', () => {
        console.log('⚠️ فقد الاتصال');
        updateSyncStatusUI('offline');
        showToast('⚠️ فقد الاتصال بالإنترنت، سيتم الحفظ محلياً', true);
    });
}

// ========== مزامنة دورية محسنة ==========

let autoRefreshInterval = null;
let isRefreshing = false;
let failedRefreshAttempts = 0;
const MAX_FAILED_ATTEMPTS = 3;

function startAutoRefresh(intervalSeconds = 60) {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    
    autoRefreshInterval = setInterval(async () => {
        if (navigator.onLine && document.visibilityState === 'visible' && !isRefreshing) {
            console.log('🔄 تحديث دوري للبيانات...');
            isRefreshing = true;
            try {
                const newData = await loadDataFromCloud();
                
                if (newData && newData.subscribers) {
                    failedRefreshAttempts = 0;
                    let hasChanges = false;
                    
                    if (newData.subscribers.length !== subscribers.length) {
                        hasChanges = true;
                    } else {
                        for (const cloudSub of newData.subscribers) {
                            const localSub = subscribers.find(s => s.id === cloudSub.id);
                            if (!localSub || new Date(cloudSub.updatedAt) > new Date(localSub.updatedAt)) {
                                hasChanges = true;
                                break;
                            }
                        }
                    }
                    
                    if (hasChanges) {
                        console.log('📦 تم اكتشاف تغييرات، جاري تحديث الواجهة...');
                        
                        subscribers = newData.subscribers.map(s => migrateSubscriber(s)).filter(s => s !== null);
                        monthlyPayments = newData.monthlyPayments || {};
                        paymentDates = newData.paymentDates || {};
                        breadOverrides = newData.breadOverrides || {};
                        
                        if (newData.users && Array.isArray(newData.users) && newData.users.length) {
                            usersList = newData.users;
                            saveUsersToLocal();
                        }
                        
                        if (newData.systemNotes) systemNotes = newData.systemNotes;
                        if (newData.activityLog) {
                            activityLog = newData.activityLog;
                            saveActivityLogToLocal();
                        }
                        
                        saveLocalData();
                        
                        if (typeof renderAll === 'function') renderAll();
                        
                        showBellNotification('تحديث البيانات', 'تم تحديث البيانات من الخادم');
                        showToast('📡 تم تحديث البيانات من السحابة');
                    }
                }
            } catch (e) {
                failedRefreshAttempts++;
                console.warn(`فشل التحديث الدوري (${failedRefreshAttempts}/${MAX_FAILED_ATTEMPTS}):`, e.message);
                
                if (failedRefreshAttempts >= MAX_FAILED_ATTEMPTS) {
                    console.warn('توقف التحديث الدوري مؤقتاً بعد 3 محاولات فاشلة');
                    stopAutoRefresh();
                    setTimeout(() => {
                        console.log('🔄 إعادة تشغيل التحديث الدوري...');
                        startAutoRefresh(120);
                        failedRefreshAttempts = 0;
                    }, 120000);
                }
            } finally {
                isRefreshing = false;
            }
        }
    }, intervalSeconds * 1000);
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

async function loadDataFromCloudAndMerge() {
    if (!navigator.onLine) return false;
    
    try {
        const data = await loadDataFromCloud();
        
        if (data && data.subscribers && Array.isArray(data.subscribers)) {
            const cloudSubscribers = data.subscribers.map(s => migrateSubscriber(s)).filter(s => s !== null);
            let hasChanges = false;
            
            if (cloudSubscribers.length !== subscribers.length) {
                hasChanges = true;
            } else {
                for (const cloudSub of cloudSubscribers) {
                    const localSub = subscribers.find(s => s.id === cloudSub.id);
                    if (!localSub || new Date(cloudSub.updatedAt) > new Date(localSub.updatedAt)) {
                        hasChanges = true;
                        break;
                    }
                }
            }
            
            if (hasChanges) {
                subscribers = cloudSubscribers;
                monthlyPayments = data.monthlyPayments || {};
                paymentDates = data.paymentDates || {};
                breadOverrides = data.breadOverrides || {};
                
                if (data.users && Array.isArray(data.users) && data.users.length) {
                    usersList = data.users;
                    saveUsersToLocal();
                }
                
                if (data.systemNotes) systemNotes = data.systemNotes;
                if (data.activityLog) {
                    activityLog = data.activityLog;
                    saveActivityLogToLocal();
                }
                
                saveLocalData();
                return true;
            }
        }
        return false;
    } catch (e) {
        console.warn('فشل دمج البيانات:', e);
        return false;
    }
}

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

async function loadData(forceLocal = false) {
    if (window.location.protocol === 'file:') {
        showToast('⚠️ التطبيق يعمل من ملف محلي', true);
        updateSyncStatusUI('no_connection');
        loadLocalData();
        renderAll();
        return;
    }

    loadLocalData();
    renderAll();
    
    if (forceLocal || !navigator.onLine) {
        updateSyncStatusUI(navigator.onLine ? 'failed' : 'offline');
        return;
    }

    try {
        updateSyncStatusUI('syncing');
        const data = await loadDataFromCloud();
        
        if (data && data.subscribers && Array.isArray(data.subscribers)) {
            const cloudSubscribers = data.subscribers.map(s => migrateSubscriber(s)).filter(s => s !== null);
            
            const localLatest = subscribers.reduce((max, s) => {
                const date = new Date(s.updatedAt || 0);
                return date > max ? date : max;
            }, new Date(0));
            
            const cloudLatest = cloudSubscribers.reduce((max, s) => {
                const date = new Date(s.updatedAt || 0);
                return date > max ? date : max;
            }, new Date(0));
            
            if (cloudLatest > localLatest || subscribers.length === 0) {
                subscribers = cloudSubscribers;
                monthlyPayments = data.monthlyPayments || {};
                paymentDates = data.paymentDates || {};
                breadOverrides = data.breadOverrides || {};
                
                if (data.users && Array.isArray(data.users) && data.users.length) {
                    usersList = data.users;
                    saveUsersToLocal();
                }
                
                if (data.systemNotes) systemNotes = data.systemNotes;
                if (data.activityLog) {
                    activityLog = data.activityLog;
                    saveActivityLogToLocal();
                }
                
                saveLocalData();
                renderAll();
                showToast(`✅ تم تحديث البيانات من السحابة`);
            }
            
            updateSyncStatusUI('success');
        } else {
            throw new Error('بيانات غير صالحة');
        }
    } catch (e) {
        console.warn('فشل التحميل من السحابة:', e);
        updateSyncStatusUI('failed');
        showToast(`⚠️ فشل الاتصال بالسحابة، عرض البيانات المحلية`, true);
    }
}

// ⭐ مزامنة يدوية محسنة
async function manualSync() {
    if (!navigator.onLine) {
        showToast('❌ لا يوجد اتصال بالإنترنت', true);
        return false;
    }
    
    showToast('⏳ جاري المزامنة الفورية...');
    updateSyncStatusUI('syncing');
    
    try {
        await saveDataToCloud();
        console.log('✅ تم حفظ البيانات محلياً -> سحابة');
        
        const newData = await loadDataFromCloud();
        
        if (newData && newData.subscribers) {
            let changesCount = 0;
            
            for (const cloudSub of newData.subscribers) {
                const localSub = subscribers.find(s => s.id === cloudSub.id);
                if (!localSub) {
                    subscribers.push(cloudSub);
                    changesCount++;
                } else if (new Date(cloudSub.updatedAt) > new Date(localSub.updatedAt)) {
                    const index = subscribers.findIndex(s => s.id === cloudSub.id);
                    subscribers[index] = cloudSub;
                    changesCount++;
                }
            }
            
            monthlyPayments = { ...monthlyPayments, ...(newData.monthlyPayments || {}) };
            paymentDates = { ...paymentDates, ...(newData.paymentDates || {}) };
            breadOverrides = { ...breadOverrides, ...(newData.breadOverrides || {}) };
            
            if (newData.users && Array.isArray(newData.users) && newData.users.length) {
                usersList = newData.users;
                saveUsersToLocal();
            }
            
            if (newData.systemNotes) systemNotes = newData.systemNotes;
            if (newData.activityLog) {
                activityLog = newData.activityLog;
                saveActivityLogToLocal();
            }
            
            saveLocalData();
            renderAll();
            
            if (changesCount > 0) {
                showToast(`✅ تمت المزامنة بنجاح (${changesCount} تغيير)`);
            } else {
                showToast('✅ تمت المزامنة - لا توجد تغييرات جديدة');
            }
            
            updateSyncStatusUI('success');
            return true;
        }
        
        updateSyncStatusUI('success');
        showToast('✅ تمت المزامنة بنجاح');
        return true;
    } catch (e) {
        updateSyncStatusUI('failed');
        showToast(`❌ فشلت المزامنة: ${e.message}`, true);
        return false;
    }
}

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
