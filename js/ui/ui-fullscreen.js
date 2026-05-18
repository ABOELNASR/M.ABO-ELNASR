// ========== ui-fullscreen.js - وضع ملء الشاشة للجدول ==========

function toggleFullscreenTable() {
    const section = document.getElementById('tableSection');
    const btn = document.getElementById('toggleFullscreenBtn');
    const viewToggle = document.getElementById('viewToggle');
    const toolbarRow = document.getElementById('toolbarRow');
    const cardsCountHeader = document.getElementById('cardsCountHeader');
    
    if (!section || !btn) return;
    
    const isEntering = !section.classList.contains('fullscreen');
    
    if (isEntering) {
        // ⭐ دخول وضع ملء الشاشة
        
        // نقل الأدوات إلى داخل table-section (قبل table-wrapper)
        const tableWrapper = document.getElementById('tableWrapper');
        if (viewToggle) section.insertBefore(viewToggle, tableWrapper);
        if (toolbarRow) section.insertBefore(toolbarRow, tableWrapper);
        if (cardsCountHeader) section.insertBefore(cardsCountHeader, tableWrapper);
        
        // ⭐ نقل الزر إلى body عشان يظهر ثابت فوق الكل
        document.body.appendChild(btn);
        
        section.classList.add('fullscreen');
        btn.innerHTML = '✖';
        btn.title = 'إغلاق وضع ملء الشاشة';
        disableBodyScroll();
        
        history.pushState({ fullscreen: true }, '', '');
    } else {
        // ⭐ خروج من وضع ملء الشاشة
        exitFullscreenMode(section, btn, viewToggle, toolbarRow, cardsCountHeader, false);
    }
}

// ========== دالة الخروج من وضع ملء الشاشة ==========
function exitFullscreenMode(section, btn, viewToggle, toolbarRow, cardsCountHeader, isBackButton) {
    if (!section || !btn) return;
    
    const parent = section.parentNode;
    
    // ⭐ إرجاع الأدوات إلى أماكنها الأصلية بنفس الترتيب: viewToggle → toolbarRow → cardsCountHeader
    if (viewToggle && viewToggle.parentNode === section) {
        parent.insertBefore(viewToggle, section);
    }
    if (toolbarRow && toolbarRow.parentNode === section) {
        parent.insertBefore(toolbarRow, section);
    }
    if (cardsCountHeader && cardsCountHeader.parentNode === section) {
        parent.insertBefore(cardsCountHeader, section);
    }
    
    // ⭐ إرجاع الزر إلى toolbarRow
    if (btn && btn.parentNode === document.body) {
        const tr = document.getElementById('toolbarRow');
        if (tr) {
            tr.appendChild(btn);
        }
    }
    
    section.classList.remove('fullscreen');
    btn.innerHTML = '🖥️';
    btn.title = 'تكبير الجدول';
    enableBodyScroll();
    
    if (isBackButton) {
        history.back();
    }
}

// ========== حدث زر الرجوع في الهاتف ==========
window.addEventListener('popstate', function(event) {
    const section = document.getElementById('tableSection');
    const btn = document.getElementById('toggleFullscreenBtn');
    const viewToggle = document.getElementById('viewToggle');
    const toolbarRow = document.getElementById('toolbarRow');
    const cardsCountHeader = document.getElementById('cardsCountHeader');
    
    if (section && section.classList.contains('fullscreen')) {
        exitFullscreenMode(section, btn, viewToggle, toolbarRow, cardsCountHeader, true);
        history.pushState({ fullscreen: true }, '', '');
    }
});
