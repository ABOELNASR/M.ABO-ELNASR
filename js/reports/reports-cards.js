// ========== reports-cards.js - تقارير البطاقات ==========

function showCardsReport(advanced = true) {
    disableBodyScroll();
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    let innerHtml = `<div class="modal-content"><h3>📇 تقرير البطاقات</h3>`;
    
    if (advanced) {
        innerHtml += `
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <input type="text" id="reportSearchInput" class="report-search-box" placeholder="🔍 بحث في أسماء المشتركين أو البطاقات...">
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <input type="date" id="reportDateFrom" placeholder="من تاريخ" class="report-search-box" style="flex:1;">
                    <input type="date" id="reportDateTo" placeholder="إلى تاريخ" class="report-search-box" style="flex:1;">
                </div>
                <input type="text" id="reportNotesFilter" class="report-search-box" placeholder="📝 بحث في الملاحظات...">
                <button id="advancedSearchBtn" class="btn btn-primary btn-sm">🔍 بحث متقدم</button>
            </div>
            <div id="cardsReportList" class="cards-report-list" style="margin-top:1rem;"></div>
            <button id="closeReportBtn" class="btn btn-secondary btn-sm" style="margin-top:1rem;">إغلاق</button>
        `;
    } else {
        innerHtml += `
            <input type="text" id="reportSearchInput" class="report-search-box" placeholder="🔍 بحث في أسماء المشتركين أو البطاقات...">
            <div id="cardsReportList" class="cards-report-list"></div>
            <button id="closeReportBtn" class="btn btn-secondary btn-sm" style="margin-top:1rem;">إغلاق</button>
        `;
    }
    innerHtml += `</div>`;
    
    modal.innerHTML = innerHtml;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) { modal.remove(); enableBodyScroll(); } });
    document.getElementById('closeReportBtn').onclick = () => { modal.remove(); enableBodyScroll(); };
    
    const searchInput = document.getElementById('reportSearchInput');
    const reportList = document.getElementById('cardsReportList');
    const dateFrom = document.getElementById('reportDateFrom');
    const dateTo = document.getElementById('reportDateTo');
    const notesFilter = document.getElementById('reportNotesFilter');
    const searchBtn = document.getElementById('advancedSearchBtn');
    
    function renderReport(searchTerm = '', fromDate = '', toDate = '', notesTerm = '') {
        let filteredSubs = subscribers.filter(s => {
            if (!searchTerm && !fromDate && !toDate && !notesTerm) return true;
            
            const term = searchTerm.toLowerCase();
            const nameMatch = !searchTerm || s.name.toLowerCase().includes(term);
            const cardsMatch = !searchTerm || (s.cardsList && s.cardsList.some(card => 
                card.cardName && card.cardName.toLowerCase().includes(term)
            ));
            if (!nameMatch && !cardsMatch) return false;
            
            if (fromDate || toDate) {
                let cardMatches = false;
                if (s.cardsList) {
                    for (const card of s.cardsList) {
                        const createdAt = card.createdAt ? card.createdAt.slice(0, 10) : '';
                        const updatedAt = card.updatedAt ? card.updatedAt.slice(0, 10) : '';
                        if ((!fromDate || createdAt >= fromDate || updatedAt >= fromDate) &&
                            (!toDate || createdAt <= toDate || updatedAt <= toDate)) {
                            cardMatches = true;
                            break;
                        }
                    }
                }
                if (!cardMatches) return false;
            }
            
            if (notesTerm) {
                let noteMatch = false;
                if (s.cardsList) {
                    for (const card of s.cardsList) {
                        if ((card.notes && card.notes.toLowerCase().includes(notesTerm.toLowerCase())) ||
                            (card.history && card.history.some(h => h.note && h.note.toLowerCase().includes(notesTerm.toLowerCase())))) {
                            noteMatch = true;
                            break;
                        }
                    }
                }
                if (!noteMatch) return false;
            }
            return true;
        });
        
        let html = '';
        filteredSubs.forEach(sub => {
            if (sub.cardsList && sub.cardsList.length) {
                sub.cardsList.forEach((card, idx) => {
                    const bread = getDailyBreadForCard(card);
                    html += `
                        <div class="report-card-item" data-sub-id="${sub.id}" data-card-idx="${idx}">
                            <div class="report-card-title">📇 ${escapeHtml(card.cardName)} - 👤 ${escapeHtml(sub.name)}</div>
                            <div class="report-card-details">👥 عدد الأفراد: ${card.individuals} | 🍞 حصة يومية: ${bread} رغيف</div>
                            <div class="report-card-details">📅 تاريخ الإنشاء: ${formatDateTimeArabic(card.createdAt)} | 📅 آخر تعديل: ${formatDateTimeArabic(card.updatedAt)}</div>
                            ${card.notes ? `<div class="report-card-details">📝 آخر ملاحظة: ${escapeHtml(card.notes)}</div>` : ''}
                            <div class="report-card-details">📜 السجل:</div>
                            <div class="history-list">
                                ${card.history && card.history.length ? card.history.map(h => {
                                    const user = h.user || 'غير معروف';
                                    return `<div class="history-item">🕒 ${formatDateTimeArabic(h.date)} - 👤 ${user}<br>📌 ${escapeHtml(h.action)}: ${escapeHtml(h.note)}</div>`;
                                }).join('') : '<div class="history-item">لا يوجد سجل</div>'}
                            </div>
                        </div>
                    `;
                });
            }
        });
        
        if (!html) html = '<div style="text-align:center; padding:1rem;">لا توجد نتائج</div>';
        reportList.innerHTML = html;
        
        document.querySelectorAll('.report-card-item').forEach(item => {
            item.addEventListener('click', () => {
                const subId = parseInt(item.dataset.subId);
                const cardIdx = parseInt(item.dataset.cardIdx);
                const sub = subscribers.find(s => s.id === subId);
                if (sub && sub.cardsList[cardIdx]) {
                    const card = sub.cardsList[cardIdx];
                    const bread = getDailyBreadForCard(card);
                    let historyText = '';
                    if (card.history && card.history.length) {
                        historyText = card.history.map(h => 
                            `- ${formatDateTimeArabic(h.date)} (${h.user || 'غير معروف'}) : ${h.action} - ${h.note}`
                        ).join('\n');
                    } else {
                        historyText = 'لا يوجد';
                    }
                    alert(`📇 بطاقة: ${card.cardName}\n👤 المشترك: ${sub.name}\n👥 عدد الأفراد: ${card.individuals}\n🍞 حصة يومية: ${bread} رغيف\n📅 تاريخ الإنشاء: ${formatDateTimeArabic(card.createdAt)}\n📅 آخر تعديل: ${formatDateTimeArabic(card.updatedAt)}\n📝 الملاحظات: ${card.notes || 'لا توجد'}\n📜 السجل:\n${historyText}`);
                }
            });
        });
    }
    
    const doSearch = () => {
        renderReport(
            searchInput.value,
            dateFrom ? dateFrom.value : '',
            dateTo ? dateTo.value : '',
            notesFilter ? notesFilter.value : ''
        );
    };
    
    searchInput.addEventListener('input', doSearch);
    if (searchBtn) searchBtn.addEventListener('click', doSearch);
    renderReport();
}

function showDatePickerReport() {
    disableBodyScroll();
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="date-picker-content">
                <h3>📅 اختر التاريخ</h3>
                <input type="date" id="reportDate" value="${new Date().toISOString().slice(0, 10)}">
                <div class="date-picker-buttons">
                    <button id="confirmReportBtn" class="btn btn-primary btn-sm">عرض التقرير</button>
                    <button id="cancelReportBtn" class="btn btn-secondary btn-sm">إلغاء</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) { modal.remove(); enableBodyScroll(); } });
    document.getElementById('confirmReportBtn').onclick = () => {
        const selectedDate = document.getElementById('reportDate').value;
        const list = [];
        let total = 0;
        
        for (const sub of subscribers) {
            const subDates = paymentDates[sub.id];
            if (subDates) {
                for (const key in subDates) {
                    if (subDates[key] === selectedDate) {
                        const amt = monthlyPayments[sub.id]?.[key] || 0;
                        list.push(`${sub.name} - ${formatNumber(amt)} ج.م`);
                        total += amt;
                    }
                }
            }
        }
        
        if (list.length) {
            alert(`📅 المدفوعات في ${selectedDate}:\n${list.join('\n')}\n\n💰 الإجمالي: ${formatNumber(total)} ج.م`);
        } else {
            alert(`لا توجد مدفوعات في ${selectedDate}`);
        }
        modal.remove();
        enableBodyScroll();
    };
    document.getElementById('cancelReportBtn').onclick = () => { modal.remove(); enableBodyScroll(); };
}