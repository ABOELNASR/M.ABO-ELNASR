// ========== ui-fullscreen.js - وضع ملء الشاشة للجدول ==========

function toggleFullscreenTable() {
    const section = document.getElementById('tableSection');
    const btn = document.getElementById('toggleFullscreenBtn');
    const toolbar = document.getElementById('toolbar');
    const cardsCountHeader = document.getElementById('cardsCountHeader');
    const btnContainer = document.getElementById('fullscreenBtnContainer');
    const viewToggle = document.getElementById('viewToggle');
    
    if (!section || !btn) return;
    
    section.classList.toggle('fullscreen');
    
    if (section.classList.contains('fullscreen')) {
        // ⭐ تخزين العناصر الأصلية قبل أي تغيير
        const originalElements = {
            toolbar: { element: toolbar, parent: toolbar.parentElement, next: toolbar.nextElementSibling },
            viewToggle: { element: viewToggle, parent: viewToggle.parentElement, next: viewToggle.nextElementSibling },
            cardsCountHeader: { element: cardsCountHeader, parent: cardsCountHeader.parentElement, next: cardsCountHeader.nextElementSibling },
            btn: { element: btn, parent: btn.parentElement, next: btn.parentElement.nextElementSibling }
        };
        
        // تخزين في الـ section لاستخدامها لاحقاً
        section._originalElements = originalElements;
        
        btn.innerHTML = '✖';
        btn.title = 'إغلاق وضع ملء الشاشة';
        disableBodyScroll();
        
        // نقل العناصر جوه الـ section
        section.insertBefore(toolbar, section.firstChild);
        section.insertBefore(cardsCountHeader, toolbar);
        section.insertBefore(viewToggle, cardsCountHeader);
        section.insertBefore(btn, viewToggle);
        
        btn.style.position = 'absolute';
        btn.style.top = '0.5rem';
        btn.style.right = '0.5rem';
        btn.style.left = 'auto';
        btn.style.zIndex = '10';
        
    } else {
        btn.innerHTML = '🖥️';
        btn.title = 'تكبير الجدول';
        enableBodyScroll();
        
        btn.style.position = '';
        btn.style.top = '';
        btn.style.right = '';
        btn.style.left = '';
        btn.style.zIndex = '';
        
        // ⭐ إرجاع كل العناصر لأماكنها الأصلية بالترتيب العكسي
        const original = section._originalElements;
        
        if (original && original.toolbar && original.toolbar.parent) {
            if (original.toolbar.next) {
                original.toolbar.parent.insertBefore(toolbar, original.toolbar.next);
            } else {
                original.toolbar.parent.appendChild(toolbar);
            }
        }
        
        if (original && original.viewToggle && original.viewToggle.parent) {
            if (original.viewToggle.next) {
                original.viewToggle.parent.insertBefore(viewToggle, original.viewToggle.next);
            } else {
                original.viewToggle.parent.appendChild(viewToggle);
            }
        }
        
        if (original && original.cardsCountHeader && original.cardsCountHeader.parent) {
            if (original.cardsCountHeader.next) {
                original.cardsCountHeader.parent.insertBefore(cardsCountHeader, original.cardsCountHeader.next);
            } else {
                original.cardsCountHeader.parent.appendChild(cardsCountHeader);
            }
        }
        
        if (original && original.btn && original.btn.parent) {
            if (original.btn.next) {
                original.btn.parent.insertBefore(btnContainer || btn, original.btn.next);
            } else {
                original.btn.parent.appendChild(btnContainer || btn);
            }
        }
        
        // لو الزر مش في الحاوية، رجعه للحاوية
        if (btnContainer && btn.parentElement !== btnContainer) {
            btnContainer.appendChild(btn);
        }
        
        // تنظيف
        delete section._originalElements;
    }
}
