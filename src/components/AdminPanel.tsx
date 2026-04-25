import React, { useState, useRef } from 'react';
import { useApp } from '../store/AppContext';
import {
  getFiles, addFile, deleteFile, getPrices, addPrice, updatePrice, deletePrice,
  getKeyStock, addKeys, getPayments, updatePayment, getPaymentById, getAvailableKey, useKey,
  getUsers, getTrialKeys, addTrialKey, deleteTrialKey, getTrialLogs,
  getFeedbacks, markFeedbackSeen, getSetting, setSetting,
  getBroadcastLogs, addBroadcastLog, updateUser, getFileById,
  getAdminCreds, setAdminCreds, addUserNotification, markAllNotifsRead
} from '../store/db';
import { getPricesByFileId, getStockCount, formatDate, generateCode } from '../store/helpers';
import { Icon, IconName } from './Icon';
import { ProductVisual, getProductInitials, KityGamerBadge } from './ProductVisual';

interface TabDef {
  id: string;
  label: string;
  icon: IconName;
}

const TABS: TabDef[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'chart' },
  { id: 'files',     label: 'Files',     icon: 'folder' },
  { id: 'prices',    label: 'Prices',    icon: 'tag' },
  { id: 'keys',      label: 'Keys',      icon: 'key' },
  { id: 'payments',  label: 'Payments',  icon: 'card' },
  { id: 'trials',    label: 'Trials',    icon: 'gift' },
  { id: 'users',     label: 'Users',     icon: 'users' },
  { id: 'feedback',  label: 'Feedback',  icon: 'message' },
  { id: 'settings',  label: 'Settings',  icon: 'gear' },
  { id: 'broadcast', label: 'Broadcast', icon: 'megaphone' },
];

// -------- Small product avatar (used in lists) --------
const ProductAvatar: React.FC<{ name: string; seed: number; size?: number }> = ({ name, seed, size = 40 }) => (
  <div
    className="rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-border"
    style={{ width: size, height: size }}
  >
    <ProductVisual
      name={name}
      seed={seed}
      className="w-full h-full"
      initialsClassName={size <= 32 ? 'text-[10px]' : 'text-xs'}
      showOrb={false}
    />
  </div>
);

const AdminPanel: React.FC = () => {
  const { navigate } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="px-3 sm:px-4 py-4 sm:py-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="icon-box icon-box-accent">
            <Icon name="gear" className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-base sm:text-xl font-extrabold leading-none">Admin panel</h2>
            <p className="text-text-muted text-[10px] sm:text-xs mt-0.5">Manage your store</p>
          </div>
        </div>
        <button
          onClick={() => navigate('home')}
          className="btn-ghost text-xs sm:text-sm px-2 py-1.5"
        >
          <Icon name="arrow-left" className="w-4 h-4" /> Store
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 sm:gap-1.5 mb-5 overflow-x-auto pb-2 -mx-1 px-1" role="tablist">
        {TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={activeTab === t.id}
            onClick={() => setActiveTab(t.id)}
            className={`tab-pill ${activeTab === t.id ? 'active' : ''}`}
          >
            <Icon name={t.icon} className="w-3.5 h-3.5" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'files' && <FilesTab />}
        {activeTab === 'prices' && <PricesTab />}
        {activeTab === 'keys' && <KeysTab />}
        {activeTab === 'payments' && <PaymentsTab />}
        {activeTab === 'trials' && <TrialsTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'feedback' && <FeedbackTab />}
        {activeTab === 'settings' && <SettingsTab />}
        {activeTab === 'broadcast' && <BroadcastTab />}
      </div>
    </div>
  );
};

// =================== DASHBOARD ===================
const DashboardTab: React.FC = () => {
  const files = getFiles();
  const users = getUsers();
  const payments = getPayments();
  const keys = getKeyStock();
  const feedbacks = getFeedbacks();
  const prices = getPrices();

  const availableKeys = keys.filter(k => k.status === 'AVAILABLE').length;
  const approvedPayments = payments.filter(p => p.status === 'APPROVED').length;
  const pendingPayments = payments.filter(p => p.status === 'PENDING' || p.status === 'PROOF_UPLOADED').length;
  const totalRevenue = payments.filter(p => p.status === 'APPROVED').reduce((sum, p) => {
    const price = prices.find(pr => pr.id === p.priceId);
    return sum + (price?.price || 0);
  }, 0);
  const bannedUsers = users.filter(u => u.banned).length;
  const unreadFeedback = feedbacks.filter(f => !f.seen).length;

  const stats: { label: string; value: string | number; icon: IconName; cls: string }[] = [
    { label: 'Users',     value: users.length,        icon: 'users',        cls: 'icon-box-info' },
    { label: 'Files',     value: files.length,        icon: 'folder',       cls: 'icon-box' },
    { label: 'Keys',      value: availableKeys,       icon: 'key',          cls: 'icon-box-success' },
    { label: 'Revenue',   value: `₹${totalRevenue}`,  icon: 'wallet',       cls: 'icon-box-warning' },
    { label: 'Approved',  value: approvedPayments,    icon: 'check-circle', cls: 'icon-box-success' },
    { label: 'Pending',   value: pendingPayments,     icon: 'clock',        cls: 'icon-box-warning' },
    { label: 'Banned',    value: bannedUsers,         icon: 'ban',          cls: 'icon-box-danger' },
    { label: 'Feedback',  value: unreadFeedback,      icon: 'message',      cls: 'icon-box' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {stats.map(s => (
          <div key={s.label} className="metric-card p-3 sm:p-4">
            <span className={`icon-box ${s.cls} mb-2`}>
              <Icon name={s.icon} className="w-4 h-4" />
            </span>
            <p className="text-lg sm:text-2xl font-extrabold leading-none">{s.value}</p>
            <p className="text-text-muted text-[10px] sm:text-xs mt-1.5 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {pendingPayments > 0 && (
        <div className="mt-4 panel-card p-4 border-l-4 border-l-warning flex items-start gap-3">
          <span className="icon-box icon-box-warning flex-shrink-0">
            <Icon name="alert" className="w-4 h-4" />
          </span>
          <div>
            <p className="text-warning text-sm font-semibold">{pendingPayments} payment(s) need attention</p>
            <p className="text-text-muted text-xs mt-0.5">Review them in the Payments tab.</p>
          </div>
        </div>
      )}

      {unreadFeedback > 0 && (
        <div className="mt-3 panel-card p-4 border-l-4 border-l-primary flex items-start gap-3">
          <span className="icon-box flex-shrink-0">
            <Icon name="message" className="w-4 h-4" />
          </span>
          <div>
            <p className="text-primary-light text-sm font-semibold">{unreadFeedback} unread feedback</p>
            <p className="text-text-muted text-xs mt-0.5">See what users are saying in the Feedback tab.</p>
          </div>
        </div>
      )}
    </div>
  );
};

// =================== FILES ===================
const FilesTab: React.FC = () => {
  const { refreshData } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const files = getFiles();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setSelectedFile(f);
    if (!fileName.trim()) setFileName(f.name.replace(/\.[^/.]+$/, ''));
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
      reader.readAsDataURL(f);
    } else { setPreviewUrl(''); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    setSelectedFile(f);
    if (!fileName.trim()) setFileName(f.name.replace(/\.[^/.]+$/, ''));
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
      reader.readAsDataURL(f);
    } else { setPreviewUrl(''); }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      addFile(fileName.trim() || selectedFile.name, base64, selectedFile.type, `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB`);
      setFileName(''); setSelectedFile(null); setPreviewUrl(''); setShowAdd(false); refreshData();
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this file and all related prices/keys?')) { deleteFile(id); refreshData(); }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title"><Icon name="folder" className="w-4 h-4" /> Files ({files.length})</h3>
        <button onClick={() => setShowAdd(s => !s)} className="btn-primary px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm">
          <Icon name={showAdd ? 'x' : 'plus'} className="w-4 h-4" />
          {showAdd ? 'Cancel' : 'Upload'}
        </button>
      </div>

      {showAdd && (
        <div className="panel-card p-4 mb-4 animate-fade-in">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/60 hover:bg-primary/[0.05] transition-all mb-3"
            role="button" tabIndex={0}
          >
            {previewUrl ? (
              <div>
                <img src={previewUrl} alt="Preview" className="max-h-32 mx-auto rounded-lg mb-2" />
                <p className="text-success text-sm inline-flex items-center gap-1.5">
                  <Icon name="check-circle" className="w-3.5 h-3.5" /> {selectedFile?.name}
                </p>
              </div>
            ) : selectedFile ? (
              <div>
                <span className="icon-box icon-box-lg mx-auto mb-2"><Icon name="file" className="w-5 h-5" /></span>
                <p className="text-success text-sm inline-flex items-center gap-1.5">
                  <Icon name="check-circle" className="w-3.5 h-3.5" /> {selectedFile.name}
                </p>
                <p className="text-text-muted text-xs mt-1">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
            ) : (
              <div>
                <span className="icon-box icon-box-lg mx-auto mb-2"><Icon name="upload" className="w-5 h-5" /></span>
                <p className="text-text-secondary text-sm">Drag & drop or tap to upload</p>
                <p className="text-text-muted text-xs mt-1">Any file type supported</p>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" />
          <input
            type="text" value={fileName} onChange={(e) => setFileName(e.target.value)}
            placeholder="File display name..." className="input-field mb-3"
          />
          <button onClick={handleUpload} disabled={!selectedFile} className="btn-accent px-6 py-2 rounded-xl text-sm w-full sm:w-auto">
            <Icon name="upload" className="w-4 h-4" /> Upload file
          </button>
        </div>
      )}

      <div className="space-y-2">
        {files.length === 0 && (
          <div className="empty-state panel-card">
            <span className="empty-icon"><Icon name="folder" className="w-5 h-5" /></span>
            <p className="text-sm">No files uploaded</p>
          </div>
        )}
        {files.map(f => (
          <div key={f.id} className="panel-card p-3 sm:p-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {f.fileData && f.fileType.startsWith('image/') ? (
                <img src={f.fileData} alt={f.fileName} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 ring-1 ring-border" />
              ) : (
                <ProductAvatar name={f.fileName} seed={f.id} />
              )}
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{f.fileName}</p>
                <p className="text-text-muted text-xs">ID: {f.id} • {f.fileSize}</p>
              </div>
            </div>
            <button
              onClick={() => handleDelete(f.id)}
              className="text-danger hover:bg-danger/10 p-2 rounded-lg flex-shrink-0 transition-colors"
              aria-label={`Delete ${f.fileName}`}
            >
              <Icon name="trash" className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// =================== PRICES ===================
const PricesTab: React.FC = () => {
  const { refreshData } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [selFile, setSelFile] = useState(0);
  const [days, setDays] = useState('');
  const [price, setPrice] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editDays, setEditDays] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const files = getFiles();
  const allPrices = getPrices();

  const handleAdd = () => {
    if (!selFile || !days || !price) return;
    addPrice(selFile, parseInt(days), parseFloat(price));
    setDays(''); setPrice(''); setShowAdd(false); refreshData();
  };
  const handleEdit = (id: number) => {
    if (!editDays || !editPrice) return;
    updatePrice(id, parseInt(editDays), parseFloat(editPrice));
    setEditId(null); refreshData();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title"><Icon name="tag" className="w-4 h-4" /> Prices ({allPrices.length})</h3>
        <button onClick={() => setShowAdd(s => !s)} className="btn-primary px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm">
          <Icon name={showAdd ? 'x' : 'plus'} className="w-4 h-4" />
          {showAdd ? 'Cancel' : 'Add'}
        </button>
      </div>
      {showAdd && (
        <div className="panel-card p-4 mb-4 animate-fade-in">
          <select
            value={selFile} onChange={(e) => setSelFile(parseInt(e.target.value))}
            className="input-field mb-3"
          >
            <option value={0}>Select file...</option>
            {files.map(f => <option key={f.id} value={f.id}>{f.fileName}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input type="number" value={days} onChange={(e) => setDays(e.target.value)} placeholder="Days" className="input-field" />
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="₹ Price" className="input-field" />
          </div>
          <button onClick={handleAdd} disabled={!selFile || !days || !price} className="btn-accent px-6 py-2 rounded-xl text-sm">
            <Icon name="plus" className="w-4 h-4" /> Add price
          </button>
        </div>
      )}
      <div className="space-y-2">
        {allPrices.length === 0 && (
          <div className="empty-state panel-card">
            <span className="empty-icon"><Icon name="tag" className="w-5 h-5" /></span>
            <p className="text-sm">No prices configured</p>
          </div>
        )}
        {allPrices.map(p => {
          const file = files.find(f => f.id === p.fileId);
          return (
            <div key={p.id} className="panel-card p-3 flex items-center justify-between gap-2">
              {editId === p.id ? (
                <div className="flex-1 flex flex-wrap gap-2 items-center">
                  <input type="number" value={editDays} onChange={(e) => setEditDays(e.target.value)} className="input-field !w-20 !py-1.5" placeholder="Days" />
                  <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="input-field !w-20 !py-1.5" placeholder="₹" />
                  <button onClick={() => handleEdit(p.id)} className="text-success p-1.5 rounded-md hover:bg-success/10" aria-label="Save">
                    <Icon name="check" className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditId(null)} className="text-danger p-1.5 rounded-md hover:bg-danger/10" aria-label="Cancel">
                    <Icon name="x" className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <ProductAvatar name={file?.fileName || '?'} seed={p.fileId} size={32} />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{file?.fileName || '?'}</p>
                      <p className="text-text-muted text-xs">{p.durationDays}D — <span className="text-accent font-semibold">₹{p.price}</span></p>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => { setEditId(p.id); setEditDays(String(p.durationDays)); setEditPrice(String(p.price)); }}
                      className="text-primary-light p-2 rounded-md hover:bg-primary/10 transition-colors"
                      aria-label="Edit price"
                    >
                      <Icon name="pencil" className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { deletePrice(p.id); refreshData(); }}
                      className="text-danger p-2 rounded-md hover:bg-danger/10 transition-colors"
                      aria-label="Delete price"
                    >
                      <Icon name="trash" className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =================== KEYS ===================
const KeysTab: React.FC = () => {
  const { refreshData } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [selFile, setSelFile] = useState(0);
  const [days, setDays] = useState('');
  const [keysInput, setKeysInput] = useState('');
  const files = getFiles();
  const stock = getKeyStock();

  const handleAdd = () => {
    if (!selFile || !days || !keysInput.trim()) return;
    const keys = keysInput.trim().split(/[\s,]+/).filter(k => k);
    addKeys(selFile, parseInt(days), keys);
    setDays(''); setKeysInput(''); setShowAdd(false); refreshData();
  };

  const stockSummary = files.map(f => {
    const filePrices = getPricesByFileId(f.id);
    const plans = filePrices.map(p => ({
      days: p.durationDays,
      available: getStockCount(f.id, p.durationDays),
      used: stock.filter(k => k.fileId === f.id && k.durationDays === p.durationDays && k.status === 'USED').length,
    }));
    return { file: f, plans };
  });

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title"><Icon name="key" className="w-4 h-4" /> Key stock</h3>
        <button onClick={() => setShowAdd(s => !s)} className="btn-primary px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm">
          <Icon name={showAdd ? 'x' : 'plus'} className="w-4 h-4" />
          {showAdd ? 'Cancel' : 'Add'}
        </button>
      </div>
      {showAdd && (
        <div className="panel-card p-4 mb-4 animate-fade-in">
          <select value={selFile} onChange={(e) => setSelFile(parseInt(e.target.value))} className="input-field mb-3">
            <option value={0}>Select file...</option>
            {files.map(f => <option key={f.id} value={f.id}>{f.fileName}</option>)}
          </select>
          <input type="number" value={days} onChange={(e) => setDays(e.target.value)} placeholder="Duration (days)" className="input-field mb-3" />
          <textarea value={keysInput} onChange={(e) => setKeysInput(e.target.value)} placeholder="Keys (space or comma separated)" rows={3} className="input-field mb-3" />
          <button onClick={handleAdd} disabled={!selFile || !days || !keysInput.trim()} className="btn-accent px-6 py-2 rounded-xl text-sm w-full sm:w-auto">
            <Icon name="plus" className="w-4 h-4" /> Add keys
          </button>
        </div>
      )}
      <div className="space-y-3">
        {stockSummary.length === 0 && (
          <div className="empty-state panel-card">
            <span className="empty-icon"><Icon name="key" className="w-5 h-5" /></span>
            <p className="text-sm">Upload a file first</p>
          </div>
        )}
        {stockSummary.map(({ file, plans }) => (
          <div key={file.id} className="panel-card p-3 sm:p-4">
            <div className="flex items-center gap-3 mb-2">
              <ProductAvatar name={file.fileName} seed={file.id} size={32} />
              <h4 className="font-semibold text-sm truncate">{file.fileName}</h4>
            </div>
            {plans.length === 0 ? (
              <p className="text-text-muted text-xs ml-11">No plans configured</p>
            ) : (
              <div className="space-y-1.5 ml-11">
                {plans.map(plan => (
                  <div key={plan.days} className="flex items-center justify-between bg-surface-lighter/60 rounded-lg p-2.5 border border-border/60">
                    <span className="text-xs text-text-secondary inline-flex items-center gap-1.5">
                      <Icon name="clock" className="w-3 h-3" /> {plan.days} days
                    </span>
                    <div className="flex gap-2 text-xs">
                      <span className="status-badge status-success">
                        <span className="dot" /> {plan.available} available
                      </span>
                      <span className="status-badge status-muted">
                        Used {plan.used}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// =================== PAYMENTS ===================
type PayFilter = 'ALL' | 'PENDING' | 'PROOF_UPLOADED' | 'APPROVED' | 'REJECTED';

const FILTERS: { id: PayFilter; label: string; icon?: IconName }[] = [
  { id: 'ALL',            label: 'All' },
  { id: 'PROOF_UPLOADED', label: 'Proof', icon: 'camera' },
  { id: 'PENDING',        label: 'Pending', icon: 'clock' },
  { id: 'APPROVED',       label: 'Approved', icon: 'check-circle' },
  { id: 'REJECTED',       label: 'Rejected', icon: 'x-circle' },
];

const PaymentsTab: React.FC = () => {
  const { refreshData } = useApp();
  const [filter, setFilter] = useState<PayFilter>('ALL');
  const payments = getPayments();
  const files = getFiles();
  const prices = getPrices();
  const users = getUsers();
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const filtered = filter === 'ALL' ? payments : payments.filter(p => p.status === filter);
  const sorted = [...filtered].sort((a, b) => b.id - a.id);
  const proofCount = payments.filter(p => p.status === 'PROOF_UPLOADED').length;

  const handleApprove = (pid: number) => {
    const pay = getPaymentById(pid);
    if (!pay) return;
    const price = prices.find(p => p.id === pay.priceId);
    if (!price) return;
    const key = getAvailableKey(pay.fileId, price.durationDays);
    if (!key) { alert('No keys available!'); return; }
    const file = getFileById(pay.fileId);
    useKey(key.id);
    updatePayment(pid, {
      status: 'APPROVED',
      deliveredFile: file?.fileData || '',
      deliveredFileName: file?.fileName || '',
      deliveredKey: key.keyCode,
    });
    addUserNotification(
      pay.userId,
      'PAYMENT_APPROVED',
      'Payment approved',
      `Your payment for ${file?.fileName || 'file'} (₹${price?.price || 0}) has been approved. Key & file delivered.`,
      pid,
      key.keyCode,
      file?.fileName,
    );
    markAllNotifsRead('');
    refreshData();
  };

  const handleReject = (pid: number) => {
    if (!rejectReason.trim()) return;
    const pay = getPaymentById(pid);
    updatePayment(pid, { status: 'REJECTED', rejectReason: rejectReason.trim() });
    if (pay) {
      const file = files.find(f => f.id === pay.fileId);
      addUserNotification(
        pay.userId,
        'PAYMENT_REJECTED',
        'Payment rejected',
        `Your payment for ${file?.fileName || 'file'} was rejected. Reason: ${rejectReason.trim()}`,
        pid,
      );
    }
    setRejectId(null); setRejectReason(''); refreshData();
  };

  const statusBadge = (s: string) => {
    if (s === 'APPROVED')       return { cls: 'status-success', label: 'Approved',  icon: 'check-circle' as IconName };
    if (s === 'PROOF_UPLOADED') return { cls: 'status-warning', label: 'Needs review', icon: 'camera' as IconName };
    if (s === 'PENDING')        return { cls: 'status-muted',   label: 'Pending',   icon: 'clock' as IconName };
    return { cls: 'status-danger', label: 'Rejected', icon: 'x-circle' as IconName };
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h3 className="section-title">
          <Icon name="card" className="w-4 h-4" /> Payments
          {proofCount > 0 && (
            <span className="bg-danger text-white text-[10px] px-2 py-0.5 rounded-full ml-1 animate-pulse-soft font-semibold">
              {proofCount} new
            </span>
          )}
        </h3>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 -mx-1 px-1">
        {FILTERS.map(f => (
          <button
            key={f.id} onClick={() => setFilter(f.id)}
            className={`tab-pill ${filter === f.id ? 'active' : ''}`}
          >
            {f.icon && <Icon name={f.icon} className="w-3.5 h-3.5" />}
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {sorted.map(pay => {
          const file = files.find(f => f.id === pay.fileId);
          const price = prices.find(p => p.id === pay.priceId);
          const user = users.find(u => u.id === pay.userId);
          const hasProof = pay.status === 'PROOF_UPLOADED' || (pay.proofImage && pay.status !== 'PENDING');
          const sb = statusBadge(pay.status);
          return (
            <div
              key={pay.id}
              className={`panel-card p-3 sm:p-4 animate-slide-in ${pay.status === 'PROOF_UPLOADED' ? 'border-l-4 border-l-warning' : ''}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <ProductAvatar name={file?.fileName || '?'} seed={pay.fileId} size={36} />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">
                      <span className="text-text-muted">#{pay.id}</span> {file?.fileName || '?'}
                    </p>
                    <p className="text-text-muted text-[10px] sm:text-xs truncate inline-flex items-center gap-1.5">
                      <Icon name="user" className="w-3 h-3" /> {user?.username || '?'}
                      <span className="text-border">•</span>
                      {formatDate(pay.createdAt)}
                    </p>
                  </div>
                </div>
                <span className={`status-badge ${sb.cls} flex-shrink-0`}>
                  <Icon name={sb.icon} className="w-3 h-3" />
                  {sb.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                <div className="bg-surface-lighter/60 rounded-lg p-2.5 border border-border/60">
                  <span className="text-text-muted text-[10px] uppercase tracking-wider">Amount</span>
                  <p className="text-accent font-extrabold text-sm">₹{price?.price || 0}</p>
                  <p className="text-text-muted text-[10px]">{price?.durationDays || 0} days</p>
                </div>
                <div className="bg-surface-lighter/60 rounded-lg p-2.5 border border-border/60">
                  <span className="text-text-muted text-[10px] uppercase tracking-wider">Proof</span>
                  <p className="inline-flex items-center gap-1.5 text-sm font-medium">
                    <Icon name={hasProof ? 'check-circle' : 'x-circle'} className={`w-3.5 h-3.5 ${hasProof ? 'text-success' : 'text-danger'}`} />
                    {hasProof ? 'Uploaded' : 'None'}
                  </p>
                </div>
              </div>

              {pay.proofImage && (
                <div className="mb-2">
                  <img src={pay.proofImage} alt="Proof" className="max-h-32 sm:max-h-40 rounded-lg w-auto border border-border" />
                </div>
              )}

              {pay.status === 'APPROVED' && pay.deliveredKey && (
                <div className="bg-success/[0.08] border border-success/25 rounded-lg p-2.5 mb-2">
                  <p className="text-success text-xs font-medium inline-flex items-center gap-1.5">
                    <Icon name="key" className="w-3.5 h-3.5" /> Key:
                    <code className="bg-success/15 px-1.5 py-0.5 rounded font-mono break-all">{pay.deliveredKey}</code>
                  </p>
                  <p className="text-success/70 text-[10px] mt-1 inline-flex items-center gap-1.5">
                    <Icon name="file" className="w-3 h-3" /> {pay.deliveredFileName || 'N/A'}
                  </p>
                </div>
              )}

              {pay.status === 'REJECTED' && pay.rejectReason && (
                <p className="text-danger text-xs mb-2 inline-flex items-center gap-1.5">
                  <Icon name="alert" className="w-3.5 h-3.5" /> {pay.rejectReason}
                </p>
              )}

              {(pay.status === 'PENDING' || pay.status === 'PROOF_UPLOADED') && (
                <div className="mt-2">
                  {rejectId === pay.id ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text" value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Rejection reason..." className="input-field flex-1 !py-2 text-xs"
                      />
                      <div className="flex gap-1">
                        <button onClick={() => handleReject(pay.id)} className="btn-danger px-3 py-2 rounded-lg text-xs">
                          <Icon name="check" className="w-3.5 h-3.5" /> Submit
                        </button>
                        <button onClick={() => { setRejectId(null); setRejectReason(''); }} className="btn-secondary px-3 py-2 rounded-lg text-xs">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(pay.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-success/15 text-success border border-success/25 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-success/25 transition-all"
                      >
                        <Icon name="check-circle" className="w-4 h-4" /> Approve & deliver
                      </button>
                      <button
                        onClick={() => setRejectId(pay.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-danger/15 text-danger border border-danger/25 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-danger/25 transition-all"
                      >
                        <Icon name="x-circle" className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {sorted.length === 0 && (
          <div className="empty-state panel-card">
            <span className="empty-icon"><Icon name="inbox" className="w-5 h-5" /></span>
            <p className="text-sm">No payments here</p>
          </div>
        )}
      </div>
    </div>
  );
};

// =================== TRIALS ===================
const TrialsTab: React.FC = () => {
  const { refreshData } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [selFile, setSelFile] = useState(0);
  const [trialKey, setTrialKey] = useState('');
  const files = getFiles();
  const trials = getTrialKeys();
  const logs = getTrialLogs();

  const handleAdd = () => {
    if (!selFile || !trialKey.trim()) return;
    addTrialKey(selFile, generateCode(8), trialKey.trim());
    setTrialKey(''); setShowAdd(false); refreshData();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title"><Icon name="gift" className="w-4 h-4 text-warning" /> Trial keys</h3>
        <button onClick={() => setShowAdd(s => !s)} className="btn-primary px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm">
          <Icon name={showAdd ? 'x' : 'plus'} className="w-4 h-4" />
          {showAdd ? 'Cancel' : 'Add'}
        </button>
      </div>
      {showAdd && (
        <div className="panel-card p-4 mb-4 animate-fade-in">
          <select value={selFile} onChange={(e) => setSelFile(parseInt(e.target.value))} className="input-field mb-3">
            <option value={0}>Select file...</option>
            {files.map(f => <option key={f.id} value={f.id}>{f.fileName}</option>)}
          </select>
          <input type="text" value={trialKey} onChange={(e) => setTrialKey(e.target.value)} placeholder="Trial key value..." className="input-field mb-3" />
          <button onClick={handleAdd} disabled={!selFile || !trialKey.trim()} className="btn-accent px-6 py-2 rounded-xl text-sm">
            <Icon name="plus" className="w-4 h-4" /> Create
          </button>
        </div>
      )}
      <h4 className="text-text-secondary text-xs uppercase tracking-wider mb-2">Active trials ({trials.length})</h4>
      <div className="space-y-2 mb-6">
        {trials.length === 0 && (
          <p className="text-text-muted text-xs px-2">No active trials</p>
        )}
        {trials.map(t => {
          const file = files.find(f => f.id === t.fileId);
          return (
            <div key={t.id} className="panel-card p-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <ProductAvatar name={file?.fileName || '?'} seed={t.fileId} size={32} />
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{file?.fileName || '?'}</p>
                  <p className="text-text-muted text-xs inline-flex items-center gap-1.5 flex-wrap">
                    <code className="text-accent font-mono">{t.redeemCode}</code>
                    <Icon name="arrow-right" className="w-3 h-3" />
                    <code className="text-success font-mono">{t.trialKey}</code>
                  </p>
                </div>
              </div>
              <button
                onClick={() => { deleteTrialKey(t.id); refreshData(); }}
                className="text-danger p-2 rounded-md hover:bg-danger/10 flex-shrink-0 transition-colors"
                aria-label="Delete trial"
              >
                <Icon name="trash" className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
      <h4 className="text-text-secondary text-xs uppercase tracking-wider mb-2">Redemption logs</h4>
      <div className="space-y-2">
        {logs.length === 0 ? (
          <p className="text-text-muted text-xs px-2">No redemptions yet</p>
        ) : logs.map(l => (
          <div key={l.id} className="panel-card p-3">
            <p className="text-xs inline-flex items-center gap-1.5"><Icon name="user" className="w-3.5 h-3.5 text-text-muted" /> {l.username} — <span className="text-text-secondary">{l.fileName}</span></p>
            <p className="text-text-muted text-[10px] mt-0.5">{formatDate(l.redeemedAt)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// =================== USERS ===================
const UsersTab: React.FC = () => {
  const { refreshData } = useApp();
  const users = getUsers();
  const [search, setSearch] = useState('');
  const filtered = users.filter(u => u.username.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4 gap-2">
        <h3 className="section-title"><Icon name="users" className="w-4 h-4" /> Users ({users.length})</h3>
        <div className="relative w-32 sm:w-56">
          <Icon name="search" className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..." className="input-field pl-8 !py-2 text-sm"
            aria-label="Search users"
          />
        </div>
      </div>
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="empty-state panel-card">
            <span className="empty-icon"><Icon name="users" className="w-5 h-5" /></span>
            <p className="text-sm">No users match</p>
          </div>
        )}
        {filtered.map(u => (
          <div key={u.id} className="panel-card p-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                u.banned ? 'bg-danger/15 text-danger ring-1 ring-danger/25' : 'bg-primary/15 text-primary-light ring-1 ring-primary/25'
              }`}>
                {getProductInitials(u.username)}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{u.username}</p>
                <p className="text-text-muted text-[10px] truncate inline-flex items-center gap-2 flex-wrap">
                  {u.mobile && <span className="inline-flex items-center gap-1"><Icon name="phone" className="w-3 h-3" /> {u.mobile}</span>}
                  {u.email && <span className="inline-flex items-center gap-1"><Icon name="mail" className="w-3 h-3" /> {u.email}</span>}
                </p>
              </div>
            </div>
            <button
              onClick={() => { updateUser(u.id, { banned: !u.banned }); refreshData(); }}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium flex-shrink-0 inline-flex items-center gap-1.5 transition-colors ${
                u.banned
                  ? 'bg-success/15 text-success hover:bg-success/25 border border-success/25'
                  : 'bg-danger/15 text-danger hover:bg-danger/25 border border-danger/25'
              }`}
            >
              <Icon name={u.banned ? 'check-circle' : 'ban'} className="w-3.5 h-3.5" />
              {u.banned ? 'Unban' : 'Ban'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// =================== FEEDBACK ===================
const FeedbackTab: React.FC = () => {
  const { refreshData } = useApp();
  const feedbacks = getFeedbacks();
  const sorted = [...feedbacks].sort((a, b) => {
    if (a.seen !== b.seen) return a.seen ? 1 : -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="animate-fade-in">
      <h3 className="section-title mb-4"><Icon name="message" className="w-4 h-4" /> Feedback ({feedbacks.length})</h3>
      <div className="space-y-2">
        {sorted.length === 0 && (
          <div className="empty-state panel-card">
            <span className="empty-icon"><Icon name="message" className="w-5 h-5" /></span>
            <p className="text-sm">No feedback yet</p>
          </div>
        )}
        {sorted.map(fb => (
          <div key={fb.id} className={`panel-card p-3 sm:p-4 ${!fb.seen ? 'border-l-4 border-l-primary' : ''}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-xs">{fb.username}</span>
                  {!fb.seen && <span className="status-badge status-info text-[9px]"><span className="dot" /> NEW</span>}
                </div>
                <p className="text-text-secondary text-sm leading-snug">{fb.content}</p>
                <p className="text-text-muted text-[10px] mt-1">{formatDate(fb.createdAt)}</p>
              </div>
              {!fb.seen && (
                <button
                  onClick={() => { markFeedbackSeen(fb.id); refreshData(); }}
                  className="bg-primary/15 text-primary-light hover:bg-primary/25 border border-primary/25 px-2.5 py-1.5 rounded-lg text-[11px] flex-shrink-0 inline-flex items-center gap-1 transition-colors"
                >
                  <Icon name="check" className="w-3.5 h-3.5" /> Mark seen
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// =================== SETTINGS ===================
const SettingsTab: React.FC = () => {
  const { refreshData } = useApp();
  const [upiId, setUpiId] = useState(getSetting('UPI_ID') || '');
  const creds = getAdminCreds();
  const [mobile, setMobile] = useState(creds.mobile);
  const [password, setPassword] = useState(creds.password);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSetting('UPI_ID', upiId);
    setAdminCreds(mobile, password);
    setSaved(true); setTimeout(() => setSaved(false), 2000); refreshData();
  };

  return (
    <div className="animate-fade-in">
      <h3 className="section-title mb-4"><Icon name="gear" className="w-4 h-4" /> Settings</h3>
      <div className="panel-card p-4 sm:p-6 space-y-5">
        <div>
          <label className="block text-xs text-text-secondary mb-1.5 inline-flex items-center gap-1.5">
            <Icon name="wallet" className="w-3.5 h-3.5" /> UPI ID
          </label>
          <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="you@paytm" className="input-field" />
        </div>

        <div className="border-t border-border pt-5">
          <h4 className="text-sm font-semibold mb-3 inline-flex items-center gap-2">
            <span className="icon-box icon-box-sm icon-box-warning"><Icon name="shield" className="w-3.5 h-3.5" /></span>
            Admin login credentials
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1.5 inline-flex items-center gap-1.5">
                <Icon name="phone" className="w-3.5 h-3.5" /> Mobile number
              </label>
              <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} maxLength={10} placeholder="Mobile number" className="input-field" />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1.5 inline-flex items-center gap-1.5">
                <Icon name="lock" className="w-3.5 h-3.5" /> Password
              </label>
              <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="input-field" />
            </div>
          </div>
        </div>

        <button onClick={handleSave} className="btn-primary px-6 py-2.5 rounded-xl text-sm w-full sm:w-auto">
          <Icon name="check" className="w-4 h-4" /> Save changes
        </button>
        {saved && (
          <p className="text-success text-xs inline-flex items-center gap-1.5">
            <Icon name="check-circle" className="w-3.5 h-3.5" /> Settings saved
          </p>
        )}
      </div>
      <div className="panel-card p-4 sm:p-6 mt-4 inline-flex items-center gap-3 w-full">
        <span className="icon-box icon-box-accent">
          <Icon name="sparkles" className="w-4 h-4" />
        </span>
        <div>
          <p className="text-text-secondary text-sm font-medium">KITY Digital Store v1.0</p>
          <p className="text-text-muted text-xs inline-flex items-center gap-1.5 flex-wrap justify-center mt-1">
            <span>Crafted by</span>
            <KityGamerBadge />
          </p>
        </div>
      </div>
    </div>
  );
};

// =================== BROADCAST ===================
const BroadcastTab: React.FC = () => {
  const { refreshData } = useApp();
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const users = getUsers();

  const handleBroadcast = () => {
    if (!message.trim()) return;
    const gid = 'bc_' + Date.now();
    users.forEach(u => addBroadcastLog(u.id, message, 'TEXT', gid));
    setMessage(''); setSent(true); setTimeout(() => setSent(false), 3000); refreshData();
  };

  const broadcastLogs = getBroadcastLogs();

  return (
    <div className="animate-fade-in">
      <h3 className="section-title mb-4"><Icon name="megaphone" className="w-4 h-4" /> Broadcast</h3>
      <div className="panel-card p-4 sm:p-6 mb-4">
        <p className="text-text-secondary text-xs mb-3 inline-flex items-center gap-1.5">
          <Icon name="users" className="w-3.5 h-3.5" /> Sending to <span className="text-white font-semibold">{users.length}</span> users
        </p>
        <textarea
          value={message} onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your broadcast message..." rows={4}
          className="input-field mb-3"
        />
        <button onClick={handleBroadcast} disabled={!message.trim()} className="btn-primary px-6 py-2.5 rounded-xl text-sm w-full sm:w-auto">
          <Icon name="rocket" className="w-4 h-4" /> Send broadcast
        </button>
        {sent && (
          <p className="text-success text-xs mt-2 inline-flex items-center gap-1.5">
            <Icon name="check-circle" className="w-3.5 h-3.5" /> Sent to all users
          </p>
        )}
      </div>
      <h4 className="text-text-secondary text-xs uppercase tracking-wider mb-2">Recent broadcasts</h4>
      <div className="space-y-2">
        {broadcastLogs.length === 0 ? (
          <p className="text-text-muted text-xs px-2">No broadcasts yet</p>
        ) : (
          [...new Set(broadcastLogs.map(l => l.groupId))].slice(0, 5).map(gid => {
            const logs = broadcastLogs.filter(l => l.groupId === gid);
            return (
              <div key={gid} className="panel-card p-3">
                <p className="text-xs leading-snug">{logs[0]?.message}</p>
                <p className="text-text-muted text-[10px] mt-1 inline-flex items-center gap-1.5">
                  <Icon name="users" className="w-3 h-3" /> {logs.length} users
                  <span className="text-border">•</span>
                  {formatDate(logs[0]?.sentAt || '')}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
