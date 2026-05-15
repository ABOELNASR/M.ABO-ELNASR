// ========== helpers-text.js - دوال النصوص والأرقام ==========

// ========== دوال الترميز والحماية ==========

/**
 * ترميز النص لمنع هجمات XSS
 * @param {string} s - النص المراد ترميزه
 * @returns {string} النص المرمّز
 */
function escapeHtml(s) {
    if (!s) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
    };
    return String(s).replace(/[&<>"'/`=]/g, m => map[m]);
}

/**
 * فك ترميز النص (عكس escapeHtml)
 * @param {string} s - النص المرمّز
 * @returns {string} النص الأصلي
 */
function unescapeHtml(s) {
    if (!s) return '';
    const map = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#039;': "'",
        '&#x2F;': '/',
        '&#x60;': '`',
        '&#x3D;': '='
    };
    return String(s).replace(/&(?:amp|lt|gt|quot|#039|#x2F|#x60|#x3D);/g, m => map[m]);
}

// ========== دوال تحويل الأرقام ==========

/**
 * تحويل الأرقام العربية إلى إنجليزية
 * @param {string} str - النص الذي يحتوي على أرقام عربية
 * @returns {string} النص مع تحويل الأرقام إلى إنجليزية
 */
function arabicToEnglishNumber(str) {
    if (!str) return '';
    const map = {
        '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
        '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
    };
    return String(str).replace(/[٠-٩]/g, m => map[m]);
}

/**
 * تحويل الأرقام الإنجليزية إلى عربية
 * @param {string} str - النص الذي يحتوي على أرقام إنجليزية
 * @returns {string} النص مع تحويل الأرقام إلى عربية
 */
function englishToArabicNumber(str) {
    if (!str) return '';
    const map = {
        '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
        '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩'
    };
    return String(str).replace(/[0-9]/g, m => map[m]);
}

/**
 * تنسيق الأرقام (إضافة فواصل الآلاف)
 * @param {number} num - الرقم المراد تنسيقه
 * @param {number} decimals - عدد الخانات العشرية
 * @returns {string} الرقم المنسق
 */
function formatNumber(num, decimals = 2) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    return Number(num).toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/**
 * تنسيق الأرقام بالعربية (مع أرقام عربية)
 * @param {number} num - الرقم المراد تنسيقه
 * @param {number} decimals - عدد الخانات العشرية
 * @returns {string} الرقم المنسق بالأرقام العربية
 */
function formatNumberArabic(num, decimals = 2) {
    const formatted = formatNumber(num, decimals);
    return englishToArabicNumber(formatted);
}

/**
 * تحويل السلسلة إلى رقم (مع دعم الأرقام العربية)
 * @param {string} str - النص المراد تحويله
 * @returns {number} الرقم
 */
function parseNumber(str) {
    if (!str) return 0;
    const englishStr = arabicToEnglishNumber(str);
    const num = parseFloat(englishStr);
    return isNaN(num) ? 0 : num;
}

// ========== دوال معالجة النصوص ==========

/**
 * تقليم النص وإزالة المسافات الزائدة
 * @param {string} str - النص المراد تقليمه
 * @returns {string} النص المقلم
 */
function trimText(str) {
    if (!str) return '';
    return String(str).trim().replace(/\s+/g, ' ');
}

/**
 * اختصار النص الطويل
 * @param {string} str - النص الأصلي
 * @param {number} maxLength - أقصى طول مسموح
 * @param {string} suffix - النص المضاف في النهاية (مثل ...)
 * @returns {string} النص المختصر
 */
function truncateText(str, maxLength = 50, suffix = '...') {
    if (!str) return '';
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * تحويل الحرف الأول إلى كبير
 * @param {string} str - النص الأصلي
 * @returns {string} النص مع تكبير أول حرف
 */
function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * تحويل النص إلى حالة Title (أول حرف من كل كلمة كبير)
 * @param {string} str - النص الأصلي
 * @returns {string} النص مع تكبير أول حرف من كل كلمة
 */
function toTitleCase(str) {
    if (!str) return '';
    return str.replace(/\w\S*/g, txt => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

// ========== دوال قياس النص ==========

/**
 * حساب عرض النص بالبكسلات (يستخدم Canvas)
 * @param {string} text - النص المراد قياسه
 * @param {string} font - خط النص (مثل "16px Cairo")
 * @returns {number} عرض النص بالبكسلات
 */
function getTextWidth(text, font) {
    const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement('canvas'));
    const context = canvas.getContext('2d');
    context.font = font;
    return context.measureText(text).width;
}

/**
 * تصغير حجم الخط ليتناسب مع الحاوية
 * @param {HTMLElement} element - العنصر المراد تعديل خطه
 * @param {number} maxFontSize - أقصى حجم خط (rem)
 * @param {number} minFontSize - أدنى حجم خط (rem)
 */
function fitTextToContainer(element, maxFontSize = 1.3, minFontSize = 0.7) {
    if (!element) return;
    
    const container = element.closest('.stat-card, .card-detail-item');
    if (!container) return;
    
    const containerStyle = window.getComputedStyle(container);
    const containerWidth = container.clientWidth;
    const padLeft = parseFloat(containerStyle.paddingLeft) || 0;
    const padRight = parseFloat(containerStyle.paddingRight) || 0;
    const availableWidth = containerWidth - padLeft - padRight - 8;
    
    const text = element.textContent.trim();
    if (!text) return;
    
    const fontFamily = window.getComputedStyle(element).fontFamily || 'Cairo, sans-serif';
    let currentSize = maxFontSize;
    element.style.fontSize = currentSize + 'rem';
    
    const checkAndShrink = () => {
        const font = `800 ${currentSize}rem ${fontFamily}`;
        const textWidth = getTextWidth(text, font);
        
        if (textWidth > availableWidth && currentSize > minFontSize) {
            currentSize -= 0.05;
            element.style.fontSize = currentSize + 'rem';
            requestAnimationFrame(checkAndShrink);
        }
    };
    
    requestAnimationFrame(() => {
        requestAnimationFrame(checkAndShrink);
    });
}

// ========== دوال التحقق من صحة النصوص ==========

/**
 * التحقق من صحة البريد الإلكتروني
 * @param {string} email - البريد الإلكتروني
 * @returns {boolean} صحة البريد
 */
function isValidEmail(email) {
    if (!email) return false;
    const re = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
    return re.test(email);
}

/**
 * التحقق من صحة رقم الهاتف (مصري)
 * @param {string} phone - رقم الهاتف
 * @returns {boolean} صحة الرقم
 */
function isValidEgyptianPhone(phone) {
    if (!phone) return false;
    const cleaned = arabicToEnglishNumber(phone).replace(/[^0-9]/g, '');
    const re = /^(01)[0-9]{9}$/;
    return re.test(cleaned);
}

/**
 * إخفاء جزء من النص (مثل البريد الإلكتروني)
 * @param {string} str - النص الأصلي
 * @param {number} visibleStart - عدد الأحرف الظاهرة في البداية
 * @param {number} visibleEnd - عدد الأحرف الظاهرة في النهاية
 * @param {string} mask - رمز الإخفاء
 * @returns {string} النص مع إخفاء الجزء الأوسط
 */
function maskText(str, visibleStart = 2, visibleEnd = 2, mask = '*') {
    if (!str) return '';
    if (str.length <= visibleStart + visibleEnd) return str;
    const start = str.substring(0, visibleStart);
    const end = str.substring(str.length - visibleEnd);
    const maskedLength = str.length - visibleStart - visibleEnd;
    const masked = mask.repeat(Math.min(maskedLength, 10));
    return start + masked + end;
}

// تصدير الدوال للنطاق العام
if (typeof window !== 'undefined') {
    window.escapeHtml = escapeHtml;
    window.unescapeHtml = unescapeHtml;
    window.arabicToEnglishNumber = arabicToEnglishNumber;
    window.englishToArabicNumber = englishToArabicNumber;
    window.formatNumber = formatNumber;
    window.formatNumberArabic = formatNumberArabic;
    window.parseNumber = parseNumber;
    window.trimText = trimText;
    window.truncateText = truncateText;
    window.capitalizeFirst = capitalizeFirst;
    window.toTitleCase = toTitleCase;
    window.getTextWidth = getTextWidth;
    window.fitTextToContainer = fitTextToContainer;
    window.isValidEmail = isValidEmail;
    window.isValidEgyptianPhone = isValidEgyptianPhone;
    window.maskText = maskText;
}

console.log('✅ helpers-text.js loaded');
