// ========== ui-table.js - عرض الجدول والأحداث المرتبطة به ==========

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
                            <div class="card-detail-header">📇 ${escapeHtml(card.cardName)}</div>
                            <div class="card-detail-row">
                                <span class="card-detail-label-inline">👥 عدد الأفراد:</span>
                                <span class="card-detail-value-inline">${card.individuals}</span>
                            </div>
                            <div class="card-detail-row">
                                <span class="card-detail-label-inline">🍞 الحصة اليومية:</span>
                                <span class="card-detail-value-inline">${bread} رغيف/يوم</span>
                            </div>
                            ${card.notes ? `<div class="card-detail-row"><span class="card-detail-label-inline">📝 ملاحظة:</span><span class="card-detail-value-inline">${escapeHtml(card.notes)}</span></div>` : ''}
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

// ========== ربط أحداث الجدول ==========

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
