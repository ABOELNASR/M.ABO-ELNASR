// ========== config.js - الإعدادات والمتغيرات العامة ==========

// مفاتيح التخزين في LocalStorage
const STORAGE_USERS = 'app_users';
const STORAGE_SESSION = 'bakery_user';
const STORAGE_DATA = 'bakery_system_data';
const STORAGE_SYSTEM_NOTES = 'system_notes';
const STORAGE_ACTIVITY_LOG = 'activity_log';
const STORAGE_DELETED_CARDS_LOG = 'deleted_cards_log';
const STORAGE_BREAD_OVERRIDES = 'bread_overrides';

// إعدادات التطبيق
const APP_VERSION = '2.5';
const BREAD_PRICE_PER_LOAF = 0.20;
const CREDIT_PRICE_PER_LOAF = 0.25;
const DEFAULT_DAILY_BREAD_PER_PERSON = 5;

// صلاحيات المستخدمين
const ROLES = {
    ADMIN: 'admin',
    WRITE: 'write',
    READ: 'read'
};

// أسماء الأشهر بالعربية
const MONTHS_AR = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

// المستخدمون الافتراضيون
const DEFAULT_USERS = [
    {
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        email: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

// البيانات الافتراضية للنظام
const DEFAULT_DATA = {
    subscribers: [],
    monthlyPayments: {},
    paymentDates: {},
    systemNotes: '',
    activityLog: [],
    deletedCardsLog: [],
    breadOverrides: {}
};

// ========== المتغيرات العامة (Global State) ==========

// المستخدم الحالي
let currentUser = null;

// بيانات المشتركين
let subscribers = [];

// المدفوعات الشهرية (المفتاح: subscriberId, القيمة: { "2024-01": 100 })
let monthlyPayments = {};

// تواريخ الدفع
let paymentDates = {};

// تجاوزات الحصة اليومية (المفتاح: subscriberId, القيمة: { "2024-01": [{ day: 5, totalDailyBread: 40, reason: "..." }] })
let breadOverrides = {};

// الشهر والسنة الحاليان
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

// حالة التحرير (ID المشترك الجاري تعديله، null إذا إضافة جديدة)
let editId = null;

// البحث الحالي
let currentSearch = '';

// الفلتر الحالي (all, paid, unpaid)
let currentFilter = 'all';

// الصف المحدد حالياً في الجدول
let currentSelectedRowId = null;

// الصف المفتوح لعرض التفاصيل
let expandedRowId = null;

// هل تحتاج البيانات إلى مزامنة؟
let syncNeeded = false;

// البطاقات المؤقتة (في نموذج الإضافة/التعديل)
let tempCardsList = [];

// قائمة المستخدمين
let usersList = [];

// الملاحظات العامة للنظام
let systemNotes = '';

// سجل العمليات
let activityLog = [];

// سجل البطاقات المحذوفة
let deletedCardsLog = [];

// وضع العرض الحالي (table, cards)
let viewMode = 'table';

// ========== دوال مساعدة للتحقق من وجود المتغيرات ==========

// دالة للتحقق من صحة المتغيرات (للتطوير فقط)
function checkConfigVariables() {
    const requiredVars = [
        'STORAGE_USERS', 'STORAGE_SESSION', 'STORAGE_DATA', 'STORAGE_SYSTEM_NOTES',
        'STORAGE_ACTIVITY_LOG', 'STORAGE_DELETED_CARDS_LOG', 'STORAGE_BREAD_OVERRIDES',
        'APP_VERSION', 'BREAD_PRICE_PER_LOAF', 'CREDIT_PRICE_PER_LOAF', 'DEFAULT_DAILY_BREAD_PER_PERSON',
        'ROLES', 'MONTHS_AR', 'DEFAULT_USERS', 'DEFAULT_DATA',
        'currentUser', 'subscribers', 'monthlyPayments', 'paymentDates', 'breadOverrides',
        'currentYear', 'currentMonth', 'editId', 'currentSearch', 'currentFilter',
        'currentSelectedRowId', 'expandedRowId', 'syncNeeded', 'tempCardsList',
        'usersList', 'systemNotes', 'activityLog', 'deletedCardsLog', 'viewMode'
    ];
    
    const missing = [];
    for (const varName of requiredVars) {
        if (typeof eval(varName) === 'undefined') {
            missing.push(varName);
        }
    }
    
    if (missing.length > 0) {
        console.warn('⚠️ المتغيرات التالية غير معرفة:', missing);
        return false;
    }
    
    console.log('✅ جميع متغيرات config.js معرفة بشكل صحيح');
    return true;
}

// دالة لإعادة تعيين جميع المتغيرات إلى القيم الافتراضية (للطوارئ)
function resetAllVariables() {
    currentUser = null;
    subscribers = [];
    monthlyPayments = {};
    paymentDates = {};
    breadOverrides = {};
    currentYear = new Date().getFullYear();
    currentMonth = new Date().getMonth();
    editId = null;
    currentSearch = '';
    currentFilter = 'all';
    currentSelectedRowId = null;
    expandedRowId = null;
    syncNeeded = false;
    tempCardsList = [];
    usersList = JSON.parse(JSON.stringify(DEFAULT_USERS));
    systemNotes = '';
    activityLog = [];
    deletedCardsLog = [];
    viewMode = 'table';
    
    console.log('🔄 تم إعادة تعيين جميع المتغيرات إلى القيم الافتراضية');
}

// تسجيل أن config.js تم تحميله
console.log('✅ config.js loaded - Version:', APP_VERSION);
