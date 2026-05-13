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

// ⭐ دالة حساب قيمة الاشتراك مع مراعاة تغييرات منتصف الشهر
function subValue(sub) {
    const days = getDays(currentYear, currentMonth);
    const key = getKey(currentYear, currentMonth);
    
    // التحقق من وجود تغييرات في الحصة خلال الشهر
    const overrides = breadOverrides[sub.id]?.[key];
    
    if (overrides && overrides.length > 0) {
        // ترتيب التغييرات حسب اليوم
        const sortedOverrides = [...overrides].sort((a, b) => a.day - b.day);
        
        // ⭐ أول override هو الحصة من بداية الشهر
        let totalValue = 0;
        let lastDay = 1;
        let lastDailyBread = sortedOverrides[0].totalDailyBread || sortedOverrides[0].dailyBread || 0;
        
        for (let i = 0; i < sortedOverrides.length; i++) {
            const override = sortedOverrides[i];
            const changeDay = override.day;
            const newDailyBread = override.totalDailyBread || override.dailyBread || 0;
            
            if (i === 0) {
                // أول override - بيحدد الحصة من يوم 1
                lastDay = changeDay;
                lastDailyBread = newDailyBread;
                continue;
            }
            
            // الفترة من lastDay إلى changeDay - 1 بالحصة القديمة
            if (changeDay > lastDay) {
                const periodDays = changeDay - lastDay;
                totalValue += lastDailyBread * periodDays * BREAD_PRICE_PER_LOAF;
            }
            
            lastDay = changeDay;
            lastDailyBread = newDailyBread;
        }
        
        // الفترة الأخيرة من آخر تغيير لنهاية الشهر
        if (lastDay <= days) {
            const periodDays = days - lastDay + 1;
            totalValue += lastDailyBread * periodDays * BREAD_PRICE_PER_LOAF;
        }
        
        return Math.max(0, totalValue);
    }
    
    // لو مفيش تغييرات، الحساب العادي
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
