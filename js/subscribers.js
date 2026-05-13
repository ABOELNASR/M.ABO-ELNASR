// ========== subscribers.js - عمليات المشتركين والبطاقات ==========

// ========== إدارة البطاقات المؤقتة (نموذج الإضافة/التعديل) ==========

function renderTempCards() {
    const container = document.getElementById('cardsListContainer');
    if (!container) return;
    
    if (tempCardsList.length === 0) {
        container.innerHTML = '<div style="color:var(--text-secondary); font-size:0.7rem; padding:0.5rem;">لا توجد بطاقات، أضف بطاقة على الأقل</div>';
        updateDuplicateWarnings();
        return;
    }
    
    let html = '';
    tempCardsList.forEach((card, idx) => {
        html += `
            <div class="card-item" data-card-index="${idx}">
                <input type="text" class="card-name" value="${escapeHtml(card.cardName)}" placeholder="اسم البطاقة">
                <input type="text" class="card-individuals" value="${card.individuals}" placeholder="عدد الأفراد">
                <button class="remove-card-btn" data-idx="${idx}">✖</button>
            </div>
        `;
    });
    container.innerHTML = html;
    
    document.querySelectorAll('.remove-card-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.dataset.idx);
            const card = tempCardsList[idx];
            const cardName = card.cardName || 'بطاقة غير مسماة';
            const individuals = parseInt(card.individuals) || 0;
            
            let subscriberName = 'إضافة جديدة';
            if (editId !== null) {
                const editingSub = subscribers.find(s => s.id == editId);
                subscriberName = editingSub ? editingSub.name : 'مشترك';
            }
            
            if (editId !== null) {
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
                renderTempCards();
                updateDuplicateWarnings();
                logDeletedCard(cardName, individuals, subscriberName, note);
                addActivityLog('حذف بطاقة', `حذف بطاقة "${cardName}" من ${subscriberName} - السبب: ${note}`);
                showToast(`🗑️ تم حذف البطاقة. السبب: ${note}`);
            } else {
                tempCardsList.splice(idx, 1);
                renderTempCards();
                updateDuplicateWarnings();
                showToast(`🗑️ تم حذف البطاقة.`);
            }
        });
    });
    
    document.querySelectorAll('.card-name').forEach((input, i) => {
        input.addEventListener('change', (e) => {
            tempCardsList[i].cardName = e.target.value;
            renderTempCards();
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
    
    updateDuplicateWarnings();
}

function addNewCard() {
    tempCardsList.push({
        cardName: '',
        individuals: '',
        dailyBreadOverride: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        history: [],
        notes: ''
    });
    renderTempCards();
    updateDuplicateWarnings();
}

function loadCardsForEdit(sub) {
    if (sub.cardsList && sub.cardsList.length) {
        tempCardsList = JSON.parse(JSON.stringify(sub.cardsList));
    } else {
        const migrated = migrateSubscriber(sub);
        tempCardsList = JSON.parse(JSON.stringify(migrated.cardsList));
    }
    renderTempCards();
}

// ========== عمليات المشتركين الأساسية ==========

function cancelEdit() {
    editId = null;
    document.getElementById('subName').value = '';
    tempCardsList = [];
    renderTempCards();
    document.getElementById('saveBtn').innerText = '💾 حفظ';
    updateDuplicateWarnings();
}

async function addOrUpdate() {
    if (!hasAddEditSubscriber()) {
        showToast('لا صلاحية', true);
        return;
    }
    
    const name = document.getElementById('subName').value.trim();
    if (!name) {
        showToast('الاسم مطلوب', true);
        return;
    }
    if (tempCardsList.length === 0) {
        showToast('يجب إضافة بطاقة واحدة على الأقل', true);
        return;
    }
    
    if (isDuplicateSubscriberName(name, editId)) {
        showToast('❌ اسم المشترك موجود بالفعل. الرجاء استخدام اسم آخر.', true);
        return;
    }
    
    let duplicateCardName = null;
    for (let i = 0; i < tempCardsList.length; i++) {
        const card = tempCardsList[i];
        if (!card.cardName || !card.cardName.trim()) continue;
        if (isDuplicateCardNameGlobal(card.cardName, editId)) {
            duplicateCardName = card.cardName;
            break;
        }
        if (isDuplicateCardInTemp(card.cardName, i)) {
            duplicateCardName = card.cardName;
            break;
        }
    }
    if (duplicateCardName) {
        showToast(`❌ اسم البطاقة "${duplicateCardName}" مكرر (موجود لدى مشترك آخر أو مكرر في القائمة).`, true);
        return;
    }
    
    let valid = true;
    tempCardsList.forEach((card, idx) => {
        if (!card.cardName || !card.cardName.trim()) {
            showToast(`البطاقة ${idx + 1}: اسم البطاقة مطلوب`, true);
            valid = false;
        }
        if (isNaN(card.individuals) || card.individuals <= 0) {
            showToast(`البطاقة ${idx + 1}: عدد الأفراد غير صحيح`, true);
            valid = false;
        }
    });
    if (!valid) return;
    
    const now = new Date().toISOString();
    const cardsList = tempCardsList.map(card => ({
        cardName: String(card.cardName || '').trim(),
        individuals: parseInt(card.individuals) || 1,
        dailyBreadOverride: null,
        createdAt: card.createdAt || now,
        updatedAt: now,
        history: Array.isArray(card.history) ? card.history : [],
        notes: String(card.notes || '')
    })).filter(card => card.cardName !== '');
    
    const isEdit = (editId !== null);
    
    if (isEdit) {
        const idx = subscribers.findIndex(s => s.id == editId);
        if (idx !== -1) {
            const oldSub = subscribers[idx];
            const key = getKey(currentYear, currentMonth);
            const today = new Date().getDate();
            const days = getDays(currentYear, currentMonth);
            const oldCardsCount = oldSub.cardsList ? oldSub.cardsList.length : 0;
            const newCardsCount = cardsList.length;
            
            // ⭐ كشف إضافة بطاقة جديدة
            const hasNewCard = newCardsCount > oldCardsCount;
            
            // ⭐ كشف تغيير في عدد الأفراد
            cardsList.forEach((newCard, cardIdx) => {
                const oldCard = oldSub.cardsList ? oldSub.cardsList[cardIdx] : null;
                if (oldCard && oldCard.individuals !== newCard.individuals) {
                    newCard.dailyBreadOverride = null;
                }
            });
            
            // ⭐ إضافة بطاقة جديدة - حساب من تاريخ اليوم
            if (hasNewCard && today > 1 && today < days) {
                const newTotalDailyBread = cardsList.reduce((sum, c) => {
                    return sum + (c.dailyBreadOverride || c.individuals * DEFAULT_DAILY_BREAD_PER_PERSON);
                }, 0);
                
                if (!breadOverrides[oldSub.id]) breadOverrides[oldSub.id] = {};
                if (!breadOverrides[oldSub.id][key]) breadOverrides[oldSub.id][key] = [];
                
                breadOverrides[oldSub.id][key] = breadOverrides[oldSub.id][key].filter(o => o.day !== today);
                
                breadOverrides[oldSub.id][key].push({
                    day: today,
                    totalDailyBread: newTotalDailyBread,
                    reason: `إضافة بطاقة جديدة (${newCardsCount} بطاقات)`
                });
                
                breadOverrides[oldSub.id][key].sort((a, b) => a.day - b.day);
            }
            
            // ⭐ لو مفيش بطاقة جديدة، نمسح breadOverrides
            if (!hasNewCard) {
                if (breadOverrides[oldSub.id] && breadOverrides[oldSub.id][key]) {
                    delete breadOverrides[oldSub.id][key];
                }
            }
            
            const historyEntry = {
                action: 'تعديل المشترك',
                note: hasNewCard ? `إضافة بطاقة جديدة` : 'تعديل بيانات',
                date: now,
                oldName: oldSub.name,
                newName: name,
                oldCards: oldCardsCount,
                newCards: newCardsCount
            };
            const updatedHistory = [...(oldSub.history || []), historyEntry];
            subscribers[idx] = {
                ...oldSub,
                name,
                cardsList: cardsList,
                updatedAt: now,
                history: updatedHistory,
                lastEditNote: hasNewCard ? 'إضافة بطاقة جديدة' : 'تعديل بيانات'
            };
            addActivityLog('تعديل مشترك', `تم تعديل المشترك ${name}`);
        }
        editId = null;
        requestPushNotification('المخبز', `تم تعديل المشترك • ${name} ✓`);
    } else {
        const newId = Date.now() + Math.floor(Math.random() * 10000);
        const newSubscriber = {
            id: newId,
            name: name,
            balance: 0,
            cardsList: cardsList,
            createdAt: now,
            updatedAt: now,
            history: []
        };
        subscribers.push(newSubscriber);
        const totalInd = getTotalIndividuals({ cardsList });
        addActivityLog('إضافة مشترك', `تم إضافة مشترك جديد: ${name} مع ${cardsList.length} بطاقات (إجمالي الأفراد ${totalInd})`);
        requestPushNotification('المخبز', `تم إضافة المشترك • ${name} ✓`);
    }
    
    await saveData();
    cancelEdit();
    renderAll();
}

async function deleteSub(id) {
    if (!hasFullEditDelete()) {
        showToast('لا صلاحية', true);
        return;
    }
    
    const sub = subscribers.find(s => s.id == id);
    if (!sub) {
        showToast('❌ المشترك غير موجود', true);
        await loadData();
        return;
    }
    
    const note = await askForNote(`حذف المشترك "${sub.name}"`);
    if (!confirm(`حذف المشترك "${sub.name}" نهائياً؟\nالملاحظة: ${note}`)) return;
    
    if (sub.cardsList && sub.cardsList.length) {
        sub.cardsList.forEach(card => {
            logDeletedCard(
                card.cardName || 'بطاقة غير مسماة',
                card.individuals || 0,
                sub.name,
                `حذف المشترك (ملاحظة: ${note})`
            );
        });
    }
    
    subscribers = subscribers.filter(s => s.id != id);
    delete monthlyPayments[id];
    delete paymentDates[id];
    
    addActivityLog('حذف مشترك', `تم حذف المشترك ${sub.name} (الملاحظة: ${note})`);
    requestPushNotification('المخبز', `تم حذف المشترك • ${sub.name} ✗`);
    await saveData();
    renderAll();
}

function editSub(id) {
    if (!hasFullEditDelete()) {
        showToast('لا صلاحية', true);
        return;
    }
    
    const sub = subscribers.find(s => s.id == id);
    if (sub) {
        document.getElementById('subName').value = sub.name;
        loadCardsForEdit(sub);
        editId = id;
        document.getElementById('saveBtn').innerText = '💾 تحديث';
        updateDuplicateWarnings();
    } else {
        showToast('المشترك غير موجود', true);
    }
}

// ========== عمليات المدفوعات ==========

async function editPayment(subId) {
    if (!hasPaymentActions()) {
        showToast('لا صلاحية', true);
        return;
    }
    
    const sub = subscribers.find(s => s.id == subId);
    if (!sub) {
        showToast('المشترك غير موجود', true);
        return;
    }
    
    const currentPaid = getPaid(subId);
    const totalValue = subValue(sub);
    const newPaidStr = prompt(`تعديل المدفوع للمشترك "${sub.name}"\nالحالي: ${currentPaid.toFixed(2)} ج.م\nأدخل المبلغ الجديد:`, currentPaid.toFixed(2));
    if (!newPaidStr) return;
    
    let newPaid = parseFloat(arabicToEnglishNumber(newPaidStr));
    if (isNaN(newPaid) || newPaid < 0) {
        showToast('قيمة غير صالحة', true);
        return;
    }
    if (newPaid > totalValue) newPaid = totalValue;
    
    const key = getKey(currentYear, currentMonth);
    if (!monthlyPayments[subId]) monthlyPayments[subId] = {};
    monthlyPayments[subId][key] = newPaid;
    
    if (!paymentDates[subId]) paymentDates[subId] = {};
    paymentDates[subId][key] = new Date().toISOString().slice(0, 10);
    
    addActivityLog('تعديل مبلغ مدفوع', `تم تعديل المدفوع للمشترك ${sub.name} إلى ${newPaid.toFixed(2)} ج.م`);
    requestPushNotification('المخبز', `تم تعديل مدفوعات • ${sub.name} ✓`);
    await saveData();
    renderAll();
}

async function toggleFullPayment(subId, wantPaid) {
    if (!hasPaymentActions()) {
        showToast('لا صلاحية', true);
        return;
    }
    
    const sub = subscribers.find(s => s.id == subId);
    if (!sub) {
        showToast('المشترك غير موجود', true);
        return;
    }
    
    const key = getKey(currentYear, currentMonth);
    const remaining = getRemaining(subId);
    
    if (wantPaid && remaining > 0) {
        const totalValue = subValue(sub);
        if (confirm(`تسجيل المتبقي ${remaining.toFixed(2)} ج.م كدفعة كاملة للمشترك ${sub.name}؟`)) {
            if (!monthlyPayments[subId]) monthlyPayments[subId] = {};
            monthlyPayments[subId][key] = totalValue;
            if (!paymentDates[subId]) paymentDates[subId] = {};
            paymentDates[subId][key] = new Date().toISOString().slice(0, 10);
            addActivityLog('تسديد كامل', `تم تسديد كامل مبلغ الاشتراك للمشترك ${sub.name}`);
            requestPushNotification('المخبز', `تم تسديد كامل الاشتراك • ${sub.name} • بقيمة ${formatNumber(totalValue)} ج.م ✓`);
            await saveData();
            renderAll();
        } else {
            renderAll();
        }
    } else if (!wantPaid && getPaid(subId) > 0) {
        if (confirm(`مسح جميع دفعات هذا الشهر للمشترك ${sub.name}؟`)) {
            if (monthlyPayments[subId]) delete monthlyPayments[subId][key];
            if (paymentDates[subId]) delete paymentDates[subId][key];
            addActivityLog('إلغاء مدفوعات', `تم إلغاء جميع دفعات الشهر للمشترك ${sub.name}`);
            requestPushNotification('المخبز', `تم إلغاء مدفوعات • ${sub.name} ✗`);
            await saveData();
            renderAll();
        } else {
            renderAll();
        }
    }
}

// ========== تعديل الحصة اليومية ==========

async function editDailyBread(subId) {
    if (!hasPaymentActions()) {
        showToast('لا صلاحية', true);
        return;
    }
    
    const sub = subscribers.find(s => s.id == subId);
    if (!sub) {
        showToast('المشترك غير موجود', true);
        return;
    }
    
    disableBodyScroll();
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    let cardsHtml = '';
    sub.cardsList.forEach((card, idx) => {
        const defaultBread = card.individuals * DEFAULT_DAILY_BREAD_PER_PERSON;
        const currentBread = card.dailyBreadOverride !== null ? card.dailyBreadOverride : defaultBread;
        cardsHtml += `
            <div style="border:1px solid var(--border-light); padding:0.8rem; margin-bottom:0.8rem; border-radius:12px;">
                <h4>📇 ${escapeHtml(card.cardName)} (${card.individuals} أفراد)</h4>
                <label>🍞 الحصة اليومية المعدلة (اتركه فارغاً للافتراضي ${defaultBread}):</label>
                <input type="number" id="bread_${idx}" value="${currentBread}" min="0" max="${defaultBread}" step="1" style="width:100%; padding:8px; border-radius:8px; margin-top:5px;">
                <small style="color: var(--text-secondary);">⚠️ لا يمكن تعديل الحصة لأعلى من ${defaultBread} رغيف/يوم</small>
            </div>
        `;
    });
    
    modal.innerHTML = `
        <div class="modal-content">
            <h3>🍞 تعديل الحصة اليومية للمشترك ${escapeHtml(sub.name)}</h3>
            <div style="max-height: 50vh; overflow-y: auto;">${cardsHtml}</div>
            <div class="date-picker-buttons" style="margin-top:1rem;">
                <button id="saveBreadBtn" class="btn btn-primary btn-sm">💾 حفظ التعديلات</button>
                <button id="cancelBreadBtn" class="btn btn-secondary btn-sm">إلغاء</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) { modal.remove(); enableBodyScroll(); } });
    document.getElementById('cancelBreadBtn').onclick = () => { modal.remove(); enableBodyScroll(); };
    document.getElementById('saveBreadBtn').onclick = async () => {
        const key = getKey(currentYear, currentMonth);
        const today = new Date().getDate();
        const days = getDays(currentYear, currentMonth);
        let hasChanges = false;
        let newTotalDailyBread = 0;
        
        sub.cardsList.forEach((card, idx) => {
            const input = document.getElementById(`bread_${idx}`);
            const val = input.value.trim();
            const defaultDaily = card.individuals * DEFAULT_DAILY_BREAD_PER_PERSON;
            const oldBread = card.dailyBreadOverride !== null ? card.dailyBreadOverride : defaultDaily;
            
            let newBread;
            if (val === '') {
                newBread = defaultDaily;
                card.dailyBreadOverride = null;
            } else {
                let num = parseInt(val);
                if (isNaN(num) || num < 0) num = 0;
                if (num > defaultDaily) {
                    num = defaultDaily;
                }
                newBread = num;
                card.dailyBreadOverride = num;
            }
            
            newTotalDailyBread += newBread;
            card.updatedAt = new Date().toISOString();
            
            if (oldBread !== newBread && today > 1 && today < days) {
                hasChanges = true;
            }
        });
        
        if (hasChanges) {
            if (!breadOverrides[sub.id]) breadOverrides[sub.id] = {};
            if (!breadOverrides[sub.id][key]) breadOverrides[sub.id][key] = [];
            
            breadOverrides[sub.id][key] = breadOverrides[sub.id][key].filter(o => o.day !== today);
            
            breadOverrides[sub.id][key].push({
                day: today,
                totalDailyBread: newTotalDailyBread,
                reason: 'تعديل الحصة اليومية'
            });
            
            breadOverrides[sub.id][key].sort((a, b) => a.day - b.day);
            
            showToast(`✅ تم تعديل الحصة. سيتم احتساب المتبقي من اليوم ${today} إلى نهاية الشهر.`);
        }
        
        addActivityLog('تعديل الحصة اليومية', `تم تعديل حصة المشترك ${sub.name}`);
        requestPushNotification('المخبز', `تم تعديل حصة • ${sub.name} ✓`);
        await saveData();
        renderAll();
        modal.remove();
        enableBodyScroll();
    };
}
