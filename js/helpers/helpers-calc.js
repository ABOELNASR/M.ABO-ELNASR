// ========== helpers-calc.js - دوال العمليات الحسابية ==========

// ========== دوال الأفراد والحصة اليومية ==========

/**
 * حساب إجمالي عدد الأفراد لمشترك
 * @param {Object} sub - كائن المشترك
 * @returns {number} إجمالي عدد الأفراد
 */
function getTotalIndividuals(sub) {
    if (!sub || !sub.cardsList || !sub.cardsList.length) {
        return 0;
    }
    return sub.cardsList.reduce((sum, card) => sum + (parseInt(card.individuals) || 0), 0);
}

/**
 * حساب الحصة اليومية لبطاقة واحدة
 * @param {Object} card - كائن البطاقة
 * @returns {number} الحصة اليومية بالرغيف
 */
function getDailyBreadForCard(card) {
    if (!card) return 0;
    if (card.dailyBreadOverride !== null && card.dailyBreadOverride !== undefined) {
        return card.dailyBreadOverride;
    }
    return (card.individuals || 0) * DEFAULT_DAILY_BREAD_PER_PERSON;
}

/**
 * الحصول على الحصة اليومية الافتراضية لبطاقة (بدون تجاوزات)
 * @param {Object} card - كائن البطاقة
 * @returns {number} الحصة الافتراضية
 */
function getDefaultDailyBreadForCard(card) {
    if (!card) return 0;
    return (card.individuals || 0) * DEFAULT_DAILY_BREAD_PER_PERSON;
}

/**
 * حساب إجمالي الحصة اليومية لمشترك
 * @param {Object} sub - كائن المشترك
 * @returns {number} إجمالي الحصة اليومية بالرغيف
 */
function getDailyBread(sub) {
    if (!sub || !sub.cardsList || sub.cardsList.length === 0) return 0;
    return sub.cardsList.reduce((sum, card) => sum + getDailyBreadForCard(card), 0);
}

/**
 * حساب الحصة اليومية الافتراضية لمشترك (بدون تجاوزات)
 * @param {Object} sub - كائن المشترك
 * @returns {number} الحصة الافتراضية
 */
function getDefaultDailyBread(sub) {
    if (!sub || !sub.cardsList || sub.cardsList.length === 0) return 0;
    return sub.cardsList.reduce((sum, card) => sum + getDefaultDailyBreadForCard(card), 0);
}

/**
 * حساب فرق الحصة اليومية (الافتراضية - الفعلية)
 * @param {Object} sub - كائن المشترك
 * @returns {number} الفرق (موجب إذا كانت الفعلية أقل)
 */
function getBreadDifference(sub) {
    const defaultBread = getDefaultDailyBread(sub);
    const actualBread = getDailyBread(sub);
    return defaultBread - actualBread;
}

// ========== حساب قيمة الاشتراك ==========

/**
 * حساب قيمة الاشتراك الشهري لمشترك مع مراعاة تغييرات منتصف الشهر
 * @param {Object} sub - كائن المشترك
 * @returns {number} قيمة الاشتراك بالجنيه
 */
function subValue(sub) {
    if (!sub) return 0;
    
    const days = getDays(currentYear, currentMonth);
    const key = getKey(currentYear, currentMonth);
    
    // التحقق من وجود تغييرات في الحصة خلال الشهر
    const overrides = breadOverrides[sub.id]?.[key];
    
    if (overrides && overrides.length > 0) {
        // ترتيب التغييرات حسب اليوم
        const sortedOverrides = [...overrides].sort((a, b) => a.day - b.day);
        
        // حساب القيمة بناءً على فترات مختلفة من الشهر
        let totalValue = 0;
        let lastDay = 1;
        let lastDailyBread = getDefaultDailyBread(sub); // الحصة الافتراضية أول الشهر
        
        for (const override of sortedOverrides) {
            const changeDay = override.day;
            const newDailyBread = override.totalDailyBread || override.dailyBread;
            
            // الفترة من lastDay إلى changeDay - 1 بالحصة القديمة
            if (changeDay > lastDay) {
                const periodDays = changeDay - lastDay;
                totalValue += lastDailyBread * periodDays * BREAD_PRICE_PER_LOAF;
                
                // حساب فرق النقاط عن الحصة الافتراضية
                const defaultBread = getDefaultDailyBread(sub);
                const breadDiff = defaultBread - lastDailyBread;
                if (breadDiff > 0) {
                    totalValue -= breadDiff * periodDays * CREDIT_PRICE_PER_LOAF;
                }
            }
            
            lastDay = changeDay;
            lastDailyBread = newDailyBread;
        }
        
        // الفترة الأخيرة من آخر تغيير لنهاية الشهر
        if (lastDay <= days) {
            const periodDays = days - lastDay + 1;
            totalValue += lastDailyBread * periodDays * BREAD_PRICE_PER_LOAF;
            
            const defaultBread = getDefaultDailyBread(sub);
            const breadDiff = defaultBread - lastDailyBread;
            if (breadDiff > 0) {
                totalValue -= breadDiff * periodDays * CREDIT_PRICE_PER_LOAF;
            }
        }
        
        return Math.max(0, totalValue);
    }
    
    // إذا لم توجد تغييرات، الحساب العادي
    const modifiedValue = getDailyBread(sub) * days * BREAD_PRICE_PER_LOAF;
    const breadDiff = getBreadDifference(sub);
    const credit = breadDiff * days * CREDIT_PRICE_PER_LOAF;
    return Math.max(0, modifiedValue - credit);
}

/**
 * حساب قيمة فرق النقاط المستحقة للمشترك
 * @param {Object} sub - كائن المشترك
 * @returns {number} قيمة فرق النقاط
 */
function getCreditAmount(sub) {
    if (!sub) return 0;
    const days = getDays(currentYear, currentMonth);
    const breadDiff = getBreadDifference(sub);
    return Math.max(0, breadDiff * days * CREDIT_PRICE_PER_LOAF);
}

// ========== دوال المدفوعات ==========

/**
 * الحصول على المبلغ المدفوع لمشترك في الشهر الحالي
 * @param {number|string} subId - معرف المشترك
 * @returns {number} المبلغ المدفوع
 */
function getPaid(subId) {
    const key = getKey(currentYear, currentMonth);
    return monthlyPayments[subId]?.[key] || 0;
}

/**
 * الحصول على المبلغ المتبقي لمشترك في الشهر الحالي
 * @param {number|string} subId - معرف المشترك
 * @returns {number} المبلغ المتبقي (قد يكون سالباً إذا كان دائناً)
 */
function getRemaining(subId) {
    const sub = subscribers.find(s => s.id == subId);
    if (!sub) return 0;
    return subValue(sub) - getPaid(subId);
}

/**
 * التحقق مما إذا كان المشترك قد دفع بالكامل
 * @param {number|string} subId - معرف المشترك
 * @returns {boolean} هل دفع بالكامل
 */
function isFullyPaid(subId) {
    return getRemaining(subId) <= 0;
}

/**
 * التحقق مما إذا كان للمشترك رصيد دائن (مدفوع أكثر من المطلوب)
 * @param {number|string} subId - معرف المشترك
 * @returns {boolean} هل لديه رصيد دائن
 */
function hasCreditBalance(subId) {
    return getRemaining(subId) < 0;
}

/**
 * الحصول على نسبة الدفع المئوية لمشترك
 * @param {number|string} subId - معرف المشترك
 * @returns {number} نسبة الدفع (0-100)
 */
function getPaymentPercentage(subId) {
    const sub = subscribers.find(s => s.id == subId);
    if (!sub) return 0;
    const total = subValue(sub);
    if (total === 0) return 100;
    const paid = getPaid(subId);
    return Math.min(100, (paid / total) * 100);
}

// ========== دوال مساعدة إضافية ==========

/**
 * حساب إجمالي قيمة الاشتراكات لجميع المشتركين في الشهر الحالي
 * @returns {number} الإجمالي
 */
function getTotalSubscriptionsValue() {
    return subscribers.reduce((sum, sub) => sum + subValue(sub), 0);
}

/**
 * حساب إجمالي المدفوعات لجميع المشتركين في الشهر الحالي
 * @returns {number} الإجمالي
 */
function getTotalPaid() {
    return subscribers.reduce((sum, sub) => sum + getPaid(sub.id), 0);
}

/**
 * حساب إجمالي المتبقي لجميع المشتركين في الشهر الحالي
 * @returns {number} الإجمالي
 */
function getTotalRemaining() {
    return getTotalSubscriptionsValue() - getTotalPaid();
}

/**
 * حساب إجمالي عدد الرغيف اليومي لجميع المشتركين
 * @returns {number} إجمالي الرغيف اليومي
 */
function getTotalDailyBread() {
    return subscribers.reduce((sum, sub) => sum + getDailyBread(sub), 0);
}

/**
 * حساب إجمالي عدد الرغيف الشهري لجميع المشتركين
 * @returns {number} إجمالي الرغيف الشهري
 */
function getTotalMonthlyBread() {
    const days = getDays(currentYear, currentMonth);
    return getTotalDailyBread() * days;
}

// تصدير الدوال للنطاق العام
if (typeof window !== 'undefined') {
    window.getTotalIndividuals = getTotalIndividuals;
    window.getDailyBreadForCard = getDailyBreadForCard;
    window.getDefaultDailyBreadForCard = getDefaultDailyBreadForCard;
    window.getDailyBread = getDailyBread;
    window.getDefaultDailyBread = getDefaultDailyBread;
    window.getBreadDifference = getBreadDifference;
    window.subValue = subValue;
    window.getCreditAmount = getCreditAmount;
    window.getPaid = getPaid;
    window.getRemaining = getRemaining;
    window.isFullyPaid = isFullyPaid;
    window.hasCreditBalance = hasCreditBalance;
    window.getPaymentPercentage = getPaymentPercentage;
    window.getTotalSubscriptionsValue = getTotalSubscriptionsValue;
    window.getTotalPaid = getTotalPaid;
    window.getTotalRemaining = getTotalRemaining;
    window.getTotalDailyBread = getTotalDailyBread;
    window.getTotalMonthlyBread = getTotalMonthlyBread;
}

console.log('✅ helpers-calc.js loaded');
