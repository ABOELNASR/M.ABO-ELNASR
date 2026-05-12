// ========== reports.js - دوال التقارير والتصدير والاستيراد ==========

// ========== تقارير البطاقات ==========

/**
 * عرض تقرير البطاقات (مع إمكانية البحث المتقدم)
 * @param {boolean} advanced - عرض خيارات البحث المتقدم (تاريخ، ملاحظات)
 */
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
    
    /**
     * عرض التقرير بناءً على معايير البحث
     */
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
        
        // ربط حدث النقر لعرض التفاصيل
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

/**
 * عرض تقرير المدفوعات في يوم محدد
 */
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

// ========== التصدير إلى Excel ==========

/**
 * تصدير قائمة المشتركين إلى ملف Excel
 */
function exportSubscribersToExcel() {
    if (!subscribers.length) {
        showToast('لا يوجد مشتركين لتصديرهم', true);
        return;
    }
    
    const data = subscribers.map(sub => ({
        'اسم المشترك': sub.name,
        'عدد البطاقات': sub.cardsList ? sub.cardsList.length : 0,
        'إجمالي الأفراد': getTotalIndividuals(sub),
        'الحصة اليومية (رغيف)': getDailyBread(sub),
        'قيمة الاشتراك (ج.م)': subValue(sub).toFixed(2),
        'الرصيد (ج.م)': (sub.balance || 0).toFixed(2),
        'تاريخ الإضافة': sub.createdAt ? formatDateTimeArabic(sub.createdAt) : '',
        'آخر تعديل': sub.updatedAt ? formatDateTimeArabic(sub.updatedAt) : ''
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المشتركين');
    XLSX.writeFile(wb, `المشتركين_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`);
    
    addActivityLog('تصدير بيانات', 'تم تصدير قائمة المشتركين إلى Excel');
    showToast('✅ تم تصدير المشتركين بنجاح');
}

/**
 * تصدير تقرير الشهر الحالي إلى Excel
 */
function exportReportsToExcel() {
    const data = subscribers.map(sub => ({
        'اسم المشترك': sub.name,
        'الشهر الحالي': `${currentYear}-${currentMonth + 1}`,
        'قيمة الاشتراك': subValue(sub).toFixed(2),
        'المدفوع': getPaid(sub.id).toFixed(2),
        'المتبقي': getRemaining(sub.id).toFixed(2),
        'الرصيد': (sub.balance || 0).toFixed(2),
        'نسبة الدفع': ((getPaid(sub.id) / subValue(sub)) * 100).toFixed(1) + '%'
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `تقرير_${currentYear}-${currentMonth + 1}`);
    XLSX.writeFile(wb, `تقرير_${currentYear}-${currentMonth + 1}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`);
    
    addActivityLog('تصدير تقرير', `تم تصدير تقرير الشهر ${currentMonth + 1}/${currentYear}`);
    showToast('✅ تم تصدير التقرير بنجاح');
}

// ========== الاستيراد ==========

/**
 * استيراد المشتركين من ملف Excel
 */
function importFromExcel() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx, .xls, .csv';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
                const data = new Uint8Array(ev.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
                
                if (!rows || rows.length < 2) {
                    showToast('الملف فارغ أو غير صالح', true);
                    return;
                }
                
                const subscribersMap = new Map();
                const headerRow = rows[0];
                const colIndex = { name: -1, cardName: -1, individuals: -1 };
                
                for (let i = 0; i < headerRow.length; i++) {
                    const cell = String(headerRow[i]).trim().toLowerCase();
                    if (cell.includes('اسم المشترك') || cell === 'subscriber' || cell === 'name') {
                        colIndex.name = i;
                    } else if (cell.includes('اسم البطاقة') || cell === 'card name' || cell === 'card') {
                        colIndex.cardName = i;
                    } else if (cell.includes('عدد الأفراد') || cell === 'individuals' || cell === 'members') {
                        colIndex.individuals = i;
                    }
                }
                
                if (colIndex.name === -1 || colIndex.cardName === -1 || colIndex.individuals === -1) {
                    showToast('تنسيق الملف غير صحيح. تأكد من وجود أعمدة: اسم المشترك، اسم البطاقة، عدد الأفراد', true);
                    return;
                }
                
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    const subName = row[colIndex.name] ? String(row[colIndex.name]).trim() : '';
                    const cardName = row[colIndex.cardName] ? String(row[colIndex.cardName]).trim() : '';
                    const individualsRaw = row[colIndex.individuals];
                    let individuals = parseInt(arabicToEnglishNumber(String(individualsRaw)));
                    if (isNaN(individuals) || individuals <= 0) individuals = 1;
                    
                    if (!subName || !cardName) continue;
                    
                    if (!subscribersMap.has(subName)) {
                        subscribersMap.set(subName, { name: subName, cards: [] });
                    }
                    subscribersMap.get(subName).cards.push({ cardName, individuals });
                }
                
                if (subscribersMap.size === 0) {
                    showToast('لا توجد بيانات صالحة في الملف', true);
                    return;
                }
                
                let addedCount = 0;
                let duplicateSkipped = 0;
                
                for (const [_, subData] of subscribersMap) {
                    if (isDuplicateSubscriberName(subData.name)) {
                        duplicateSkipped++;
                        continue;
                    }
                    
                    let cardsList = [];
                    let validCards = true;
                    for (const card of subData.cards) {
                        if (isDuplicateCardNameGlobal(card.cardName)) {
                            validCards = false;
                            break;
                        }
                        cardsList.push({
                            cardName: card.cardName,
                            individuals: card.individuals,
                            dailyBreadOverride: null,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            history: [],
                            notes: ''
                        });
                    }
                    
                    if (!validCards) {
                        duplicateSkipped++;
                        continue;
                    }
                    
                    const now = new Date().toISOString();
                    subscribers.push({
                        id: Date.now() + Math.floor(Math.random() * 10000),
                        name: subData.name,
                        balance: 0,
                        cardsList: cardsList,
                        createdAt: now,
                        updatedAt: now,
                        history: []
                    });
                    addedCount++;
                }
                
                await saveData();
                renderAll();
                addActivityLog('استيراد من Excel', `تم استيراد ${addedCount} مشترك جديد. تم تخطي ${duplicateSkipped} بسبب التكرار`);
                showToast(`✅ تم استيراد ${addedCount} مشترك بنجاح. تخطي ${duplicateSkipped} مكرر.`);
            } catch (err) {
                showToast(`❌ خطأ في قراءة الملف: ${err.message}`, true);
            }
        };
        reader.readAsArrayBuffer(file);
    };
    input.click();
}

/**
 * استيراد المشتركين من نص (بالجملة)
 */
function importBulkText() {
    disableBodyScroll();
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>📝 استيراد نصي (بالجملة)</h3>
            <textarea id="bulkTextInput" rows="15" class="notes-textarea" placeholder="اكتب البيانات بالشكل التالي:&#10;اسم المشترك&#10;اسم البطاقة عدد_الأفراد&#10;اسم بطاقة ثانية عدد_أفراد&#10;&#10;اسم مشترك آخر&#10;بطاقته عدد_أفراد&#10;..."></textarea>
            <div class="date-picker-buttons">
                <button id="importBulkBtn" class="btn btn-primary btn-sm">📥 استيراد</button>
                <button id="closeBulkBtn" class="btn btn-secondary btn-sm">إلغاء</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) { modal.remove(); enableBodyScroll(); } });
    document.getElementById('closeBulkBtn').onclick = () => { modal.remove(); enableBodyScroll(); };
    
    document.getElementById('importBulkBtn').onclick = async () => {
        const text = document.getElementById('bulkTextInput').value;
        if (!text.trim()) {
            showToast('الرجاء إدخال البيانات', true);
            modal.remove();
            enableBodyScroll();
            return;
        }
        
        const lines = text.split(/\r?\n/);
        let currentSubscriber = null;
        const newSubscribersMap = new Map();
        let lineNumber = 0;
        
        for (const rawLine of lines) {
            lineNumber++;
            const line = rawLine.trim();
            if (line === '') {
                currentSubscriber = null;
                continue;
            }
            
            const parts = line.split(/\s+/);
            const lastPart = parts[parts.length - 1];
            const possibleNumber = parseInt(arabicToEnglishNumber(lastPart));
            
            if (!isNaN(possibleNumber) && parts.length > 1) {
                const cardName = parts.slice(0, -1).join(' ').trim();
                const individuals = possibleNumber;
                if (cardName && individuals > 0 && currentSubscriber) {
                    if (!newSubscribersMap.has(currentSubscriber)) {
                        newSubscribersMap.set(currentSubscriber, []);
                    }
                    newSubscribersMap.get(currentSubscriber).push({ cardName, individuals });
                } else if (!currentSubscriber) {
                    showToast(`سطر ${lineNumber}: لا يوجد مشترك محدد للبطاقة: ${line}`, true);
                }
            } else {
                currentSubscriber = line;
                if (!newSubscribersMap.has(currentSubscriber)) {
                    newSubscribersMap.set(currentSubscriber, []);
                }
            }
        }
        
        let addedCount = 0;
        let duplicateSubs = 0;
        let duplicateCardsGlobal = 0;
        let invalidCards = 0;
        const newSubscribersArray = [];
        
        for (const [subName, cards] of newSubscribersMap) {
            if (isDuplicateSubscriberName(subName)) {
                duplicateSubs++;
                continue;
            }
            
            let cardsList = [];
            let valid = true;
            const cardNamesInSub = new Set();
            
            for (const card of cards) {
                if (cardNamesInSub.has(card.cardName.toLowerCase())) {
                    showToast(`❌ المشترك "${subName}" يحتوي على بطاقة مكررة: "${card.cardName}"`, true);
                    valid = false;
                    break;
                }
                cardNamesInSub.add(card.cardName.toLowerCase());
                
                if (isDuplicateCardNameGlobal(card.cardName)) {
                    duplicateCardsGlobal++;
                    valid = false;
                    break;
                }
                
                cardsList.push({
                    cardName: card.cardName,
                    individuals: card.individuals,
                    dailyBreadOverride: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    history: [],
                    notes: ''
                });
            }
            
            if (!valid) {
                invalidCards++;
                continue;
            }
            if (cardsList.length === 0) {
                invalidCards++;
                continue;
            }
            
            newSubscribersArray.push({ name: subName, cardsList });
        }
        
        for (const sub of newSubscribersArray) {
            const now = new Date().toISOString();
            subscribers.push({
                id: Date.now() + Math.floor(Math.random() * 10000),
                name: sub.name,
                balance: 0,
                cardsList: sub.cardsList,
                createdAt: now,
                updatedAt: now,
                history: []
            });
            addedCount++;
        }
        
        if (addedCount > 0) {
            await saveData();
            renderAll();
            addActivityLog('استيراد نصي بالجملة', `تم استيراد ${addedCount} مشترك. تخطي ${duplicateSubs} مشترك مكرر، ${duplicateCardsGlobal} بطاقة مكررة عالمياً، ${invalidCards} مشترك بسبب بيانات غير صالحة.`);
            showToast(`✅ تم استيراد ${addedCount} مشترك. تخطي: ${duplicateSubs} مكرر اسم مشترك، ${duplicateCardsGlobal} بطاقة مكررة، ${invalidCards} مشترك غير صالح.`);
        } else {
            showToast('⚠️ لم يتم إضافة أي مشترك جديد. تحقق من البيانات وتجنب التكرار.', true);
        }
        modal.remove();
        enableBodyScroll();
    };
}

// ========== النسخ الاحتياطي ==========

/**
 * تحميل نسخة احتياطية من البيانات
 */
function backupDownload() {
    const backupData = {
        version: APP_VERSION,
        timestamp: new Date().toISOString(),
        subscribers: subscribers,
        monthlyPayments: monthlyPayments,
        paymentDates: paymentDates,
        users: usersList,
        systemNotes: systemNotes,
        activityLog: activityLog
    };
    
    const dataStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bakery_backup_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    addActivityLog('نسخ احتياطي', 'تم تحميل نسخة احتياطية من البيانات');
    showToast('✅ تم تحميل النسخة الاحتياطية');
}

/**
 * استعادة نسخة احتياطية
 */
function backupRestore() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
                const backup = JSON.parse(ev.target.result);
                
                if (backup.subscribers) {
                    subscribers = backup.subscribers.map(s => migrateSubscriber(s));
                }
                if (backup.monthlyPayments) monthlyPayments = backup.monthlyPayments;
                if (backup.paymentDates) paymentDates = backup.paymentDates;
                if (backup.users) {
                    usersList = backup.users;
                    saveUsersToLocal();
                }
                if (backup.systemNotes) systemNotes = backup.systemNotes;
                if (backup.activityLog) {
                    activityLog = backup.activityLog;
                    saveActivityLogToLocal();
                }
                
                await saveData();
                renderAll();
                addActivityLog('استعادة نسخة احتياطية', 'تم استعادة البيانات من ملف احتياطي');
                showToast('✅ تم استعادة النسخة الاحتياطية بنجاح');
            } catch (err) {
                showToast('❌ ملف غير صالح أو تالف', true);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// ========== الملاحظات العامة ==========

/**
 * عرض وإدارة الملاحظات العامة للنظام
 */
function showSystemNotes() {
    disableBodyScroll();
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>📝 الملاحظات العامة</h3>
            <textarea id="systemNotesTextarea" class="notes-textarea" rows="6" placeholder="أدخل ملاحظات عامة أو تنبيهات...">${escapeHtml(systemNotes)}</textarea>
            <div class="date-picker-buttons">
                <button id="saveNotesBtn" class="btn btn-primary btn-sm">💾 حفظ</button>
                <button id="closeNotesBtn" class="btn btn-secondary btn-sm">إلغاء</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) { modal.remove(); enableBodyScroll(); } });
    document.getElementById('closeNotesBtn').onclick = () => { modal.remove(); enableBodyScroll(); };
    document.getElementById('saveNotesBtn').onclick = async () => {
        systemNotes = document.getElementById('systemNotesTextarea').value;
        await saveData();
        addActivityLog('تحديث الملاحظات العامة', 'تم تحديث الملاحظات العامة للنظام');
        showToast('✅ تم حفظ الملاحظات');
        modal.remove();
        enableBodyScroll();
    };
}

// ========== سجل العمليات (مُحدث لاستخدام جدول HTML لمشاكل التوافق) ==========

/**
 * عرض سجل العمليات
 */
function showActivityLog() {
    disableBodyScroll();
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    let logsHtml = `
        <div class="modal-content" style="max-width: 95%; overflow: auto;">
            <h3>📜 سجل العمليات</h3>
            <div style="max-height: 60vh; overflow: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.7rem; white-space: nowrap;">
    `;
    
    if (activityLog.length === 0) {
        logsHtml += '<tr><td colspan="3" style="text-align:center; padding:1rem;">لا توجد عمليات مسجلة</td></tr>';
    } else {
        activityLog.forEach(log => {
            const time = formatDateTimeArabic(log.timestamp);
            const action = `${log.action}: ${log.details}`;
            const user = log.user || 'غير معروف';
            
            logsHtml += `
                <tr style="border-bottom: 1px solid var(--border-light);">
                    <td style="padding: 6px 8px; text-align: right; color: var(--btn-light-green); font-weight: bold; white-space: nowrap; min-width: 140px;">🕒 ${escapeHtml(time)}</td>
                    <td style="padding: 6px 8px; text-align: right; white-space: nowrap;">📌 ${escapeHtml(action)}</td>
                    <td style="padding: 4px 4px 4px 0; text-align: right; color: var(--text-secondary); white-space: nowrap; width: 50px; font-size: 0.6rem;">👤 ${escapeHtml(user)}</td>
                </tr>
            `;
        });
    }
    
    logsHtml += `
            </table>
            </div>
            <button id="closeLogBtn" class="btn btn-secondary btn-sm" style="margin-top:1rem;">إغلاق</button>
        </div>
    `;
    
    modal.innerHTML = logsHtml;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) { modal.remove(); enableBodyScroll(); } });
    document.getElementById('closeLogBtn').onclick = () => { modal.remove(); enableBodyScroll(); };
}

// ========== إرسال التقرير بالبريد الإلكتروني ==========

/**
 * إرسال تقرير شهري عبر البريد الإلكتروني باستخدام EmailJS
 * @param {Object} user - المستخدم المستلم
 */
async function sendMonthlyReport(user) {
    if (!user.email || !user.email.includes('@')) {
        showToast('⚠️ لا يوجد بريد إلكتروني صحيح', true);
        return;
    }
    
    if (typeof emailjs === 'undefined') {
        showToast('❌ خدمة البريد غير متاحة', true);
        return;
    }
    
    try {
        emailjs.init(EMAILJS_PUBLIC_KEY);
        
        const totalSubs = subscribers.length;
        const totalValue = subscribers.reduce((sum, s) => sum + subValue(s), 0);
        const totalPaid = subscribers.reduce((sum, s) => sum + getPaid(s.id), 0);
        const totalDue = totalValue - totalPaid;
        const unpaidSubs = subscribers
            .filter(s => getRemaining(s.id) > 0)
            .map(s => `${s.name} (${getRemaining(s.id).toFixed(2)} ج.م)`);
        
        const reportDate = `${getMonthName(currentMonth)} ${currentYear}`;
        
        const templateParams = {
            to_name: user.username,
            to_email: user.email,
            report_date: reportDate,
            total_subscribers: totalSubs,
            total_value: totalValue.toFixed(2),
            total_paid: totalPaid.toFixed(2),
            total_due: totalDue.toFixed(2),
            unpaid_list: unpaidSubs.length ? unpaidSubs.join('\n') : 'لا يوجد متأخرون',
            current_user: currentUser ? currentUser.username : 'النظام'
        };
        
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
        showToast(`📧 تم إرسال التقرير إلى ${user.email}`);
        addActivityLog('إرسال تقرير بريدي', `تم إرسال تقرير إلى ${user.email}`);
    } catch (e) {
        showToast(`❌ فشل الإرسال: ${e.text || e.message}`, true);
    }
}
