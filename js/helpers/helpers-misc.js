// ========== helpers-misc.js - دوال متنوعة ==========

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

function showExternalNotification(title, body) {
    // تم تعطيل الإشعارات المحلية واستبدالها بـ Web Push Notifications
}

async function sendTelegramNotification(message) {
    // تم تعطيل إشعارات تيليجرام واستبدالها بـ Web Push Notifications
}

async function requestPushNotification(title, body) {
    try {
        const formData = new FormData();
        formData.append('action', 'sendPush');
        formData.append('data', JSON.stringify({ title, body }));

        await fetch(API_URL, {
            method: 'POST',
            body: formData,
            mode: 'no-cors'
        });
    } catch (e) {
        console.error('فشل طلب الإشعار عبر الخادم:', e);
    }
}
