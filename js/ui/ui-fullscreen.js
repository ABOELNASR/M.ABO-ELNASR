// ========== ui-fullscreen.js - وضع ملء الشاشة للجدول ==========

let savedElements = [];

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
        // ⭐ حفظ المواقع الأصلية
        savedElements = [];
        
        [toolbar, cardsCountHeader, viewToggle, btn].forEach(el => {
            if (el && el.parentElement) {
                savedElements.push({
                    el: el,
                    parent: el.parentElement,
                    nextSibling: el.nextElementSibling
                });
            }
        });
        
        btn.innerHTML = '✖';
        btn.title = 'إغلاق وضع ملء الشاشة';
        disableBodyScroll();
        
        // ⭐ نقل العناصر جوه الـ section فوق الجدول بالترتيب:
        // 1. أزرار التبديل 2. toolbar 3. عدد البطاقات 4. الجدول
        
        const tableWrapper = document.getElementById('tableWrapper');
        const cardsContainer = document.getElementById('cardsViewContainer');
        const referenceNode = tableWrapper || cardsContainer || section.firstChild;
        
        if (cardsCountHeader) section.insertBefore(cardsCountHeader, referenceNode);
        if (toolbar) section.insertBefore(toolbar, cardsCountHeader || referenceNode);
        if (viewToggle) section.insertBefore(viewToggle, toolbar || cardsCountHeader || referenceNode);
        
        // ⭐ زر الخروج - fixed فوق على اليمين
        document.body.appendChild(btn);
        btn.style.cssText = 'position:fixed;top:10px;right:10px;left:auto;z-index:1600;';
        
    } else {
        btn.innerHTML = '🖥️';
        btn.title = 'تكبير الجدول';
        enableBodyScroll();
        
        btn.style.cssText = '';
        
        // ⭐ إرجاع كل عنصر لمكانه الأصلي بالترتيب الصحيح
        // من فوق لتحت: viewToggle → toolbar → cardsCountHeader → btn
        savedElements.forEach(saved => {
            if (saved.parent && saved.el && saved.el.parentElement !== saved.parent) {
                try {
                    if (saved.nextSibling && saved.nextSibling.parentElement === saved.parent) {
                        saved.parent.insertBefore(saved.el, saved.nextSibling);
                    } else {
                        saved.parent.appendChild(saved.el);
                    }
                } catch (e) {
                    saved.parent.appendChild(saved.el);
                }
            }
        });
        
        // تأكيد رجوع الزر للحاوية الأصلية
        if (btnContainer && btn.parentElement !== btnContainer) {
            btnContainer.appendChild(btn);
        }
        
        savedElements = [];
    }
}
