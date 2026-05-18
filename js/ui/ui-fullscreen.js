// ========== ui-fullscreen.js - وضع ملء الشاشة للجدول ==========

function toggleFullscreenTable() {
    const section = document.getElementById('tableSection');
    const enterBtn = document.getElementById('enterFullscreenBtn');
    const exitBtn = document.getElementById('exitFullscreenBtn');
    const viewToggle = document.getElementById('viewToggle');
    const toolbarRow = document.getElementById('toolbarRow');
    const cardsCountHeaderRow = document.getElementById('cardsCountHeaderRow');
    
    if (!section) return;
    
    const isEntering = !section.classList.contains('fullscreen');
    
    if (isEntering) {
        // ⭐ دخول وضع ملء الشاشة - إنشاء نسخ وإضافتها لـ tableSection
        
        const tableWrapper = document.getElementById('tableWrapper');
        
        // إنشاء نسخ من العناصر الأصلية (العناصر الأصلية تفضل في مكانها)
        if (viewToggle) {
            const clone = viewToggle.cloneNode(true);
            clone.id = 'viewToggleClone';
            section.insertBefore(clone, tableWrapper);
        }
        if (toolbarRow) {
            const clone = toolbarRow.cloneNode(true);
            clone.id = 'toolbarRowClone';
            section.insertBefore(clone, tableWrapper);
        }
        if (cardsCountHeaderRow) {
            const clone = cardsCountHeaderRow.cloneNode(true);
            clone.id = 'cardsCountHeaderRowClone';
            section.insertBefore(clone, tableWrapper);
        }
        
        // إخفاء العناصر الأصلية
        if (viewToggle) viewToggle.style.display = 'none';
        if (toolbarRow) toolbarRow.style.display = 'none';
        if (cardsCountHeaderRow) cardsCountHeaderRow.style.display = 'none';
        
        section.classList.add('fullscreen');
        
        // إخفاء زر الدخول، إظهار زر الخروج
        if (enterBtn) enterBtn.style.display = 'none';
        if (exitBtn) exitBtn.style.display = 'flex';
        
        disableBodyScroll();
        history.pushState({ fullscreen: true }, '', '');
    } else {
        // ⭐ خروج من وضع ملء الشاشة - حذف النسخ
        
        // حذف النسخ اللي أضفناها
        const clones = section.querySelectorAll('#viewToggleClone, #toolbarRowClone, #cardsCountHeaderRowClone');
        clones.forEach(clone => clone.remove());
        
        // إظهار العناصر الأصلية تاني
        if (viewToggle) viewToggle.style.display = '';
        if (toolbarRow) toolbarRow.style.display = '';
        if (cardsCountHeaderRow) cardsCountHeaderRow.style.display = '';
        
        section.classList.remove('fullscreen');
        
        // إظهار زر الدخول، إخفاء زر الخروج
        if (enterBtn) enterBtn.style.display = '';
        if (exitBtn) exitBtn.style.display = 'none';
        
        enableBodyScroll();
    }
}

window.addEventListener('popstate', function(event) {
    const section = document.getElementById('tableSection');
    if (section && section.classList.contains('fullscreen')) {
        toggleFullscreenTable();
        history.pushState({ fullscreen: true }, '', '');
    }
});
