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
        if (viewToggle && viewToggle.parentNode !== section) {
            section.insertBefore(viewToggle, tableWrapper);
        }
        if (toolbarRow && toolbarRow.parentNode !== section) {
            section.insertBefore(toolbarRow, tableWrapper);
        }
        if (cardsCountHeader && cardsCountHeader.parentNode !== section) {
            section.insertBefore(cardsCountHeader, tableWrapper);
        }
        
        // ⭐ إظهار الزر وجعله ثابت
        btn.style.display = 'flex';
        btn.style.position = 'fixed';
        btn.style.top = '10px';
        btn.style.right = '10px';
        btn.style.zIndex = '1600';
        btn.style.width = '36px';
        btn.style.height = '36px';
        btn.style.borderRadius = '50%';
        btn.style.fontSize = '1.2rem';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.background = 'var(--danger)';
        btn.style.color = 'white';
        btn.style.border = 'none';
        btn.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.25)';
        btn.style.cursor = 'pointer';
        btn.style.padding = '0';
        btn.innerHTML = '✖';
        btn.title = 'إغلاق وضع ملء الشاشة';
        
        section.classList.add('fullscreen');
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
        
        // ⭐ إرجاع الزر لوضعه الطبيعي
        btn.style.display = '';
        btn.style.position = '';
        btn.style.top = '';
        btn.style.right = '';
        btn.style.zIndex = '';
        btn.style.width = '';
        btn.style.height = '';
        btn.style.borderRadius = '';
        btn.style.fontSize = '';
        btn.style.alignItems = '';
        btn.style.justifyContent = '';
        btn.style.background = '';
        btn.style.color = '';
        btn.style.border = '';
        btn.style.boxShadow = '';
        btn.style.cursor = '';
        btn.style.padding = '';
        btn.innerHTML = '🖥️';
        btn.title = 'تكبير الجدول';
        
        section.classList.remove('fullscreen');
        enableBodyScroll();
    }
}
