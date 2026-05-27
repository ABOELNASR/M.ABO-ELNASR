// ========== helpers-calc.js - دوال العمليات الحسابية ==========

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

// ⭐ دالة للتحقق من وجود تعديل يدوي على الحصة اليومية لأي بطاقة
function hasManualDailyOverride(sub) {
    if (!sub.cardsList) return false;
    return sub.cardsList.some(card => card.dailyBreadOverride !== null && card.dailyBreadOverride !== undefined);
}

// ⭐ دالة للتحقق من وجود تعديل يدوي على الحصة الشهرية (breadOverrides)
function hasMonthlyBreadOverride(subId) {
    const key = getKey(currentYear, currentMonth);
    const overrides = breadOverrides[subId]?.[key];
    return overrides && overrides.length > 0;
}

// ⭐ دالة للتحقق مما إذا كان هناك أي تعديل يدوي (بطاقة أو شهري)
function hasAnyManualOverride(sub) {
    return hasManualDailyOverride(sub) || hasMonthlyBreadOverride(sub.id);
}

// ⭐ دالة حساب قيمة الاشتراك مع مراعاة تغييرات منتصف الشهر
function subValue(sub) {
    const days = getDays(currentYear, currentMonth);
    const key = getKey(currentYear, currentMonth);

    // التحقق من وجود تغييرات في الحصة خلال الشهر
    const overrides = breadOverrides[sub.id]?.[key];

    // إذا لم يكن هناك أي تعديل يدوي (لا بطاقات معدلة ولا overrides)
    if (!hasAnyManualOverride(sub)) {
        return getDailyBread(sub) * days * BREAD_PRICE_PER_LOAF;
    }

    if (overrides && overrides.length > 0) {
        // ترتيب التغييرات حسب اليوم
        const sortedOverrides = [...overrides].sort((a, b) => a.day - b.day);

        let totalValue = 0;
        let lastDay = 1;
        let lastDailyBread = getDefaultDailyBread(sub); // الحصة الافتراضية أول الشهر

        for (const override of sortedOverrides) {
            const changeDay = override.day;
            const newDailyBread = override.totalDailyBread || override.dailyBread;

            if (changeDay > lastDay) {
                const periodDays = changeDay - lastDay;
                totalValue += lastDailyBread * periodDays * BREAD_PRICE_PER_LOAF;

                // ⭐ التعديل: فرق النقاط يحسب فقط عند وجود تعديل يدوي
                if (lastDailyBread !== getDefaultDailyBread(sub)) {
                    const defaultBread = getDefaultDailyBread(sub);
                    const breadDiff = defaultBread - lastDailyBread;
                    if (breadDiff > 0) {
                        totalValue -= breadDiff * periodDays * CREDIT_PRICE_PER_LOAF;
                    }
                }
            }

            lastDay = changeDay;
            lastDailyBread = newDailyBread;
        }

        // الفترة الأخيرة من آخر تغيير لنهاية الشهر
        if (lastDay <= days) {
            const periodDays = days - lastDay + 1;
            totalValue += lastDailyBread * periodDays * BREAD_PRICE_PER_LOAF;

            if (lastDailyBread !== getDefaultDailyBread(sub)) {
                const defaultBread = getDefaultDailyBread(sub);
                const breadDiff = defaultBread - lastDailyBread;
                if (breadDiff > 0) {
                    totalValue -= breadDiff * periodDays * CREDIT_PRICE_PER_LOAF;
                }
            }
        }

        return Math.max(0, totalValue);
    }

    // لا توجد overrides ولكن توجد بطاقات معدلة يدويًا → حساب مباشر مع خصم فرق النقاط
    const dailyBread = getDailyBread(sub);
    let value = dailyBread * days * BREAD_PRICE_PER_LOAF;
    const credit = getCreditAmount(sub);
    value -= credit;
    return Math.max(0, value);
}

function getCreditAmount(sub) {
    // ⭐ التعديل: فرق النقاط يحسب فقط عند وجود تعديل يدوي (بطاقة أو شهري)
    if (!hasAnyManualOverride(sub)) {
        return 0;
    }

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
