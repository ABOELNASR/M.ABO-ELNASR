// ========== ui-main.js - الدوال الرئيسية لواجهة المستخدم ==========

// ========== تحديث واجهة المستخدم ==========

function updateUI() {
    if (!isReadOnly()) {
        let totalVal = 0, totalPaid = 0;
        const totalCardsCount = getFilteredCardsCount(currentSearch);
        const filteredSubs = subscribers.filter(s => subscriberMatchesSearch(s, currentSearch));
        filteredSubs.forEach(s => { totalVal += subValue(s); totalPaid += getPaid(s.id); });

        const elSubs = document.getElementById('totalSubs');
        if (elSubs) elSubs.innerText = filteredSubs.length;

        const elMonthVal = document.getElementById('totalMonthValue');
        if (elMonthVal) elMonthVal.innerHTML = formatNumber(totalVal) + ' ج.م';

        const elPaid = document.getElementById('totalPaidMonth');
        if (elPaid) elPaid.innerHTML = formatNumber(totalPaid) + ' ج.م';

        const elDue = document.getElementById('totalDueMonth');
        if (elDue) elDue.innerHTML = formatNumber(totalVal - totalPaid) + ' ج.م';

        const elCards = document.getElementById('cardsCountHeader');
        if (elCards) elCards.innerHTML = `📇 عدد البطاقات: ${totalCardsCount}`;

        fitTextToContainer(document.getElementById('totalMonthValue'));
        fitTextToContainer(document.getElementById('totalPaidMonth'));
        fitTextToContainer(document.getElementById('totalDueMonth'));
    }

    const elDays = document.getElementById('daysCount');
    if (elDays) elDays.innerText = getDays(currentYear, currentMonth);

    const elMonthYear = document.getElementById('currentMonthYear');
    if (elMonthYear) elMonthYear.innerText = `${getMonthName(currentMonth)} ${currentYear}`;
}

function renderAll() { 
    updateUI(); 
    if (viewMode === 'cards') {
        renderCards();
    } else {
        renderTable();
    }
}

function changeMonth(delta) {
    let nm = currentMonth + delta, ny = currentYear;
    if (nm < 0) { nm = 11; ny--; }
    if (nm > 11) { nm = 0; ny++; }
    currentYear = ny;
    currentMonth = nm;
    currentSelectedRowId = null;
    expandedRowId = null;
    renderAll();
}

// ========== تبديل العرض (جدول / كروت) ==========

function toggleView(mode) {
    viewMode = mode;
    
    const tableViewBtn = document.getElementById('tableViewBtn');
    const cardsViewBtn = document.getElementById('cardsViewBtn');
    const tableWrapper = document.getElementById('tableWrapper');
    const cardsContainer = document.getElementById('cardsViewContainer');
    
    if (tableViewBtn && cardsViewBtn) {
        tableViewBtn.classList.toggle('active', mode === 'table');
        cardsViewBtn.classList.toggle('active', mode === 'cards');
    }
    
    if (tableWrapper && cardsContainer) {
        if (mode === 'table') {
            tableWrapper.style.display = 'block';
            cardsContainer.style.display = 'none';
            renderTable();
        } else {
            tableWrapper.style.display = 'none';
            cardsContainer.style.display = 'block';
            renderCards();
        }
    }
}

// ========== ربط الأحداث العامة للواجهة ==========

window.addEventListener('DOMContentLoaded', function() {
    const fullscreenBtn = document.getElementById('toggleFullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreenTable);
    }
    
    const tableViewBtn = document.getElementById('tableViewBtn');
    const cardsViewBtn = document.getElementById('cardsViewBtn');
    if (tableViewBtn) tableViewBtn.addEventListener('click', () => toggleView('table'));
    if (cardsViewBtn) cardsViewBtn.addEventListener('click', () => toggleView('cards'));
});

// ========== حدث النقر خارج الجدول لإغلاق التفاصيل ==========

document.addEventListener('click', (e) => {
    if (!e.target.closest('table') && !e.target.closest('.modal-overlay') && !e.target.closest('button') && !e.target.closest('.subscriber-card')) {
        if (currentSelectedRowId !== null) {
            currentSelectedRowId = null;
            expandedRowId = null;
            renderAll();
        }
    }
});
