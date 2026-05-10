// ========== helpers.js - الدوال المساعدة العامة (مع دعم Web Push Notifications وسجل البطاقات المحذوفة) ==========

// ========== دوال واجهة المستخدم والإشعارات ==========

function showToast(msg, isError = false) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.borderRightColor = isError ? 'var(--danger)' : 'var(--btn-light-green)';
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function disableBodyScroll() {
    document.body.classList.add('modal-open');
}

function enableBodyScroll() {
    document.body.classList.remove('modal-open');
}

// ========== دوال النصوص والأرقام ==========

function escapeHtml(s) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(s).replace(/[&<>"']/g, m => map[m]);
}

function arabicToEnglishNumber(str) {
    const map = {
        '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
        '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
    };
    return String(str).replace(/[٠-٩]/g, m => map[m]);
}

function formatDateArabic(date) {
    const d = new Date(date);
    if (isNaN(d)) return '';
    const months = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTimeArabic(date) {
    const d = new Date(date);
    if (isNaN(d)) return '';
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'م' : 'ص';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
}

function formatDateTimeArabic(date) {
    const d = new Date(date);
    if (isNaN(d)) return '';
    return `${formatDateArabic(d)} ${formatTimeArabic(d)}`;
}

// ========== دوال التاريخ والوقت ==========

function getDays(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function getKey(year, month) {
    return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function getMonthName(month) {
    const months = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return months[month];
}

// ========== دوال العمليات الحسابية ==========

function getTotalIndividuals(sub) {
    if (sub.cardsList && sub.cardsList.length) {
        return sub.cardsList.reduce((sum, card) => sum + (parseInt(card.individuals) || 0), 0);
    }
    return sub.individuals || 0;
}

function getDailyBreadForCard(card) {
    if (card.dailyBreadOverride !== null && card.dailyBreadOverride !== undefined) {
        return card.dailyBreadOverride;
    }
    return (card.individuals || 0) * DEFAULT_DAILY_BREAD_PER_PERSON;
}

function getDefaultDailyBreadForCard(card) {
    return (card.individuals || 0) * DEFAULT_DAILY_BREAD_PER_PERSON;
}

function getDailyBread(sub) {
    if (!sub.cardsList || sub.cardsList.length === 0) return 0;
    return sub.cardsList.reduce((sum, card) => sum + getDailyBreadForCard(card), 0);
}

function getDefaultDailyBread(sub) {
    if (!sub.cardsList || sub.cardsList.length === 0) return 0;
    return sub.cardsList.reduce((sum, card) => sum + getDefaultDailyBreadForCard(card), 0);
}

function getBreadDifference(sub) {
    const defaultBread = getDefaultDailyBread(sub);
    const actualBread = getDailyBread(sub);
    return defaultBread - actualBread;
}

function subValue(sub) {
    const days = getDays(currentYear, currentMonth);
    const modifiedValue = getDailyBread(sub) * days * BREAD_PRICE_PER_LOAF;
    const breadDiff = getBreadDifference(sub);
    const credit = breadDiff * days * CREDIT_PRICE_PER_LOAF;
    return modifiedValue - credit;
}

function getCreditAmount(sub) {
    const days = getDays(currentYear, currentMonth);
    const breadDiff = getBreadDifference(sub);
    return Math.max(0, breadDiff * days * CREDIT_PRICE_PER_LOAF);
}

function getPaid(subId) {
    const key = getKey(currentYear, currentMonth);
    return monthlyPayments[subId]?.[key] || 0;
}

function getRemaining(subId) {
    const sub = subscribers.find(s => s.id == subId);
    return sub ? subValue(sub) - getPaid(subId) : 0;
}

function isFullyPaid(subId) {
    return getRemaining(subId) <= 0;
}

function hasCreditBalance(subId) {
    return getRemaining(subId) < 0;
}

// ========== دوال التحقق من التكرار ==========

function isDuplicateSubscriberName(name, excludeId = null) {
    const normalized = name.trim().toLowerCase();
    return subscribers.some(s => s.id !== excludeId && s.name.trim().toLowerCase() === normalized);
}

function isDuplicateCardNameGlobal(cardName, excludeSubscriberId = null) {
    if (!cardName || cardName.trim() === '') return false;
    const normalized = cardName.trim().toLowerCase();
    for (const sub of subscribers) {
        if (excludeSubscriberId !== null && sub.id === excludeSubscriberId) continue;
        if (sub.cardsList && sub.cardsList.length) {
            if (sub.cardsList.some(card => card.cardName && card.cardName.trim().toLowerCase() === normalized)) {
                return true;
            }
        }
    }
    return false;
}

function isDuplicateCardInTemp(cardName, currentIndex = -1) {
    if (!cardName || cardName.trim() === '') return false;
    const normalized = cardName.trim().toLowerCase();
    return tempCardsList.some((card, idx) => 
        idx !== currentIndex && card.cardName && card.cardName.trim().toLowerCase() === normalized
    );
}

// ========== دوال البحث والتصفية ==========

function subscriberMatchesSearch(sub, searchTerm) {
    if (!searchTerm) return true;
    const term = searchTerm.trim();
    
    let targetNumber = null;
    const englishNumber = parseInt(term);
    const arabicNumber = parseInt(arabicToEnglishNumber(term));
    if (!isNaN(englishNumber) && englishNumber.toString() === term) {
        targetNumber = englishNumber;
    } else if (!isNaN(arabicNumber)) {
        targetNumber = arabicNumber;
    }
    
    if (targetNumber !== null) {
        if (sub.cardsList && sub.cardsList.length) {
            return sub.cardsList.some(card => card.individuals === targetNumber);
        }
        return false;
    } else {
        const lowerTerm = term.toLowerCase();
        if (sub.name.toLowerCase().includes(lowerTerm)) return true;
        if (sub.cardsList && sub.cardsList.length) {
            return sub.cardsList.some(card => 
                card.cardName && card.cardName.toLowerCase().includes(lowerTerm)
            );
        }
        return false;
    }
}

function getFilteredCardsCount(searchTerm) {
    if (!searchTerm) {
        return subscribers.reduce((sum, s) => sum + (s.cardsList ? s.cardsList.length : 0), 0);
    }
    
    let count = 0;
    const term = searchTerm.trim();
    let targetNumber = null;
    const englishNumber = parseInt(term);
    const arabicNumber = parseInt(arabicToEnglishNumber(term));
    if (!isNaN(englishNumber) && englishNumber.toString() === term) {
        targetNumber = englishNumber;
    } else if (!isNaN(arabicNumber)) {
        targetNumber = arabicNumber;
    }
    
    if (targetNumber !== null) {
        for (const sub of subscribers) {
            if (sub.cardsList) {
                count += sub.cardsList.filter(card => card.individuals === targetNumber).length;
            }
        }
    } else {
        const lowerTerm = term.toLowerCase();
        for (const sub of subscribers) {
            if (sub.name.toLowerCase().includes(lowerTerm)) {
                count += (sub.cardsList ? sub.cardsList.length : 0);
            } else if (sub.cardsList && sub.cardsList.length) {
                count += sub.cardsList.filter(card => 
                    card.cardName && card.cardName.toLowerCase().includes(lowerTerm)
                ).length;
            }
        }
    }
    return count;
}

// ========== دوال البحث المتقدم ==========

/**
 * فلترة المشتركين حسب البحث المتقدم (التاريخ والمبلغ)
 */
function applyAdvancedFilters(subscriberList) {
    return subscriberList.filter(sub => {
        const total = subValue(sub);
        const paid = getPaid(sub.id);
        const rem = total - paid;
        const createdAt = sub.createdAt ? sub.createdAt.slice(0, 10) : '';
        
        if (advancedSearch.dateFrom && createdAt && createdAt < advancedSearch.dateFrom) return false;
        if (advancedSearch.dateTo && createdAt && createdAt > advancedSearch.dateTo) return false;
        if (advancedSearch.amountMin !== '' && rem < parseFloat(advancedSearch.amountMin)) return false;
        if (advancedSearch.amountMax !== '' && rem > parseFloat(advancedSearch.amountMax)) return false;
        
        return true;
    });
}

/**
 * حفظ معايير البحث في السجل
 */
function saveSearchToHistory(searchCriteria) {
    let history = getSearchHistory();
    history.unshift({
        ...searchCriteria,
        timestamp: new Date().toISOString()
    });
    if (history.length > MAX_SEARCH_HISTORY) history.pop();
    localStorage.setItem(STORAGE_SEARCH_HISTORY, JSON.stringify(history));
}

/**
 * استرجاع سجل البحث
 */
function getSearchHistory() {
    try {
        const stored = localStorage.getItem(STORAGE_SEARCH_HISTORY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
}

/**
 * مسح سجل البحث
 */
function clearSearchHistory() {
    localStorage.removeItem(STORAGE_SEARCH_HISTORY);
}

// ========== دوال متنوعة ==========

async function askForNote(actionName) {
    return new Promise((resolve) => {
        const note = prompt(`✏️ ${actionName}\nالرجاء كتابة ملاحظة لهذا الإجراء:`);
        resolve(note || 'بدون ملاحظة');
    });
}

function updateDuplicateWarnings() {
    const subName = document.getElementById('subName')?.value.trim();
    const subWarning = document.getElementById('subNameWarning');
    if (subWarning) {
        if (subName && isDuplicateSubscriberName(subName, editId)) {
            subWarning.style.display = 'block';
            subWarning.innerText = '⚠️ اسم المشترك موجود بالفعل. الرجاء استخدام اسم آخر.';
        } else {
            subWarning.style.display = 'none';
        }
    }
    
    let duplicateCardMsg = '';
    for (let i = 0; i < tempCardsList.length; i++) {
        const card = tempCardsList[i];
        if (!card.cardName || card.cardName.trim() === '') continue;
        if (isDuplicateCardInTemp(card.cardName, i)) {
            duplicateCardMsg = '⚠️ يوجد بطاقة مكررة بنفس الاسم في القائمة.';
            break;
        }
        if (isDuplicateCardNameGlobal(card.cardName, editId)) {
            duplicateCardMsg = `⚠️ اسم البطاقة "${card.cardName}" موجود بالفعل لدى مشترك آخر.`;
            break;
        }
    }
    const cardWarning = document.getElementById('cardNameWarning');
    if (cardWarning) {
        if (duplicateCardMsg) {
            cardWarning.style.display = 'block';
            cardWarning.innerText = duplicateCardMsg;
        } else {
            cardWarning.style.display = 'none';
        }
    }
}

function updateDateTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'م' : 'ص';
    hours = hours % 12 || 12;
    const timeStr = `${hours}:${minutes}:${seconds} ${ampm}`;
    
    const clockElement = document.getElementById('liveClock');
    if (clockElement) clockElement.innerText = timeStr;
    
    const monthsAr = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    const dateElement = document.getElementById('currentDateDisplay');
    if (dateElement) {
        dateElement.innerText = `${now.getDate()} ${monthsAr[now.getMonth()]} ${now.getFullYear()}`;
    }
}

function isValidCard(card) {
    return card 
        && typeof card.cardName === 'string' 
        && card.cardName.trim() !== ''
        && !isNaN(parseInt(card.individuals))
        && parseInt(card.individuals) > 0;
}

// ========== دالة تنسيق الأرقام بفواصل الآلاف (إنجليزية) ==========
function formatNumber(num, decimals = 2) {
    if (num == null || isNaN(num)) return '0';
    return Number(num).toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

// ========== دالة قياس عرض النص النقي ==========
function getTextWidth(text, font) {
    const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement('canvas'));
    const context = canvas.getContext('2d');
    context.font = font;
    return context.measureText(text).width;
}

// ========== دالة تصغير الخط فقط عند الخروج الفعلي ==========
function fitTextToContainer(element, maxFontSize = 1.3, minFontSize = 0.7) {
    if (!element) return;
    
    const card = element.closest('.stat-card');
    if (!card) return;
    
    const cardStyle = window.getComputedStyle(card);
    const cardWidth = card.clientWidth;
    const padLeft = parseFloat(cardStyle.paddingLeft) || 0;
    const padRight = parseFloat(cardStyle.paddingRight) || 0;
    const availableWidth = cardWidth - padLeft - padRight - 8;
    
    const text = element.textContent.trim();
    if (!text) return;
    
    const fontFamily = window.getComputedStyle(element).fontFamily || 'Cairo, sans-serif';
    let currentSize = maxFontSize;
    element.style.fontSize = currentSize + 'rem';
    
    const checkAndShrink = () => {
        const font = `800 ${currentSize}rem ${fontFamily}`;
        const textWidth = getTextWidth(text, font);
        
        if (textWidth > availableWidth && currentSize > minFontSize) {
            currentSize -= 0.05;
            element.style.fontSize = currentSize + 'rem';
            requestAnimationFrame(checkAndShrink);
        }
    };
    
    requestAnimationFrame(() => {
        requestAnimationFrame(checkAndShrink);
    });
}

// ========== دالة تسجيل حذف بطاقة (للسجل) ==========
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

// ========== دالة الإشعارات الخارجية (محلية) - معطلة حالياً ==========
function showExternalNotification(title, body) {
    // تم تعطيل الإشعارات المحلية واستبدالها بـ Web Push Notifications
}

// ========== دالة إرسال إشعار Telegram - معطلة حالياً ==========
async function sendTelegramNotification(message) {
    // تم تعطيل إشعارات تيليجرام واستبدالها بـ Web Push Notifications
}

// ========== دالة طلب إرسال Web Push Notification من الخادم (POST مع FormData) ==========
async function requestPushNotification(title, body) {
    try {
        const formData = new FormData();
        formData.append('action', 'sendPush');
        formData.append('data', JSON.stringify({ title, body }));

        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        console.log('📬 استجابة الخادم للإشعار:', JSON.stringify(result, null, 2));
        if (result.error) {
            console.error('❌ خطأ من الخادم:', result.error);
        }
    } catch (e) {
        console.error('فشل طلب الإشعار عبر الخادم:', e);
    }
}