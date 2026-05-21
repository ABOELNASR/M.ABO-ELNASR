// ========== helpers-text.js - دوال النصوص والأرقام ==========

function escapeHtml(s) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(s).replace(/[&<>"']/g, m => map[m]);
}

function arabicToEnglishNumber(str) {
    const map = {
        '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
        '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
    };
    return String(str).replace(/[٠-٩]/g, m => map[m]);
}

function formatDateArabic(date) {
    const d = new Date(date);
    if (isNaN(d)) return '';
    const months = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTimeArabic(date) {
    const d = new Date(date);
    if (isNaN(d)) return '';
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'م' : 'ص';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
}

function formatDateTimeArabic(date) {
    const d = new Date(date);
    if (isNaN(d)) return '';
    return `${formatDateArabic(d)} ${formatTimeArabic(d)}`;
}

function formatNumber(num, decimals = 2) {
    if (num == null || isNaN(num)) return '0';
    return Number(num).toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

// ========== دالة قياس عرض النص ==========
function getTextWidth(text, font) {
    const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement('canvas'));
    const context = canvas.getContext('2d');
    context.font = font;
    return context.measureText(text).width;
}

// ========== دالة تصغير الخط ==========
function fitTextToContainer(element, maxFontSize, minFontSize) {
    if (!element) return;
    
    // ⭐ الحصول على حجم الخط الحالي للعنصر (من CSS) كحجم أقصى
    if (maxFontSize == null) {
        const currentFontSize = window.getComputedStyle(element).fontSize;
        maxFontSize = parseFloat(currentFontSize) / 16; // تحويل px إلى rem
        // إذا كان الحجم صغير جداً، استخدم قيمة افتراضية كبيرة
        if (maxFontSize < 1.2) {
            maxFontSize = 1.8;
        }
    }
    
    // ⭐ الحد الأدنى للتصغير - لا يصغر عن هذا أبداً
    if (minFontSize == null) {
        minFontSize = 0.7;
    }
    
    const card = element.closest('.stat-card');
    if (!card) return;
    
    const cardStyle = window.getComputedStyle(card);
    const cardWidth = card.clientWidth;
    const padLeft = parseFloat(cardStyle.paddingLeft) || 0;
    const padRight = parseFloat(cardStyle.paddingRight) || 0;
    // المساحة المتاحة داخل البطاقة مع هامش أمان
    const availableWidth = cardWidth - padLeft - padRight - 12;
    
    const text = element.textContent.trim();
    if (!text) return;
    
    const fontFamily = window.getComputedStyle(element).fontFamily || 'Cairo, sans-serif';
    const fontWeight = window.getComputedStyle(element).fontWeight || '800';
    
    // ⭐ ابدأ بالحجم المطلوب من CSS
    let currentSize = maxFontSize;
    element.style.fontSize = currentSize + 'rem';
    
    const checkAndShrink = () => {
        const font = `${fontWeight} ${currentSize}rem ${fontFamily}`;
        const textWidth = getTextWidth(text, font);
        
        // ⭐ إذا تجاوز النص العرض المتاح AND لم نصل للحد الأدنى → صغّر
        if (textWidth > availableWidth && currentSize > minFontSize) {
            currentSize -= 0.05;
            element.style.fontSize = currentSize + 'rem';
            requestAnimationFrame(checkAndShrink);
        }
        // ⭐ إذا انتهينا، ثبت الحجم
        else {
            element.style.fontSize = currentSize + 'rem';
        }
    };
    
    // ⭐ تأخير مزدوج للتأكد من اكتمال الرندر
    requestAnimationFrame(() => {
        requestAnimationFrame(checkAndShrink);
    });
}
