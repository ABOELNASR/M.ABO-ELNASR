// ========== ui-main.js - الدوال الرئيسية لواجهة المستخدم ==========

// ========== تحديث واجهة المستخدم ==========

function updateUI() {
    if (!isReadOnly()) {
        let totalVal = 0, totalPaid = 0;
        const totalCardsCount = getFilteredCardsCount(currentSearch);
        const filteredSubs = subscribers.filter(s => subscriberMatchesSearch(s, currentSearch));
        
        filteredSubs.forEach(s => { 
            totalVal += subValue(s); 
            totalPaid += getPaid(s.id); 
        });

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

        // تصحيح حجم الخط في بطاقات الإحصائيات
        fitTextToContainer(document.getElementById('totalMonthValue'));
        fitTextToContainer(document.getElementById('totalPaidMonth'));
        fitTextToContainer(document.getElementById('totalDueMonth'));
    }

    const elDays = document.getElementById('daysCount');
    if (elDays) elDays.innerText = getDays(currentYear, currentMonth);

    const elMonthYear = document.getElementById('currentMonthYear');
    if (elMonthYear) elMonthYear.innerText = `${getMonthName(currentMonth)} ${currentYear}`;
}

// ========== عرض جميع البيانات ==========

function renderAll() { 
    updateUI(); 
    if (viewMode === 'cards') {
        renderCards();
    } else {
        renderTable();
    }
}

// ========== تغيير الشهر ==========

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
    
    // حفظ وضع العرض المفضل
    localStorage.setItem('preferred_view_mode', mode);
}

// ========== تحميل وضع العرض المحفوظ ==========

function loadPreferredViewMode() {
    const savedMode = localStorage.getItem('preferred_view_mode');
    if (savedMode === 'cards' || savedMode === 'table') {
        viewMode = savedMode;
        toggleView(viewMode);
    } else {
        // الوضع الافتراضي هو الجدول
        viewMode = 'table';
        toggleView('table');
    }
}

// ========== ربط الأحداث العامة للواجهة ==========

function bindGlobalEvents() {
    // زر ملء الشاشة
    const fullscreenBtn = document.getElementById('toggleFullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreenTable);
    }
    
    // أزرار تبديل العرض
    const tableViewBtn = document.getElementById('tableViewBtn');
    const cardsViewBtn = document.getElementById('cardsViewBtn');
    if (tableViewBtn) tableViewBtn.addEventListener('click', () => toggleView('table'));
    if (cardsViewBtn) cardsViewBtn.addEventListener('click', () => toggleView('cards'));
    
    // زر العودة للأعلى
    const scrollBtn = document.getElementById('scrollToTopBtn');
    if (scrollBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollBtn.style.display = 'flex';
            } else {
                scrollBtn.style.display = 'none';
            }
        });
        scrollBtn.addEventListener('click', scrollToTop);
    }
    
    // زر مسح البحث
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = '';
                currentSearch = '';
                renderAll();
            }
        });
    }
    
    // حقل البحث
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value;
            renderAll();
        });
    }
    
    // أزرار التصفية
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(f => f.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderAll();
        });
    });
    
    // زر مسح التصفية
    const clearFilterBtn = document.getElementById('clearFilterBtn');
    if (clearFilterBtn) {
        clearFilterBtn.addEventListener('click', () => {
            currentFilter = 'all';
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
            if (allBtn) allBtn.classList.add('active');
            renderAll();
        });
    }
}

// ========== حدث النقر خارج الجدول لإغلاق التفاصيل ==========

function bindOutsideClickHandler() {
    document.addEventListener('click', (e) => {
        // التحقق مما إذا كان النقر خارج الجدول وخارج الكروت
        const isInsideTable = e.target.closest('table');
        const isInsideCard = e.target.closest('.subscriber-card');
        const isInsideModal = e.target.closest('.modal-overlay');
        const isInsideButton = e.target.closest('button');
        
        if (!isInsideTable && !isInsideCard && !isInsideModal && !isInsideButton) {
            if (currentSelectedRowId !== null) {
                currentSelectedRowId = null;
                expandedRowId = null;
                renderAll();
            }
        }
    });
}

// ========== تهيئة واجهة المستخدم ==========

function initUI() {
    bindGlobalEvents();
    bindOutsideClickHandler();
    loadPreferredViewMode();
    
    // تحديث الوقت كل ثانية
    setInterval(updateDateTime, 1000);
    
    // مراقبة حالة الاتصال
    window.addEventListener('online', () => {
        updateOnlineStatus(true);
    });
    window.addEventListener('offline', () => {
        updateOnlineStatus(false);
    });
    
    // التحقق من حالة الاتصال عند التحميل
    updateOnlineStatus(navigator.onLine);
    
    console.log('✅ UI initialized');
}

// ========== تصدير الدوال للنطاق العام ==========
if (typeof window !== 'undefined') {
    window.updateUI = updateUI;
    window.renderAll = renderAll;
    window.changeMonth = changeMonth;
    window.toggleView = toggleView;
    window.loadPreferredViewMode = loadPreferredViewMode;
    window.bindGlobalEvents = bindGlobalEvents;
    window.bindOutsideClickHandler = bindOutsideClickHandler;
    window.initUI = initUI;
}

console.log('✅ ui-main.js loaded');
