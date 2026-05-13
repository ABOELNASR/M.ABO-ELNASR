// ========== reports-other.js - ملاحظات، سجل عمليات، بريد إلكتروني ==========

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