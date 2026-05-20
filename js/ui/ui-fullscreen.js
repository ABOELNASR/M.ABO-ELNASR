// ========== ui-fullscreen.js - وضع ملء الشاشة للجدول ==========

// ⭐ ========== تخزين الأماكن الأصلية للعناصر ==========
let originalPositions = null;

function saveOriginalPositions() {
    const toolbarArea = document.getElementById('toolbarArea');
    const viewToggle = document.getElementById('viewToggle');
    const toggleFullscreenBtn = document.getElementById('toggleFullscreenBtn');
    const filterGroup = document.getElementById('filterGroup');
    const cardsCountHeader = document.getElementById('cardsCountHeader');
    const syncStatus = document.getElementById('syncStatus');
    const tableSection = document.getElementById('tableSection');
    
    originalPositions = {
        toolbarArea: toolbarArea ? toolbarArea.parentNode : null,
        viewToggle: viewToggle ? viewToggle.parentNode : null,
        toggleFullscreenBtn: toggleFullscreenBtn ? toggleFullscreenBtn.parentNode : null,
        filterGroup: filterGroup ? filterGroup.parentNode : null,
        cardsCountHeader: cardsCountHeader ? cardsCountHeader.parentNode : null,
        syncStatus: syncStatus ? syncStatus.parentNode : null,
        // ⭐ تخزين مكان table-section الأصلي
        tableSectionParent: tableSection ? tableSection.parentNode : null,
        tableSectionNextSibling: tableSection ? tableSection.nextSibling : null,
        // ⭐ تخزين العناصر نفسها
        toolbarAreaEl: toolbarArea,
        viewToggleEl: viewToggle,
        toggleFullscreenBtnEl: toggleFullscreenBtn,
        filterGroupEl: filterGroup,
        cardsCountHeaderEl: cardsCountHeader,
        syncStatusEl: syncStatus,
        tableSectionEl: tableSection
    };
    
    console.log('✅ تم حفظ الأماكن الأصلية للعناصر');
}

function restoreOriginalPositions() {
    if (!originalPositions) {
        console.warn('⚠️ لا توجد أماكن أصلية محفوظة');
        return;
    }
    
    const pos = originalPositions;
    
    // ⭐ إرجاع كل عنصر إلى أبيه الأصلي
    if (pos.viewToggleEl && pos.viewToggle) {
        pos.viewToggle.insertBefore(pos.viewToggleEl, pos.viewToggle.firstChild);
    }
    
    if (pos.toggleFullscreenBtnEl && pos.toggleFullscreenBtn) {
        pos.toggleFullscreenBtn.appendChild(pos.toggleFullscreenBtnEl);
    }
    
    if (pos.filterGroupEl && pos.filterGroup) {
        pos.filterGroup.appendChild(pos.filterGroupEl);
    }
    
    if (pos.cardsCountHeaderEl && pos.cardsCountHeader) {
        pos.cardsCountHeader.appendChild(pos.cardsCountHeaderEl);
    }
    
    if (pos.syncStatusEl && pos.syncStatus) {
        pos.syncStatus.appendChild(pos.syncStatusEl);
    }
    
    // ⭐ إرجاع tableSection إلى مكانها الأصلي
    if (pos.tableSectionEl && pos.tableSectionParent) {
        if (pos.tableSectionNextSibling) {
            pos.tableSectionParent.insertBefore(pos.tableSectionEl, pos.tableSectionNextSibling);
        } else {
            pos.tableSectionParent.appendChild(pos.tableSectionEl);
        }
    }
    
    // ⭐ إرجاع toolbarArea إلى مكانها الأصلي
    if (pos.toolbarAreaEl && pos.toolbarArea) {
        if (pos.tableSectionEl && pos.tableSectionEl.parentNode) {
            pos.tableSectionEl.parentNode.insertBefore(pos.toolbarAreaEl, pos.tableSectionEl);
        }
    }
    
    console.log('✅ تم استعادة الأماكن الأصلية للعناصر');
    originalPositions = null;
}

// ========== دالة الدخول والخروج من وضع ملء الشاشة ==========
function toggleFullscreenTable() {
    const section = document.getElementById('tableSection');
    const btn = document.getElementById('toggleFullscreenBtn');
    const toolbarArea = document.getElementById('toolbarArea');
    
    if (!section || !btn) return;
    
    const isEntering = !section.classList.contains('fullscreen');
    
    if (isEntering) {
        // ⭐ دخول وضع ملء الشاشة
        
        // حفظ الأماكن الأصلية قبل أي تغيير
        saveOriginalPositions();
        
        // نقل toolbarArea إلى داخل table-section (قبل table-wrapper)
        if (toolbarArea) {
            const tableWrapper = document.getElementById('tableWrapper');
            section.insertBefore(toolbarArea, tableWrapper);
        }
        
        // نقل الزر إلى body عشان يظهر ثابت فوق الكل
        document.body.appendChild(btn);
        
        section.classList.add('fullscreen');
        btn.innerHTML = '✖';
        btn.title = 'إغلاق وضع ملء الشاشة';
        disableBodyScroll();
        
        // إضافة حالة في الـ history عشان زر الرجوع يخرج من ملء الشاشة
        history.pushState({ fullscreen: true }, '', '');
        
        console.log('✅ تم الدخول في وضع ملء الشاشة');
    } else {
        // ⭐ خروج من وضع ملء الشاشة
        exitFullscreenMode(false);
    }
}

// ========== دالة الخروج من وضع ملء الشاشة ==========
function exitFullscreenMode(isBackButton) {
    const section = document.getElementById('tableSection');
    const btn = document.getElementById('toggleFullscreenBtn');
    
    if (!section || !btn) return;
    
    // استعادة الأماكن الأصلية
    restoreOriginalPositions();
    
    // لو الزر لسه في body، نرجعه لمكانه الأصلي
    if (btn.parentNode === document.body && originalPositions) {
        // تمت الاستعادة بالفعل في restoreOriginalPositions
    }
    
    // لو لسه في body وما اترجعش، نرجعه للـ toolbar-top-row
    if (btn.parentNode === document.body) {
        const topRow = document.querySelector('.toolbar-top-row');
        if (topRow) {
            topRow.appendChild(btn);
        }
    }
    
    section.classList.remove('fullscreen');
    btn.innerHTML = '🖥️';
    btn.title = 'تكبير الجدول';
    enableBodyScroll();
    
    console.log('✅ تم الخروج من وضع ملء الشاشة');
    
    // لو الخروج تم عن طريق زر الرجوع، نرجع خطوة في الـ history
    if (isBackButton) {
        history.back();
    }
}

// ========== حدث زر الرجوع في الهاتف ==========
window.addEventListener('popstate', function(event) {
    const section = document.getElementById('tableSection');
    
    if (section && section.classList.contains('fullscreen')) {
        exitFullscreenMode(true);
        
        // منع الخروج الفعلي من الصفحة
        history.pushState({ fullscreen: true }, '', '');
    }
});

// ========== حدث ESC للخروج من ملء الشاشة ==========
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const section = document.getElementById('tableSection');
        if (section && section.classList.contains('fullscreen')) {
            exitFullscreenMode(false);
        }
    }
});
