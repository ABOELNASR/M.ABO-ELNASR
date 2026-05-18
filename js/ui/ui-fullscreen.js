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
        
        const tableWrapper = document.getElementById('tableWrapper');
        if (viewToggle) section.insertBefore(viewToggle, tableWrapper);
        if (toolbarRow) section.insertBefore(toolbarRow, tableWrapper);
        if (cardsCountHeader) section.insertBefore(cardsCountHeader, tableWrapper);
        
        section.classList.add('fullscreen');
        btn.innerHTML = '✖';
        btn.title = 'إغلاق وضع ملء الشاشة';
        disableBodyScroll();
        history.pushState({ fullscreen: true }, '', '');
    } else {
        // ⭐ خروج من وضع ملء الشاشة
        
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

// ========== حدث زر الرجوع في الهاتف ==========
window.addEventListener('popstate', function(event) {
    const section = document.getElementById('tableSection');
    if (section && section.classList.contains('fullscreen')) {
        toggleFullscreenTable();
        history.pushState({ fullscreen: true }, '', '');
    }
});
