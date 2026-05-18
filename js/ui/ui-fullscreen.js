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
        }
        if (toolbarRowClone && toolbarRow) {
            toolbarRowClone.innerHTML = toolbarRow.innerHTML;
            toolbarRowClone.style.display = '';
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

window.addEventListener('popstate', function(event) {
    const section = document.getElementById('tableSection');
    if (section && section.classList.contains('fullscreen')) {
        toggleFullscreenTable();
        history.pushState({ fullscreen: true }, '', '');
    }
});
