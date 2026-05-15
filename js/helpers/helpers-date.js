// ========== helpers-date.js - دوال التاريخ والوقت ==========

// ========== دوال الأيام والشهور ==========

/**
 * الحصول على عدد أيام الشهر
 * @param {number} year - السنة
 * @param {number} month - الشهر (0-11)
 * @returns {number} عدد أيام الشهر
 */
function getDays(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

/**
 * الحصول على مفتاح الشهر (مثلاً "2024-01")
 * @param {number} year - السنة
 * @param {number} month - الشهر (0-11)
 * @returns {string} مفتاح الشهر بصيغة YYYY-MM
 */
function getKey(year, month) {
    return `${year}-${String(month + 1).padStart(2, '0')}`;
}

/**
 * الحصول على اسم الشهر بالعربية
 * @param {number} month - رقم الشهر (0-11)
 * @returns {string} اسم الشهر بالعربية
 */
function getMonthName(month) {
    const months = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return months[month];
}

/**
 * الحصول على اسم اليوم بالعربية
 * @param {number} dayIndex - رقم اليوم (0 = الأحد, 6 = السبت)
 * @returns {string} اسم اليوم بالعربية
 */
function getDayName(dayIndex) {
    const days = [
        'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 
        'الخميس', 'الجمعة', 'السبت'
    ];
    return days[dayIndex];
}

// ========== دوال الوقت الحالي ==========

/**
 * تحديث الساعة والتاريخ في واجهة المستخدم
 */
function updateDateTime() {
    const now = new Date();
    
    // تنسيق الوقت بصيغة 12 ساعة
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'م' : 'ص';
    hours = hours % 12 || 12;
    const timeStr = `${hours}:${minutes}:${seconds} ${ampm}`;
    
    const clockElement = document.getElementById('liveClock');
    if (clockElement) clockElement.innerText = timeStr;
    
    // تنسيق التاريخ
    const dateElement = document.getElementById('currentDateDisplay');
    if (dateElement) {
        dateElement.innerText = formatDateArabic(now);
    }
}

/**
 * الحصول على التاريخ والوقت الحاليين ككائن
 * @returns {Object} كائن يحتوي على التاريخ والوقت
 */
function getCurrentDateTime() {
    const now = new Date();
    return {
        year: now.getFullYear(),
        month: now.getMonth(),
        monthName: getMonthName(now.getMonth()),
        day: now.getDate(),
        dayName: getDayName(now.getDay()),
        hours: now.getHours(),
        minutes: now.getMinutes(),
        seconds: now.getSeconds(),
        timestamp: now.getTime(),
        isoString: now.toISOString(),
        dateString: now.toISOString().slice(0, 10),
        timeString: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
    };
}

// ========== دوال تنسيق التواريخ ==========

/**
 * تنسيق تاريخ بالعربية
 * @param {Date|string} date - التاريخ المراد تنسيقه
 * @returns {string} التاريخ المنسق (مثال: 15 يناير 2024)
 */
function formatDateArabic(date) {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return `${d.getDate()} ${getMonthName(d.getMonth())} ${d.getFullYear()}`;
}

/**
 * تنسيق وقت بالعربية
 * @param {Date|string} date - التاريخ المراد تنسيقه
 * @returns {string} الوقت المنسق (مثال: 03:30 م)
 */
function formatTimeArabic(date) {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'م' : 'ص';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
}

/**
 * تنسيق تاريخ ووقت بالعربية
 * @param {Date|string} date - التاريخ المراد تنسيقه
 * @returns {string} التاريخ والوقت المنسق
 */
function formatDateTimeArabic(date) {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return `${formatDateArabic(d)} ${formatTimeArabic(d)}`;
}

/**
 * تنسيق تاريخ قصير (YYYY-MM-DD)
 * @param {Date|string} date - التاريخ المراد تنسيقه
 * @returns {string} التاريخ المنسق بصيغة YYYY-MM-DD
 */
function formatDateShort(date) {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
}

/**
 * تنسيق التاريخ والوقت للاستخدام في أسماء الملفات
 * @param {Date|string} date - التاريخ المراد تنسيقه
 * @returns {string} التاريخ والوقت للاستخدام في أسماء الملفات
 */
function formatDateTimeForFilename(date) {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 19).replace(/:/g, '-');
}

// ========== دوال معالجة التواريخ ==========

/**
 * التحقق مما إذا كان التاريخ في نفس الشهر والسنة
 * @param {Date} date1 - التاريخ الأول
 * @param {Date} date2 - التاريخ الثاني
 * @returns {boolean} هل هما في نفس الشهر والسنة
 */
function isSameMonth(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() && 
           date1.getMonth() === date2.getMonth();
}

/**
 * الحصول على بداية الشهر
 * @param {number} year - السنة
 * @param {number} month - الشهر
 * @returns {Date} تاريخ بداية الشهر
 */
function getMonthStart(year, month) {
    return new Date(year, month, 1);
}

/**
 * الحصول على نهاية الشهر
 * @param {number} year - السنة
 * @param {number} month - الشهر
 * @returns {Date} تاريخ نهاية الشهر
 */
function getMonthEnd(year, month) {
    return new Date(year, month + 1, 0);
}

/**
 * الحصول على الشهر السابق
 * @param {number} year - السنة
 * @param {number} month - الشهر
 * @returns {Object} كائن يحتوي على السنة والشهر السابقين
 */
function getPreviousMonth(year, month) {
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth < 0) {
        prevMonth = 11;
        prevYear--;
    }
    return { year: prevYear, month: prevMonth };
}

/**
 * الحصول على الشهر التالي
 * @param {number} year - السنة
 * @param {number} month - الشهر
 * @returns {Object} كائن يحتوي على السنة والشهر التاليين
 */
function getNextMonth(year, month) {
    let nextYear = year;
    let nextMonth = month + 1;
    if (nextMonth > 11) {
        nextMonth = 0;
        nextYear++;
    }
    return { year: nextYear, month: nextMonth };
}

/**
 * تغيير الشهر الحالي بمقدار معين
 * @param {number} delta - مقدار التغيير (1 للشهر التالي، -1 للشهر السابق)
 * @returns {Object} كائن يحتوي على السنة والشهر الجديدين
 */
function changeCurrentMonth(delta) {
    let newMonth = currentMonth + delta;
    let newYear = currentYear;
    if (newMonth < 0) {
        newMonth = 11;
        newYear--;
    }
    if (newMonth > 11) {
        newMonth = 0;
        newYear++;
    }
    return { year: newYear, month: newMonth };
}

/**
 * الحصول على قائمة السنوات المتاحة في البيانات
 * @returns {number[]} قائمة السنوات مرتبة تنازلياً
 */
function getAvailableYears() {
    const years = new Set();
    years.add(currentYear);
    
    // إضافة السنوات من المدفوعات
    for (const subId in monthlyPayments) {
        for (const key in monthlyPayments[subId]) {
            const year = parseInt(key.split('-')[0]);
            if (!isNaN(year)) years.add(year);
        }
    }
    
    return Array.from(years).sort((a, b) => b - a);
}

// تصدير الدوال للنطاق العام
if (typeof window !== 'undefined') {
    window.getDays = getDays;
    window.getKey = getKey;
    window.getMonthName = getMonthName;
    window.getDayName = getDayName;
    window.updateDateTime = updateDateTime;
    window.getCurrentDateTime = getCurrentDateTime;
    window.formatDateArabic = formatDateArabic;
    window.formatTimeArabic = formatTimeArabic;
    window.formatDateTimeArabic = formatDateTimeArabic;
    window.formatDateShort = formatDateShort;
    window.formatDateTimeForFilename = formatDateTimeForFilename;
    window.isSameMonth = isSameMonth;
    window.getMonthStart = getMonthStart;
    window.getMonthEnd = getMonthEnd;
    window.getPreviousMonth = getPreviousMonth;
    window.getNextMonth = getNextMonth;
    window.changeCurrentMonth = changeCurrentMonth;
    window.getAvailableYears = getAvailableYears;
}

console.log('✅ helpers-date.js loaded');
