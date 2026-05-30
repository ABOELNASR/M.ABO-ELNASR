// ========== reports-other.js - ملاحظات، سجل عمليات، بريد إلكتروني، سجل البطاقات المحذوفة ==========

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
        const oldNote = systemNotes;
        const newNote = document.getElementById('systemNotesTextarea').value;
        systemNotes = newNote;
        await saveData();
        addActivityLog('تحديث الملاحظات العامة', 'تم تحديث الملاحظات العامة للنظام');
        
        // استخراج النص المضاف فقط (الفرق بين القديم والجديد)
        let addedText = '';
        if (oldNote.trim() === '') {
            addedText = newNote.trim();
        } else if (newNote.includes(oldNote)) {
            addedText = newNote.substring(newNote.indexOf(oldNote) + oldNote.length).trim();
        } else {
            addedText = newNote.trim();
        }
        
        // إرسال الإشعارات فقط إذا كان هناك نص مضاف
        if (addedText) {
            // إشعار داخلي (جرس) بالنص المضاف فقط
            showBellNotification('📝 ملاحظة عامة جديدة', addedText);
            
            // إشعار خارجي بالنص المضاف فقط
            if (navigator.onLine && window.location.protocol !== 'file:') {
                try {
                    const formData = new FormData();
                    formData.append('action', 'sendPush');
                    formData.append('data', JSON.stringify({ 
                        title: '📝 ملاحظة عامة جديدة', 
                        body: addedText
                    }));
                    await fetch(API_URL, {
                        method: 'POST',
                        body: formData
                    });
                    console.log('📤 تم إرسال إشعار الملاحظة الخارجي');
                } catch (e) {
                    console.warn('⚠️ فشل إرسال الإشعار الخارجي للملاحظة:', e);
                }
            }
        }
        
        modal.remove();
        enableBodyScroll();
    };
}

function showActivityLog() {
    disableBodyScroll();
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    let logsHtml = `
        <div class="modal-content" style="max-width: 95%; width: 95%; padding: 0.4rem;">
            <h3 style="font-size: 0.75rem; margin-bottom: 0.3rem;">📜 سجل العمليات</h3>
            <div style="max-height: 70vh; overflow-y: auto; overflow-x: hidden;">
    `;
    
    if (activityLog.length === 0) {
        logsHtml += '<div style="text-align:center; padding:1rem; color: var(--text-secondary);">لا توجد عمليات مسجلة</div>';
    } else {
        activityLog.forEach((log, index) => {
            const time = formatDateTimeArabic(log.timestamp);
            const action = `${log.action}: ${log.details}`;
            const user = log.user || 'غير معروف';
            
            logsHtml += `
                <div style="
                    background: ${index % 2 === 0 ? 'var(--card-bg)' : 'var(--hover-bg)'};
                    border-radius: 8px;
                    padding: 0.4rem 0.5rem;
                    margin-bottom: 0.3rem;
                    border-right: 3px solid var(--btn-light-green);
                    font-size: 0.6rem;
                    line-height: 1.5;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                ">
                    <div style="display: flex; flex-wrap: wrap; gap: 0.3rem; align-items: baseline;">
                        <span style="color: var(--btn-light-green); font-weight: bold; font-size: 0.55rem; white-space: nowrap;">
                            🕒 ${escapeHtml(time)}
                        </span>
                        <span style="color: var(--text-secondary); font-size: 0.55rem; white-space: nowrap;">
                            👤 ${escapeHtml(user)}
                        </span>
                    </div>
                    <div style="
                        margin-top: 0.2rem;
                        color: var(--text-primary);
                        font-size: 0.58rem;
                        word-break: break-word;
                        line-height: 1.4;
                    ">
                        📌 ${escapeHtml(action)}
                    </div>
                </div>
            `;
        });
    }
    
    logsHtml += `
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; gap: 0.5rem;">
                <span style="font-size: 0.55rem; color: var(--text-secondary);">
                    📊 ${activityLog.length} عملية مسجلة
                </span>
                <div style="display: flex; gap: 0.4rem;">
                    <button id="clearLogBtn" class="btn btn-sm btn-danger" style="font-size:0.6rem; padding:3px 8px;">
                        🗑️ مسح السجل
                    </button>
                    <button id="closeLogBtn" class="btn btn-sm btn-secondary" style="font-size:0.6rem; padding:3px 8px;">
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.innerHTML = logsHtml;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) { modal.remove(); enableBodyScroll(); } });
    document.getElementById('closeLogBtn').onclick = () => { modal.remove(); enableBodyScroll(); };
    
    const clearBtn = document.getElementById('clearLogBtn');
    if (clearBtn) {
        clearBtn.onclick = () => {
            if (confirm('هل أنت متأكد من مسح جميع سجل العمليات؟')) {
                activityLog = [];
                saveActivityLogToLocal();
                modal.remove();
                enableBodyScroll();
                showToast('✅ تم مسح سجل العمليات');
                addActivityLog('مسح السجل', 'تم مسح سجل العمليات بالكامل');
            }
        };
    }
}

// ========== سجل البطاقات المحذوفة ==========
function showDeletedCardsLog() {
    disableBodyScroll();
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 95%; width: 95%; padding: 0.4rem;">
            <h3 style="font-size: 0.75rem; margin-bottom: 0.3rem;">🗑️ سجل البطاقات المحذوفة</h3>
            <div class="search-box" style="margin-bottom: 0.5rem;">
                <input type="text" id="deletedCardsSearch" placeholder="بحث باسم البطاقة..." style="width:100%; padding:6px; border-radius:20px; border:1px solid var(--border-light); background:var(--input-bg); color:var(--text-primary);">
            </div>
            <div id="deletedCardsListContainer" style="max-height: 65vh; overflow-y: auto; overflow-x: hidden;">
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; gap: 0.5rem;">
                <span id="deletedCardsCount" style="font-size: 0.55rem; color: var(--text-secondary);"></span>
                <button id="closeDeletedCardsBtn" class="btn btn-sm btn-secondary" style="font-size:0.6rem; padding:3px 8px;">إغلاق</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) { modal.remove(); enableBodyScroll(); } });
    document.getElementById('closeDeletedCardsBtn').onclick = () => { modal.remove(); enableBodyScroll(); };

    const searchInput = document.getElementById('deletedCardsSearch');
    const container = document.getElementById('deletedCardsListContainer');
    const countSpan = document.getElementById('deletedCardsCount');

    function renderDeletedCards(filterText = '') {
        const log = deletedCardsLog || [];
        const filtered = filterText.trim() === '' ? log : log.filter(entry => entry.cardName && entry.cardName.toLowerCase().includes(filterText.toLowerCase()));
        container.innerHTML = '';
        if (filtered.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:1rem; color: var(--text-secondary);">لا توجد بطاقات محذوفة مسجلة.</div>';
            countSpan.textContent = '';
            return;
        }
        filtered.forEach(entry => {
            const date = entry.deletedAt ? formatDateTimeArabic(entry.deletedAt) : 'غير معروف';
            const cardName = entry.cardName || 'بطاقة غير مسماة';
            const subscriberName = entry.subscriberName || 'غير معروف';
            const individuals = entry.individuals || 0;
            const reason = entry.reason || 'بدون سبب';
            const deletedBy = entry.deletedBy || 'غير معروف';
            const div = document.createElement('div');
            div.style.cssText = `
                background: var(--card-bg);
                border-radius: 8px;
                padding: 0.5rem;
                margin-bottom: 0.3rem;
                border-right: 3px solid #ef5350;
                font-size: 0.6rem;
                line-height: 1.5;
            `;
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="color:#e53935;">${escapeHtml(cardName)}</strong>
                    <span style="font-size:0.55rem; color: var(--text-secondary);">${escapeHtml(date)}</span>
                </div>
                <div>👤 المشترك: ${escapeHtml(subscriberName)} | 👥 الأفراد: ${individuals}</div>
                <div>📝 السبب: ${escapeHtml(reason)}</div>
                <div>🕵️ القائم بالحذف: ${escapeHtml(deletedBy)}</div>
            `;
            container.appendChild(div);
        });
        countSpan.textContent = `📊 ${filtered.length} بطاقة محذوفة`;
    }

    renderDeletedCards();
    searchInput.addEventListener('input', () => {
        renderDeletedCards(searchInput.value);
    });
}

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
