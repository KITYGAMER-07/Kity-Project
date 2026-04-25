// Simulated database using localStorage with proper typing

export interface User {
  id: string;
  username: string;
  mobile: string;
  email: string;
  joinDate: string;
  banned: boolean;
}

export interface StoreFile {
  id: number;
  fileName: string;
  fileData: string;
  fileType: string;
  fileSize: string;
}

export interface Price {
  id: number;
  fileId: number;
  durationDays: number;
  price: number;
}

export interface KeyStock {
  id: number;
  fileId: number;
  durationDays: number;
  keyCode: string;
  status: 'AVAILABLE' | 'USED';
}

export interface Payment {
  id: number;
  userId: string;
  fileId: number;
  priceId: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROOF_UPLOADED';
  proofImage?: string;
  createdAt: string;
  rejectReason?: string;
  doneClicked: boolean;
  deliveredFile?: string;
  deliveredFileName?: string;
  deliveredKey?: string;
}

export interface TrialKey {
  id: number;
  fileId: number;
  redeemCode: string;
  trialKey: string;
}

export interface TrialLog {
  id: number;
  userId: string;
  username: string;
  redeemCode: string;
  fileName: string;
  trialKey: string;
  redeemedAt: string;
}

export interface BroadcastLog {
  id: number;
  userId: string;
  message: string;
  sentAt: string;
  type: string;
  groupId: string;
}

export interface Feedback {
  id: number;
  userId: string;
  username: string;
  type: 'TEXT' | 'PHOTO';
  content: string;
  seen: boolean;
  createdAt: string;
}

export interface Setting {
  key: string;
  value: string;
}

export interface Notification {
  id: number;
  userId: string;
  type: 'PAYMENT_PROOF' | 'PAYMENT_APPROVED' | 'PAYMENT_REJECTED' | 'NEW_USER' | 'FEEDBACK';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  paymentId?: number;
  deliveredKey?: string;
  deliveredFileName?: string;
}

const DB_VERSION = 6;

function getStore<T>(key: string, def: T): T {
  try { const d = localStorage.getItem(`kity_${key}`); return d ? JSON.parse(d) : def; }
  catch { return def; }
}
function setStore<T>(key: string, value: T): void {
  localStorage.setItem(`kity_${key}`, JSON.stringify(value));
}
function nextId(key: string): number {
  const c = getStore<number>(`seq_${key}`, 0) + 1;
  setStore(`seq_${key}`, c); return c;
}

// === IMAGE COMPRESSION ===
export function compressImage(file: File, maxWidth: number = 400, quality: number = 0.5): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > maxWidth) { h = (h * maxWidth) / w; w = maxWidth; }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject('err'); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject('err');
      img.src = ev.target?.result as string;
    };
    reader.onerror = () => reject('err');
    reader.readAsDataURL(file);
  });
}

// === ADMIN CREDENTIALS (hardcoded fallback, always works) ===
const DEFAULT_ADMIN_MOBILE = '9080128384';
const DEFAULT_ADMIN_PASSWORD = 'sri@1234';

export function verifyAdmin(mobile: string, password: string): boolean {
  const sm = getSetting('ADMIN_MOBILE') || DEFAULT_ADMIN_MOBILE;
  const sp = getSetting('ADMIN_PASSWORD') || DEFAULT_ADMIN_PASSWORD;
  if (mobile === sm && password === sp) return true;
  // Hardcoded fallback - always works even if storage corrupt
  if (mobile === DEFAULT_ADMIN_MOBILE && password === DEFAULT_ADMIN_PASSWORD) {
    setSetting('ADMIN_MOBILE', DEFAULT_ADMIN_MOBILE);
    setSetting('ADMIN_PASSWORD', DEFAULT_ADMIN_PASSWORD);
    return true;
  }
  return false;
}

export function getAdminCreds(): { mobile: string; password: string } {
  return { mobile: getSetting('ADMIN_MOBILE') || DEFAULT_ADMIN_MOBILE, password: getSetting('ADMIN_PASSWORD') || DEFAULT_ADMIN_PASSWORD };
}
export function setAdminCreds(mobile: string, password: string) {
  setSetting('ADMIN_MOBILE', mobile); setSetting('ADMIN_PASSWORD', password);
}

// === USERS ===
export function getUsers(): User[] { return getStore<User[]>('users', []); }
export function addUser(username: string, mobile: string, email: string = ''): User {
  const users = getUsers();
  const id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  const user: User = { id, username, mobile, email, joinDate: new Date().toISOString(), banned: false };
  users.push(user); setStore('users', users); return user;
}
export function updateUser(id: string, updates: Partial<User>) {
  setStore('users', getUsers().map(u => u.id === id ? { ...u, ...updates } : u));
}
export function getUserById(id: string): User | undefined { return getUsers().find(u => u.id === id); }
export function getUserByMobile(mobile: string): User | undefined { return getUsers().find(u => u.mobile === mobile); }
export function getUserByEmail(email: string): User | undefined { return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase()); }

// === FILES ===
export function getFiles(): StoreFile[] { return getStore<StoreFile[]>('files', []); }
export function addFile(fileName: string, fileData: string, fileType: string, fileSize: string): StoreFile {
  const files = getFiles(); const id = nextId('files');
  const f: StoreFile = { id, fileName, fileData, fileType, fileSize };
  files.push(f); setStore('files', files); return f;
}
export function deleteFile(id: number) {
  setStore('files', getFiles().filter(f => f.id !== id));
  setStore('prices', getPrices().filter(p => p.fileId !== id));
  setStore('keyStock', getKeyStock().filter(k => k.fileId !== id));
}
export function getFileById(id: number): StoreFile | undefined { return getFiles().find(f => f.id === id); }

// === PRICES ===
export function getPrices(): Price[] { return getStore<Price[]>('prices', []); }
export function addPrice(fileId: number, durationDays: number, price: number): Price {
  const prices = getPrices(); const id = nextId('prices');
  prices.push({ id, fileId, durationDays, price }); setStore('prices', prices);
  return { id, fileId, durationDays, price };
}
export function updatePrice(id: number, durationDays: number, price: number) {
  setStore('prices', getPrices().map(p => p.id === id ? { ...p, durationDays, price } : p));
}
export function deletePrice(id: number) { setStore('prices', getPrices().filter(p => p.id !== id)); }
export function getPricesByFileId(fileId: number): Price[] { return getPrices().filter(p => p.fileId === fileId); }

// === KEY STOCK ===
export function getKeyStock(): KeyStock[] { return getStore<KeyStock[]>('keyStock', []); }
export function addKeys(fileId: number, durationDays: number, keys: string[]): void {
  const stock = getKeyStock();
  keys.forEach(keyCode => { stock.push({ id: nextId('keyStock'), fileId, durationDays, keyCode, status: 'AVAILABLE' }); });
  setStore('keyStock', stock);
}
export function getAvailableKey(fileId: number, durationDays: number): KeyStock | undefined {
  return getKeyStock().find(k => k.fileId === fileId && k.durationDays === durationDays && k.status === 'AVAILABLE');
}
export function useKey(id: number) {
  setStore('keyStock', getKeyStock().map(k => k.id === id ? { ...k, status: 'USED' as const } : k));
}
export function getStockCount(fileId: number, durationDays: number): number {
  return getKeyStock().filter(k => k.fileId === fileId && k.durationDays === durationDays && k.status === 'AVAILABLE').length;
}

// === PAYMENTS ===
export function getPayments(): Payment[] { return getStore<Payment[]>('payments', []); }
export function addPayment(userId: string, fileId: number, priceId: number): Payment {
  const payments = getPayments(); const id = nextId('payments');
  const p: Payment = { id, userId, fileId, priceId, status: 'PENDING', createdAt: new Date().toISOString(), doneClicked: false };
  payments.push(p); setStore('payments', payments); return p;
}
export function updatePayment(id: number, updates: Partial<Payment>) {
  setStore('payments', getPayments().map(p => p.id === id ? { ...p, ...updates } : p));
}
export function getPaymentById(id: number): Payment | undefined { return getPayments().find(p => p.id === id); }

// === TRIALS ===
export function getTrialKeys(): TrialKey[] { return getStore<TrialKey[]>('trialKeys', []); }
export function addTrialKey(fileId: number, redeemCode: string, trialKey: string): TrialKey {
  const keys = getTrialKeys(); const id = nextId('trialKeys');
  const tk: TrialKey = { id, fileId, redeemCode, trialKey };
  keys.push(tk); setStore('trialKeys', keys); return tk;
}
export function deleteTrialKey(id: number) { setStore('trialKeys', getTrialKeys().filter(t => t.id !== id)); }
export function getTrialByCode(code: string): TrialKey | undefined {
  return getTrialKeys().find(t => t.redeemCode.toUpperCase() === code.toUpperCase());
}
export function getTrialLogs(): TrialLog[] { return getStore<TrialLog[]>('trialLogs', []); }
export function addTrialLog(userId: string, username: string, redeemCode: string, fileName: string, trialKey: string): TrialLog {
  const logs = getTrialLogs(); const id = nextId('trialLogs');
  const l: TrialLog = { id, userId, username, redeemCode, fileName, trialKey, redeemedAt: new Date().toISOString() };
  logs.push(l); setStore('trialLogs', logs); return l;
}

// === BROADCAST ===
export function getBroadcastLogs(): BroadcastLog[] { return getStore<BroadcastLog[]>('broadcastLogs', []); }
export function addBroadcastLog(userId: string, message: string, type: string, groupId: string): BroadcastLog {
  const logs = getBroadcastLogs(); const id = nextId('broadcastLogs');
  const l: BroadcastLog = { id, userId, message, sentAt: new Date().toISOString(), type, groupId };
  logs.push(l); setStore('broadcastLogs', logs); return l;
}

// === FEEDBACK ===
export function getFeedbacks(): Feedback[] { return getStore<Feedback[]>('feedbacks', []); }
export function addFeedback(userId: string, username: string, type: 'TEXT' | 'PHOTO', content: string): Feedback {
  const fbs = getFeedbacks(); const id = nextId('feedbacks');
  const fb: Feedback = { id, userId, username, type, content, seen: false, createdAt: new Date().toISOString() };
  fbs.push(fb); setStore('feedbacks', fbs); return fb;
}
export function markFeedbackSeen(id: number) {
  setStore('feedbacks', getFeedbacks().map(f => f.id === id ? { ...f, seen: true } : f));
}

// === NOTIFICATIONS ===
export function getNotificationsFor(userId: string): Notification[] {
  return getStore<Notification[]>('notifications', []).filter(n => n.userId === userId);
}
export function addAdminNotification(type: Notification['type'], title: string, message: string, paymentId?: number): void {
  const notifs = getStore<Notification[]>('notifications', []);
  notifs.unshift({ id: nextId('notifications'), userId: '', type, title, message, read: false, createdAt: new Date().toISOString(), paymentId });
  if (notifs.length > 50) notifs.length = 50;
  setStore('notifications', notifs);
}
export function addUserNotification(userId: string, type: Notification['type'], title: string, message: string, paymentId?: number, deliveredKey?: string, deliveredFileName?: string): void {
  const notifs = getStore<Notification[]>('notifications', []);
  notifs.unshift({ id: nextId('notifications'), userId, type, title, message, read: false, createdAt: new Date().toISOString(), paymentId, deliveredKey, deliveredFileName });
  if (notifs.length > 100) notifs.length = 100;
  setStore('notifications', notifs);
}
export function markNotifRead(id: number) {
  setStore('notifications', getStore<Notification[]>('notifications', []).map(n => n.id === id ? { ...n, read: true } : n));
}
export function markAllNotifsRead(userId: string) {
  setStore('notifications', getStore<Notification[]>('notifications', []).map(n => n.userId === userId ? { ...n, read: true } : n));
}
export function getUnreadNotifCount(userId: string): number {
  return getStore<Notification[]>('notifications', []).filter(n => !n.read && n.userId === userId).length;
}

// === SETTINGS ===
export function getSetting(key: string): string | undefined {
  return getStore<Setting[]>('settings', []).find(s => s.key === key)?.value;
}
export function setSetting(key: string, value: string) {
  const settings = getStore<Setting[]>('settings', []);
  const idx = settings.findIndex(s => s.key === key);
  if (idx >= 0) settings[idx].value = value; else settings.push({ key, value });
  setStore('settings', settings);
}

// === SEED - force reset old data ===
export function seedDemoData() {
  const ver = getStore<number>('db_version', 0);
  if (ver >= DB_VERSION) return;

  // Clear all old data
  const keys = Object.keys(localStorage).filter(k => k.startsWith('kity_'));
  keys.forEach(k => localStorage.removeItem(k));

  const f1 = addFile('BGMI Premium', '', 'application/zip', '45 MB');
  const f2 = addFile('Free Fire Elite', '', 'application/zip', '32 MB');
  const f3 = addFile('Clash Royale Pro', '', 'application/zip', '28 MB');
  const f4 = addFile('PUBG Mobile Hack', '', 'application/zip', '55 MB');
  const f5 = addFile('Call of Duty Pack', '', 'application/zip', '38 MB');

  addPrice(f1.id, 7, 49); addPrice(f1.id, 30, 149); addPrice(f1.id, 90, 399);
  addPrice(f2.id, 7, 39); addPrice(f2.id, 30, 99);
  addPrice(f3.id, 7, 29); addPrice(f3.id, 30, 79);
  addPrice(f4.id, 7, 59); addPrice(f4.id, 30, 199);
  addPrice(f5.id, 7, 45); addPrice(f5.id, 30, 129);

  addKeys(f1.id, 7, ['KEY-BGMI-7D-001', 'KEY-BGMI-7D-002', 'KEY-BGMI-7D-003']);
  addKeys(f1.id, 30, ['KEY-BGMI-30D-001', 'KEY-BGMI-30D-002']);
  addKeys(f2.id, 7, ['KEY-FF-7D-001', 'KEY-FF-7D-002']);
  addKeys(f3.id, 7, ['KEY-CR-7D-001']);
  addKeys(f4.id, 7, ['KEY-PUBG-7D-001', 'KEY-PUBG-7D-002', 'KEY-PUBG-7D-003']);
  addKeys(f5.id, 7, ['KEY-COD-7D-001', 'KEY-COD-7D-002']);

  addTrialKey(f1.id, 'TRIAL2024', 'TRIAL-KEY-BGMI-X7K');
  addTrialKey(f2.id, 'FREEFIRE', 'TRIAL-KEY-FF-M3P');

  setSetting('UPI_ID', 'kitygamer@paytm');
  setSetting('ADMIN_MOBILE', DEFAULT_ADMIN_MOBILE);
  setSetting('ADMIN_PASSWORD', DEFAULT_ADMIN_PASSWORD);

  // Admin user - use different mobile so it doesn't conflict
  const adminUser = addUser('Admin', '0000000000', 'admin@kity.com');
  updateUser(adminUser.id, { banned: false });
  setStore('adminId', adminUser.id);
  setStore('db_version', DB_VERSION);
}

export function getAdminId(): string { return getStore<string>('adminId', ''); }
export function getCurrentUserId(): string { return getStore<string>('currentUserId', ''); }
export function setCurrentUserId(id: string) {
  if (id) setStore('currentUserId', id); else localStorage.removeItem('kity_currentUserId');
}
