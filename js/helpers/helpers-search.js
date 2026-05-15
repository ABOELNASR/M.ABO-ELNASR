// ========== helpers-search.js - دوال البحث والتصفية والتكرار ==========

// ========== دوال التحقق من التكرار ==========

/**
 * التحقق من تكرار اسم المشترك
 * @param {string} name - اسم المشترك
 * @param {number|null} excludeId - معرف المشترك المستثنى (لتجنب التكرار مع نفسه)
 * @returns {boolean} هل الاسم مكرر
 */
function isDuplicateSubscriberName(name, excludeId = null) {
    if (!name) return false;
    const normalized = name.trim().toLowerCase();
    return subscribers.some(s => s.id !== excludeId && s.name.trim().toLowerCase() === normalized);
}

/**
 * التحقق من تكرار اسم البطاقة عالمياً (عند جميع المشتركين)
 * @param {string} cardName - اسم البطاقة
 * @param {number|null} excludeSubscriberId - معرف المشترك المستثنى
 * @returns {boolean} هل الاسم مكرر عالمياً
 */
function isDuplicateCardNameGlobal(cardName, excludeSubscriberId = null) {
    if (!cardName || cardName.trim() === '') return false;
    const normalized = cardName.trim().toLowerCase();
    
    for (const sub of subscribers) {
        if (excludeSubscriberId !== null && sub.id === excludeSubscriberId) continue;
        if (sub.cardsList && sub.cardsList.length) {
            if (sub.cardsList.some(card => 
                card.cardName && card.cardName.trim().toLowerCase() === normalized
            )) {
                return true;
            }
        }
    }
    return false;
}

/**
 * التحقق من تكرار اسم البطاقة داخل القائمة المؤقتة
 * @param {string} cardName - اسم البطاقة
 * @param {number} currentIndex - الفهرس الحالي للبطاقة (لتجنب المقارنة مع نفسها)
 * @returns {boolean} هل الاسم مكرر داخل القائمة
 */
function isDuplicateCardInTemp(cardName, currentIndex = -1) {
    if (!cardName || cardName.trim() === '') return false;
    const normalized = cardName.trim().toLowerCase();
    return tempCardsList.some((card, idx) => 
        idx !== currentIndex && card.cardName && card.cardName.trim().toLowerCase() === normalized
    );
}

/**
 * الحصول على قائمة أسماء المشتركين (للاكتمال التلقائي)
 * @returns {string[]} قائمة أسماء المشتركين
 */
function getSubscriberNamesList() {
    return subscribers.map(s => s.name);
}

/**
 * الحصول على قائمة أسماء البطاقات (للاكتمال التلقائي)
 * @returns {string[]} قائمة أسماء البطاقات
 */
function getCardNamesList() {
    const names = new Set();
    for (const sub of subscribers) {
        if (sub.cardsList) {
            sub.cardsList.forEach(card => {
                if (card.cardName) names.add(card.cardName);
            });
        }
    }
    return Array.from(names);
}

// ========== دوال البحث والتصفية ==========

/**
 * التحقق مما إذا كان المشترك يطابق مصطلح البحث
 * @param {Object} sub - كائن المشترك
 * @param {string} searchTerm - مصطلح البحث
 * @returns {boolean} هل يطابق البحث
 */
function subscriberMatchesSearch(sub, searchTerm) {
    if (!searchTerm) return true;
    const term = searchTerm.trim();
    
    // محاولة تحويل مصطلح البحث إلى رقم (للبحث عن عدد الأفراد)
    let targetNumber = null;
    const englishNumber = parseInt(term);
    const arabicNumber = parseInt(arabicToEnglishNumber(term));
    if (!isNaN(englishNumber) && englishNumber.toString() === term) {
        targetNumber = englishNumber;
    } else if (!isNaN(arabicNumber)) {
        targetNumber = arabicNumber;
    }
    
    // البحث حسب عدد الأفراد
    if (targetNumber !== null) {
        if (sub.cardsList && sub.cardsList.length) {
            return sub.cardsList.some(card => card.individuals === targetNumber);
        }
        return false;
    }
    
    // البحث النصي
    const lowerTerm = term.toLowerCase();
    if (sub.name.toLowerCase().includes(lowerTerm)) return true;
    
    if (sub.cardsList && sub.cardsList.length) {
        return sub.cardsList.some(card => 
            card.cardName && card.cardName.toLowerCase().includes(lowerTerm)
        );
    }
    return false;
}

/**
 * تصفية المشتركين حسب حالة الدفع
 * @param {Array} subscribersList - قائمة المشتركين
 * @param {string} filter - نوع الفلتر ('all', 'paid', 'unpaid')
 * @returns {Array} القائمة المصفاة
 */
function filterByPaymentStatus(subscribersList, filter) {
    if (filter === 'paid') {
        return subscribersList.filter(s => isFullyPaid(s.id));
    }
    if (filter === 'unpaid') {
        return subscribersList.filter(s => !isFullyPaid(s.id));
    }
    return [...subscribersList];
}

/**
 * البحث المتقدم في المشتركين
 * @param {Object} criteria - معايير البحث
 * @param {string} criteria.name - اسم المشترك
 * @param {string} criteria.cardName - اسم البطاقة
 * @param {number} criteria.minIndividuals - الحد الأدنى لعدد الأفراد
 * @param {number} criteria.maxIndividuals - الحد الأقصى لعدد الأفراد
 * @param {string} criteria.paymentStatus - حالة الدفع ('paid', 'unpaid', 'all')
 * @returns {Array} قائمة المشتركين المطابقين
 */
function advancedSearch(criteria) {
    let results = [...subscribers];
    
    if (criteria.name) {
        const nameTerm = criteria.name.trim().toLowerCase();
        results = results.filter(s => s.name.toLowerCase().includes(nameTerm));
    }
    
    if (criteria.cardName) {
        const cardTerm = criteria.cardName.trim().toLowerCase();
        results = results.filter(s => 
            s.cardsList && s.cardsList.some(card => 
                card.cardName && card.cardName.toLowerCase().includes(cardTerm)
            )
        );
    }
    
    if (criteria.minIndividuals !== undefined || criteria.maxIndividuals !== undefined) {
        results = results.filter(s => {
            const totalInd = getTotalIndividuals(s);
            if (criteria.minIndividuals !== undefined && totalInd < criteria.minIndividuals) return false;
            if (criteria.maxIndividuals !== undefined && totalInd > criteria.maxIndividuals) return false;
            return true;
        });
    }
    
    if (criteria.paymentStatus && criteria.paymentStatus !== 'all') {
        results = filterByPaymentStatus(results, criteria.paymentStatus);
    }
    
    return results;
}

// ========== دوال إحصائيات البحث ==========

/**
 * الحصول على عدد البطاقات المطابقة للبحث
 * @param {string} searchTerm - مصطلح البحث
 * @returns {number} عدد البطاقات
 */
function getFilteredCardsCount(searchTerm) {
    if (!searchTerm) {
        return subscribers.reduce((sum, s) => sum + (s.cardsList ? s.cardsList.length : 0), 0);
    }
    
    let count = 0;
    const term = searchTerm.trim();
    
    // محاولة تحويل مصطلح البحث إلى رقم
    let targetNumber = null;
    const englishNumber = parseInt(term);
    const arabicNumber = parseInt(arabicToEnglishNumber(term));
    if (!isNaN(englishNumber) && englishNumber.toString() === term) {
        targetNumber = englishNumber;
    } else if (!isNaN(arabicNumber)) {
        targetNumber = arabicNumber;
    }
    
    if (targetNumber !== null) {
        // بحث حسب عدد الأفراد
        for (const sub of subscribers) {
            if (sub.cardsList) {
                count += sub.cardsList.filter(card => card.individuals === targetNumber).length;
            }
        }
    } else {
        // بحث نصي
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

// ========== دوال تحديث التحذيرات ==========

/**
 * تحديث تحذيرات التكرار في نموذج الإضافة/التعديل
 */
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

// تصدير الدوال للنطاق العام
if (typeof window !== 'undefined') {
    window.isDuplicateSubscriberName = isDuplicateSubscriberName;
    window.isDuplicateCardNameGlobal = isDuplicateCardNameGlobal;
    window.isDuplicateCardInTemp = isDuplicateCardInTemp;
    window.getSubscriberNamesList = getSubscriberNamesList;
    window.getCardNamesList = getCardNamesList;
    window.subscriberMatchesSearch = subscriberMatchesSearch;
    window.filterByPaymentStatus = filterByPaymentStatus;
    window.advancedSearch = advancedSearch;
    window.getFilteredCardsCount = getFilteredCardsCount;
    window.updateDuplicateWarnings = updateDuplicateWarnings;
}

console.log('✅ helpers-search.js loaded');
