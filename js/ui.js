// ========== ui.js - دوال واجهة المستخدم ==========

// ========== عرض الجدول الرئيسي ==========

function renderTable() {
    console.log('renderTable called, expandedRowId:', expandedRowId);
    let filtered = subscribers.filter(s => subscriberMatchesSearch(s, currentSearch));
    if (currentFilter === 'paid') filtered = filtered.filter(s => isFullyPaid(s.id));
    if (currentFilter === 'unpaid') filtered = filtered.filter(s => !isFullyPaid(s.id));
    
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;

    const searchTerm = currentSearch.trim();
    let targetNumber = null;
    const englishNumber = parseInt(searchTerm);
    const arabicNumber = parseInt(arabicToEnglishNumber(searchTerm));
    if (!isNaN(englishNumber) && englishNumber.toString() === searchTerm) targetNumber = englishNumber;
    else if (!isNaN(arabicNumber)) targetNumber = arabicNumber;

    if (targetNumber !== null) {
        let cardsHtml = '';
        let totalMatchingCards = 0;
        filtered.forEach(sub => {
            if (sub.cardsList) {
                sub.cardsList.forEach(card => {
                    if (card.individuals === targetNumber) {
                        totalMatchingCards++;
                        cardsHtml += `<tr><td colspan="9" style="text-align:right; padding:12px;">
                            <div style="display:flex; align-items:center; gap:15px;">
                                <span style="font-weight:bold; color:var(--btn-light-green);">📇 ${escapeHtml(card.cardName)}</span>
                                <span>👤 ${escapeHtml(sub.name)}</span>
                                <span>👥 ${card.individuals} أفراد</span>
                                <button class="btn btn-sm btn-info expand-sub-btn" data-id="${sub.id}">🔽 عرض المشترك</button>
                            </div>
                        </td></tr>`;
                    }
                });
            }
        });
        tbody.innerHTML = cardsHtml || '<tr><td colspan="9" style="text-align:center;">لا توجد بطاقات بهذا العدد</td></tr>';
        const cardsHeader = document.getElementById('cardsCountHeader');
        if (cardsHeader) cardsHeader.innerHTML = `📇 عدد البطاقات بعدد أفراد ${targetNumber}: ${totalMatchingCards}`;
        attachTableEvents();
        return;
    }

    if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">لا توجد بيانات</td></tr>';
        attachTableEvents();
        return;
    }

    let rowsHtml = '';
    filtered.forEach(sub => {
        const totalInd = getTotalIndividuals(sub);
        const total = subValue(sub);
        const paid = getPaid(sub.id);
        const rem = total - paid;
        const dailyBread = getDailyBread(sub);
        const checked = rem <= 0 ? 'checked' : '';
        
        let rowClass = rem <= 0 ? 'row-paid' : 'row-unpaid';
        if (currentSelectedRowId == sub.id) rowClass += ' row-selected';
        const showEditDelete = hasFullEditDelete();
        const showPaymentActions = hasPaymentActions();

        let actionButtons = '';
        if (showEditDelete) {
            actionButtons += `<button class="action-icon-btn edit-btn" data-id="${sub.id}" title="تعديل المشترك">✏️</button>`;
            actionButtons += `<button class="action-icon-btn delete-btn" data-id="${sub.id}" title="حذف المشترك">🗑️</button>`;
        }
        if (showPaymentActions) {
            actionButtons += `<button class="action-icon-btn edit-payment-btn" data-id="${sub.id}" title="تعديل المدفوع">💰</button>`;
            actionButtons += `<button class="action-icon-btn edit-bread-btn" data-id="${sub.id}" title="تعديل الحصة">🍞</button>`;
        }
        if (!showEditDelete && !showPaymentActions) {
            actionButtons = '<span style="padding:6px; opacity:0.6;">🔒</span>';
        }

        let remainingDisplay = '';
        if (rem < 0) {
            remainingDisplay = `<span style="color: #e67e22; font-weight: bold;">دائن ${formatNumber(Math.abs(rem))} ج.م</span>`;
        } else {
            remainingDisplay = `${formatNumber(rem)} ج.م`;
        }

        rowsHtml += `<tr class="${rowClass}" data-id="${sub.id}">
            <td><strong>${escapeHtml(sub.name)}</strong></td>
            <td>${sub.cardsList ? sub.cardsList.length : 0}</td>
            <td>${totalInd}</td>
            <td>${dailyBread} رغيف</td>
            <td>${formatNumber(total)} ج.م</td>
            <td>${formatNumber(paid)} ج.م</td>
            <td>${remainingDisplay}</td>
            <td><input type="checkbox" class="checkbox-paid" data-id="${sub.id}" ${checked} ${!showPaymentActions ? 'disabled' : ''}></td>
            <td><div class="action-buttons-container">${actionButtons}</div></td>
        </tr>`;
    });

    tbody.innerHTML = rowsHtml;
    console.log('Rows built. expandedRowId:', expandedRowId);

    if (expandedRowId !== null) {
        const targetRow = tbody.querySelector(`tr[data-id="${expandedRowId}"]`);
        if (targetRow) {
            const sub = subscribers.find(s => s.id == expandedRowId);
            if (sub) {
                let cardsHtml = '';
                if (sub.cardsList && sub.cardsList.length) {
                    cardsHtml = '<div class="cards-vertical-list">';
                    sub.cardsList.forEach((card, idx) => {
                        const bread = getDailyBreadForCard(card);
                        cardsHtml += `<div class="card-item-detail">
                            <span class="card-number">${idx + 1}.</span>
                            <span class="card-name-detail">📇 ${escapeHtml(card.cardName)}</span>
                            <span class="card-individuals-detail">👥 ${card.individuals} أفراد</span>
                            <span class="card-individuals-detail">🍞 ${bread} رغيف/يوم</span>
                            ${card.notes ? `<span class="card-notes-detail">📝 ${escapeHtml(card.notes)}</span>` : ''}
                        </div>`;
                    });
                    cardsHtml += '</div>';
                } else {
                    cardsHtml = 'لا توجد بطاقات';
                }
                const detailRow = document.createElement('tr');
                detailRow.className = 'cards-detail-row';
                detailRow.innerHTML = `<td colspan="9" class="cards-detail-cell">${cardsHtml}</td>`;
                targetRow.insertAdjacentElement('afterend', detailRow);
                console.log('Detail row inserted.');
            }
        }
    }

    attachTableEvents();
}

// ========== عرض الكروت (Card View) - مع تبويبين ==========

function renderCards() {
    let filtered = subscribers.filter(s => subscriberMatchesSearch(s, currentSearch));
    if (currentFilter === 'paid') filtered = filtered.filter(s => isFullyPaid(s.id));
    if (currentFilter === 'unpaid') filtered = filtered.filter(s => !isFullyPaid(s.id));
    
    const container = document.getElementById('cardsViewContainer');
    if (!container) return;

    const searchTerm = currentSearch.trim();
    let targetNumber = null;
    const englishNumber = parseInt(searchTerm);
    const arabicNumber = parseInt(arabicToEnglishNumber(searchTerm));
    if (!isNaN(englishNumber) && englishNumber.toString() === searchTerm) targetNumber = englishNumber;
    else if (!isNaN(arabicNumber)) targetNumber = arabicNumber;

    if (targetNumber !== null) {
        let cardsHtml = '';
        filtered.forEach(sub => {
            if (sub.cardsList) {
                sub.cardsList.forEach(card => {
                    if (card.individuals === targetNumber) {
                        const bread = getDailyBreadForCard(card);
                        cardsHtml += `
                        <div class="subscriber-card row-paid" style="border-right-color: var(--btn-info);">
                            <div class="card-header">
                                <span class="card-title">📇 ${escapeHtml(card.cardName)}</span>
                                <span style="font-size:0.7rem; color: var(--text-secondary);">👤 ${escapeHtml(sub.name)}</span>
                            </div>
                            <div class="card-details-grid" style="grid-template-columns: repeat(3, 1fr);">
                                <div class="card-detail-item">
                                    <div class="card-detail-label">👥 الأفراد</div>
                                    <div class="card-detail-value" data-fit-text>${card.individuals}</div>
                                </div>
                                <div class="card-detail-item">
                                    <div class="card-detail-label">🍞 الحصة اليومية</div>
                                    <div class="card-detail-value" data-fit-text>${bread} رغيف</div>
                                </div>
                                <div class="card-detail-item">
                                    <div class="card-detail-label">👤 المشترك</div>
                                    <div class="card-detail-value" data-fit-text style="font-size:0.7rem;">${escapeHtml(sub.name)}</div>
                                </div>
                            </div>
                        </div>`;
                    }
                });
            }
        });
        container.innerHTML = cardsHtml || '<div style="text-align:center; padding:2rem; color: var(--text-secondary);">لا توجد بطاقات بهذا العدد</div>';
        applyFitTextToCards();
        return;
    }

    if (!filtered.length) {
        container.innerHTML = '<div style="text-align:center; padding:2rem; color: var(--text-secondary);">لا توجد بيانات</div>';
        return;
    }

    let cardsHtml = '<div class="cards-view-grid">';
    filtered.forEach(sub => {
        const totalInd = getTotalIndividuals(sub);
        const total = subValue(sub);
        const paid = getPaid(sub.id);
        const rem = total - paid;
        const dailyBread = getDailyBread(sub);
        const checked = rem <= 0 ? 'checked' : '';
        const days = getDays(currentYear, currentMonth);
        const monthlyBread = dailyBread * days;
        
        let cardClass = rem <= 0 ? 'row-paid' : 'row-unpaid';
        if (currentSelectedRowId == sub.id) cardClass += ' row-selected';
        
        const badgeClass = rem <= 0 ? 'paid' : 'unpaid';
        const badgeText = rem <= 0 ? '✅ خالص' : '❌ متبقي';
        
        const showEditDelete = hasFullEditDelete();
        const showPaymentActions = hasPaymentActions();

        let remainingClass = '';
        let remainingText = '';
        if (rem < 0) {
            remainingClass = 'remaining-credit';
            remainingText = `دائن ${formatNumber(Math.abs(rem))} ج.م`;
        } else if (rem > 0) {
            remainingClass = 'remaining-positive';
            remainingText = `${formatNumber(rem)} ج.م`;
        } else {
            remainingText = `${formatNumber(rem)} ج.م`;
        }

        let cardsListHtml = '';
        if (sub.cardsList && sub.cardsList.length) {
            cardsListHtml = '<div class="card-cards-list">';
            sub.cardsList.forEach((card, idx) => {
                const cardBread = getDailyBreadForCard(card);
                const cardMonthlyBread = cardBread * days;
                cardsListHtml += `
                <div class="card-card-item">
                    <span class="card-card-name">📇 ${escapeHtml(card.cardName)}</span>
                    <span class="card-card-ind">👥 ${card.individuals}</span>
                    <span class="card-card-bread">🍞 ${cardBread}/يوم</span>
                    <span class="card-card-monthly">📅 ${cardMonthlyBread}/شهر</span>
                </div>`;
            });
            cardsListHtml += `
                <div class="card-card-totals">
                    <span>👥 إجمالي الأفراد: ${totalInd}</span>
                    <span>🍞 إجمالي الحصة الشهرية: ${monthlyBread} رغيف</span>
                </div>`;
            cardsListHtml += '</div>';
        }

        cardsHtml += `
        <div class="subscriber-card ${cardClass}" data-id="${sub.id}">
            <div class="card-tabs">
                <button class="card-tab active" data-tab="info">📋 معلومات</button>
                <button class="card-tab" data-tab="cards">📇 البطاقات</button>
            </div>
            <div class="card-tab-content active" data-content="info">
                <div class="card-header">
                    <span class="card-title">👤 ${escapeHtml(sub.name)}</span>
                    <span class="card-badge ${badgeClass}">${badgeText}</span>
                </div>
                <div class="card-details-grid">
                    <div class="card-detail-item">
                        <div class="card-detail-label">📇 البطاقات</div>
                        <div class="card-detail-value" data-fit-text>${sub.cardsList ? sub.cardsList.length : 0}</div>
                    </div>
                    <div class="card-detail-item">
                        <div class="card-detail-label">👥 الأفراد</div>
                        <div class="card-detail-value" data-fit-text>${totalInd}</div>
                    </div>
                    <div class="card-detail-item">
                        <div class="card-detail-label">🍞 الحصة</div>
                        <div class="card-detail-value" data-fit-text>${dailyBread} رغيف</div>
                    </div>
                    <div class="card-detail-item">
                        <div class="card-detail-label">💰 الاشتراك</div>
                        <div class="card-detail-value" data-fit-text>${formatNumber(total)} ج.م</div>
                    </div>
                    <div class="card-detail-item">
                        <div class="card-detail-label">✅ المدفوع</div>
                        <div class="card-detail-value" data-fit-text>${formatNumber(paid)} ج.م</div>
                    </div>
                    <div class="card-detail-item">
                        <div class="card-detail-label">⏳ المتبقي</div>
                        <div class="card-detail-value ${remainingClass}" data-fit-text>${remainingText}</div>
                    </div>
                </div>
            </div>
            <div class="card-tab-content" data-content="cards">
                <div class="card-cards-header">👤 ${escapeHtml(sub.name)}</div>
                ${cardsListHtml || '<div style="text-align:center;color:var(--text-secondary);">لا توجد بطاقات</div>'}
            </div>
            <div class="card-actions-row">
                ${showPaymentActions ? `<input type="checkbox" class="checkbox-paid card-checkbox" data-id="${sub.id}" ${checked} ${!showPaymentActions ? 'disabled' : ''} title="خالص">` : ''}
                ${showEditDelete ? `<button class="action-icon-btn edit-btn" data-id="${sub.id}" title="تعديل">✏️</button>` : ''}
                ${showEditDelete ? `<button class="action-icon-btn delete-btn" data-id="${sub.id}" title="حذف">🗑️</button>` : ''}
                ${showPaymentActions ? `<button class="action-icon-btn edit-payment-btn" data-id="${sub.id}" title="مدفوع">💰</button>` : ''}
                ${showPaymentActions ? `<button class="action-icon-btn edit-bread-btn" data-id="${sub.id}" title="حصة">🍞</button>` : ''}
                ${!showEditDelete && !showPaymentActions ? '<span style="padding:6px; opacity:0.6;">🔒</span>' : ''}
            </div>
        </div>`;
    });
    cardsHtml += '</div>';

    container.innerHTML = cardsHtml;

    bindCardEvents();
    bindCardTabs();
    applyFitTextToCards();
}

function bindCardTabs() {
    document.querySelectorAll('.subscriber-card').forEach(card => {
        card.querySelectorAll('.card-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.stopPropagation();
                const tabName = tab.dataset.tab;
                
                card.querySelectorAll('.card-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                card.querySelectorAll('.card-tab-content').forEach(c => c.classList.remove('active'));
                const content = card.querySelector(`.card-tab-content[data-content="${tabName}"]`);
                if (content) content.classList.add('active');
            });
        });
    });
}

function bindCardEvents() {
    document.querySelectorAll('.subscriber-card .edit-btn').forEach(b => b.onclick = (e) => { e.stopPropagation(); editSub(parseInt(b.dataset.id)); });
    document.querySelectorAll('.subscriber-card .delete-btn').forEach(b => b.onclick = (e) => { e.stopPropagation(); deleteSub(parseInt(b.dataset.id)); });
    document.querySelectorAll('.subscriber-card .edit-payment-btn').forEach(b => b.onclick = (e) => { e.stopPropagation(); editPayment(parseInt(b.dataset.id)); });
    document.querySelectorAll('.subscriber-card .edit-bread-btn').forEach(b => b.onclick = (e) => { e.stopPropagation(); editDailyBread(parseInt(b.dataset.id)); });
    document.querySelectorAll('.subscriber-card .checkbox-paid').forEach(cb => {
        cb.onchange = (e) => { e.stopPropagation(); toggleFullPayment(parseInt(cb.dataset.id), cb.checked); };
    });
}

function applyFitTextToCards() {
    document.querySelectorAll('.card-detail-value[data-fit-text]').forEach(el => {
        fitTextToContainer(el, 0.85, 0.55);
    });
}

// ========== تبديل العرض ==========

function toggleView(mode) {
    viewMode = mode;
    
    const tableViewBtn = document.getElementById('tableViewBtn');
    const cardsViewBtn = document.getElementById('cardsViewBtn');
    const tableWrapper = document.getElementById('tableWrapper');
    const cardsContainer = document.getElementById('cardsViewContainer');
    
    if (tableViewBtn && cardsViewBtn) {
        tableViewBtn.classList.toggle('active', mode === 'table');
        cardsViewBtn.classList.toggle('active', mode === 'cards');
    }
    
    if (tableWrapper && cardsContainer) {
        if (mode === 'table') {
            tableWrapper.style.display = 'block';
            cardsContainer.style.display = 'none';
            renderTable();
        } else {
            tableWrapper.style.display = 'none';
            cardsContainer.style.display = 'block';
            renderCards();
        }
    }
}

function attachTableEvents() {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;

    tbody.querySelectorAll('tr[data-id]').forEach(row => {
        row.removeEventListener('click', handleRowClick);
        row.addEventListener('click', handleRowClick);
    });

    document.querySelectorAll('.edit-btn').forEach(b => b.onclick = (e) => { e.stopPropagation(); editSub(parseInt(b.dataset.id)); });
    document.querySelectorAll('.delete-btn').forEach(b => b.onclick = (e) => { e.stopPropagation(); deleteSub(parseInt(b.dataset.id)); });
    document.querySelectorAll('.edit-payment-btn').forEach(b => b.onclick = (e) => { e.stopPropagation(); editPayment(parseInt(b.dataset.id)); });
    document.querySelectorAll('.edit-bread-btn').forEach(b => b.onclick = (e) => { e.stopPropagation(); editDailyBread(parseInt(b.dataset.id)); });
    document.querySelectorAll('.checkbox-paid').forEach(cb => {
        cb.onchange = (e) => { e.stopPropagation(); toggleFullPayment(parseInt(cb.dataset.id), cb.checked); };
    });
    document.querySelectorAll('.expand-sub-btn').forEach(btn => {
        btn.onclick = () => {
            const id = parseInt(btn.dataset.id);
            currentSelectedRowId = id;
            expandedRowId = id;
            currentSearch = '';
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.value = '';
            renderAll();
        };
    });
}

function handleRowClick(e) {
    if (e.target.closest('button') || e.target.closest('.checkbox-paid')) return;
    const row = e.currentTarget;
    const id = parseInt(row.dataset.id);
    e.stopPropagation();
    if (currentSelectedRowId === id) {
        expandedRowId = null;
        currentSelectedRowId = null;
    } else {
        currentSelectedRowId = id;
        expandedRowId = id;
    }
    renderTable();
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('table') && !e.target.closest('.modal-overlay') && !e.target.closest('button') && !e.target.closest('.subscriber-card')) {
        if (currentSelectedRowId !== null) {
            currentSelectedRowId = null;
            expandedRowId = null;
            renderAll();
        }
    }
});

// ========== تحديث واجهة المستخدم ==========

function updateUI() {
    if (!isReadOnly()) {
        let totalVal = 0, totalPaid = 0;
        const totalCardsCount = getFilteredCardsCount(currentSearch);
        const filteredSubs = subscribers.filter(s => subscriberMatchesSearch(s, currentSearch));
        filteredSubs.forEach(s => { totalVal += subValue(s); totalPaid += getPaid(s.id); });

        const elSubs = document.getElementById('totalSubs');
        if (elSubs) elSubs.innerText = filteredSubs.length;

        const elMonthVal = document.getElementById('totalMonthValue');
        if (elMonthVal) elMonthVal.innerHTML = formatNumber(totalVal) + ' ج.م';

        const elPaid = document.getElementById('totalPaidMonth');
        if (elPaid) elPaid.innerHTML = formatNumber(totalPaid) + ' ج.م';

        const elDue = document.getElementById('totalDueMonth');
        if (elDue) elDue.innerHTML = formatNumber(totalVal - totalPaid) + ' ج.م';

        const elCards = document.getElementById('cardsCountHeader');
        if (elCards) elCards.innerHTML = `📇 عدد البطاقات: ${totalCardsCount}`;

        fitTextToContainer(document.getElementById('totalMonthValue'));
        fitTextToContainer(document.getElementById('totalPaidMonth'));
        fitTextToContainer(document.getElementById('totalDueMonth'));
    }

    const elDays = document.getElementById('daysCount');
    if (elDays) elDays.innerText = getDays(currentYear, currentMonth);

    const elMonthYear = document.getElementById('currentMonthYear');
    if (elMonthYear) elMonthYear.innerText = `${getMonthName(currentMonth)} ${currentYear}`;
}

function renderAll() { 
    updateUI(); 
    if (viewMode === 'cards') {
        renderCards();
    } else {
        renderTable();
    }
}

function changeMonth(delta) {
    let nm = currentMonth + delta, ny = currentYear;
    if (nm < 0) { nm = 11; ny--; }
    if (nm > 11) { nm = 0; ny++; }
    currentYear = ny;
    currentMonth = nm;
    currentSelectedRowId = null;
    expandedRowId = null;
    renderAll();
}

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
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.editIdx);
                tempCardsList.splice(idx, 1);
                renderEditCards();
                updateDuplicateWarnings();
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
            subscribers[idx].name = name;
            subscribers[idx].cardsList = tempCardsList.map(card => ({
                cardName: String(card.cardName || '').trim(),
                individuals: parseInt(card.individuals) || 1,
                dailyBreadOverride: card.dailyBreadOverride || null,
                createdAt: card.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                history: Array.isArray(card.history) ? card.history : [],
                notes: String(card.notes || '')
            }));
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

// ========== زر فرق النقاط ==========
function showCreditBalanceReport() {
    disableBodyScroll();
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    const creditors = subscribers.filter(s => hasCreditBalance(s.id));
    
    let html = '<h3>🪙 المشتركون المستحقون لمبالغ (فرق النقاط)</h3>';
    
    if (creditors.length === 0) {
        html += '<div style="text-align:center; padding:2rem;">لا يوجد مشتركون مستحقون لمبالغ حالياً.</div>';
    } else {
        html += '<div style="max-height: 60vh; overflow-y: auto;">';
        creditors.forEach(sub => {
            const credit = Math.abs(getRemaining(sub.id));
            const total = subValue(sub);
            const paid = getPaid(sub.id);
            html += `
                <div class="report-card-item" style="cursor: default;">
                    <div class="report-card-title" style="display: flex; justify-content: space-between; align-items: center;">
                        <span>👤 ${escapeHtml(sub.name)}</span>
                        <span style="color: #e67e22; font-weight: bold;">يستحق ${formatNumber(credit)} ج.م</span>
                        <button class="btn btn-sm btn-primary settle-credit-btn" data-id="${sub.id}">✅ تم الدفع</button>
                    </div>
                    <div class="report-card-details">
                        الحصة: ${getDailyBread(sub)} رغيف/يوم | قيمة الاشتراك: ${formatNumber(total)} ج.م | المدفوع: ${formatNumber(paid)} ج.م
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    html += '<button id="closeCreditReportBtn" class="btn btn-secondary btn-sm" style="margin-top:1rem;">إغلاق</button>';
    modal.innerHTML = `<div class="modal-content">${html}</div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) { modal.remove(); enableBodyScroll(); } });
    document.getElementById('closeCreditReportBtn').onclick = () => { modal.remove(); enableBodyScroll(); };
    
    document.querySelectorAll('.settle-credit-btn').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const subId = parseInt(btn.dataset.id);
            const sub = subscribers.find(s => s.id === subId);
            if (!sub) return;
            
            const credit = Math.abs(getRemaining(subId));
            if (!confirm(`هل تم دفع مبلغ ${formatNumber(credit)} ج.م للمشترك "${sub.name}"؟\n(سيؤدي هذا لجعل حسابه غير دائن لهذا الشهر)`)) return;
            
            const key = getKey(currentYear, currentMonth);
            if (!monthlyPayments[subId]) monthlyPayments[subId] = {};
            monthlyPayments[subId][key] = subValue(sub);
            if (!paymentDates[subId]) paymentDates[subId] = {};
            paymentDates[subId][key] = new Date().toISOString().slice(0, 10);
            
            addActivityLog('تسوية نقاط', `تمت تسوية مستحقات ${sub.name} بمبلغ ${formatNumber(credit)} ج.م`);
            await saveData();
            renderAll();
            requestPushNotification('المخبز', `تمت تسوية مستحقات • ${sub.name} ✓`);
            modal.remove();
            enableBodyScroll();
            showCreditBalanceReport();
        };
    });
}

// ========== استعادة النسخ الاحتياطية من الواجهة ==========
async function showRestoreBackupModal() {
    disableBodyScroll();
    showToast('⏳ جاري تحميل قائمة النسخ الاحتياطية...');
    let backups = [];
    try {
        const resp = await fetch(`${API_URL}?action=listBackups`);
        const data = await resp.json();
        if (data.error) throw new Error(data.error);
        backups = data.backups || [];
    } catch (e) {
        showToast('❌ فشل تحميل النسخ الاحتياطية: ' + e.message, true);
        enableBodyScroll();
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    let html = '<h3>🔄 استعادة نسخة احتياطية</h3>';
    html += '<div style="max-height: 60vh; overflow-y: auto;">';
    
    if (backups.length === 0) {
        html += '<div style="text-align:center; padding:2rem;">لا توجد نسخ احتياطية متاحة.</div>';
    } else {
        backups.forEach(backup => {
            html += `
                <div class="report-card-item" style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>📅 ${backup.date}</strong> (${backup.time})
                        <span style="color: var(--text-secondary);"> | 👥 ${backup.subscribersCount} مشترك</span>
                    </div>
                    <button class="btn btn-sm btn-primary restore-backup-btn" data-date="${backup.date}">استعادة</button>
                </div>
            `;
        });
    }
    html += '</div>';
    html += '<button id="closeRestoreModalBtn" class="btn btn-secondary btn-sm" style="margin-top:1rem;">إغلاق</button>';
    modal.innerHTML = `<div class="modal-content">${html}</div>`;
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => { if (e.target === modal) { modal.remove(); enableBodyScroll(); } });
    document.getElementById('closeRestoreModalBtn').onclick = () => { modal.remove(); enableBodyScroll(); };
    
    document.querySelectorAll('.restore-backup-btn').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const date = btn.dataset.date;
            if (!confirm(`هل أنت متأكد من استعادة النسخة الاحتياطية بتاريخ ${date}؟\nسيتم استبدال جميع البيانات الحالية.`)) return;
            
            btn.disabled = true;
            btn.innerText = '⏳';
            try {
                const resp = await fetch(`${API_URL}?action=restoreBackup&date=${date}`);
                const result = await resp.json();
                if (result.error) throw new Error(result.error);
                
                localStorage.removeItem(STORAGE_DATA);
                showToast('✅ تمت الاستعادة بنجاح. جاري إعادة تحميل التطبيق...');
                requestPushNotification('المخبز', `تمت استعادة نسخة احتياطية`);
                setTimeout(() => {
                    modal.remove();
                    enableBodyScroll();
                    window.location.reload();
                }, 1500);
            } catch(err) {
                showToast('❌ فشلت الاستعادة: ' + err.message, true);
                btn.disabled = false;
                btn.innerText = 'استعادة';
            }
        };
    });
}

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

// ========== وضع ملء الشاشة للجدول ==========
function toggleFullscreenTable() {
    const section = document.getElementById('tableSection');
    const btn = document.getElementById('toggleFullscreenBtn');
    const toolbar = document.getElementById('toolbar');
    const cardsCountHeader = document.getElementById('cardsCountHeader');
    
    if (!section || !btn) return;
    
    section.classList.toggle('fullscreen');
    
    if (section.classList.contains('fullscreen')) {
        btn.innerHTML = '✖';
        btn.title = 'إغلاق وضع ملء الشاشة';
        disableBodyScroll();
        
        if (toolbar && cardsCountHeader) {
            const tableWrapper = document.getElementById('tableWrapper');
            if (tableWrapper) {
                section.insertBefore(toolbar, tableWrapper);
                section.insertBefore(cardsCountHeader, toolbar);
            }
        }
    } else {
        btn.innerHTML = '🖥️';
        btn.title = 'تكبير الجدول';
        enableBodyScroll();
        
        if (toolbar && cardsCountHeader) {
            const formCard = document.getElementById('addSubscriberCard');
            if (formCard) {
                formCard.insertAdjacentElement('afterend', toolbar);
                toolbar.insertAdjacentElement('beforebegin', cardsCountHeader);
            }
        }
    }
}

// ========== ربط الأحداث ==========
window.addEventListener('DOMContentLoaded', function() {
    const fullscreenBtn = document.getElementById('toggleFullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreenTable);
    }
    
    const tableViewBtn = document.getElementById('tableViewBtn');
    const cardsViewBtn = document.getElementById('cardsViewBtn');
    if (tableViewBtn) tableViewBtn.addEventListener('click', () => toggleView('table'));
    if (cardsViewBtn) cardsViewBtn.addEventListener('click', () => toggleView('cards'));
});
