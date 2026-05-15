// ========== ui-fullscreen.js - وضع ملء الشاشة للجدول ==========

function toggleFullscreenTable() {
    const section = document.getElementById('tableSection');
    const btn = document.getElementById('toggleFullscreenBtn');
    const toolbar = document.getElementById('toolbar');
    const cardsCountHeader = document.getElementById('cardsCountHeader');
    const viewToggle = document.getElementById('viewToggle');
    const btnContainer = document.getElementById('fullscreenBtnContainer');
    
    if (!section || !btn) return;
    
    const isEntering = !section.classList.contains('fullscreen');
    
    if (isEntering) {
        // ⭐ دخول وضع ملء الشاشة
        section.classList.add('fullscreen');
        
        // إنشاء شريط علوي للأدوات
        const topBar = document.createElement('div');
        topBar.id = 'fullscreenTopBar';
        topBar.style.cssText = 'position:sticky;top:0;z-index:1501;background:var(--bg-container);padding:8px;border-radius:12px;margin-bottom:8px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;';
        
        // نقل الأدوات للشريط العلوي (فوق الجدول)
        if (toolbar) topBar.appendChild(toolbar);
        if (cardsCountHeader) topBar.appendChild(cardsCountHeader);
        if (viewToggle) topBar.appendChild(viewToggle);
        
        // حط الشريط العلوي فوق الجدول
        section.insertBefore(topBar, section.firstChild);
        
        // نقل زر الإغلاق
        section.appendChild(btn);
        
        btn.innerHTML = '✖';
        btn.title = 'إغلاق وضع ملء الشاشة';
        btn.style.cssText = 'position:fixed;top:10px;right:10px;z-index:1600;';
        
        disableBodyScroll();
        
    } else {
        // ⭐ خروج من وضع ملء الشاشة
        section.classList.remove('fullscreen');
        
        // إرجاع الأدوات لأماكنها الأصلية
        const topBar = document.getElementById('fullscreenTopBar');
        if (topBar) {
            if (toolbar && btnContainer && btnContainer.parentElement) {
                btnContainer.parentElement.insertBefore(toolbar, btnContainer);
            }
            if (cardsCountHeader && btnContainer && btnContainer.parentElement) {
                btnContainer.parentElement.insertBefore(cardsCountHeader, btnContainer);
            }
            if (viewToggle && btnContainer && btnContainer.parentElement) {
                btnContainer.parentElement.insertBefore(viewToggle, btnContainer);
            }
            topBar.remove();
        }
        
        // إرجاع الزر لمكانه
        if (btnContainer && btn.parentElement !== btnContainer) {
            btnContainer.appendChild(btn);
        }
        
        btn.innerHTML = '🖥️';
        btn.title = 'تكبير الجدول';
        btn.style.cssText = '';
        
        enableBodyScroll();
    }
}
