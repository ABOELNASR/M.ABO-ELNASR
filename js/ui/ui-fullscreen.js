// ========== ui-fullscreen.js - وضع ملء الشاشة للجدول ==========

let originalHTML = null;
let fullscreenClones = {};

function toggleFullscreenTable() {
    const section = document.getElementById('tableSection');
    const btn = document.getElementById('toggleFullscreenBtn');
    const toolbar = document.getElementById('toolbar');
    const cardsCountHeader = document.getElementById('cardsCountHeader');
    const viewToggle = document.getElementById('viewToggle');
    const btnContainer = document.getElementById('fullscreenBtnContainer');
    
    if (!section || !btn) return;
    
    section.classList.toggle('fullscreen');
    
    if (section.classList.contains('fullscreen')) {
        // ⭐ حفظ الموقع الأصلي لكل عنصر في الـ DOM باستخدام placeholder
        const placeholders = {};
        
        [toolbar, cardsCountHeader, viewToggle].forEach(el => {
            if (el && el.parentElement) {
                const placeholder = document.createElement('div');
                placeholder.setAttribute('data-placeholder', el.id);
                placeholder.style.display = 'none';
                el.parentElement.insertBefore(placeholder, el);
                placeholders[el.id] = placeholder;
            }
        });
        
        // حفظ في الـ section
        section._placeholders = placeholders;
        
        btn.innerHTML = '✖';
        btn.title = 'إغلاق وضع ملء الشاشة';
        disableBodyScroll();
        
        // نقل العناصر جوه الـ section بالترتيب
        const tableWrapper = document.getElementById('tableWrapper');
        const referenceNode = tableWrapper || section.firstChild;
        
        if (cardsCountHeader) section.insertBefore(cardsCountHeader, referenceNode);
        if (toolbar) section.insertBefore(toolbar, cardsCountHeader || referenceNode);
        if (viewToggle) section.insertBefore(viewToggle, toolbar || cardsCountHeader || referenceNode);
        
        // زر الخروج
        document.body.appendChild(btn);
        btn.style.cssText = 'position:fixed;top:10px;right:10px;z-index:1600;';
        
    } else {
        btn.innerHTML = '🖥️';
        btn.title = 'تكبير الجدول';
        enableBodyScroll();
        
        btn.style.cssText = '';
        
        // ⭐ إرجاع العناصر لأماكنها الأصلية باستخدام placeholders
        const placeholders = section._placeholders || {};
        
        [viewToggle, toolbar, cardsCountHeader].forEach(el => {
            if (el) {
                const placeholder = placeholders[el.id];
                if (placeholder && placeholder.parentElement) {
                    placeholder.parentElement.insertBefore(el, placeholder);
                    placeholder.remove();
                }
            }
        });
        
        // رجوع الزر
        if (btnContainer && btn.parentElement !== btnContainer) {
            btnContainer.appendChild(btn);
        }
        
        delete section._placeholders;
    }
}
