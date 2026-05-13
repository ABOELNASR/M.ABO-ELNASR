// ========== config.js - الإعدادات والمتغيرات العامة =========

const STORAGE_USERS = 'app_users';
const STORAGE_SESSION = 'bakery_user';
const STORAGE_DATA = 'bakery_system_data';
const STORAGE_SYSTEM_NOTES = 'system_notes';
const STORAGE_ACTIVITY_LOG = 'activity_log';
const STORAGE_DELETED_CARDS_LOG = 'deleted_cards_log';
const STORAGE_BREAD_OVERRIDES = 'bread_overrides';

const APP_VERSION = '2.3';
const BREAD_PRICE_PER_LOAF = 0.20;
const CREDIT_PRICE_PER_LOAF = 0.25;
const DEFAULT_DAILY_BREAD_PER_PERSON = 5;

const ROLES = {
    ADMIN: 'admin',
    WRITE: 'write',
    READ: 'read'
};

const MONTHS_AR = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

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

const DEFAULT_DATA = {
    subscribers: [],
    monthlyPayments: {},
    paymentDates: {},
    systemNotes: '',
    activityLog: [],
    deletedCardsLog: []
};

let currentUser = null;
let subscribers = [];
let monthlyPayments = {};
let paymentDates = {};
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let editId = null;
let currentSearch = '';
let currentFilter = 'all';
let currentSelectedRowId = null;
let expandedRowId = null;
let syncNeeded = false;
let tempCardsList = [];
let usersList = [];
let systemNotes = '';
let activityLog = [];
let deletedCardsLog = [];
let viewMode = 'table';
let breadOverrides = {};
