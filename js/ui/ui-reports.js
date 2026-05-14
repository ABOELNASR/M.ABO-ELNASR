// ========== ui-reports.js - نوافذ التقارير الإضافية ==========

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