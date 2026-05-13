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
        
        // بنضيف بالعكس عشان كل واحد يتحط قبل اللي بعده
        if (cardsCountHeader) {
            section.insertBefore(cardsCountHeader, referenceNode);
        }
        if (toolbar) {
            section.insertBefore(toolbar, cardsCountHeader || referenceNode);
        }
        if (viewToggle) {
            section.insertBefore(viewToggle, toolbar || cardsCountHeader || referenceNode);
        }
        
        // ⭐ زر الخروج - fixed فوق على اليمين
        document.body.appendChild(btn);
        btn.style.position = 'fixed';
        btn.style.top = '10px';
        btn.style.right = '10px';
        btn.style.left = 'auto';
        btn.style.zIndex = '1600';
        btn.style.width = 'auto';
        btn.style.height = 'auto';
        btn.style.borderRadius = '50%';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.padding = '4px 8px';
        btn.style.fontSize = '0.9rem';
        
    } else {
        btn.innerHTML = '🖥️';
        btn.title = 'تكبير الجدول';
        enableBodyScroll();
        
        // ⭐ تنظيف خصائص الزر
        btn.style.position = '';
        btn.style.top = '';
        btn.style.right = '';
        btn.style.left = '';
        btn.style.zIndex = '';
        btn.style.width = '';
        btn.style.height = '';
        btn.style.borderRadius = '';
        btn.style.display = '';
        btn.style.alignItems = '';
        btn.style.justifyContent = '';
        btn.style.padding = '';
        btn.style.fontSize = '';
        
        // ⭐ إرجاع كل العناصر لأماكنها الأصلية بالعكس
        // بنرجع بالعكس عشان الترتيب يضبط
        const reversed = [...savedElements].reverse();
        
        reversed.forEach(saved => {
            if (saved.parent && saved.el) {
                try {
                    if (saved.nextSibling && saved.nextSibling.parentElement === saved.parent) {
                        saved.parent.insertBefore(saved.el, saved.nextSibling);
                    } else {
                        saved.parent.appendChild(saved.el);
                    }
                } catch (e) {
                    if (saved.parent) {
                        saved.parent.appendChild(saved.el);
                    }
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
