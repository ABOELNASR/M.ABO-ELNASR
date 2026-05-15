// ========== users.js - إدارة المستخدمين والصلاحيات ==========

// ========== تهيئة وتحميل المستخدمين ==========

/**
 * تهيئة قائمة المستخدمين من LocalStorage أو إنشاء الافتراضية
 */
function initUsers() {
    const localUsers = localStorage.getItem(STORAGE_USERS);
    if (localUsers) {
        try {
            usersList = JSON.parse(localUsers);
        } catch (e) {
            console.error('خطأ في قراءة بيانات المستخدمين:', e);
            usersList = JSON.parse(JSON.stringify(DEFAULT_USERS));
        }
    } else {
        usersList = JSON.parse(JSON.stringify(DEFAULT_USERS));
    }
}

/**
 * حفظ قائمة المستخدمين في LocalStorage
 */
function saveUsersToLocal() {
    try {
        localStorage.setItem(STORAGE_USERS, JSON.stringify(usersList));
    } catch (e) {
        console.error('خطأ في حفظ المستخدمين:', e);
        if (e.name === 'QuotaExceededError') {
            if (typeof showToast === 'function') {
                showToast('⚠️ سعة التخزين المحلي ممتلئة', true);
            }
        }
    }
}

/**
 * تحميل المستخدمين من السحابة (Google Apps Script)
 */
async function loadUsersFromCloud() {
    if (window.location.protocol === 'file:') return;
    if (!navigator.onLine) return;
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const res = await fetch(`${API_URL}?action=load&t=${Date.now()}`, {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        
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
            console.log('✅ تم تحميل المستخدمين من السحابة');
        }
    } catch (e) {
        if (e.name === 'AbortError') {
            console.warn('⚠️ انتهى وقت الانتظار لتحميل المستخدمين');
        } else {
            console.warn('لم يتم تحميل المستخدمين من السحابة:', e.message);
        }
    }
}

// ========== المصادقة والجلسات ==========

/**
 * تسجيل دخول المستخدم
 * @param {string} username - اسم المستخدم
 * @param {string} password - كلمة المرور
 * @param {boolean} remember - تذكر الجلسة
 * @returns {boolean} نجاح أو فشل
 */
function login(username, password, remember) {
    const user = usersList.find(u => u.username === username && u.password === password);
    if (user) {
        currentUser = {
            username: user.username,
            role: user.role,
            email: user.email || ''
        };
        const sessionData = JSON.stringify(currentUser);
        if (remember) {
            localStorage.setItem(STORAGE_SESSION, sessionData);
        } else {
            sessionStorage.setItem(STORAGE_SESSION, sessionData);
        }
        
        if (typeof addActivityLog === 'function') {
            addActivityLog('تسجيل دخول', `${username} قام بتسجيل الدخول`);
        }
        
        return true;
    }
    
    console.warn(`محاولة تسجيل دخول فاشلة: ${username}`);
    return false;
}

/**
 * تسجيل الخروج
 */
function logout() {
    const username = currentUser ? currentUser.username : 'unknown';
    currentUser = null;
    localStorage.removeItem(STORAGE_SESSION);
    sessionStorage.removeItem(STORAGE_SESSION);
    
    if (typeof addActivityLog === 'function') {
        addActivityLog('تسجيل خروج', `${username} قام بتسجيل الخروج`);
    }
    
    if (typeof showLoginScreen === 'function') {
        showLoginScreen();
    }
    
    // إخفاء واجهة التطبيق
    const appContainer = document.getElementById('appContainer');
    if (appContainer) appContainer.style.display = 'none';
}

/**
 * التحقق من وجود جلسة نشطة
 * @returns {boolean} وجود جلسة
 */
function checkSession() {
    const saved = localStorage.getItem(STORAGE_SESSION) || sessionStorage.getItem(STORAGE_SESSION);
    if (saved) {
        try {
            currentUser = JSON.parse(saved);
            return true;
        } catch (e) {
            console.error('خطأ في قراءة الجلسة:', e);
            return false;
        }
    }
    return false;
}

// ========== دوال الصلاحيات ==========

/**
 * هل يملك صلاحية إضافة أو تعديل مشترك؟
 * @returns {boolean}
 */
function hasAddEditSubscriber() {
    return currentUser && (currentUser.role === ROLES.ADMIN || currentUser.role === ROLES.WRITE);
}

/**
 * هل يملك صلاحية الحذف والتعديل الكامل؟
 * @returns {boolean}
 */
function hasFullEditDelete() {
    return currentUser && (currentUser.role === ROLES.ADMIN || currentUser.role === ROLES.WRITE);
}

/**
 * هل يملك صلاحية إجراء المدفوعات وتعديل الحصة؟
 * @returns {boolean}
 */
function hasPaymentActions() {
    return currentUser && (currentUser.role === ROLES.ADMIN || currentUser.role === ROLES.WRITE);
}

/**
 * هل هو مدير النظام؟
 * @returns {boolean}
 */
function isAdmin() {
    return currentUser && currentUser.role === ROLES.ADMIN;
}

/**
 * هل هو وضع قراءة فقط؟
 * @returns {boolean}
 */
function isReadOnly() {
    return currentUser && currentUser.role === ROLES.READ;
}

// ========== دوال مساعدة للمستخدمين ==========

/**
 * الحصول على اسم الصلاحية بالعربية
 * @param {string} role - رمز الصلاحية
 * @returns {string} الاسم العربي
 */
function getRoleNameArabic(role) {
    switch (role) {
        case ROLES.ADMIN:
            return 'مدير';
        case ROLES.WRITE:
            return 'كتابة';
        case ROLES.READ:
            return 'قراءة فقط';
        default:
            return 'غير معروف';
    }
}

/**
 * التحقق من صحة بيانات مستخدم جديد
 * @param {Object} user - بيانات المستخدم
 * @returns {Object} نتيجة التحقق { valid, errors }
 */
function validateUser(user) {
    const errors = [];
    
    if (!user.username || user.username.trim() === '') {
        errors.push('اسم المستخدم مطلوب');
    } else if (user.username.length < 3) {
        errors.push('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
    }
    
    if (!user.password || user.password === '') {
        errors.push('كلمة المرور مطلوبة');
    } else if (user.password.length < 6) {
        errors.push('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    }
    
    if (user.email && !user.email.includes('@')) {
        errors.push('البريد الإلكتروني غير صالح');
    }
    
    if (!user.role || ![ROLES.ADMIN, ROLES.WRITE, ROLES.READ].includes(user.role)) {
        errors.push('الصلاحية غير صالحة');
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

/**
 * البحث عن مستخدم
 * @param {string} username - اسم المستخدم (اختياري)
 * @returns {Array} قائمة المستخدمين المطابقين
 */
function findUsers(username = '') {
    if (!username) return [...usersList];
    const term = username.toLowerCase();
    return usersList.filter(u => u.username.toLowerCase().includes(term));
}

/**
 * تحديث بيانات المستخدم الحالي
 */
function refreshCurrentUser() {
    if (!currentUser) return;
    const updated = usersList.find(u => u.username === currentUser.username);
    if (updated) {
        currentUser = {
            username: updated.username,
            role: updated.role,
            email: updated.email || ''
        };
        // تحديث الجلسة المخزنة
        if (localStorage.getItem(STORAGE_SESSION)) {
            localStorage.setItem(STORAGE_SESSION, JSON.stringify(currentUser));
        }
        if (sessionStorage.getItem(STORAGE_SESSION)) {
            sessionStorage.setItem(STORAGE_SESSION, JSON.stringify(currentUser));
        }
    }
}

/**
 * تغيير كلمة مرور المستخدم الحالي
 * @param {string} oldPassword - كلمة المرور القديمة
 * @param {string} newPassword - كلمة المرور الجديدة
 * @returns {boolean} نجاح أو فشل
 */
function changePassword(oldPassword, newPassword) {
    if (!currentUser) {
        if (typeof showToast === 'function') showToast('❌ يجب تسجيل الدخول أولاً', true);
        return false;
    }
    
    const userIndex = usersList.findIndex(u => u.username === currentUser.username);
    if (userIndex === -1) {
        if (typeof showToast === 'function') showToast('❌ المستخدم غير موجود', true);
        return false;
    }
    
    if (usersList[userIndex].password !== oldPassword) {
        if (typeof showToast === 'function') showToast('❌ كلمة المرور القديمة غير صحيحة', true);
        return false;
    }
    
    if (newPassword.length < 6) {
        if (typeof showToast === 'function') showToast('❌ كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل', true);
        return false;
    }
    
    usersList[userIndex].password = newPassword;
    usersList[userIndex].updatedAt = new Date().toISOString();
    saveUsersToLocal();
    saveData();
    
    if (typeof addActivityLog === 'function') {
        addActivityLog('تغيير كلمة مرور', `${currentUser.username} قام بتغيير كلمة المرور`);
    }
    
    if (typeof showToast === 'function') showToast('✅ تم تغيير كلمة المرور بنجاح');
    return true;
}

// تصدير الدوال للنطاق العام
if (typeof window !== 'undefined') {
    window.initUsers = initUsers;
    window.saveUsersToLocal = saveUsersToLocal;
    window.loadUsersFromCloud = loadUsersFromCloud;
    window.login = login;
    window.logout = logout;
    window.checkSession = checkSession;
    window.hasAddEditSubscriber = hasAddEditSubscriber;
    window.hasFullEditDelete = hasFullEditDelete;
    window.hasPaymentActions = hasPaymentActions;
    window.isAdmin = isAdmin;
    window.isReadOnly = isReadOnly;
    window.getRoleNameArabic = getRoleNameArabic;
    window.validateUser = validateUser;
    window.findUsers = findUsers;
    window.refreshCurrentUser = refreshCurrentUser;
    window.changePassword = changePassword;
}

console.log('✅ users.js loaded');
