// ========== reports-backup.js - النسخ الاحتياطي والاستعادة ==========

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