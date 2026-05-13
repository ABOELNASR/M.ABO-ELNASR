// ========== ui-fullscreen.js - وضع ملء الشاشة للجدول ==========

// مصفوفة لتخزين العناصر اللي هتتنقل وبياناتها الأصلية
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
        // ⭐ حفظ المواقع الأصلية للعناصر اللي هتنتقل
        savedElements = [];
        
        const elementsToMove = [
            { el: toolbar, id: 'toolbar' },
            { el: cardsCountHeader, id: 'cardsCountHeader' },
            { el: viewToggle, id: 'viewToggle' }
        ];
        
        elementsToMove.forEach(item => {
            if (item.el) {
                savedElements.push({
                    el: item.el,
                    parent: item.el.parentElement,
                    nextSibling: item.el.nextElementSibling
                });
            }
        });
        
        // حفظ مكان الزر
        if (btn.parentElement) {
            savedElements.push({
                el: btn,
                parent: btn.parentElement,
                nextSibling: btn.nextElementSibling
            });
        }
        
        btn.innerHTML = '✖';
        btn.title = 'إغلاق وضع ملء الشاشة';
        disableBodyScroll();
        
        // نقل العناصر جوه الـ section بالترتيب المطلوب
        if (toolbar) section.appendChild(toolbar);
        if (cardsCountHeader) section.appendChild(cardsCountHeader);
        if (viewToggle) section.appendChild(viewToggle);
        section.appendChild(btn);
        
        btn.style.position = 'fixed';
        btn.style.top = '10px';
        btn.style.right = '10px';
        btn.style.zIndex = '1600';
        
    } else {
        btn.innerHTML = '🖥️';
        btn.title = 'تكبير الجدول';
        enableBodyScroll();
        
        btn.style.position = '';
        btn.style.top = '';
        btn.style.right = '';
        btn.style.zIndex = '';
        
        // ⭐ إرجاع كل العناصر لأماكنها الأصلية
        savedElements.forEach(saved => {
            if (saved.parent && saved.el) {
                if (saved.nextSibling && saved.nextSibling.parentElement === saved.parent) {
                    saved.parent.insertBefore(saved.el, saved.nextSibling);
                } else {
                    saved.parent.appendChild(saved.el);
                }
            }
        });
        
        // لو الزر رجع لغير مكانه، رجعه للحاوية
        if (btnContainer && btn.parentElement !== btnContainer) {
            btnContainer.appendChild(btn);
        }
        
        savedElements = [];
    }
}
