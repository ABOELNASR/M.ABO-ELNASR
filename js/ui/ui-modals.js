// ========== ui-modals.js - النوافذ المنبثقة =========

// ========== نافذة تعديل المشترك المنبثقة ==========

function showEditSubscriberModal(sub) {
    disableBodyScroll();
    
    if (sub.cardsList && sub.cardsList.length) {
        tempCardsList = JSON.parse(JSON.stringify(sub.cardsList));
    } else {
        const migrated = migrateSubscriber(sub);
        tempCardsList = JSON.parse(JSON.stringify(migrated.cardsList));
    }
    editId = sub.id;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <h3>✏️ تعديل المشترك: ${escapeHtml(sub.name)}</h3>
            <div class="input-group" style="margin-bottom: 1rem;">
                <label>اسم المشترك</label>
                <input type="text" id="editSubName" value="${escapeHtml(sub.name)}">
                <div id="editSubNameWarning" class="warning-message" style="display: none;"></div>
            </div>
            <div class="cards-header" style="margin-bottom: 0.5rem;">
                <span class="cards-title">📇 البطاقات التموينية</span>
                <button type="button" class="add-card-btn" id="editAddCardBtn">+ إضافة بطاقة</button>
            </div>
            <div id="editCardsListContainer" class="cards-list"></div>
            <div id="editCardNameWarning" class="warning-message" style="display: none;"></div>
            <div class="date-picker-buttons" style="margin-top: 1rem;">
                <button id="saveEditBtn" class="btn btn-primary btn-sm">💾 حفظ التعديلات</button>
                <button id="cancelEditModalBtn" class="btn btn-secondary btn-sm">إلغاء</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    const closeModal = () => {
        modal.remove();
        enableBodyScroll();
        editId = null;
        tempCardsList = [];
        renderAll();
    };
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    document.getElementById('cancelEditModalBtn').onclick = closeModal;
    
    const renderEditCards = () => {
        const container = document.getElementById('editCardsListContainer');
        if (!container) return;
        if (tempCardsList.length === 0) {
            container.innerHTML = '<div style="color:var(--text-secondary); font-size:0.7rem; padding:0.5rem;">لا توجد بطاقات</div>';
            return;
        }
        let html = '';
        tempCardsList.forEach((card, idx) => {
            html += `
                <div class="card-item">
                    <input type="text" class="card-name" value="${escapeHtml(card.cardName)}" placeholder="اسم البطاقة">
                    <input type="text" class="card-individuals" value="${card.individuals}" placeholder="عدد الأفراد">
                    <button class="remove-card-btn" data-edit-idx="${idx}">✖</button>
                </div>
            `;
        });
        container.innerHTML = html;
        
        document.querySelectorAll('.card-name').forEach((input, i) => {
            input.addEventListener('change', (e) => {
                tempCardsList[i].cardName = e.target.value;
                renderEditCards();
                updateDuplicateWarnings();
            });
        });
        document.querySelectorAll('.card-individuals').forEach((input, i) => {
            input.addEventListener('change', (e) => {
                let val = parseInt(arabicToEnglishNumber(e.target.value));
                tempCardsList[i].individuals = isNaN(val) ? 0 : val;
                e.target.value = tempCardsList[i].individuals;
                updateDuplicateWarnings();
            });
        });
        document.querySelectorAll('.remove-card-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.editIdx);
                const card = tempCardsList[idx];
                const cardName = card.cardName || 'بطاقة غير مسماة';
                const individuals = parseInt(card.individuals) || 0;
                const subscriberName = sub.name;
                
                const note = prompt(`🗑️ حذف البطاقة "${cardName}" من المشترك "${subscriberName}"\nالرجاء كتابة سبب الحذف (ملاحظة إلزامية):`);
                if (note === null) {
                    showToast('تم إلغاء الحذف', true);
                    return;
                }
                if (!note.trim()) {
                    showToast('❌ الملاحظة مطلوبة لحذف البطاقة', true);
                    return;
                }
                
                tempCardsList.splice(idx, 1);
                renderEditCards();
                updateDuplicateWarnings();
                logDeletedCard(cardName, individuals, subscriberName, note);
                addActivityLog('حذف بطاقة', `حذف بطاقة "${cardName}" من ${subscriberName} - السبب: ${note}`);
                showToast(`🗑️ تم حذف البطاقة. السبب: ${note}`);
            });
        });
    };
    
    renderEditCards();
    document.getElementById('editAddCardBtn').onclick = () => {
        tempCardsList.push({
            cardName: '',
            individuals: ''
        });
        renderEditCards();
    };
    
    document.getElementById('saveEditBtn').onclick = async () => {
        const name = document.getElementById('editSubName').value.trim();
        if (!name) {
            showToast('الاسم مطلوب', true);
            return;
        }
        if (tempCardsList.length === 0) {
            showToast('يجب إضافة بطاقة واحدة على الأقل', true);
            return;
        }
        
        const idx = subscribers.findIndex(s => s.id == sub.id);
        if (idx !== -1) {
            const oldSub = subscribers[idx];
            
            const key = getKey(currentYear, currentMonth);
            const today = new Date().getDate();
            const days = getDays(currentYear, currentMonth);
            
            const cardsList = tempCardsList.map(card => ({
                cardName: String(card.cardName || '').trim(),
                individuals: parseInt(card.individuals) || 1,
                dailyBreadOverride: card.dailyBreadOverride || null,
                createdAt: card.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                history: Array.isArray(card.history) ? card.history : [],
                notes: String(card.notes || '')
            }));
            
            cardsList.forEach((newCard, cardIdx) => {
                const oldCard = oldSub.cardsList ? oldSub.cardsList[cardIdx] : null;
                if (oldCard && oldCard.individuals !== newCard.individuals && today > 1 && today < days) {
                    const newDefaultBread = newCard.individuals * DEFAULT_DAILY_BREAD_PER_PERSON;
                    
                    if (newCard.dailyBreadOverride !== null && newCard.dailyBreadOverride > newDefaultBread) {
                        newCard.dailyBreadOverride = newDefaultBread;
                    }
                    
                    const newTotalDailyBread = cardsList.reduce((sum, c) => {
                        return sum + (c.dailyBreadOverride || c.individuals * DEFAULT_DAILY_BREAD_PER_PERSON);
                    }, 0);
                    
                    if (!breadOverrides[oldSub.id]) breadOverrides[oldSub.id] = {};
                    if (!breadOverrides[oldSub.id][key]) breadOverrides[oldSub.id][key] = [];
                    
                    breadOverrides[oldSub.id][key] = breadOverrides[oldSub.id][key].filter(o => o.day !== today);
                    
                    breadOverrides[oldSub.id][key].push({
                        day: today,
                        totalDailyBread: newTotalDailyBread,
                        reason: `تغيير عدد أفراد بطاقة "${newCard.cardName}" من ${oldCard.individuals} إلى ${newCard.individuals}`
                    });
                    
                    breadOverrides[oldSub.id][key].sort((a, b) => a.day - b.day);
                }
            });
            
            subscribers[idx].name = name;
            subscribers[idx].cardsList = cardsList;
            subscribers[idx].updatedAt = new Date().toISOString();
        }
        
        addActivityLog('تعديل مشترك', `تم تعديل المشترك ${name}`);
        requestPushNotification('المخبز', `تم تعديل المشترك • ${name} ✓`);
        await saveData();
        closeModal();
    };
}

function editSub(id) {
    if (!hasFullEditDelete()) {
        showToast('لا صلاحية', true);
        return;
    }
    const sub = subscribers.find(s => s.id == id);
    if (sub) {
        showEditSubscriberModal(sub);
    } else {
        showToast('المشترك غير موجود', true);
    }
}

// ========== نافذة إدارة المستخدمين ==========

function showUserManagement() {
    if (!isAdmin()) return;

    disableBodyScroll();
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px;">
            <h3>👥 إدارة المستخدمين</h3>
            <div class="user-management-grid" id="userGrid"></div>
            <div class="add-user-form">
                <h4 style="margin-bottom:12px;">➕ إضافة مستخدم جديد</h4>
                <input type="text" id="newUsername" placeholder="اسم المستخدم">
                <input type="password" id="newPassword" placeholder="كلمة المرور">
                <input type="email" id="newEmail" placeholder="البريد الإلكتروني">
                <select id="newRole">
                    <option value="read">قراءة فقط</option>
                    <option value="write">كتابة</option>
                    <option value="admin">مدير</option>
                </select>
                <button id="addUserBtn" class="btn btn-primary btn-sm" style="width:100%;">إضافة</button>
            </div>
            <div style="display:flex; justify-content:flex-end; margin-top:16px;">
                <button id="closeUserModal" class="btn btn-secondary btn-sm">إغلاق</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            enableBodyScroll();
        }
    });
    document.getElementById('closeUserModal').onclick = () => {
        modal.remove();
        enableBodyScroll();
    };

    const renderUserGrid = () => {
        const grid = document.getElementById('userGrid');
        grid.innerHTML = '';
        usersList.forEach((user, idx) => {
            const roleText = user.role === 'admin' ? 'مدير' : (user.role === 'write' ? 'كتابة' : 'قراءة فقط');
            const card = document.createElement('div');
            card.className = 'user-card-modern';
            card.innerHTML = `
                <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
                <div class="user-detail-row"><strong>${escapeHtml(user.username)}</strong></div>
                <div class="user-detail-row"><span class="user-role-badge">${roleText}</span></div>
                <div class="user-detail-row">📧 ${user.email || 'غير محدد'}</div>
                <div class="user-actions">
                    <button class="btn btn-sm btn-info edit-user-btn" data-idx="${idx}">✏️ تعديل</button>
                    <button class="btn btn-sm btn-danger delete-user-btn" data-idx="${idx}">🗑️ حذف</button>
                </div>
            `;
            grid.appendChild(card);
        });

        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.onclick = () => {
                const idx = btn.dataset.idx;
                const user = usersList[idx];
                if (user.username === 'admin') { showToast('لا يمكن حذف المدير الافتراضي', true); return; }
                if (confirm(`حذف المستخدم "${user.username}"؟`)) {
                    usersList.splice(idx, 1);
                    saveUsersToLocal();
                    saveData();
                    addActivityLog('حذف مستخدم', `تم حذف ${user.username}`);
                    renderUserGrid();
                }
            };
        });

        document.querySelectorAll('.edit-user-btn').forEach(btn => {
            btn.onclick = () => {
                const idx = btn.dataset.idx;
                const user = usersList[idx];
                const newUsername = prompt('اسم المستخدم الجديد:', user.username);
                if (!newUsername) return;
                const newPassword = prompt('كلمة المرور الجديدة (اتركه فارغاً لعدم التغيير):');
                const newEmail = prompt('البريد الإلكتروني:', user.email || '');
                const newRole = prompt('الصلاحية (admin, write, read):', user.role);
                if (newRole && !['admin', 'write', 'read'].includes(newRole)) {
                    showToast('صلاحية غير صالحة', true);
                    return;
                }
                usersList[idx] = {
                    ...user,
                    username: newUsername,
                    password: newPassword || user.password,
                    email: newEmail || '',
                    role: newRole || user.role,
                    updatedAt: new Date().toISOString()
                };
                saveUsersToLocal();
                saveData();
                addActivityLog('تعديل مستخدم', `تم تعديل ${newUsername}`);
                if (currentUser && currentUser.username === user.username) {
                    currentUser = { username: newUsername, role: usersList[idx].role, email: usersList[idx].email };
                    localStorage.setItem(STORAGE_SESSION, JSON.stringify(currentUser));
                    const userNameDisplay = document.getElementById('userNameDisplay');
                    if (userNameDisplay) userNameDisplay.innerText = currentUser.username;
                }
                renderUserGrid();
            };
        });
    };

    renderUserGrid();

    document.getElementById('addUserBtn').onclick = () => {
        const username = document.getElementById('newUsername').value.trim();
        const password = document.getElementById('newPassword').value.trim();
        const email = document.getElementById('newEmail').value.trim();
        const role = document.getElementById('newRole').value;
        if (!username || !password) { showToast('الاسم وكلمة المرور مطلوبان', true); return; }
        if (usersList.find(u => u.username === username)) { showToast('اسم المستخدم موجود', true); return; }
        usersList.push({
            username,
            password,
            role,
            email,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        saveUsersToLocal();
        saveData();
        addActivityLog('إضافة مستخدم', `تم إضافة ${username}`);
        renderUserGrid();
        document.getElementById('newUsername').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('newEmail').value = '';
    };
}

// ========== نافذة تسجيل الدخول ==========

function showLoginScreen() {
    console.log('🔐 عرض شاشة تسجيل الدخول');

    // إخفاء شاشة السبلاش
    const splash = document.getElementById('splashScreen');
    if (splash) {
        splash.classList.add('hidden');
        setTimeout(() => {
            splash.classList.remove('active');
            splash.classList.remove('hidden');
        }, 500);
    }

    // إظهار حاوية التطبيق مع نموذج تسجيل الدخول
    const appContainer = document.getElementById('appContainer');
    if (!appContainer) {
        console.error('❌ appContainer غير موجود');
        return;
    }

    appContainer.style.display = 'block';
    appContainer.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; min-height: 80vh; padding: 1rem;">
            <div style="background: var(--card-bg); border-radius: 16px; padding: 2rem; width: 100%; max-width: 400px; box-shadow: 0 8px 32px rgba(0,0,0,0.15);">
                <div style="text-align: center; margin-bottom: 1.5rem;">
                    <img src="icons/launchericon-192x192.png" alt="Logo" style="width: 64px; height: 64px; border-radius: 12px; margin-bottom: 0.5rem;">
                    <h2 style="margin: 0; color: var(--text-primary);">منظومة الخبز المدعم</h2>
                    <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary); font-size: 0.85rem;">تسجيل الدخول</p>
                </div>
                <div id="loginError" style="background: #ffebee; color: #c62828; padding: 8px 12px; border-radius: 8px; margin-bottom: 1rem; display: none; font-size: 0.85rem; text-align: center;"></div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.25rem; font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">اسم المستخدم</label>
                    <input type="text" id="loginUsername" placeholder="أدخل اسم المستخدم" autocomplete="username" style="width: 100%; padding: 10px 12px; border: 2px solid var(--border-color); border-radius: 8px; font-size: 0.9rem; background: var(--input-bg); color: var(--text-primary); box-sizing: border-box;">
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.25rem; font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">كلمة المرور</label>
                    <input type="password" id="loginPassword" placeholder="أدخل كلمة المرور" autocomplete="current-password" style="width: 100%; padding: 10px 12px; border: 2px solid var(--border-color); border-radius: 8px; font-size: 0.9rem; background: var(--input-bg); color: var(--text-primary); box-sizing: border-box;">
                </div>
                <div style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <input type="checkbox" id="loginRemember" style="width: auto;">
                    <label for="loginRemember" style="font-size: 0.85rem; color: var(--text-secondary); cursor: pointer;">تذكرني</label>
                </div>
                <button id="loginSubmitBtn" style="width: 100%; padding: 12px; background: #2c7a4d; color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.2s;">دخول</button>
                <p style="text-align: center; margin-top: 1rem; font-size: 0.75rem; color: var(--text-secondary);">تصميم م. محمد أبوالنصر</p>
            </div>
        </div>
    `;

    // إضافة الأحداث بعد حقن HTML
    const submitBtn = document.getElementById('loginSubmitBtn');
    const usernameInput = document.getElementById('loginUsername');
    const passwordInput = document.getElementById('loginPassword');
    const rememberCheck = document.getElementById('loginRemember');
    const errorDiv = document.getElementById('loginError');

    const doLogin = () => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (!username || !password) {
            errorDiv.style.display = 'block';
            errorDiv.textContent = 'الرجاء إدخال اسم المستخدم وكلمة المرور';
            return;
        }

        if (login(username, password, rememberCheck.checked)) {
            // نجاح - إعادة تحميل الصفحة
            location.reload();
        } else {
            errorDiv.style.display = 'block';
            errorDiv.textContent = '❌ اسم المستخدم أو كلمة المرور غير صحيحة';
            passwordInput.value = '';
            passwordInput.focus();
        }
    };

    // النقر على زر الدخول
    submitBtn.addEventListener('click', doLogin);

    // الضغط على Enter في حقل كلمة المرور
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            doLogin();
        }
    });

    // الضغط على Enter في حقل اسم المستخدم
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            passwordInput.focus();
        }
    });

    // تركيز تلقائي على حقل اسم المستخدم
    setTimeout(() => {
        usernameInput.focus();
    }, 600);

    console.log('✅ شاشة تسجيل الدخول جاهزة');
}
