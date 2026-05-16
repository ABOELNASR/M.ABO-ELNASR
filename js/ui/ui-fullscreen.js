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
        
        section.classList.add('fullscreen');
        btn.innerHTML = '✖';
        btn.title = 'إغلاق وضع ملء الشاشة';
        disableBodyScroll();
    } else {
        // ⭐ خروج من وضع ملء الشاشة
        
        // إرجاع الأدوات إلى أماكنها الأصلية (قبل table-section)
        const parent = section.parentNode;
        if (viewToggle && viewToggle.parentNode === section) {
            parent.insertBefore(viewToggle, section);
        }
        if (toolbarRow && toolbarRow.parentNode === section) {
            parent.insertBefore(toolbarRow, section);
        }
        if (cardsCountHeader && cardsCountHeader.parentNode === section) {
            parent.insertBefore(cardsCountHeader, section);
        }
        
        section.classList.remove('fullscreen');
        btn.innerHTML = '🖥️';
        btn.title = 'تكبير الجدول';
        enableBodyScroll();
    }
}
