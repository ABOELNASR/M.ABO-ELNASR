// ========== ui-fullscreen.js - وضع ملء الشاشة للجدول ==========

function toggleFullscreenTable() {
    const section = document.getElementById('tableSection');
    const btn = document.getElementById('toggleFullscreenBtn');
    const toolbar = document.getElementById('toolbar');
    const cardsCountHeader = document.getElementById('cardsCountHeader');
    
    if (!section || !btn) return;
    
    section.classList.toggle('fullscreen');
    
    if (section.classList.contains('fullscreen')) {
        btn.innerHTML = '✖';
        btn.title = 'إغلاق وضع ملء الشاشة';
        disableBodyScroll();
        
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
        
        if (toolbar && cardsCountHeader) {
            const formCard = document.getElementById('addSubscriberCard');
            if (formCard) {
                formCard.insertAdjacentElement('afterend', toolbar);
                toolbar.insertAdjacentElement('beforebegin', cardsCountHeader);
            }
        }
    }
}