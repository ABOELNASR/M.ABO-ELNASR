// ========== ui-fullscreen.js - وضع ملء الشاشة للجدول ==========

function toggleFullscreenTable() {
    const section = document.getElementById('tableSection');
    const btn = document.getElementById('toggleFullscreenBtn');
    const toolbar = document.getElementById('toolbar');
    const cardsCountHeader = document.getElementById('cardsCountHeader');
    const btnContainer = btn ? btn.parentElement : null;
    
    if (!section || !btn) return;
    
    section.classList.toggle('fullscreen');
    
    if (section.classList.contains('fullscreen')) {
        btn.innerHTML = '✖';
        btn.title = 'إغلاق وضع ملء الشاشة';
        disableBodyScroll();
        
        // نقل الزر جوه الـ table-section
        section.insertBefore(btn, section.firstChild);
        btn.style.position = 'absolute';
        btn.style.top = '0.5rem';
        btn.style.right = '0.5rem';
        btn.style.left = 'auto';
        btn.style.zIndex = '10';
        
        // نقل toolbar و cardsCountHeader جوه fullscreen
        if (toolbar && cardsCountHeader) {
            const tableWrapper = document.getElementById('tableWrapper');
            if (tableWrapper) {
                section.insertBefore(toolbar, tableWrapper);
                section.insertBefore(cardsCountHeader, toolbar);
            }
        }
    } else {
        btn.innerHTML = '🖥️';
        btn.title = 'تكبير الجدول';
        enableBodyScroll();
        
        // إرجاع الزر لمكانه الأصلي
        if (btnContainer) {
            btnContainer.appendChild(btn);
        }
        btn.style.position = '';
        btn.style.top = '';
        btn.style.right = '';
        btn.style.left = '';
        btn.style.zIndex = '';
        
        // إرجاع toolbar و cardsCountHeader لأماكنهم
        if (toolbar && cardsCountHeader) {
            const viewToggle = document.getElementById('viewToggle');
            if (viewToggle) {
                viewToggle.insertAdjacentElement('afterend', cardsCountHeader);
                cardsCountHeader.insertAdjacentElement('afterend', btnContainer);
            }
        }
    }
}
