// ========== helpers-ui.js - دوال واجهة المستخدم والإشعارات ==========

// ========== إشعارات Toast ==========

/**
 * عرض إشعار منبثق (Toast)
 * @param {string} msg - نص الرسالة
 * @param {boolean} isError - هل هو خطأ (يغير لون الحدود)
 * @param {number} duration - مدة ظهور الإشعار بالمللي ثانية
 */
function showToast(msg, isError = false, duration = 4000) {
    // إزالة أي توست موجود مسبقاً لتجنب التراكم
    const existingToasts = document.querySelectorAll('.toast-notification');
    existingToasts.forEach(t => t.remove());
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.borderRightColor = isError ? 'var(--danger)' : 'var(--btn-light-green)';
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.top = 'auto';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.zIndex = '3000';
    toast.style.maxWidth = '90%';
    toast.style.minWidth = '200px';
    toast.style.textAlign = 'center';
    toast.style.padding = '10px 16px';
    toast.style.borderRadius = '30px';
    toast.style.fontSize = '0.8rem';
    toast.style.fontWeight = '500';
    toast.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
    toast.style.backdropFilter = 'blur(8px)';
    toast.style.backgroundColor = 'var(--card-bg)';
    toast.style.color = 'var(--text-primary)';
    toast.innerText = msg;
    
    document.body.appendChild(toast);
    
    // إضافة تأثير دخول سلس
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(() => {
        toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);
    
    // إخفاء وإزالة بعد المدة المحددة
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 300);
    }, duration);
}

/**
 * عرض إشعار خطأ قصير
 * @param {string} msg - نص الخطأ
 */
function showErrorToast(msg) {
    showToast(msg, true, 3000);
}

/**
 * عرض إشعار نجاح قصير
 * @param {string} msg - نص النجاح
 */
function showSuccessToast(msg) {
    showToast(msg, false, 2500);
}

/**
 * عرض إشعار تحميل (يظهر حتى يتم إخفاؤه)
 * @param {string} msg - نص رسالة التحميل
 * @returns {HTMLElement} عنصر الإشعار لإخفائه لاحقاً
 */
function showLoadingToast(msg = '⏳ جاري التحميل...') {
    // إزالة أي toast تحميل موجود
    const existingLoading = document.querySelector('.toast-loading');
    if (existingLoading) existingLoading.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification toast-loading';
    toast.style.borderRightColor = 'var(--btn-info)';
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.top = 'auto';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.zIndex = '3000';
    toast.style.backgroundColor = 'var(--card-bg)';
    toast.innerHTML = `<span class="loading-spinner" style="width:16px;height:16px;display:inline-block;margin-left:8px;"></span> ${msg}`;
    
    document.body.appendChild(toast);
    return toast;
}

/**
 * إخفاء إشعار التحميل
 * @param {HTMLElement} toast - عنصر الإشعار المراد إخفاؤه
 */
function hideLoadingToast(toast) {
    if (toast && toast.parentNode) {
        toast.remove();
    }
}

// ========== التحكم في تمرير الصفحة ==========

/**
 * تعطيل تمرير الصفحة (عند فتح نافذة منبثقة)
 */
function disableBodyScroll() {
    document.body.classList.add('modal-open');
    // حفظ موضع التمرير الحالي
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.dataset.scrollPosition = scrollY;
}

/**
 * إعادة تمكين تمرير الصفحة (عند إغلاق النافذة المنبثقة)
 */
function enableBodyScroll() {
    const scrollY = document.body.dataset.scrollPosition;
    document.body.classList.remove('modal-open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    if (scrollY) {
        window.scrollTo(0, parseInt(scrollY));
        delete document.body.dataset.scrollPosition;
    }
}

/**
 * التمرير السلس إلى أعلى الصفحة
 */
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/**
 * التمرير السلس إلى عنصر محدد
 * @param {string} elementId - معرف العنصر
 */
function scrollToElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// ========== تحميل الشاشة (Splash Screen) ==========

/**
 * إخفاء شاشة التحميل
 * @param {number} delay - التأخير قبل الإخفاء بالمللي ثانية
 */
function hideSplashScreen(delay = 500) {
    const splashScreen = document.getElementById('splashScreen');
    if (splashScreen) {
        setTimeout(() => {
            splashScreen.classList.add('hidden');
            setTimeout(() => {
                if (splashScreen.parentNode) splashScreen.remove();
            }, 500);
        }, delay);
    }
}

/**
 * عرض شاشة التحميل
 * @param {string} message - رسالة التحميل
 */
function showSplashScreen(message = 'جاري التحميل...') {
    let splashScreen = document.getElementById('splashScreen');
    if (!splashScreen) {
        splashScreen = document.createElement('div');
        splashScreen.className = 'splash-screen';
        splashScreen.id = 'splashScreen';
        splashScreen.innerHTML = `
            <div class="splash-spinner-wrapper">
                <img src="icons/launchericon-192x192.png" alt="Logo" class="splash-img">
                <div class="splash-spinner"></div>
            </div>
            <div class="splash-text">${message}</div>
            <div class="splash-subtext">يرجى الانتظار</div>
        `;
        document.body.appendChild(splashScreen);
    } else {
        const textEl = splashScreen.querySelector('.splash-text');
        if (textEl) textEl.innerText = message;
        splashScreen.classList.remove('hidden');
    }
}

// ========== أدوات متنوعة لواجهة المستخدم ==========

/**
 * تحديث حالة اتصال الإنترنت في الواجهة
 * @param {boolean} isOnline - حالة الاتصال
 */
function updateOnlineStatus(isOnline) {
    const syncStatus = document.getElementById('syncStatus');
    if (syncStatus) {
        if (isOnline) {
            syncStatus.innerHTML = '🟢 متصل';
            syncStatus.style.color = '#4caf50';
        } else {
            syncStatus.innerHTML = '🔴 غير متصل';
            syncStatus.style.color = '#ef5350';
        }
    }
    
    // عرض إشعار عند تغيير حالة الاتصال
    if (!isOnline) {
        showToast('⚠️ فقد الاتصال بالإنترنت، سيتم الحفظ محلياً', true, 3000);
    } else {
        showToast('✅ تم استعادة الاتصال بالإنترنت', false, 2000);
    }
}

/**
 * تأكيد قبل تنفيذ إجراء مهم
 * @param {string} message - رسالة التأكيد
 * @param {Function} onConfirm - دالة يتم تنفيذها عند التأكيد
 * @param {Function} onCancel - دالة يتم تنفيذها عند الإلغاء
 */
function confirmAction(message, onConfirm, onCancel) {
    if (confirm(message)) {
        if (typeof onConfirm === 'function') onConfirm();
    } else {
        if (typeof onCancel === 'function') onCancel();
    }
}

/**
 * نسخ نص إلى الحافظة
 * @param {string} text - النص المراد نسخه
 * @returns {Promise<boolean>} نجاح أو فشل العملية
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showSuccessToast('✅ تم النسخ إلى الحافظة');
        return true;
    } catch (err) {
        console.error('فشل النسخ:', err);
        showErrorToast('❌ فشل النسخ إلى الحافظة');
        return false;
    }
}

// تصدير الدوال للنطاق العام
if (typeof window !== 'undefined') {
    window.showToast = showToast;
    window.showErrorToast = showErrorToast;
    window.showSuccessToast = showSuccessToast;
    window.showLoadingToast = showLoadingToast;
    window.hideLoadingToast = hideLoadingToast;
    window.disableBodyScroll = disableBodyScroll;
    window.enableBodyScroll = enableBodyScroll;
    window.scrollToTop = scrollToTop;
    window.scrollToElement = scrollToElement;
    window.hideSplashScreen = hideSplashScreen;
    window.showSplashScreen = showSplashScreen;
    window.updateOnlineStatus = updateOnlineStatus;
    window.confirmAction = confirmAction;
    window.copyToClipboard = copyToClipboard;
}

console.log('✅ helpers-ui.js loaded');
