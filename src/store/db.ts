// Simulated database using localStorage with proper typing

export interface User {
  id: string;
  username: string;
  joinDate: string;
  banned: boolean;
}

export interface StoreFile {
  id: number;
  fileName: string;
  fileData: string; // base64 or blob URL for demo
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
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  proofImage?: string;
  proofText?: string;
  createdAt: string;
  rejectReason?: string;
  doneClicked: boolean;
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

export interface Channel {
  id: number;
  channelUsername: string;
  inviteLink: string;
}

export interface BroadcastLog {
  id: number;
  userId: string;
  message: string;
  sentAt: string;
  type: string;
  groupId: string;
}

export interface PollVote {
  id: number;
  groupId: string;
  pollId: string;
  userId: string;
  optionId: number;
  votedAt: string;
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

function getStore<T>(key: string, def: T): T {
  try {
    const data = localStorage.getItem(`kity_${key}`);
    return data ? JSON.parse(data) : def;
  } catch {
    return def;
  }
}

function setStore<T>(key: string, value: T): void {
  localStorage.setItem(`kity_${key}`, JSON.stringify(value));
}

// Auto-increment ID helper
function nextId(key: string): number {
  const current = getStore<number>(`seq_${key}`, 0) + 1;
  setStore(`seq_${key}`, current);
  return current;
}

// === USERS ===
export function getUsers(): User[] { return getStore<User[]>('users', []); }
export function addUser(username: string): User {
  const users = getUsers();
  const id = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  const user: User = { id, username, joinDate: new Date().toISOString(), banned: false };
  users.push(user);
  setStore('users', users);
  return user;
}
export function updateUser(id: string, updates: Partial<User>) {
  const users = getUsers().map(u => u.id === id ? { ...u, ...updates } : u);
  setStore('users', users);
}
export function getUserById(id: string): User | undefined {
  return getUsers().find(u => u.id === id);
}

// === FILES ===
export function getFiles(): StoreFile[] { return getStore<StoreFile[]>('files', []); }
export function addFile(fileName: string, fileData: string, fileType: string, fileSize: string): StoreFile {
  const files = getFiles();
  const id = nextId('files');
  const file: StoreFile = { id, fileName, fileData, fileType, fileSize };
  files.push(file);
  setStore('files', files);
  return file;
}
export function deleteFile(id: number) {
  const files = getFiles().filter(f => f.id !== id);
  setStore('files', files);
  // Also delete related prices and keys
  setStore('prices', getPrices().filter(p => p.fileId !== id));
  setStore('keyStock', getKeyStock().filter(k => k.fileId !== id));
}
export function getFileById(id: number): StoreFile | undefined {
  return getFiles().find(f => f.id === id);
}

// === PRICES ===
export function getPrices(): Price[] { return getStore<Price[]>('prices', []); }
export function addPrice(fileId: number, durationDays: number, price: number): Price {
  const prices = getPrices();
  const id = nextId('prices');
  const p: Price = { id, fileId, durationDays, price };
  prices.push(p);
  setStore('prices', prices);
  return p;
}
export function updatePrice(id: number, durationDays: number, price: number) {
  const prices = getPrices().map(p => p.id === id ? { ...p, durationDays, price } : p);
  setStore('prices', prices);
}
export function deletePrice(id: number) {
  setStore('prices', getPrices().filter(p => p.id !== id));
}
export function getPricesByFileId(fileId: number): Price[] {
  return getPrices().filter(p => p.fileId === fileId);
}

// === KEY STOCK ===
export function getKeyStock(): KeyStock[] { return getStore<KeyStock[]>('keyStock', []); }
export function addKeys(fileId: number, durationDays: number, keys: string[]): void {
  const stock = getKeyStock();
  keys.forEach(keyCode => {
    const id = nextId('keyStock');
    stock.push({ id, fileId, durationDays, keyCode, status: 'AVAILABLE' });
  });
  setStore('keyStock', stock);
}
export function getAvailableKey(fileId: number, durationDays: number): KeyStock | undefined {
  return getKeyStock().find(k => k.fileId === fileId && k.durationDays === durationDays && k.status === 'AVAILABLE');
}
export function useKey(id: number) {
  const stock = getKeyStock().map(k => k.id === id ? { ...k, status: 'USED' as const } : k);
  setStore('keyStock', stock);
}
export function getStockCount(fileId: number, durationDays: number): number {
  return getKeyStock().filter(k => k.fileId === fileId && k.durationDays === durationDays && k.status === 'AVAILABLE').length;
}

// === PAYMENTS ===
export function getPayments(): Payment[] { return getStore<Payment[]>('payments', []); }
export function addPayment(userId: string, fileId: number, priceId: number): Payment {
  const payments = getPayments();
  const id = nextId('payments');
  const p: Payment = { id, userId, fileId, priceId, status: 'PENDING', createdAt: new Date().toISOString(), doneClicked: false };
  payments.push(p);
  setStore('payments', payments);
  return p;
}
export function updatePayment(id: number, updates: Partial<Payment>) {
  const payments = getPayments().map(p => p.id === id ? { ...p, ...updates } : p);
  setStore('payments', payments);
}
export function getPaymentById(id: number): Payment | undefined {
  return getPayments().find(p => p.id === id);
}
export function getPendingPayments(): Payment[] {
  return getPayments().filter(p => p.status === 'PENDING');
}

// === TRIAL KEYS ===
export function getTrialKeys(): TrialKey[] { return getStore<TrialKey[]>('trialKeys', []); }
export function addTrialKey(fileId: number, redeemCode: string, trialKey: string): TrialKey {
  const keys = getTrialKeys();
  const id = nextId('trialKeys');
  const tk: TrialKey = { id, fileId, redeemCode, trialKey };
  keys.push(tk);
  setStore('trialKeys', keys);
  return tk;
}
export function deleteTrialKey(id: number) {
  setStore('trialKeys', getTrialKeys().filter(t => t.id !== id));
}
export function getTrialByCode(code: string): TrialKey | undefined {
  return getTrialKeys().find(t => t.redeemCode.toUpperCase() === code.toUpperCase());
}

// === TRIAL LOGS ===
export function getTrialLogs(): TrialLog[] { return getStore<TrialLog[]>('trialLogs', []); }
export function addTrialLog(userId: string, username: string, redeemCode: string, fileName: string, trialKey: string): TrialLog {
  const logs = getTrialLogs();
  const id = nextId('trialLogs');
  const log: TrialLog = { id, userId, username, redeemCode, fileName, trialKey, redeemedAt: new Date().toISOString() };
  logs.push(log);
  setStore('trialLogs', logs);
  return log;
}

// === CHANNELS ===
export function getChannels(): Channel[] { return getStore<Channel[]>('channels', []); }
export function addChannel(channelUsername: string, inviteLink: string): Channel {
  const channels = getChannels();
  const id = nextId('channels');
  const ch: Channel = { id, channelUsername, inviteLink };
  channels.push(ch);
  setStore('channels', channels);
  return ch;
}
export function deleteChannel(id: number) {
  setStore('channels', getChannels().filter(c => c.id !== id));
}

// === BROADCAST LOGS ===
export function getBroadcastLogs(): BroadcastLog[] { return getStore<BroadcastLog[]>('broadcastLogs', []); }
export function addBroadcastLog(userId: string, message: string, type: string, groupId: string): BroadcastLog {
  const logs = getBroadcastLogs();
  const id = nextId('broadcastLogs');
  const log: BroadcastLog = { id, userId, message, sentAt: new Date().toISOString(), type, groupId };
  logs.push(log);
  setStore('broadcastLogs', logs);
  return log;
}
export function deleteBroadcastLogs(groupId: string) {
  setStore('broadcastLogs', getBroadcastLogs().filter(l => l.groupId !== groupId));
}

// === FEEDBACK ===
export function getFeedbacks(): Feedback[] { return getStore<Feedback[]>('feedbacks', []); }
export function addFeedback(userId: string, username: string, type: 'TEXT' | 'PHOTO', content: string): Feedback {
  const fbs = getFeedbacks();
  const id = nextId('feedbacks');
  const fb: Feedback = { id, userId, username, type, content, seen: false, createdAt: new Date().toISOString() };
  fbs.push(fb);
  setStore('feedbacks', fbs);
  return fb;
}
export function markFeedbackSeen(id: number) {
  const fbs = getFeedbacks().map(f => f.id === id ? { ...f, seen: true } : f);
  setStore('feedbacks', fbs);
}

// === SETTINGS ===
export function getSetting(key: string): string | undefined {
  const settings = getStore<Setting[]>('settings', []);
  return settings.find(s => s.key === key)?.value;
}
export function setSetting(key: string, value: string) {
  const settings = getStore<Setting[]>('settings', []);
  const idx = settings.findIndex(s => s.key === key);
  if (idx >= 0) settings[idx].value = value;
  else settings.push({ key, value });
  setStore('settings', settings);
}

// === SEED DATA ===
export function seedDemoData() {
  if (getStore('seeded', false)) return;
  
  // Add demo files
  const f1 = addFile('BGMI Premium', '', 'application/zip', '45 MB');
  const f2 = addFile('Free Fire Elite', '', 'application/zip', '32 MB');
  const f3 = addFile('Clash Royale Pro', '', 'application/zip', '28 MB');
  const f4 = addFile('PUBG Mobile Hack', '', 'application/zip', '55 MB');
  const f5 = addFile('Call of Duty Pack', '', 'application/zip', '38 MB');
  
  // Add demo prices
  addPrice(f1.id, 7, 49);
  addPrice(f1.id, 30, 149);
  addPrice(f1.id, 90, 399);
  addPrice(f2.id, 7, 39);
  addPrice(f2.id, 30, 99);
  addPrice(f3.id, 7, 29);
  addPrice(f3.id, 30, 79);
  addPrice(f4.id, 7, 59);
  addPrice(f4.id, 30, 199);
  addPrice(f5.id, 7, 45);
  addPrice(f5.id, 30, 129);
  
  // Add demo keys
  addKeys(f1.id, 7, ['KEY-BGMI-7D-001', 'KEY-BGMI-7D-002', 'KEY-BGMI-7D-003']);
  addKeys(f1.id, 30, ['KEY-BGMI-30D-001', 'KEY-BGMI-30D-002']);
  addKeys(f2.id, 7, ['KEY-FF-7D-001', 'KEY-FF-7D-002']);
  addKeys(f3.id, 7, ['KEY-CR-7D-001']);
  addKeys(f4.id, 7, ['KEY-PUBG-7D-001', 'KEY-PUBG-7D-002', 'KEY-PUBG-7D-003']);
  addKeys(f5.id, 7, ['KEY-COD-7D-001', 'KEY-COD-7D-002']);
  
  // Add demo trial
  addTrialKey(f1.id, 'TRIAL2024', 'TRIAL-KEY-BGMI-X7K');
  addTrialKey(f2.id, 'FREEFIRE', 'TRIAL-KEY-FF-M3P');
  
  // Set UPI
  setSetting('UPI_ID', 'kitygamer@paytm');
  
  // Demo users
  const adminUser = addUser('Admin');
  updateUser(adminUser.id, { banned: false });
  
  setStore('seeded', true);
  setStore('adminId', adminUser.id);
}

export function getAdminId(): string {
  return getStore<string>('adminId', '');
}
export function setAdminId(id: string) {
  setStore('adminId', id);
}
export function getCurrentUserId(): string {
  return getStore<string>('currentUserId', '');
}
export function setCurrentUserId(id: string) {
  if (id) setStore('currentUserId', id);
  else localStorage.removeItem('kity_currentUserId');
}
