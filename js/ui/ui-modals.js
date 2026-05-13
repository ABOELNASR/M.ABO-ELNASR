// ========== ui-modals.js - النوافذ المنبثقة ==========

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
            
            const cardsList = tempCardsList.map(card => ({
                cardName: String(card.cardName || '').trim(),
                individuals: parseInt(card.individuals) || 1,
                dailyBreadOverride: card.dailyBreadOverride || null,
                createdAt: card.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                history: Array.isArray(card.history) ? card.history : [],
                notes: String(card.notes || '')
            }));
            
            // ⭐ تحديث الحصة اليومية تلقائياً عند تغيير عدد الأفراد في أي يوم
            cardsList.forEach((newCard, cardIdx) => {
                const oldCard = oldSub.cardsList ? oldSub.cardsList[cardIdx] : null;
                if (oldCard && oldCard.individuals !== newCard.individuals) {
                    const newDefaultBread = newCard.individuals * DEFAULT_DAILY_BREAD_PER_PERSON;
                    
                    // ⭐ إجبار الحصة اليومية على التحديث للافتراضي الجديد
                    newCard.dailyBreadOverride = null;
                    
                    // ⭐ تنظيف breadOverrides لأن الحساب من أول الشهر
                    const key = getKey(currentYear, currentMonth);
                    if (breadOverrides[oldSub.id] && breadOverrides[oldSub.id][key]) {
                        delete breadOverrides[oldSub.id][key];
                    }
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
