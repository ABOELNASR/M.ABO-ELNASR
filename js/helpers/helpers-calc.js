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