// ========== helpers-search.js - دوال البحث والتصفية والتكرار ==========

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