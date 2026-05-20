// ========== ui-fullscreen.js - وضع ملء الشاشة للجدول ==========

// ========== دالة الدخول والخروج من وضع ملء الشاشة ==========
function toggleFullscreenTable() {
    const section = document.getElementById('tableSection');
    const btn = document.getElementById('toggleFullscreenBtn');
    
    if (!section || !btn) return;
    
    const isEntering = !section.classList.contains('fullscreen');
    
    if (isEntering) {
        enterFullscreen(section, btn);
    } else {
        exitFullscreen(section, btn);
    }
}

// ========== دخول وضع ملء الشاشة ==========
function enterFullscreen(section, btn) {
    // ⭐ إخفاء العناصر الأصلية خارج table-section
    const originalToolbarArea = document.getElementById('toolbarArea');
    if (originalToolbarArea) {
        originalToolbarArea.classList.add('fullscreen-hidden');
    }
    
    // ⭐ إظهار النسخ داخل table-section
    const cloneToolbarArea = document.getElementById('toolbarAreaClone');
    if (cloneToolbarArea) {
        cloneToolbarArea.style.display = 'flex';
    }
    
    // ⭐ نقل الزر إلى body عشان يظهر ثابت فوق الكل
    document.body.appendChild(btn);
    
    section.classList.add('fullscreen');
    btn.innerHTML = '✖';
    btn.title = 'إغلاق وضع ملء الشاشة';
    disableBodyScroll();
    
    // ⭐ مزامنة حالة أزرار الفلتر من النسخة الأصلية إلى النسخة المستنسخة
    syncFilterButtons();
    
    // ⭐ إضافة حالة في الـ history عشان زر الرجوع يخرج من ملء الشاشة
    history.pushState({ fullscreen: true }, '', '');
}

// ========== خروج من وضع ملء الشاشة ==========
function exitFullscreen(section, btn, isBackButton) {
    // ⭐ إظهار العناصر الأصلية
    const originalToolbarArea = document.getElementById('toolbarArea');
    if (originalToolbarArea) {
        originalToolbarArea.classList.remove('fullscreen-hidden');
    }
    
    // ⭐ إخفاء النسخ داخل table-section
    const cloneToolbarArea = document.getElementById('toolbarAreaClone');
    if (cloneToolbarArea) {
        cloneToolbarArea.style.display = 'none';
    }
    
    // ⭐ إرجاع الزر إلى مكانه الأصلي
    const topRow = document.querySelector('.toolbar-top-row');
    if (topRow && btn.parentNode === document.body) {
        topRow.insertBefore(btn, topRow.firstChild);
    }
    
    section.classList.remove('fullscreen');
    btn.innerHTML = '🖥️';
    btn.title = 'تكبير الجدول';
    enableBodyScroll();
    
    // ⭐ مزامنة حالة أزرار الفلتر من النسخة المستنسخة إلى النسخة الأصلية
    syncFilterButtonsBack();
    
    // ⭐ لو الخروج تم عن طريق زر الرجوع
    if (isBackButton && history.state && history.state.fullscreen) {
        history.back();
    }
}

// ========== مزامنة أزرار الفلتر من الأصلية إلى المستنسخة ==========
function syncFilterButtons() {
    const originalFilters = document.querySelectorAll('#filterGroup .filter-btn');
    const cloneFilters = document.querySelectorAll('#filterGroupClone .filter-btn');
    
    cloneFilters.forEach((cloneBtn, index) => {
        if (originalFilters[index]) {
            cloneBtn.className = originalFilters[index].className;
        }
    });
    
    // مزامنة حالة البحث
    const originalSearch = document.getElementById('searchInput');
    const cloneSearch = document.getElementById('searchInputClone');
    if (originalSearch && cloneSearch) {
        cloneSearch.value = originalSearch.value;
    }
    
    // مزامنة حالة أزرار العرض
    const originalTableViewBtn = document.getElementById('tableViewBtn');
    const originalCardsViewBtn = document.getElementById('cardsViewBtn');
    const cloneTableViewBtn = document.getElementById('tableViewBtnClone');
    const cloneCardsViewBtn = document.getElementById('cardsViewBtnClone');
    
    if (originalTableViewBtn && cloneTableViewBtn) {
        cloneTableViewBtn.className = originalTableViewBtn.className;
    }
    if (originalCardsViewBtn && cloneCardsViewBtn) {
        cloneCardsViewBtn.className = originalCardsViewBtn.className;
    }
}

// ========== مزامنة أزرار الفلتر من المستنسخة إلى الأصلية ==========
function syncFilterButtonsBack() {
    const cloneFilters = document.querySelectorAll('#filterGroupClone .filter-btn');
    const originalFilters = document.querySelectorAll('#filterGroup .filter-btn');
    
    originalFilters.forEach((origBtn, index) => {
        if (cloneFilters[index]) {
            origBtn.className = cloneFilters[index].className;
        }
    });
    
    // مزامنة حالة البحث
    const cloneSearch = document.getElementById('searchInputClone');
    const originalSearch = document.getElementById('searchInput');
    if (cloneSearch && originalSearch) {
        originalSearch.value = cloneSearch.value;
        currentSearch = cloneSearch.value;
    }
}

// ========== حدث زر الرجوع في الهاتف ==========
window.addEventListener('popstate', function(event) {
    const section = document.getElementById('tableSection');
    const btn = document.getElementById('toggleFullscreenBtn');
    
    if (section && section.classList.contains('fullscreen')) {
        exitFullscreen(section, btn, true);
        history.pushState({ fullscreen: true }, '', '');
    }
});

// ========== حدث ESC للخروج من ملء الشاشة ==========
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const section = document.getElementById('tableSection');
        const btn = document.getElementById('toggleFullscreenBtn');
        if (section && section.classList.contains('fullscreen')) {
            exitFullscreen(section, btn, false);
        }
    }
});
