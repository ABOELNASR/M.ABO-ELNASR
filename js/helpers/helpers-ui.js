// ========== helpers-ui.js - دوال واجهة المستخدم والإشعارات ==========

function showToast(msg, isError = false) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.borderRightColor = isError ? 'var(--danger)' : 'var(--btn-light-green)';
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function disableBodyScroll() {
    document.body.classList.add('modal-open');
}

function enableBodyScroll() {
    document.body.classList.remove('modal-open');
}

// ========== إشعار داخلي مع رمز الجرس (يُستخدم من app.js لكنه موجود هنا للمرجعية) ==========
// showBellNotification موجودة في app.js