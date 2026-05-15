// ========== ui-cards.js - عرض الكروت والأحداث المرتبطة بها ==========

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
            <div class="card-actions-row" style="display: flex; align-items: center; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 4px;">
                    ${showPaymentActions ? `<input type="checkbox" class="checkbox-paid" data-id="${sub.id}" ${checked} ${!showPaymentActions ? 'disabled' : ''} title="خالص" style="width: 20px; height: 20px; cursor: pointer; accent-color: var(--btn-light-green);">` : ''}
                </div>
                <div style="display: flex; justify-content: center; gap: 5px; flex-wrap: wrap; flex: 1;">
                    ${showEditDelete ? `<button class="action-icon-btn edit-btn" data-id="${sub.id}" title="تعديل">✏️</button>` : ''}
                    ${showEditDelete ? `<button class="action-icon-btn delete-btn" data-id="${sub.id}" title="حذف">🗑️</button>` : ''}
                    ${showPaymentActions ? `<button class="action-icon-btn edit-payment-btn" data-id="${sub.id}" title="مدفوع">💰</button>` : ''}
                    ${showPaymentActions ? `<button class="action-icon-btn edit-bread-btn" data-id="${sub.id}" title="حصة">🍞</button>` : ''}
                    ${!showEditDelete && !showPaymentActions ? '<span style="padding:6px; opacity:0.6;">🔒</span>' : ''}
                </div>
            </div>
        </div>`;
    });
    cardsHtml += '</div>';

    container.innerHTML = cardsHtml;

    bindCardEvents();
    bindCardTabs();
    applyFitTextToCards();
}

// ========== تبويبات الكروت ==========

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

// ========== ربط أحداث الكروت ==========

function bindCardEvents() {
    document.querySelectorAll('.subscriber-card .edit-btn').forEach(b => b.onclick = (e) => { e.stopPropagation(); editSub(parseInt(b.dataset.id)); });
    document.querySelectorAll('.subscriber-card .delete-btn').forEach(b => b.onclick = (e) => { e.stopPropagation(); deleteSub(parseInt(b.dataset.id)); });
    document.querySelectorAll('.subscriber-card .edit-payment-btn').forEach(b => b.onclick = (e) => { e.stopPropagation(); editPayment(parseInt(b.dataset.id)); });
    document.querySelectorAll('.subscriber-card .edit-bread-btn').forEach(b => b.onclick = (e) => { e.stopPropagation(); editDailyBread(parseInt(b.dataset.id)); });
    document.querySelectorAll('.subscriber-card .checkbox-paid').forEach(cb => {
        cb.onchange = (e) => { e.stopPropagation(); toggleFullPayment(parseInt(cb.dataset.id), cb.checked); };
    });
}

// ========== تطبيق تصغير الخط في الكروت ==========

function applyFitTextToCards() {
    document.querySelectorAll('.card-detail-value[data-fit-text]').forEach(el => {
        fitTextToContainer(el, 0.85, 0.55);
    });
}
