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

// ========== دالة مساعدة لاستخراج العدد من نهاية النص (للنمط: اسم+رقم) ==========
function extractNameAndCountFromLine(line) {
    const trimmed = line.trim();
    if (!trimmed) return null;
    // اكتشاف رقم عربي/هندي في نهاية النص دون مسافات
    const match = trimmed.match(/^(.*?)([٠-٩0-9]+)$/);
    if (match) {
        const namePart = match[1].trim();
        const numStr = match[2];
        const num = parseInt(arabicToEnglishNumber(numStr));
        if (!isNaN(num) && num > 0) {
            return { name: namePart || trimmed, individuals: num };
        }
    }
    return null;
}

function importBulkText() {
    disableBodyScroll();
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>📝 استيراد نصي (بالجملة)</h3>
            <textarea id="bulkTextInput" rows="15" class="notes-textarea" placeholder="اكتب البيانات بالشكل التالي:&#10;اسم المشترك&#10;أحمد&#10;محمد٣&#10;اسم البطاقة عدد_الأفراد&#10;اسم بطاقة ثانية عدد_أفراد&#10;&#10;اسم مشترك آخر&#10;بطاقته عدد_أفراد&#10;..."></textarea>
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
            
            // 1. تحليل النمط: اسم مشترك فقط أو اسم+عدد ملتصق (مثال: محمد، أحمد٢)
            const compactInfo = extractNameAndCountFromLine(line);
            if (compactInfo && !line.includes(' ')) {
                // سطر لا يحتوي على مسافات ويحتوي على عدد في نهايته أو اسم فقط
                const subName = compactInfo.name;
                const individuals = compactInfo.individuals || 1; // إذا لم يوجد عدد → 1
                
                // نعتبر هذا اسم مشترك جديد وننشئ بطاقة افتراضية باسم "البطاقة الأساسية" بالعدد
                if (!newSubscribersMap.has(subName)) {
                    newSubscribersMap.set(subName, []);
                }
                // إضافة بطاقة افتراضية (لن نضيفها الآن لأننا سنتعامل معها لاحقًا)
                // بدلاً من ذلك سنضع علامة على أن هذا المشترك لديه بطاقة افتراضية مضمنة
                currentSubscriber = subName;
                const existingCards = newSubscribersMap.get(subName);
                // تجنب تكرار البطاقة الافتراضية إذا تمت إضافتها مسبقًا
                if (!existingCards.some(c => c.cardName === 'البطاقة الأساسية' && c.individuals === individuals)) {
                    existingCards.push({ cardName: 'البطاقة الأساسية', individuals });
                }
                continue;
            }
            
            // 2. التنسيق القديم: اسم بطاقة متبوع بعدد أفراد (يحتوي على مسافة)
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
                // سطر لا يتطابق مع أي نمط: ربما اسم مشترك بدون عدد وبدون مسافات
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
            
            // إذا لم تكن هناك بطاقات صريحة، نضيف بطاقة افتراضية (عدد 1) إن لم تكن موجودة
            if (cards.length === 0) {
                cards.push({ cardName: 'البطاقة الأساسية', individuals: 1 });
            }
            
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
