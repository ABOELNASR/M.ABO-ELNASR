// ========== helpers-misc.js - دوال متنوعة ==========

// ========== دوال الملاحظات والتحقق ==========

async function askForNote(actionName) {
    return new Promise((resolve) => {
        const note = prompt(`✏️ ${actionName}\nالرجاء كتابة ملاحظة لهذا الإجراء:`);
        resolve(note || 'بدون ملاحظة');
    });
}

function isValidCard(card) {
    return card 
        && typeof card.cardName === 'string' 
        && card.cardName.trim() !== ''
        && !isNaN(parseInt(card.individuals))
        && parseInt(card.individuals) > 0;
}

function logDeletedCard(cardName, individuals, subscriberName, reason) {
    if (!deletedCardsLog) deletedCardsLog = [];
    deletedCardsLog.push({
        cardName: cardName,
        individuals: individuals,
        subscriberName: subscriberName,
        reason: reason,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_DELETED_CARDS_LOG, JSON.stringify(deletedCardsLog));
}

// ========== دوال الإشعارات ==========

// إشعار داخلي مع رمز الجرس
function showBellNotification(title, body) {
    // تلوين العلامات
    let coloredBody = String(body || '')
        .replace(/✓/g, '<span class="bell-mark-green">✓</span>')
        .replace(/✗/g, '<span class="bell-mark-red">✗</span>')
        .replace(/✅/g, '<span class="bell-mark-green">✅</span>')
        .replace(/❌/g, '<span class="bell-mark-red">❌</span>')
        .replace(/تم/g, '<span class="bell-mark-green">تم</span>');

    const notif = document.createElement('div');
    notif.className = 'bell-notification';
    notif.innerHTML = `
        <span class="bell-icon">🔔</span>
        <div class="bell-content">
            <span class="bell-title">${escapeHtml(title) || 'المخبز'}</span>
            <span class="bell-body">${coloredBody}</span>
        </div>
    `;
    document.body.appendChild(notif);
    
    setTimeout(() => notif.classList.add('show'), 100);
    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 300);
    }, 4000);
}

// ⭐ ========== مجموعة الإشعارات المجمعة ==========
const MAX_NOTIFICATIONS = 5;

// ⭐ دالة إضافة إشعار للمجموعة
function addToNotificationGroup(body) {
    let notifications = [];
    try {
        const stored = localStorage.getItem('pending_notifications');
        if (stored) {
            notifications = JSON.parse(stored);
        }
    } catch(e) {
        notifications = [];
    }
    
    // إزالة العلامات الخاصة عشان النص يبقى نضيف
    let cleanBody = String(body || '')
        .replace(/<[^>]*>/g, '')
        .replace(/✓/g, '')
        .replace(/✗/g, '')
        .replace(/✅/g, '')
        .replace(/❌/g, '')
        .trim();
    
    notifications.unshift(cleanBody);
    
    // ⭐ نحتفظ بآخر 5 إشعارات فقط
    if (notifications.length > MAX_NOTIFICATIONS) {
        notifications = notifications.slice(0, MAX_NOTIFICATIONS);
    }
    
    localStorage.setItem('pending_notifications', JSON.stringify(notifications));
}

// ⭐ دالة الحصول على الإشعارات المجمعة
function getGroupedNotifications() {
    let notifications = [];
    try {
        const stored = localStorage.getItem('pending_notifications');
        if (stored) {
            notifications = JSON.parse(stored);
        }
    } catch(e) {
        notifications = [];
    }
    
    if (notifications.length === 0) return '';
    
    return notifications.join('\n');
}

// ⭐ دالة مسح الإشعارات المجمعة
function clearNotificationGroup() {
    localStorage.removeItem('pending_notifications');
}

// ⭐ طلب إرسال إشعار (للخادم)
async function requestPushNotification(title, body) {
    console.log('📤 طلب إرسال إشعار:', title);
    
    // ⭐ إضافة الإشعار لقائمة الإشعارات المجمعة
    addToNotificationGroup(body);
    
    // عرض الإشعار الداخلي فوراً (جرس)
    showBellNotification(title, body);
    
    // ⭐ إرسال الإشعار المجمّع للخادم
    try {
        const formData = new FormData();
        formData.append('action', 'sendPush');
        formData.append('data', JSON.stringify({ 
            title: title || 'المخبز', 
            body: getGroupedNotifications() 
        }));

        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });
        
        try {
            const result = await response.json();
            console.log('📬 استجابة الخادم للإشعار:', result);
        } catch(e) {
            console.log('تم إرسال الإشعار (استجابة غير JSON)');
        }
    } catch (e) {
        console.error('فشل طلب الإشعار عبر الخادم:', e);
    }
}

// ========== دوال اختبار الاتصال ==========

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
        const response = await fetch(`${API_URL}?action=load&t=${Date.now()}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        showToast(`✅ الاتصال بالسحابة ناجح. عدد المشتركين: ${data.subscribers?.length || 0}`);
    } catch (err) {
        showToast(`❌ فشل الاتصال: ${err.message}`, true);
    }
}

// ========== دوال إضافية ==========

// دالة لتنظيف البيانات القديمة (اختياري)
async function cleanupOldData() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // تنظيف سجل العمليات القديم
    if (activityLog && activityLog.length > 100) {
        activityLog = activityLog.slice(0, 100);
        saveActivityLogToLocal();
    }
    
    // تنظيف تجاوزات الحصة القديمة (أكثر من 3 أشهر)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    for (const subId in breadOverrides) {
        for (const key in breadOverrides[subId]) {
            const [year, month] = key.split('-');
            const overrideDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            if (overrideDate < threeMonthsAgo) {
                delete breadOverrides[subId][key];
            }
        }
        if (Object.keys(breadOverrides[subId]).length === 0) {
            delete breadOverrides[subId];
        }
    }
    
    await saveData();
    console.log('🧹 تم تنظيف البيانات القديمة');
}

// ⭐ مسح الإشعارات المجمعة عند فتح التطبيق
document.addEventListener('DOMContentLoaded', function() {
    clearNotificationGroup();
});

// تسجيل تحميل الملف
console.log('✅ helpers-misc.js loaded');
