// ========== ui-fullscreen.js - وضع ملء الشاشة للجدول ==========

// ========== مرجع لمستمع window.scroll الأصلي ==========
let originalWindowScrollHandler = null;

// ========== تهيئة أحداث النسخة المستنسخة ==========
function initCloneEvents() {
    // ⭐ ربط أزرار العرض في النسخة المستنسخة
    const tableViewBtnClone = document.getElementById('tableViewBtnClone');
    const cardsViewBtnClone = document.getElementById('cardsViewBtnClone');
    
    if (tableViewBtnClone) {
        tableViewBtnClone.addEventListener('click', () => {
            toggleView('table');
            syncViewButtons();
        });
    }
    if (cardsViewBtnClone) {
        cardsViewBtnClone.addEventListener('click', () => {
            toggleView('cards');
            syncViewButtons();
        });
    }
    
    // ⭐ ربط مربع البحث في النسخة المستنسخة
    const searchInputClone = document.getElementById('searchInputClone');
    const clearSearchBtnClone = document.getElementById('clearSearchBtnClone');
    
    if (searchInputClone) {
        searchInputClone.addEventListener('input', function() {
            currentSearch = this.value;
            if (typeof renderAll === 'function') renderAll();
            
            // مزامنة البحث مع النسخة الأصلية
            const originalSearch = document.getElementById('searchInput');
            if (originalSearch) originalSearch.value = this.value;
            
            // إظهار/إخفاء زر ✖
            if (clearSearchBtnClone) {
                clearSearchBtnClone.style.display = this.value ? 'flex' : 'none';
            }
            
            // ⭐ تحديث عداد البطاقات في النسخة المستنسخة
            updateCloneCardsCount();
        });
        
        // الضغط على Enter يلغي التركيز
        searchInputClone.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                this.blur();
            }
        });
    }
    
    // ⭐ ربط زر ✖ في النسخة المستنسخة - يمسح النص ويلغي التركيز
    if (clearSearchBtnClone) {
        clearSearchBtnClone.addEventListener('mousedown', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (searchInputClone) {
                searchInputClone.value = '';
                currentSearch = '';
                searchInputClone.blur(); // إلغاء التركيز
            }
            
            // إخفاء زر ✖
            this.style.display = 'none';
            
            // مزامنة مع النسخة الأصلية
            const originalSearch = document.getElementById('searchInput');
            if (originalSearch) originalSearch.value = '';
            const originalClearBtn = document.getElementById('clearSearchBtn');
            if (originalClearBtn) originalClearBtn.style.display = 'none';
            
            if (typeof renderAll === 'function') renderAll();
            
            // ⭐ تحديث عداد البطاقات في النسخة المستنسخة
            updateCloneCardsCount();
        });
    }
    
    // ⭐ ربط أزرار الفلاتر في النسخة المستنسخة
    const cloneFilterBtns = document.querySelectorAll('#filterGroupClone .filter-btn');
    cloneFilterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // تحديث الحالة في النسخة المستنسخة
            cloneFilterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // تحديث الفلتر العام
            currentFilter = this.dataset.filter;
            
            // مزامنة مع النسخة الأصلية
            const originalFilterBtns = document.querySelectorAll('#filterGroup .filter-btn');
            originalFilterBtns.forEach(b => {
                b.classList.remove('active');
                if (b.dataset.filter === currentFilter) {
                    b.classList.add('active');
                }
            });
            
            if (typeof renderAll === 'function') renderAll();
            
            // ⭐ تحديث عداد البطاقات في النسخة المستنسخة
            updateCloneCardsCount();
        });
    });
    
    console.log('✅ تم تهيئة أحداث النسخة المستنسخة');
}

// ⭐ ========== تحديث عداد البطاقات في النسخة المستنسخة ==========
function updateCloneCardsCount() {
    const cloneCardsCount = document.getElementById('cardsCountHeaderClone');
    if (!cloneCardsCount) return;
    
    // استخدام نفس دالة العد المستخدمة في الأصلية
    if (typeof getFilteredCardsCount === 'function') {
        const count = getFilteredCardsCount(currentSearch);
        cloneCardsCount.textContent = `📇 عدد البطاقات: ${count}`;
    }
}

// ========== مزامنة أزرار العرض ==========
function syncViewButtons() {
    const origTableBtn = document.getElementById('tableViewBtn');
    const origCardsBtn = document.getElementById('cardsViewBtn');
    const cloneTableBtn = document.getElementById('tableViewBtnClone');
    const cloneCardsBtn = document.getElementById('cardsViewBtnClone');
    
    if (origTableBtn && cloneTableBtn) {
        cloneTableBtn.className = origTableBtn.className;
    }
    if (origCardsBtn && cloneCardsBtn) {
        cloneCardsBtn.className = origCardsBtn.className;
    }
}

// ========== مزامنة كل شيء عند الدخول لوضع ملء الشاشة ==========
function syncAllToClone() {
    // مزامنة البحث
    const originalSearch = document.getElementById('searchInput');
    const cloneSearch = document.getElementById('searchInputClone');
    if (originalSearch && cloneSearch) {
        cloneSearch.value = originalSearch.value;
        currentSearch = originalSearch.value;
    }
    
    // مزامنة زر ✖
    const originalClearBtn = document.getElementById('clearSearchBtn');
    const cloneClearBtn = document.getElementById('clearSearchBtnClone');
    if (originalClearBtn && cloneClearBtn) {
        cloneClearBtn.style.display = originalClearBtn.style.display;
    }
    
    // مزامنة أزرار العرض
    syncViewButtons();
    
    // مزامنة أزرار الفلاتر
    const originalFilterBtns = document.querySelectorAll('#filterGroup .filter-btn');
    const cloneFilterBtns = document.querySelectorAll('#filterGroupClone .filter-btn');
    cloneFilterBtns.forEach((btn, i) => {
        if (originalFilterBtns[i]) {
            btn.className = originalFilterBtns[i].className;
        }
    });
    
    // ⭐ مزامنة عداد البطاقات
    updateCloneCardsCount();
    
    // مزامنة حالة المزامنة
    const originalSync = document.getElementById('syncStatus');
    const cloneSync = document.getElementById('syncStatusClone');
    if (originalSync && cloneSync) {
        cloneSync.innerHTML = originalSync.innerHTML;
    }
}

// ========== مزامنة كل شيء عند الخروج من وضع ملء الشاشة ==========
function syncAllFromClone() {
    // مزامنة البحث
    const cloneSearch = document.getElementById('searchInputClone');
    const originalSearch = document.getElementById('searchInput');
    if (cloneSearch && originalSearch) {
        originalSearch.value = cloneSearch.value;
        currentSearch = cloneSearch.value;
    }
    
    // مزامنة أزرار الفلاتر
    const cloneFilterBtns = document.querySelectorAll('#filterGroupClone .filter-btn');
    const originalFilterBtns = document.querySelectorAll('#filterGroup .filter-btn');
    originalFilterBtns.forEach((btn, i) => {
        if (cloneFilterBtns[i]) {
            btn.className = cloneFilterBtns[i].className;
        }
    });
    
    // تحديث currentFilter
    const activeClone = document.querySelector('#filterGroupClone .filter-btn.active');
    if (activeClone) {
        currentFilter = activeClone.dataset.filter;
    }
}

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

// ========== إعداد زر الرجوع للأعلى في وضع ملء الشاشة ==========
function setupFullscreenScrollToTop() {
    const scrollBtn = document.getElementById('scrollToTopBtn');
    const tableWrapper = document.getElementById('tableWrapper');
    
    if (!scrollBtn || !tableWrapper) return;
    
    // دالة إظهار/إخفاء زر الرجوع للأعلى بناءً على تمرير الجدول
    const fullscreenScrollHandler = function() {
        if (tableWrapper.scrollTop > 300) {
            scrollBtn.style.display = 'flex';
        } else {
            scrollBtn.style.display = 'none';
        }
    };
    
    // ربط الحدث
    tableWrapper.addEventListener('scroll', fullscreenScrollHandler);
    
    // حفظ المرجع لإزالته لاحقًا
    tableWrapper._fullscreenScrollHandler = fullscreenScrollHandler;
    
    // إعداد النقر للرجوع للأعلى
    scrollBtn._fullscreenClickHandler = function() {
        tableWrapper.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };
    scrollBtn.addEventListener('click', scrollBtn._fullscreenClickHandler);
    
    // إظهار الزر مباشرة (سيكون مخفيًا افتراضيًا حتى يتم التمرير)
    scrollBtn.style.display = 'none';
    
    // فحص أولي إذا كان هناك تمرير بالفعل
    fullscreenScrollHandler();
}

// ========== إزالة إعدادات زر الرجوع للأعلى عند الخروج ==========
function cleanupFullscreenScrollToTop() {
    const scrollBtn = document.getElementById('scrollToTopBtn');
    const tableWrapper = document.getElementById('tableWrapper');
    
    if (scrollBtn && tableWrapper) {
        // إزالة مستمع التمرير
        if (tableWrapper._fullscreenScrollHandler) {
            tableWrapper.removeEventListener('scroll', tableWrapper._fullscreenScrollHandler);
            delete tableWrapper._fullscreenScrollHandler;
        }
        
        // إزالة مستمع النقر
        if (scrollBtn._fullscreenClickHandler) {
            scrollBtn.removeEventListener('click', scrollBtn._fullscreenClickHandler);
            delete scrollBtn._fullscreenClickHandler;
        }
        
        // إخفاء الزر وإعادته للحالة الطبيعية (سيتحكم به مستمع window scroll في app.js)
        scrollBtn.style.display = 'none';
    }
}

// ========== تعطيل مستمع window.scroll مؤقتًا ==========
function disableWindowScrollButton() {
    const scrollBtn = document.getElementById('scrollToTopBtn');
    if (!scrollBtn) return;
    
    // حفظ الدالة الأصلية إن وجدت (من app.js)
    if (!originalWindowScrollHandler) {
        // نبحث عن المستمع الأصلي عن طريق استبداله
        const originalHandler = function() {
            if (window.scrollY > 300) {
                scrollBtn.style.display = 'flex';
            } else {
                scrollBtn.style.display = 'none';
            }
        };
        // إزالة أي مستمع سابق (لا يمكن تحديده بالضبط، لذا نزيل الكل مؤقتًا)
        window.removeEventListener('scroll', originalHandler);
        // نخزن الدالة لاستعادتها لاحقًا
        originalWindowScrollHandler = originalHandler;
    }
    
    // إخفاء الزر بالقوة لأن window.scrollY قد يكون 0
    scrollBtn.style.display = 'none';
}

// ========== إعادة تفعيل مستمع window.scroll ==========
function enableWindowScrollButton() {
    const scrollBtn = document.getElementById('scrollToTopBtn');
    if (!scrollBtn) return;
    
    if (originalWindowScrollHandler) {
        window.addEventListener('scroll', originalWindowScrollHandler);
        // نترك المستمع يستمر في العمل بشكل طبيعي
        // لا نحتاج لحذف originalWindowScrollHandler لأننا سنعيد استخدامه في المرات القادمة
    }
    
    // نخفي الزر حتى يقرر المستمع إظهاره
    scrollBtn.style.display = 'none';
    // تشغيل تقييم سريع
    if (originalWindowScrollHandler) {
        originalWindowScrollHandler();
    }
}

// ========== دخول وضع ملء الشاشة ==========
function enterFullscreen(section, btn) {
    // ⭐ إخفاء العناصر الأصلية خارج table-section
    const originalToolbarArea = document.getElementById('toolbarArea');
    if (originalToolbarArea) {
        originalToolbarArea.classList.add('fullscreen-hidden');
    }
    
    // ⭐ مزامنة كل شيء إلى النسخة المستنسخة
    syncAllToClone();
    
    // ⭐ إظهار النسخ داخل table-section
    const cloneToolbarArea = document.getElementById('toolbarAreaClone');
    if (cloneToolbarArea) {
        cloneToolbarArea.style.display = 'flex';
    }
    
    // ⭐ نقل الزر إلى body عشان يظهر ثابت فوق الكل
    document.body.appendChild(btn);
    
    // ⭐ تعطيل مستمع window.scroll للزر وتفعيل مستمع tableWrapper
    disableWindowScrollButton();
    setupFullscreenScrollToTop();
    
    section.classList.add('fullscreen');
    btn.innerHTML = '✖';
    btn.title = 'إغلاق وضع ملء الشاشة';
    disableBodyScroll();
    
    // ⭐ تحديث العرض بعد الدخول
    if (typeof renderAll === 'function') renderAll();
    
    // ⭐ إضافة حالة في الـ history عشان زر الرجوع يخرج من ملء الشاشة
    history.pushState({ fullscreen: true }, '', '');
    
    console.log('✅ تم الدخول في وضع ملء الشاشة');
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
    
    // ⭐ مزامنة كل شيء من النسخة المستنسخة إلى الأصلية
    syncAllFromClone();
    
    // ⭐ إرجاع الزر إلى مكانه الأصلي
    const topRow = document.querySelector('.toolbar-top-row');
    if (topRow && btn.parentNode === document.body) {
        topRow.insertBefore(btn, topRow.firstChild);
    }
    
    // ⭐ تنظيف إعدادات زر الرجوع للأعلى وإعادة تفعيل window.scroll
    cleanupFullscreenScrollToTop();
    enableWindowScrollButton();
    
    section.classList.remove('fullscreen');
    btn.innerHTML = '🖥️';
    btn.title = 'تكبير الجدول';
    enableBodyScroll();
    
    // ⭐ تحديث العرض بعد الخروج
    if (typeof renderAll === 'function') renderAll();
    
    console.log('✅ تم الخروج من وضع ملء الشاشة');
    
    // ⭐ لو الخروج تم عن طريق زر الرجوع
    if (isBackButton && history.state && history.state.fullscreen) {
        history.back();
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

// ========== استدعاء تهيئة الأحداث عند تحميل الصفحة ==========
window.addEventListener('DOMContentLoaded', function() {
    initCloneEvents();
});
