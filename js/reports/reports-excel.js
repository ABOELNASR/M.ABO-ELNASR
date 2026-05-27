// ========== reports-excel.js - تصدير واستيراد Excel ==========

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

// ========== دالة مساعدة لتحليل سطر بطاقة (يدعم الصيغتين) ==========
function parseCardLine(line) {
    if (!line) return null;
    const trimmed = line.trim();
    if (!trimmed) return null;

    // 1. النمط الجديد: اسم البطاقة متبوعاً بعدد ملتصق بدون مسافة (مثال: "احمد ياسر١")
    const compactMatch = trimmed.match(/^(.*?)([٠-٩0-9]+)$/);
    if (compactMatch) {
        const namePart = compactMatch[1].trim();
        const numStr = compactMatch[2];
        const num = parseInt(arabicToEnglishNumber(numStr));
        if (namePart && !isNaN(num) && num > 0) {
            return { cardName: namePart, individuals: num };
        }
    }

    // 2. النمط القديم: اسم البطاقة ثم مسافة ثم العدد (مثال: "بطاقة أساسية 5")
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
        const lastPart = parts[parts.length - 1];
        const possibleNumber = parseInt(arabicToEnglishNumber(lastPart));
        if (!isNaN(possibleNumber) && possibleNumber > 0) {
            const cardName = parts.slice(0, -1).join(' ').trim();
            if (cardName) {
                return { cardName, individuals: possibleNumber };
            }
        }
    }

    return null; // لا يمثل بطاقة
}

function importBulkText() {
    disableBodyScroll();
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>📝 استيراد نصي (بالجملة)</h3>
            <textarea id="bulkTextInput" rows="15" class="notes-textarea" placeholder="اكتب البيانات بالشكل التالي:&#10;اسم المشترك&#10;اسم البطاقةعدد_الأفراد (بدون مسافة)&#10;أو اسم البطاقة عدد_الأفراد (بمسافة)&#10;&#10;مثال:&#10;ياسر&#10;احمد ياسر١&#10;محمد ياسر٢&#10;&#10;خالد&#10;يحي خالد٣&#10;رمزي خالد١"></textarea>
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
            
            // السطر الفارغ = فاصل بين المشتركين
            if (line === '') {
                currentSubscriber = null;
                continue;
            }
            
            // هل السطر يحتوي على رقم (عربي أو هندي)؟
            const hasNumber = /[٠-٩0-9]/.test(line);
            
            if (hasNumber) {
                // سطر يحتوي على رقم = هذا بطاقة
                const cardInfo = parseCardLine(line);
                
                if (cardInfo && currentSubscriber) {
                    // توجد بطاقة صالحة ومشترك حالي ← أضف البطاقة للمشترك
                    if (!newSubscribersMap.has(currentSubscriber)) {
                        newSubscribersMap.set(currentSubscriber, []);
                    }
                    newSubscribersMap.get(currentSubscriber).push(cardInfo);
                } else if (cardInfo && !currentSubscriber) {
                    // بطاقة بدون مشترك حالي ← تحذير
                    showToast(`⚠️ سطر ${lineNumber}: لا يوجد مشترك محدد للبطاقة "${line}"`, true);
                }
            } else {
                // سطر لا يحتوي على رقم = اسم مشترك جديد
                currentSubscriber = line;
                if (!newSubscribersMap.has(currentSubscriber)) {
                    newSubscribersMap.set(currentSubscriber, []);
                }
            }
        }
        
        let addedCount = 0;
        let duplicateSubs = 0;
        let skippedCardsCount = 0;
        let invalidSubs = 0;
        const newSubscribersArray = [];
        const skippedCardsMessages = [];
        
        for (const [subName, cards] of newSubscribersMap) {
            // تجاهل المشترك إذا لم تكن له بطاقات
            if (cards.length === 0) {
                invalidSubs++;
                continue;
            }
            
            if (isDuplicateSubscriberName(subName)) {
                duplicateSubs++;
                showToast(`⚠️ المشترك "${subName}" موجود بالفعل وتم تخطيه`, true);
                continue;
            }
            
            let cardsList = [];
            const cardNamesInSub = new Set();
            
            for (const card of cards) {
                // التحقق من تكرار اسم البطاقة داخل نفس المشترك
                if (cardNamesInSub.has(card.cardName.toLowerCase())) {
                    skippedCardsCount++;
                    skippedCardsMessages.push(`المشترك ${subName} لم يتم إضافة البطاقة ${card.cardName} الخاصة به لأنها مكررة داخل نفس المشترك`);
                    continue;
                }
                
                // التحقق من تكرار اسم البطاقة عالمياً (مع بطاقات موجودة بالفعل)
                if (isDuplicateCardNameGlobal(card.cardName)) {
                    skippedCardsCount++;
                    skippedCardsMessages.push(`المشترك ${subName} لم يتم إضافة البطاقة ${card.cardName} الخاصة به لأنها تتطابق مع اسم بطاقة موجودة`);
                    continue;
                }
                
                cardNamesInSub.add(card.cardName.toLowerCase());
                
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
            
            // إذا لم يتبق أي بطاقات صالحة بعد التصفية
            if (cardsList.length === 0) {
                invalidSubs++;
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
        
        // عرض رسائل البطاقات التي تم تخطيها
        for (const msg of skippedCardsMessages) {
            showToast(`⚠️ ${msg}`, true);
        }
        
        if (addedCount > 0) {
            await saveData();
            renderAll();
            addActivityLog('استيراد نصي بالجملة', `تم استيراد ${addedCount} مشترك. تخطي ${duplicateSubs} مشترك مكرر، ${skippedCardsCount} بطاقة مكررة، ${invalidSubs} مشترك غير صالح.`);
            showToast(`✅ تم استيراد ${addedCount} مشترك بنجاح. تخطي: ${duplicateSubs} مشترك مكرر، ${skippedCardsCount} بطاقة مكررة، ${invalidSubs} مشترك بدون بطاقات صالحة.`);
        } else {
            showToast('⚠️ لم يتم إضافة أي مشترك جديد. تحقق من البيانات وتجنب التكرار.', true);
        }
        modal.remove();
        enableBodyScroll();
    };
}
