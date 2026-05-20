// ========== helpers-date.js - دوال التاريخ والوقت ==========

function getDays(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function getKey(year, month) {
    return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function getMonthName(month) {
    const months = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return months[month];
}

function updateDateTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'م' : 'ص';
    hours = hours % 12 || 12;
    const timeStr = `${hours}:${minutes}:${seconds} ${ampm}`;
    
    const clockElement = document.getElementById('liveClock');
    if (clockElement) clockElement.innerText = timeStr;
    
    const monthsAr = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    const dateElement = document.getElementById('currentDateDisplay');
    if (dateElement) {
        dateElement.innerText = `${now.getDate()} ${monthsAr[now.getMonth()]} ${now.getFullYear()}`;
    }
}