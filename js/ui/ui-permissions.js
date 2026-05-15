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
            dropdownContent.innerHTML += '<button id="exportFullBackupBtn">💿 نسخة احتياطية كاملة (JSON)</button>';
            dropdownContent.innerHTML += '<button id="clearCacheBtn">🗑️ مسح الكاش</button>';
            
            document.getElementById('exportSubscribersBtn').onclick = () => {
                if (typeof exportSubscribersToExcel === 'function') exportSubscribersToExcel();
            };
            document.getElementById('exportReportsBtn').onclick = () => {
                if (typeof exportReportsToExcel === 'function') exportReportsToExcel();
            };
            document.getElementById('importExcelBtn').onclick = () => {
                if (typeof importFromExcel === 'function') importFromExcel();
            };
            document.getElementById('importBulkTextBtn').onclick = () => {
                if (typeof importBulkText === 'function') importBulkText();
            };
            document.getElementById('systemNotesBtn').onclick = () => {
                if (typeof showSystemNotes === 'function') showSystemNotes();
            };
            document.getElementById('backupDownloadBtn').onclick = () => {
                if (typeof backupDownload === 'function') backupDownload();
            };
            document.getElementById('restoreBackupBtn').onclick = () => {
                if (typeof showRestoreBackupModal === 'function') showRestoreBackupModal();
            };
            document.getElementById('activityLogBtn').onclick = () => {
                if (typeof showActivityLog === 'function') showActivityLog();
            };
            document.getElementById('exportFullBackupBtn').onclick = () => {
                if (typeof exportBackup === 'function') exportBackup();
            };
            document.getElementById('clearCacheBtn').onclick = () => {
                if (confirm('هل أنت متأكد من مسح الكاش؟ سيتم إعادة تحميل التطبيق.')) {
                    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
                        setTimeout(() => window.location.reload(), 500);
                    }
                }
            };
        } else if (currentUser && currentUser.role === ROLES.WRITE) {
            dropdownContent.innerHTML += '<button id="systemNotesBtn">📝 الملاحظات العامة</button>';
            dropdownContent.innerHTML += '<button id="activityLogBtn">📜 سجل العمليات</button>';
            if (typeof showSystemNotes === 'function') {
                document.getElementById('systemNotesBtn').onclick = showSystemNotes;
            }
            if (typeof showActivityLog === 'function') {
                document.getElementById('activityLogBtn').onclick = showActivityLog;
            }
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
        testBtn.onclick = () => {
            if (typeof testConnection === 'function') testConnection();
        };
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
        dailyBtn.onclick = () => {
            if (typeof showDatePickerReport === 'function') showDatePickerReport();
        };
        const cardsBtn = document.createElement('button');
        cardsBtn.id = 'cardsReportBtn';
        cardsBtn.innerText = '📇 تقرير البطاقات';
        cardsBtn.className = 'btn btn-info btn-sm';
        cardsBtn.onclick = () => {
            if (typeof showCardsReport === 'function') showCardsReport(false);
        };
        row1.appendChild(dailyBtn);
        row1.appendChild(cardsBtn);
        actionsContainer.appendChild(row1);

        const row2 = document.createElement('div');
        row2.className = 'actions-row single-center';
        const creditBtn = document.createElement('button');
        creditBtn.id = 'creditBalanceBtn';
        creditBtn.innerText = '🪙 فرق النقاط';
        creditBtn.className = 'btn btn-info btn-sm';
        creditBtn.onclick = () => {
            if (typeof showCreditBalanceReport === 'function') showCreditBalanceReport();
        };
        row2.appendChild(creditBtn);
        actionsContainer.appendChild(row2);

        const row3 = document.createElement('div');
        row3.className = 'actions-row actions-two';
        const testBtn = document.createElement('button');
        testBtn.id = 'testConnectionBtn';
        testBtn.innerText = '📡 اختبار الاتصال';
        testBtn.className = 'btn btn-info btn-sm';
        testBtn.onclick = () => {
            if (typeof testConnection === 'function') testConnection();
        };
        const manageBtn = document.createElement('button');
        manageBtn.id = 'manageUsersBtn';
        manageBtn.innerText = '👥 إدارة المستخدمين';
        manageBtn.className = 'btn btn-info btn-sm';
        manageBtn.onclick = () => {
            if (typeof showUserManagement === 'function') showUserManagement();
        };
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
        dailyBtn.onclick = () => {
            if (typeof showDatePickerReport === 'function') showDatePickerReport();
        };
        const cardsBtn = document.createElement('button');
        cardsBtn.id = 'cardsReportBtn';
        cardsBtn.innerText = '📇 تقرير البطاقات';
        cardsBtn.className = 'btn btn-info btn-sm';
        cardsBtn.onclick = () => {
            if (typeof showCardsReport === 'function') showCardsReport(false);
        };
        row1.appendChild(dailyBtn);
        row1.appendChild(cardsBtn);
        actionsContainer.appendChild(row1);

        const row2 = document.createElement('div');
        row2.className = 'actions-row actions-two';
        const creditBtn = document.createElement('button');
        creditBtn.id = 'creditBalanceBtn';
        creditBtn.innerText = '🪙 فرق النقاط';
        creditBtn.className = 'btn btn-info btn-sm';
        creditBtn.onclick = () => {
            if (typeof showCreditBalanceReport === 'function') showCreditBalanceReport();
        };
        const testBtn = document.createElement('button');
        testBtn.id = 'testConnectionBtn';
        testBtn.innerText = '📡 اختبار الاتصال';
        testBtn.className = 'btn btn-info btn-sm';
        testBtn.onclick = () => {
            if (typeof testConnection === 'function') testConnection();
        };
        row2.appendChild(creditBtn);
        row2.appendChild(testBtn);
        actionsContainer.appendChild(row2);
    }
}

// ========== شاشة تسجيل الدخول ==========

function showLoginScreen() {
    if (typeof disableBodyScroll === 'function') disableBodyScroll();
    
    // إخفاء واجهة التطبيق
    const appContainer = document.getElementById('appContainer');
    if (appContainer) appContainer.style.display = 'none';
    
    const overlay = document.createElement('div');
    overlay.className = 'login-overlay';
    overlay.id = 'loginOverlay';
    overlay.innerHTML = `
        <div class="login-box">
            <div style="text-align: center; margin-bottom: 1rem;">
                <img src="icons/launchericon-192x192.png" alt="Logo" style="width: 64px; height: 64px; border-radius: 50%;">
                <h2 style="margin-top: 0.5rem;">🔐 منظومة الخبز المدعم</h2>
            </div>
            <input type="text" id="loginUsername" placeholder="اسم المستخدم" autocomplete="username">
            <input type="password" id="loginPassword" placeholder="كلمة المرور" autocomplete="current-password">
            <div class="remember-wrapper">
                <label><input type="checkbox" id="rememberCheckbox"> تذكرني</label>
            </div>
            <button id="loginBtn" class="btn btn-primary" style="width: 100%;">دخول</button>
            <div style="margin-top: 1rem; font-size: 0.6rem; color: var(--text-secondary); text-align: center;">
                <span>🔄 جاهز للاتصال بالسحابة</span>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // منع إغلاق شاشة الدخول بالنقر خارجها
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            // لا تفعل شيئاً - لا يمكن إغلاق شاشة الدخول
            if (typeof showToast === 'function') {
                showToast('⚠️ الرجاء تسجيل الدخول أولاً', true);
            }
        }
    });

    const usernameInput = document.getElementById('loginUsername');
    const passwordInput = document.getElementById('loginPassword');
    const loginBtn = document.getElementById('loginBtn');
    const rememberCheckbox = document.getElementById('rememberCheckbox');

    // محاولة ملء آخر مستخدم تم تسجيل دخوله
    const lastUser = localStorage.getItem('last_login_username');
    if (lastUser && usernameInput) {
        usernameInput.value = lastUser;
        if (passwordInput) passwordInput.focus();
    }

    const doLogin = async () => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const remember = rememberCheckbox.checked;
        
        if (!username || !password) {
            if (typeof showToast === 'function') {
                showToast('❌ الرجاء إدخال اسم المستخدم وكلمة المرور', true);
            }
            return;
        }
        
        // تعطيل الزر أثناء محاولة الدخول
        loginBtn.disabled = true;
        loginBtn.innerText = '⏳ جاري التحقق...';
        
        try {
            // محاولة تحديث المستخدمين من السحابة قبل التحقق
            if (typeof loadUsersFromCloud === 'function' && navigator.onLine) {
                await loadUsersFromCloud();
            }
            
            if (login(username, password, remember)) {
                // حفظ آخر مستخدم
                if (remember) {
                    localStorage.setItem('last_login_username', username);
                }
                
                // إزالة شاشة الدخول
                overlay.remove();
                if (typeof enableBodyScroll === 'function') enableBodyScroll();
                
                // إظهار واجهة التطبيق
                if (appContainer) appContainer.style.display = 'block';
                
                // تطبيق الصلاحيات وتحميل البيانات
                if (typeof applyPermissions === 'function') applyPermissions();
                if (typeof loadData === 'function') loadData();
                
                if (typeof showToast === 'function') {
                    showToast(`✅ مرحباً ${username}`);
                }
            } else {
                if (typeof showToast === 'function') {
                    showToast('❌ اسم المستخدم أو كلمة المرور غير صحيحة', true);
                }
                passwordInput.value = '';
                passwordInput.focus();
            }
        } catch (err) {
            console.error('خطأ في تسجيل الدخول:', err);
            if (typeof showToast === 'function') {
                showToast('❌ حدث خطأ، حاول مرة أخرى', true);
            }
        } finally {
            loginBtn.disabled = false;
            loginBtn.innerText = 'دخول';
        }
    };

    usernameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') doLogin(); });
    passwordInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') doLogin(); });
    loginBtn.onclick = doLogin;
}

// ========== دالة لتسجيل الخروج من التطبيق ==========

function logoutApp() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        if (typeof logout === 'function') logout();
    }
}

// تصدير الدوال للنطاق العام
if (typeof window !== 'undefined') {
    window.applyPermissions = applyPermissions;
    window.showLoginScreen = showLoginScreen;
    window.logoutApp = logoutApp;
}

console.log('✅ ui-permissions.js loaded');
