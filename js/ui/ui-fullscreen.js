// ========== ui-fullscreen.js - وضع ملء الشاشة للجدول ==========

function toggleFullscreenTable() {
    const section = document.getElementById('tableSection');
    const enterBtn = document.getElementById('enterFullscreenBtn');
    const exitBtn = document.getElementById('exitFullscreenBtn');
    const viewToggle = document.getElementById('viewToggle');
    const searchSyncRow = document.getElementById('searchSyncRow');
    const filterRow = document.getElementById('filterRow');
    const infoBarRow = document.getElementById('infoBarRow');
    
    // النسخ الثابتة (موجودة في HTML)
    const viewToggleClone = document.getElementById('viewToggleClone');
    const searchSyncRowClone = document.getElementById('searchSyncRowClone');
    const filterRowClone = document.getElementById('filterRowClone');
    const infoBarRowClone = document.getElementById('infoBarRowClone');
    
    if (!section) return;
    
    const isEntering = !section.classList.contains('fullscreen');
    
    if (isEntering) {
        // ⭐ دخول وضع ملء الشاشة
        
        // نسخ محتوى أزرار تبديل العرض
        if (viewToggleClone && viewToggle) {
            viewToggleClone.innerHTML = viewToggle.innerHTML;
            viewToggleClone.style.display = '';
            bindCloneEvents(viewToggleClone);
        }
        
        // نسخ صف البحث + متزامن
        if (searchSyncRowClone && searchSyncRow) {
            searchSyncRowClone.innerHTML = searchSyncRow.innerHTML;
            searchSyncRowClone.style.display = '';
            bindSearchCloneEvents(searchSyncRowClone);
        }
        
        // نسخ أزرار الفلاتر
        if (filterRowClone && filterRow) {
            filterRowClone.innerHTML = filterRow.innerHTML;
            filterRowClone.style.display = '';
            bindFilterCloneEvents(filterRowClone);
        }
        
        // نسخ صف زر ملء الشاشة + عداد البطاقات
        if (infoBarRowClone && infoBarRow) {
            infoBarRowClone.innerHTML = infoBarRow.innerHTML;
            infoBarRowClone.style.display = '';
            // إخفاء زر ملء الشاشة في النسخة
            const clonedEnterBtn = infoBarRowClone.querySelector('.fullscreen-enter-btn');
            if (clonedEnterBtn) {
                clonedEnterBtn.style.display = 'none';
            }
        }
        
        // إخفاء العناصر الأصلية
        if (viewToggle) viewToggle.style.visibility = 'hidden';
        if (searchSyncRow) searchSyncRow.style.visibility = 'hidden';
        if (filterRow) filterRow.style.visibility = 'hidden';
        if (infoBarRow) infoBarRow.style.visibility = 'hidden';
        
        section.classList.add('fullscreen');
        
        if (enterBtn) enterBtn.style.display = 'none';
        if (exitBtn) exitBtn.style.display = 'flex';
        
        disableBodyScroll();
        history.pushState({ fullscreen: true }, '', '');
        
        // تحديث عرض الكروت إذا كان نشط
        updateFullscreenCardsView();
    } else {
        // ⭐ خروج من وضع ملء الشاشة
        
        // إخفاء النسخ
        if (viewToggleClone) viewToggleClone.style.display = 'none';
        if (searchSyncRowClone) searchSyncRowClone.style.display = 'none';
        if (filterRowClone) filterRowClone.style.display = 'none';
        if (infoBarRowClone) infoBarRowClone.style.display = 'none';
        
        // إظهار العناصر الأصلية
        if (viewToggle) viewToggle.style.visibility = '';
        if (searchSyncRow) searchSyncRow.style.visibility = '';
        if (filterRow) filterRow.style.visibility = '';
        if (infoBarRow) infoBarRow.style.visibility = '';
        
        section.classList.remove('fullscreen');
        
        if (enterBtn) enterBtn.style.display = '';
        if (exitBtn) exitBtn.style.display = 'none';
        
        enableBodyScroll();
    }
}

/**
 * إعادة ربط أحداث أزرار العرض في النسخة
 */
function bindCloneEvents(viewToggleClone) {
    const buttons = viewToggleClone.querySelectorAll('.view-toggle-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            const originalBtn = document.querySelector(`#viewToggle .view-toggle-btn[data-view="${this.dataset.view}"]`);
            if (originalBtn) {
                originalBtn.click();
            }
            buttons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

/**
 * إعادة ربط أحداث البحث في النسخة
 */
function bindSearchCloneEvents(searchSyncRowClone) {
    const searchInput = searchSyncRowClone.querySelector('#searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const originalInput = document.querySelector('#searchSyncRow #searchInput');
            if (originalInput) {
                originalInput.value = this.value;
                originalInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
    }
    
    const clearBtn = searchSyncRowClone.querySelector('#clearSearchBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            const originalClear = document.querySelector('#searchSyncRow #clearSearchBtn');
            if (originalClear) {
                originalClear.click();
            }
        });
    }
}

/**
 * إعادة ربط أحداث الفلاتر في النسخة
 */
function bindFilterCloneEvents(filterRowClone) {
    const filterBtns = filterRowClone.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.dataset.filter;
            const originalBtns = document.querySelectorAll('#filterRow .filter-btn');
            originalBtns.forEach(origBtn => {
                if (origBtn.dataset.filter === filter) {
                    origBtn.click();
                }
            });
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

/**
 * تحديث عرض الكروت في وضع fullscreen
 */
function updateFullscreenCardsView() {
    const section = document.getElementById('tableSection');
    const cardsContainer = document.getElementById('cardsViewContainer');
    const tableViewBtn = document.getElementById('tableViewBtn');
    
    if (!section || !cardsContainer) return;
    
    if (tableViewBtn && !tableViewBtn.classList.contains('active')) {
        const screenWidth = window.innerWidth;
        if (screenWidth < 600) {
            cardsContainer.style.gridTemplateColumns = '1fr';
        } else if (screenWidth < 900) {
            cardsContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
        } else if (screenWidth < 1200) {
            cardsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
        } else {
            cardsContainer.style.gridTemplateColumns = 'repeat(4, 1fr)';
        }
    }
}

/**
 * منع سكرول الجسم
 */
function disableBodyScroll() {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
}

/**
 * إعادة سكرول الجسم
 */
function enableBodyScroll() {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
}

// مستمع للرجوع من fullscreen
window.addEventListener('popstate', function(event) {
    const section = document.getElementById('tableSection');
    if (section && section.classList.contains('fullscreen')) {
        toggleFullscreenTable();
        history.pushState({ fullscreen: true }, '', '');
    }
});

// مستمع لمفتاح Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const section = document.getElementById('tableSection');
        if (section && section.classList.contains('fullscreen')) {
            toggleFullscreenTable();
        }
    }
});
