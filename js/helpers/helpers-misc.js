// ========== helpers-misc.js - دوال متنوعة ==========

// ========== دوال الملاحظات والتحقق ==========

/**
 * طلب ملاحظة من المستخدم
 * @param {string} actionName - اسم الإجراء
 * @returns {Promise<string>} الملاحظة المدخلة
 */
async function askForNote(actionName) {
    return new Promise((resolve) => {
        const note = prompt(`✏️ ${actionName}\nالرجاء كتابة ملاحظة لهذا الإجراء:`);
        resolve(note || 'بدون ملاحظة');
    });
}

/**
 * التحقق من صحة البطاقة
 * @param {Object} card - كائن البطاقة
 * @returns {boolean} صحة البطاقة
 */
function isValidCard(card) {
    return card 
        && typeof card.cardName === 'string' 
        && card.cardName.trim() !== ''
        && !isNaN(parseInt(card.individuals))
        && parseInt(card.individuals) > 0;
}

/**
 * تسجيل بطاقة محذوفة في السجل
 * @param {string} cardName - اسم البطاقة
 * @param {number} individuals - عدد الأفراد
 * @param {string} subscriberName - اسم المشترك
 * @param {string} reason - سبب الحذف
 */
function logDeletedCard(cardName, individuals, subscriberName, reason) {
    try {
        if (!deletedCardsLog) deletedCardsLog = [];
        deletedCardsLog.push({
            cardName: cardName,
            individuals: individuals,
            subscriberName: subscriberName,
            reason: reason,
            timestamp: new Date().toISOString()
        });
        // الاحتفاظ بآخر 1000 سجل فقط
        if (deletedCardsLog.length > 1000) {
            deletedCardsLog = deletedCardsLog.slice(-1000);
        }
        localStorage.setItem(STORAGE_DELETED_CARDS_LOG, JSON.stringify(deletedCardsLog));
    } catch (e) {
        console.error('خطأ في تسجيل البطاقة المحذوفة:', e);
    }
}

/**
 * الحصول على سجل البطاقات المحذوفة
 * @returns {Array} قائمة البطاقات المحذوفة
 */
function getDeletedCardsLog() {
    try {
        const stored = localStorage.getItem(STORAGE_DELETED_CARDS_LOG);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('خطأ في قراءة سجل البطاقات المحذوفة:', e);
    }
    return [];
}

/**
 * مسح سجل البطاقات المحذوفة
 */
function clearDeletedCardsLog() {
    deletedCardsLog = [];
    localStorage.removeItem(STORAGE_DELETED_CARDS_LOG);
    if (typeof showToast === 'function') {
        showToast('✅ تم مسح سجل البطاقات المحذوفة');
    }
}

// ========== دوال الإشعارات ==========

/**
 * إشعار داخلي مع رمز الجرس
 * @param {string} title - عنوان الإشعار
 * @param {string} body - نص الإشعار
 */
function showBellNotification(title, body) {
    // تلوين العلامات
    let coloredBody = String(body || '')
        .replace(/✓/g, '<span class="bell-mark-green">✓</span>')
        .replace(/✗/g, '<span class="bell-mark-red">✗</span>')
        .replace(/✅/g, '<span class="bell-mark-green">✅</span>')
        .replace(/❌/g, '<span class="bell-mark-red">❌</span>')
        .replace(/تم/g, '<span class="bell-mark-green">تم</span>')
        .replace(/نجاح/g, '<span class="bell-mark-green">نجاح</span>')
        .replace(/فشل/g, '<span class="bell-mark-red">فشل</span>');

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

/**
 * طلب إرسال إشعار (للخادم)
 * @param {string} title - عنوان الإشعار
 * @param {string} body - نص الإشعار
 */
async function requestPushNotification(title, body) {
    console.log('📤 طلب إرسال إشعار:', title);
    
    // عرض الإشعار الداخلي فوراً
    if (typeof showBellNotification === 'function') {
        showBellNotification(title, body);
    }
    
    // التحقق من الاتصال قبل الإرسال للخادم
    if (!navigator.onLine) {
        console.log('📱 غير متصل، تم حفظ الإشعار محلياً فقط');
        return;
    }
    
    if (window.location.protocol === 'file:') {
        console.log('⚠️ تشغيل محلي، تم عرض الإشعار داخلياً فقط');
        return;
    }
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'sendPush',
                data: { title: title || 'المخبز', body: body }
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            console.log('✅ تم إرسال الإشعار بنجاح');
        } else {
            console.log('⚠️ فشل إرسال الإشعار:', response.status);
        }
    } catch (e) {
        if (e.name === 'AbortError') {
            console.log('⏰ انتهى وقت الانتظار لإرسال الإشعار');
        } else {
            console.error('فشل طلب الإشعار:', e);
        }
    }
}

// ========== دوال اختبار الاتصال ==========

/**
 * اختبار الاتصال بالسحابة
 */
async function testConnection() {
    if (!navigator.onLine) {
        if (typeof showToast === 'function') {
            showToast('❌ لا يوجد اتصال بالإنترنت', true);
        }
        return;
    }
    
    if (window.location.protocol === 'file:') {
        if (typeof showToast === 'function') {
            showToast('❌ لا يمكن الاتصال بالسحابة من ملف محلي.', true);
        }
        return;
    }
    
    if (typeof showToast === 'function') {
        showToast('⏳ جاري اختبار الاتصال...');
    }
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(`${API_URL}?action=load&t=${Date.now()}`, {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        if (typeof showToast === 'function') {
            showToast(`✅ الاتصال بالسحابة ناجح. عدد المشتركين: ${data.subscribers?.length || 0}`);
        }
    } catch (err) {
        if (err.name === 'AbortError') {
            if (typeof showToast === 'function') {
                showToast(`❌ انتهى وقت الانتظار للاتصال`, true);
            }
        } else {
            if (typeof showToast === 'function') {
                showToast(`❌ فشل الاتصال: ${err.message}`, true);
            }
        }
    }
}

// ========== دوال تنظيف البيانات ==========

/**
 * تنظيف البيانات القديمة
 */
async function cleanupOldData() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // تنظيف سجل العمليات القديم
    if (activityLog && activityLog.length > 100) {
        activityLog = activityLog.slice(0, 100);
        if (typeof saveActivityLogToLocal === 'function') {
            saveActivityLogToLocal();
        }
        console.log('🧹 تم تنظيف سجل العمليات');
    }
    
    // تنظيف تجاوزات الحصة القديمة (أكثر من 3 أشهر)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    let cleanedCount = 0;
    for (const subId in breadOverrides) {
        for (const key in breadOverrides[subId]) {
            const [year, month] = key.split('-');
            const overrideDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            if (overrideDate < threeMonthsAgo) {
                delete breadOverrides[subId][key];
                cleanedCount++;
            }
        }
        if (Object.keys(breadOverrides[subId]).length === 0) {
            delete breadOverrides[subId];
        }
    }
    
    if (cleanedCount > 0) {
        console.log(`🧹 تم تنظيف ${cleanedCount} تجاوزات حصة قديمة`);
    }
    
    if (typeof saveData === 'function') {
        await saveData();
    }
    
    if (typeof showToast === 'function') {
        showToast('✅ تم تنظيف البيانات القديمة');
    }
}

/**
 * تصدير البيانات كملف JSON (نسخة احتياطية يدوية)
 */
function exportBackup() {
    const backupData = {
        version: APP_VERSION,
        timestamp: new Date().toISOString(),
        subscribers: subscribers,
        monthlyPayments: monthlyPayments,
        paymentDates: paymentDates,
        breadOverrides: breadOverrides,
        users: usersList,
        systemNotes: systemNotes,
        activityLog: activityLog,
        deletedCardsLog: deletedCardsLog
    };
    
    const dataStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bakery_full_backup_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    if (typeof addActivityLog === 'function') {
        addActivityLog('نسخ احتياطي', 'تم تصدير نسخة احتياطية كاملة');
    }
    
    if (typeof showToast === 'function') {
        showToast('✅ تم تصدير النسخة الاحتياطية');
    }
}

// تصدير الدوال للنطاق العام
if (typeof window !== 'undefined') {
    window.askForNote = askForNote;
    window.isValidCard = isValidCard;
    window.logDeletedCard = logDeletedCard;
    window.getDeletedCardsLog = getDeletedCardsLog;
    window.clearDeletedCardsLog = clearDeletedCardsLog;
    window.showBellNotification = showBellNotification;
    window.requestPushNotification = requestPushNotification;
    window.testConnection = testConnection;
    window.cleanupOldData = cleanupOldData;
    window.exportBackup = exportBackup;
}

console.log('✅ helpers-misc.js loaded');
