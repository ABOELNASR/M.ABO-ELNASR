// ========== ui-fullscreen.js - وضع ملء الشاشة للجدول ==========

function toggleFullscreenTable() {
    const section = document.getElementById('tableSection');
    const btn = document.getElementById('toggleFullscreenBtn');
    const viewToggle = document.getElementById('viewToggle');
    const toolbarRow = document.getElementById('toolbarRow');
    const cardsCountHeader = document.getElementById('cardsCountHeader');
    const btnContainer = document.getElementById('fullscreenBtnContainer');
    
    if (!section || !btn) return;
    
    const isEntering = !section.classList.contains('fullscreen');
    
    if (isEntering) {
        // ⭐ دخول وضع ملء الشاشة
        
        // نقل الأدوات إلى داخل table-section (قبل table-wrapper)
        const tableWrapper = document.getElementById('tableWrapper');
        if (viewToggle) section.insertBefore(viewToggle, tableWrapper);
        if (toolbarRow) section.insertBefore(toolbarRow, tableWrapper);
        if (cardsCountHeader) section.insertBefore(cardsCountHeader, tableWrapper);
        
        // ⭐ نقل الزر إلى body عشان يظهر ثابت فوق الكل
        document.body.appendChild(btn);
        
        section.classList.add('fullscreen');
        btn.innerHTML = '✖';
        btn.title = 'إغلاق وضع ملء الشاشة';
        disableBodyScroll();
        
        // ⭐ إضافة حالة في الـ history عشان زر الرجوع يخرج من ملء الشاشة
        history.pushState({ fullscreen: true }, '', '');
    } else {
        // ⭐ خروج من وضع ملء الشاشة
        exitFullscreenMode(section, btn, viewToggle, toolbarRow, cardsCountHeader, btnContainer, false);
    }
}

// ========== دالة الخروج من وضع ملء الشاشة ==========
function exitFullscreenMode(section, btn, viewToggle, toolbarRow, cardsCountHeader, btnContainer, isBackButton) {
    if (!section || !btn) return;
    
    // ⭐ إرجاع الزر إلى الحاوية الأصلية fullscreenBtnContainer
    if (btn && btn.parentNode === document.body) {
        if (btnContainer) {
            btnContainer.appendChild(btn);
        }
    }
    
    // ⭐ إرجاع الأدوات إلى أماكنها الأصلية بنفس الترتيب
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
    
    section.classList.remove('fullscreen');
    btn.innerHTML = '🖥️';
    btn.title = 'تكبير الجدول';
    enableBodyScroll();
    
    // ⭐ لو الخروج تم عن طريق زر الرجوع، نرجع خطوة في الـ history
    if (isBackButton) {
        history.back();
    }
}

// ========== حدث زر الرجوع في الهاتف ==========
window.addEventListener('popstate', function(event) {
    const section = document.getElementById('tableSection');
    const btn = document.getElementById('toggleFullscreenBtn');
    const viewToggle = document.getElementById('viewToggle');
    const toolbarRow = document.getElementById('toolbarRow');
    const cardsCountHeader = document.getElementById('cardsCountHeader');
    const btnContainer = document.getElementById('fullscreenBtnContainer');
    
    // لو في وضع ملء الشاشة، اخرج منه بدل ما تقفل الصفحة
    if (section && section.classList.contains('fullscreen')) {
        exitFullscreenMode(section, btn, viewToggle, toolbarRow, cardsCountHeader, btnContainer, true);
        
        // ⭐ منع الخروج الفعلي من الصفحة
        history.pushState({ fullscreen: true }, '', '');
    }
});
