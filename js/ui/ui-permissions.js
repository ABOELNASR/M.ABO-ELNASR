// ========== ui-permissions.js - الصلاحيات وشاشة تسجيل الدخول ==========

// ========== تطبيق الصلاحيات - التوزيع الجديد 2-1-2 ==========

function applyPermissions() {
    const statsSection = document.getElementById('statsSection');
    if (statsSection) statsSection.style.display = 'grid';

    const addCard = document.getElementById('addSubscriberCard');
    if (addCard) addCard.style.display = hasAddEditSubscriber() ? 'block' : 'none';
    
    const userNameDisplay = document.getElementById('userNameDisplay');
    if (userNameDisplay) userNameDisplay.innerText = currentUser ? currentUser.username : '';

    const adminDropdown = document.getElementById('adminDropdown');
    if (adminDropdown) {
        adminDropdown.style.display = (isAdmin() || (currentUser && currentUser.role === ROLES.WRITE)) ? 'inline-block' : 'none';
    }

    const dropdownContent = document.getElementById('adminDropdownContent');
    if (dropdownContent) {
        dropdownContent.innerHTML = '';
        
        if (isAdmin()) {
            dropdownContent.innerHTML += '<button id="exportSubscribersBtn">📊 تصدير المشتركين (Excel)</button>';
            dropdownContent.innerHTML += '<button id="exportReportsBtn">📈 تصدير التقارير (Excel)</button>';
            dropdownContent.innerHTML += '<button id="importExcelBtn">📥 استيراد من Excel</button>';
            dropdownContent.innerHTML += '<button id="importBulkTextBtn">📝 استيراد نصي (بالجملة)</button>';
            dropdownContent.innerHTML += '<button id="systemNotesBtn">📝 الملاحظات العامة</button>';
            dropdownContent.innerHTML += '<button id="backupDownloadBtn">💾 نسخ احتياطي (تحميل)</button>';
            dropdownContent.innerHTML += '<button id="restoreBackupBtn">🔄 استعادة نسخة احتياطية</button>';
            dropdownContent.innerHTML += '<button id="activityLogBtn">📜 سجل العمليات</button>';
            
            document.getElementById('exportSubscribersBtn').onclick = exportSubscribersToExcel;
            document.getElementById('exportReportsBtn').onclick = exportReportsToExcel;
            document.getElementById('importExcelBtn').onclick = importFromExcel;
            document.getElementById('importBulkTextBtn').onclick = importBulkText;
            document.getElementById('systemNotesBtn').onclick = showSystemNotes;
            document.getElementById('backupDownloadBtn').onclick = backupDownload;
            document.getElementById('restoreBackupBtn').onclick = showRestoreBackupModal;
            document.getElementById('activityLogBtn').onclick = showActivityLog;
        } else if (currentUser && currentUser.role === ROLES.WRITE) {
            dropdownContent.innerHTML += '<button id="systemNotesBtn">📝 الملاحظات العامة</button>';
            dropdownContent.innerHTML += '<button id="activityLogBtn">📜 سجل العمليات</button>';
            document.getElementById('systemNotesBtn').onclick = showSystemNotes;
            document.getElementById('activityLogBtn').onclick = showActivityLog;
        }
    }

    const actionsContainer = document.getElementById('actionsContainer');
    if (!actionsContainer) return;
    
    actionsContainer.innerHTML = '';

    if (isReadOnly()) {
        const testBtn = document.createElement('button');
        testBtn.id = 'testConnectionBtn';
        testBtn.innerText = '📡 اختبار الاتصال';
        testBtn.className = 'btn btn-info btn-sm';
        testBtn.onclick = testConnection;
        const row = document.createElement('div');
        row.className = 'actions-row single-center';
        row.appendChild(testBtn);
        actionsContainer.appendChild(row);
    } else if (isAdmin()) {
        const row1 = document.createElement('div');
        row1.className = 'actions-row actions-two';
        const dailyBtn = document.createElement('button');
        dailyBtn.id = 'dailyReportBtn';
        dailyBtn.innerText = '📆 تقرير يوم دفع';
        dailyBtn.className = 'btn btn-info btn-sm';
        dailyBtn.onclick = showDatePickerReport;
        const cardsBtn = document.createElement('button');
        cardsBtn.id = 'cardsReportBtn';
        cardsBtn.innerText = '📇 تقرير البطاقات';
        cardsBtn.className = 'btn btn-info btn-sm';
        cardsBtn.onclick = () => showCardsReport(false);
        row1.appendChild(dailyBtn);
        row1.appendChild(cardsBtn);
        actionsContainer.appendChild(row1);

        const row2 = document.createElement('div');
        row2.className = 'actions-row single-center';
        const creditBtn = document.createElement('button');
        creditBtn.id = 'creditBalanceBtn';
        creditBtn.innerText = '🪙 فرق النقاط';
        creditBtn.className = 'btn btn-info btn-sm';
        creditBtn.onclick = showCreditBalanceReport;
        row2.appendChild(creditBtn);
        actionsContainer.appendChild(row2);

        const row3 = document.createElement('div');
        row3.className = 'actions-row actions-two';
        const testBtn = document.createElement('button');
        testBtn.id = 'testConnectionBtn';
        testBtn.innerText = '📡 اختبار الاتصال';
        testBtn.className = 'btn btn-info btn-sm';
        testBtn.onclick = testConnection;
        const manageBtn = document.createElement('button');
        manageBtn.id = 'manageUsersBtn';
        manageBtn.innerText = '👥 إدارة المستخدمين';
        manageBtn.className = 'btn btn-info btn-sm';
        manageBtn.onclick = showUserManagement;
        row3.appendChild(testBtn);
        row3.appendChild(manageBtn);
        actionsContainer.appendChild(row3);
    } else {
        const row1 = document.createElement('div');
        row1.className = 'actions-row actions-two';
        const dailyBtn = document.createElement('button');
        dailyBtn.id = 'dailyReportBtn';
        dailyBtn.innerText = '📆 تقرير يوم دفع';
        dailyBtn.className = 'btn btn-info btn-sm';
        dailyBtn.onclick = showDatePickerReport;
        const cardsBtn = document.createElement('button');
        cardsBtn.id = 'cardsReportBtn';
        cardsBtn.innerText = '📇 تقرير البطاقات';
        cardsBtn.className = 'btn btn-info btn-sm';
        cardsBtn.onclick = () => showCardsReport(false);
        row1.appendChild(dailyBtn);
        row1.appendChild(cardsBtn);
        actionsContainer.appendChild(row1);

        const row2 = document.createElement('div');
        row2.className = 'actions-row actions-two';
        const creditBtn = document.createElement('button');
        creditBtn.id = 'creditBalanceBtn';
        creditBtn.innerText = '🪙 فرق النقاط';
        creditBtn.className = 'btn btn-info btn-sm';
        creditBtn.onclick = showCreditBalanceReport;
        const testBtn = document.createElement('button');
        testBtn.id = 'testConnectionBtn';
        testBtn.innerText = '📡 اختبار الاتصال';
        testBtn.className = 'btn btn-info btn-sm';
        testBtn.onclick = testConnection;
        row2.appendChild(creditBtn);
        row2.appendChild(testBtn);
        actionsContainer.appendChild(row2);
    }
}

// ========== شاشة تسجيل الدخول ==========

function showLoginScreen() {
    disableBodyScroll();
    const overlay = document.createElement('div');
    overlay.className = 'login-overlay';
    overlay.innerHTML = `
        <div class="login-box">
            <h2>🔐 تسجيل الدخول</h2>
            <input type="text" id="loginUsername" placeholder="اسم المستخدم">
            <input type="password" id="loginPassword" placeholder="كلمة المرور">
            <div class="remember-wrapper">
                <label><input type="checkbox" id="rememberCheckbox"> تذكرني</label>
            </div>
            <button id="loginBtn" class="btn btn-primary">دخول</button>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
            enableBodyScroll();
        }
    });

    const usernameInput = document.getElementById('loginUsername');
    const passwordInput = document.getElementById('loginPassword');
    const loginBtn = document.getElementById('loginBtn');

    const doLogin = () => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const remember = document.getElementById('rememberCheckbox').checked;
        if (login(username, password, remember)) {
            overlay.remove();
            enableBodyScroll();
            document.getElementById('appContainer').style.display = 'block';
            applyPermissions();
            loadData();
        } else {
            showToast('خطأ في الاسم أو كلمة المرور', true);
        }
    };

    usernameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') doLogin(); });
    passwordInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') doLogin(); });
    loginBtn.onclick = doLogin;
}
