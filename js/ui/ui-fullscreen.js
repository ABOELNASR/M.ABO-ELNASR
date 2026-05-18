// ========== ui-fullscreen.js - وضع ملء الشاشة للجدول ==========

function toggleFullscreenTable() {
    const section = document.getElementById('tableSection');
    const enterBtn = document.getElementById('enterFullscreenBtn');
    const exitBtn = document.getElementById('exitFullscreenBtn');
    const viewToggle = document.getElementById('viewToggle');
    const toolbarRow = document.getElementById('toolbarRow');
    const fullscreenBtnRow = document.getElementById('fullscreenBtnRow');
    const cardsCountHeader = document.getElementById('cardsCountHeader');
    
    // النسخ الثابتة (موجودة في HTML)
    const viewToggleClone = document.getElementById('viewToggleClone');
    const toolbarRowClone = document.getElementById('toolbarRowClone');
    const cardsCountHeaderClone = document.getElementById('cardsCountHeaderClone');
    
    if (!section) return;
    
    const isEntering = !section.classList.contains('fullscreen');
    
    if (isEntering) {
        // ⭐ دخول وضع ملء الشاشة
        
        // تحديث محتوى النسخ من العناصر الأصلية
        if (viewToggleClone && viewToggle) {
            viewToggleClone.innerHTML = viewToggle.innerHTML;
            viewToggleClone.style.display = '';
            // إعادة ربط أحداث الأزرار في النسخة
            bindCloneEvents(viewToggleClone);
        }
        if (toolbarRowClone && toolbarRow) {
            toolbarRowClone.innerHTML = toolbarRow.innerHTML;
            toolbarRowClone.style.display = '';
            // إعادة ربط أحداث البحث والفلترة في النسخة
            bindToolbarCloneEvents(toolbarRowClone);
        }
        if (cardsCountHeaderClone && cardsCountHeader) {
            cardsCountHeaderClone.innerHTML = cardsCountHeader.innerHTML;
            cardsCountHeaderClone.style.display = '';
        }
        
        // إخفاء العناصر الأصلية (استخدام visibility عشان يحتفظوا بمساحتهم)
        if (viewToggle) viewToggle.style.visibility = 'hidden';
        if (toolbarRow) toolbarRow.style.visibility = 'hidden';
        if (fullscreenBtnRow) fullscreenBtnRow.style.visibility = 'hidden';
        if (cardsCountHeader) cardsCountHeader.style.visibility = 'hidden';
        
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
        if (toolbarRowClone) toolbarRowClone.style.display = 'none';
        if (cardsCountHeaderClone) cardsCountHeaderClone.style.display = 'none';
        
        // إظهار العناصر الأصلية
        if (viewToggle) viewToggle.style.visibility = '';
        if (toolbarRow) toolbarRow.style.visibility = '';
        if (fullscreenBtnRow) fullscreenBtnRow.style.visibility = '';
        if (cardsCountHeader) cardsCountHeader.style.visibility = '';
        
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
            // محاكاة الضغط على الزر الأصلي
            const originalBtn = document.querySelector(`#viewToggle .view-toggle-btn[data-view="${this.dataset.view}"]`);
            if (originalBtn) {
                originalBtn.click();
            }
            // تحديث نشاط الأزرار في النسخة
            buttons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

/**
 * إعادة ربط أحداث البحث والفلترة في النسخة
 */
function bindToolbarCloneEvents(toolbarRowClone) {
    // ربط البحث
    const searchInput = toolbarRowClone.querySelector('#searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const originalInput = document.querySelector('#toolbarRow #searchInput');
            if (originalInput) {
                originalInput.value = this.value;
                originalInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
    }
    
    // ربط زر مسح البحث
    const clearBtn = toolbarRowClone.querySelector('#clearSearchBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            const originalClear = document.querySelector('#toolbarRow #clearSearchBtn');
            if (originalClear) {
                originalClear.click();
            }
        });
    }
    
    // ربط أزرار الفلتر
    const filterBtns = toolbarRowClone.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.dataset.filter;
            const originalBtns = document.querySelectorAll('#toolbarRow .filter-btn');
            originalBtns.forEach(origBtn => {
                if (origBtn.dataset.filter === filter) {
                    origBtn.click();
                }
            });
            // تحديث الكلاسات في النسخة
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
    
    // التحقق إذا كان عرض الكروت نشط
    if (tableViewBtn && !tableViewBtn.classList.contains('active')) {
        // عرض الكروت نشط - ضبط التنسيق للـ fullscreen
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
