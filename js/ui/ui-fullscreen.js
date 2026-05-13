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
        // ⭐ حفظ المكان الأصلي للعناصر قبل النقل
        btn._originalParent = btn.parentElement;
        btn._originalNextSibling = btn.parentElement.nextElementSibling;
        
        toolbar._originalParent = toolbar.parentElement;
        toolbar._originalNextSibling = toolbar.nextElementSibling;
        
        cardsCountHeader._originalParent = cardsCountHeader.parentElement;
        cardsCountHeader._originalNextSibling = cardsCountHeader.nextElementSibling;
        
        if (viewToggle) {
            viewToggle._originalParent = viewToggle.parentElement;
            viewToggle._originalNextSibling = viewToggle.nextElementSibling;
        }
        
        btn.innerHTML = '✖';
        btn.title = 'إغلاق وضع ملء الشاشة';
        disableBodyScroll();
        
        // ⭐ نقل العناصر جوه الـ table-section بالترتيب
        const tableWrapper = document.getElementById('tableWrapper');
        const cardsContainer = document.getElementById('cardsViewContainer');
        
        if (tableWrapper) {
            // نقل أزرار تبديل العرض أولاً
            if (viewToggle) {
                section.insertBefore(viewToggle, tableWrapper);
            }
            // نقل عداد البطاقات
            if (cardsCountHeader) {
                section.insertBefore(cardsCountHeader, tableWrapper);
            }
            // نقل شريط الأدوات (البحث والفلاتر)
            if (toolbar) {
                section.insertBefore(toolbar, tableWrapper);
            }
        }
        
        // نقل الزر جوه الـ section
        section.insertBefore(btn, section.firstChild);
        btn.style.position = 'absolute';
        btn.style.top = '0.5rem';
        btn.style.right = '0.5rem';
        btn.style.left = 'auto';
        btn.style.zIndex = '10';
        
    } else {
        btn.innerHTML = '🖥️';
        btn.title = 'تكبير الجدول';
        enableBodyScroll();
        
        // ⭐ إرجاع كل العناصر لأماكنها الأصلية بالظبط
        if (btn._originalParent) {
            btn._originalParent.appendChild(btn);
        } else if (btnContainer) {
            btnContainer.appendChild(btn);
        }
        btn.style.position = '';
        btn.style.top = '';
        btn.style.right = '';
        btn.style.left = '';
        btn.style.zIndex = '';
        
        // إرجاع toolbar لمكانه الأصلي
        if (toolbar._originalParent) {
            if (toolbar._originalNextSibling) {
                toolbar._originalParent.insertBefore(toolbar, toolbar._originalNextSibling);
            } else {
                toolbar._originalParent.appendChild(toolbar);
            }
        }
        
        // إرجاع cardsCountHeader لمكانه الأصلي
        if (cardsCountHeader._originalParent) {
            if (cardsCountHeader._originalNextSibling) {
                cardsCountHeader._originalParent.insertBefore(cardsCountHeader, cardsCountHeader._originalNextSibling);
            } else {
                cardsCountHeader._originalParent.appendChild(cardsCountHeader);
            }
        }
        
        // إرجاع viewToggle لمكانه الأصلي
        if (viewToggle && viewToggle._originalParent) {
            if (viewToggle._originalNextSibling) {
                viewToggle._originalParent.insertBefore(viewToggle, viewToggle._originalNextSibling);
            } else {
                viewToggle._originalParent.appendChild(viewToggle);
            }
        }
        
        // تنظيف المتغيرات المؤقتة
        delete btn._originalParent;
        delete btn._originalNextSibling;
        delete toolbar._originalParent;
        delete toolbar._originalNextSibling;
        delete cardsCountHeader._originalParent;
        delete cardsCountHeader._originalNextSibling;
        if (viewToggle) {
            delete viewToggle._originalParent;
            delete viewToggle._originalNextSibling;
        }
    }
}
