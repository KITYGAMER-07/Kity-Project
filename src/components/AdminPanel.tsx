import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import {
  getFiles, addFile, deleteFile, getPrices, addPrice, updatePrice, deletePrice,
  getKeyStock, addKeys, getPayments, updatePayment, getPaymentById, getAvailableKey, useKey,
  getUsers, getTrialKeys, addTrialKey, deleteTrialKey, getTrialLogs,
  getFeedbacks, markFeedbackSeen, getSetting, setSetting,
  getBroadcastLogs, addBroadcastLog, updateUser
} from '../store/db';
import { getPricesByFileId, getStockCount, formatDate, generateCode } from '../store/helpers';

const AdminPanel: React.FC = () => {
  const { navigate, dataVersion } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
    { id: 'files', label: '📁 Files', icon: '📁' },
    { id: 'prices', label: '💰 Prices', icon: '💰' },
    { id: 'keys', label: '🔑 Keys', icon: '🔑' },
    { id: 'payments', label: '💳 Payments', icon: '💳' },
    { id: 'trials', label: '🎁 Trials', icon: '🎁' },
    { id: 'users', label: '👥 Users', icon: '👥' },
    { id: 'feedback', label: '💬 Feedback', icon: '💬' },
    { id: 'settings', label: '⚙️ Settings', icon: '⚙️' },
    { id: 'broadcast', label: '📢 Broadcast', icon: '📢' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">⚙️ Admin Panel</h2>
        <button onClick={() => navigate('home')} className="text-text-secondary hover:text-white text-sm transition-colors">
          ← Back to Store
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-white'
                : 'bg-surface-lighter text-text-secondary hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div key={dataVersion}>
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

// === DASHBOARD ===
const DashboardTab: React.FC = () => {
  const files = getFiles();
  const users = getUsers();
  const payments = getPayments();
  const keys = getKeyStock();
  const feedbacks = getFeedbacks();
  
  const availableKeys = keys.filter(k => k.status === 'AVAILABLE').length;
  const approvedPayments = payments.filter(p => p.status === 'APPROVED').length;
  const pendingPayments = payments.filter(p => p.status === 'PENDING').length;
  const totalRevenue = payments.filter(p => p.status === 'APPROVED').reduce((sum, p) => {
    const price = getPrices().find(pr => pr.id === p.priceId);
    return sum + (price?.price || 0);
  }, 0);
  const bannedUsers = users.filter(u => u.banned).length;
  const unreadFeedback = feedbacks.filter(f => !f.seen).length;

  const stats = [
    { label: 'Total Users', value: users.length, icon: '👥', color: 'from-blue-500 to-cyan-500' },
    { label: 'Total Files', value: files.length, icon: '📁', color: 'from-purple-500 to-pink-500' },
    { label: 'Available Keys', value: availableKeys, icon: '🔑', color: 'from-green-500 to-teal-500' },
    { label: 'Revenue', value: `₹${totalRevenue}`, icon: '💰', color: 'from-yellow-500 to-orange-500' },
    { label: 'Approved', value: approvedPayments, icon: '✅', color: 'from-emerald-500 to-green-500' },
    { label: 'Pending', value: pendingPayments, icon: '⏳', color: 'from-amber-500 to-yellow-500' },
    { label: 'Banned', value: bannedUsers, icon: '🚫', color: 'from-red-500 to-pink-500' },
    { label: 'Unread FB', value: unreadFeedback, icon: '💬', color: 'from-indigo-500 to-purple-500' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(stat => (
          <div key={stat.label} className="glass-card rounded-xl p-4">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-lg mb-2`}>
              {stat.icon}
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-text-muted text-xs">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Pending Payments */}
      {pendingPayments > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-3">⚠️ Pending Payments ({pendingPayments})</h3>
          <div className="glass-card rounded-xl p-4">
            <p className="text-warning text-sm">You have {pendingPayments} payment(s) waiting for approval. Go to the Payments tab to review them.</p>
          </div>
        </div>
      )}
    </div>
  );
};

// === FILES TAB ===
const FilesTab: React.FC = () => {
  const { refreshData } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const files = getFiles();

  const handleAdd = () => {
    if (!fileName.trim()) return;
    addFile(fileName.trim(), '', 'application/zip', fileSize.trim() || 'N/A');
    setFileName('');
    setFileSize('');
    setShowAdd(false);
    refreshData();
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this file and all related prices/keys?')) {
      deleteFile(id);
      refreshData();
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">📁 Files ({files.length})</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary px-4 py-2 rounded-xl text-sm">
          {showAdd ? '✕ Cancel' : '➕ Add File'}
        </button>
      </div>

      {showAdd && (
        <div className="glass-card rounded-xl p-4 mb-4 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="File name..."
              className="bg-surface-lighter border border-border rounded-xl px-4 py-2 text-white placeholder-text-muted focus:outline-none focus:border-primary"
            />
            <input
              type="text"
              value={fileSize}
              onChange={(e) => setFileSize(e.target.value)}
              placeholder="File size (e.g., 45 MB)"
              className="bg-surface-lighter border border-border rounded-xl px-4 py-2 text-white placeholder-text-muted focus:outline-none focus:border-primary"
            />
          </div>
          <button onClick={handleAdd} disabled={!fileName.trim()} className="btn-accent px-6 py-2 rounded-xl text-sm disabled:opacity-50">
            ✅ Add File
          </button>
        </div>
      )}

      <div className="space-y-2">
        {files.map(f => (
          <div key={f.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{f.fileName}</p>
              <p className="text-text-muted text-xs">ID: {f.id} | {f.fileSize}</p>
            </div>
            <button onClick={() => handleDelete(f.id)} className="text-danger hover:bg-danger/10 px-3 py-1 rounded-lg text-sm transition-all">
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// === PRICES TAB ===
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
    setDays('');
    setPrice('');
    setShowAdd(false);
    refreshData();
  };

  const handleEdit = (id: number) => {
    if (!editDays || !editPrice) return;
    updatePrice(id, parseInt(editDays), parseFloat(editPrice));
    setEditId(null);
    refreshData();
  };

  const handleDelete = (id: number) => {
    deletePrice(id);
    refreshData();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">💰 Price Plans</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary px-4 py-2 rounded-xl text-sm">
          {showAdd ? '✕ Cancel' : '➕ Add Price'}
        </button>
      </div>

      {showAdd && (
        <div className="glass-card rounded-xl p-4 mb-4 animate-fade-in">
          <select
            value={selFile}
            onChange={(e) => setSelFile(parseInt(e.target.value))}
            className="w-full bg-surface-lighter border border-border rounded-xl px-4 py-2 text-white mb-3 focus:outline-none focus:border-primary"
          >
            <option value={0}>Select file...</option>
            {files.map(f => <option key={f.id} value={f.id}>{f.fileName}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input type="number" value={days} onChange={(e) => setDays(e.target.value)} placeholder="Days (e.g., 30)" className="bg-surface-lighter border border-border rounded-xl px-4 py-2 text-white placeholder-text-muted focus:outline-none focus:border-primary" />
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price (₹)" className="bg-surface-lighter border border-border rounded-xl px-4 py-2 text-white placeholder-text-muted focus:outline-none focus:border-primary" />
          </div>
          <button onClick={handleAdd} disabled={!selFile || !days || !price} className="btn-accent px-6 py-2 rounded-xl text-sm disabled:opacity-50">✅ Add Price</button>
        </div>
      )}

      <div className="space-y-2">
        {allPrices.map(p => {
          const file = files.find(f => f.id === p.fileId);
          return (
            <div key={p.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
              {editId === p.id ? (
                <div className="flex-1 flex gap-2 items-center">
                  <input type="number" value={editDays} onChange={(e) => setEditDays(e.target.value)} className="w-20 bg-surface-lighter border border-border rounded-lg px-2 py-1 text-sm text-white" />
                  <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="w-20 bg-surface-lighter border border-border rounded-lg px-2 py-1 text-sm text-white" />
                  <button onClick={() => handleEdit(p.id)} className="text-success text-sm">✅</button>
                  <button onClick={() => setEditId(null)} className="text-danger text-sm">❌</button>
                </div>
              ) : (
                <>
                  <div>
                    <p className="font-medium">{file?.fileName || 'Unknown'}</p>
                    <p className="text-text-muted text-xs">ID: {p.id} | {p.durationDays} Days — ₹{p.price}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditId(p.id); setEditDays(String(p.durationDays)); setEditPrice(String(p.price)); }}
                      className="text-primary-light hover:bg-primary/10 px-2 py-1 rounded-lg text-sm"
                    >✏️</button>
                    <button onClick={() => handleDelete(p.id)} className="text-danger hover:bg-danger/10 px-2 py-1 rounded-lg text-sm">🗑️</button>
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

// === KEYS TAB ===
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
    setDays('');
    setKeysInput('');
    setShowAdd(false);
    refreshData();
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
        <h3 className="font-semibold">🔑 Key Stock</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary px-4 py-2 rounded-xl text-sm">
          {showAdd ? '✕ Cancel' : '➕ Add Keys'}
        </button>
      </div>

      {showAdd && (
        <div className="glass-card rounded-xl p-4 mb-4 animate-fade-in">
          <select
            value={selFile}
            onChange={(e) => setSelFile(parseInt(e.target.value))}
            className="w-full bg-surface-lighter border border-border rounded-xl px-4 py-2 text-white mb-3 focus:outline-none focus:border-primary"
          >
            <option value={0}>Select file...</option>
            {files.map(f => <option key={f.id} value={f.id}>{f.fileName}</option>)}
          </select>
          <input
            type="number"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            placeholder="Duration (days)"
            className="w-full bg-surface-lighter border border-border rounded-xl px-4 py-2 text-white placeholder-text-muted mb-3 focus:outline-none focus:border-primary"
          />
          <textarea
            value={keysInput}
            onChange={(e) => setKeysInput(e.target.value)}
            placeholder="Enter keys (space or comma separated)&#10;e.g., KEY-001 KEY-002 KEY-003"
            rows={3}
            className="w-full bg-surface-lighter border border-border rounded-xl px-4 py-2 text-white placeholder-text-muted mb-3 focus:outline-none focus:border-primary resize-none"
          />
          <button onClick={handleAdd} disabled={!selFile || !days || !keysInput.trim()} className="btn-accent px-6 py-2 rounded-xl text-sm disabled:opacity-50">✅ Add Keys</button>
        </div>
      )}

      <div className="space-y-4">
        {stockSummary.map(({ file, plans }) => (
          <div key={file.id} className="glass-card rounded-xl p-4">
            <h4 className="font-medium mb-2">{file.fileName}</h4>
            {plans.length === 0 ? (
              <p className="text-text-muted text-sm">No plans</p>
            ) : (
              <div className="space-y-2">
                {plans.map(plan => (
                  <div key={plan.days} className="flex items-center justify-between bg-surface-lighter rounded-lg p-2">
                    <span className="text-sm text-text-secondary">{plan.days} Days</span>
                    <div className="flex items-center gap-3">
                      <span className="text-success text-sm">✅ {plan.available}</span>
                      <span className="text-text-muted text-sm">❌ {plan.used}</span>
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

// === PAYMENTS TAB ===
const PaymentsTab: React.FC = () => {
  const { refreshData } = useApp();
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const payments = getPayments();
  const files = getFiles();
  const prices = getPrices();
  const users = getUsers();
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const filtered = filter === 'ALL' ? payments : payments.filter(p => p.status === filter);
  const sorted = [...filtered].sort((a, b) => b.id - a.id);

  const handleApprove = (payId: number) => {
    const pay = getPaymentById(payId);
    if (!pay) return;
    const price = prices.find(p => p.id === pay.priceId);
    if (!price) return;
    const key = getAvailableKey(pay.fileId, price.durationDays);
    if (!key) {
      alert('⚠️ No available keys for this plan!');
      return;
    }
    useKey(key.id);
    updatePayment(payId, { status: 'APPROVED' });
    refreshData();
  };

  const handleReject = (payId: number) => {
    if (!rejectReason.trim()) return;
    updatePayment(payId, { status: 'REJECTED', rejectReason: rejectReason.trim() });
    setRejectId(null);
    setRejectReason('');
    refreshData();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">💳 Payments</h3>
        <div className="flex gap-1">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-medium ${
                filter === f ? 'bg-primary text-white' : 'bg-surface-lighter text-text-secondary'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {sorted.map(pay => {
          const file = files.find(f => f.id === pay.fileId);
          const price = prices.find(p => p.id === pay.priceId);
          const user = users.find(u => u.id === pay.userId);

          return (
            <div key={pay.id} className="glass-card rounded-xl p-4 animate-slide-in">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium">Payment #{pay.id}</p>
                  <p className="text-text-muted text-xs">
                    {user?.username || 'Unknown'} • {formatDate(pay.createdAt)}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  pay.status === 'APPROVED' ? 'bg-success/20 text-success' :
                  pay.status === 'PENDING' ? 'bg-warning/20 text-warning' :
                  'bg-danger/20 text-danger'
                }`}>
                  {pay.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                <div className="bg-surface-lighter rounded-lg p-2">
                  <span className="text-text-muted text-xs">File</span>
                  <p>{file?.fileName || 'Unknown'}</p>
                </div>
                <div className="bg-surface-lighter rounded-lg p-2">
                  <span className="text-text-muted text-xs">Amount</span>
                  <p className="text-accent font-bold">₹{price?.price || 0} ({price?.durationDays || 0}D)</p>
                </div>
              </div>

              {pay.proofImage && (
                <div className="mb-2">
                  <img src={pay.proofImage} alt="Proof" className="max-h-32 rounded-lg" />
                </div>
              )}

              {pay.status === 'REJECTED' && pay.rejectReason && (
                <p className="text-danger text-xs mb-2">Reason: {pay.rejectReason}</p>
              )}

              {pay.status === 'PENDING' && (
                <div className="flex gap-2 mt-2">
                  {rejectId === pay.id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Rejection reason..."
                        className="flex-1 bg-surface-lighter border border-border rounded-lg px-3 py-1 text-sm text-white"
                      />
                      <button onClick={() => handleReject(pay.id)} className="btn-danger px-3 py-1 rounded-lg text-xs">Submit</button>
                      <button onClick={() => { setRejectId(null); setRejectReason(''); }} className="bg-surface-lighter px-3 py-1 rounded-lg text-xs text-text-secondary">Cancel</button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => handleApprove(pay.id)} className="flex-1 bg-success/20 text-success py-2 rounded-lg text-sm font-medium hover:bg-success/30 transition-all">
                        ✅ Approve
                      </button>
                      <button onClick={() => setRejectId(pay.id)} className="flex-1 bg-danger/20 text-danger py-2 rounded-lg text-sm font-medium hover:bg-danger/30 transition-all">
                        ❌ Reject
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {sorted.length === 0 && (
          <div className="text-center py-8 text-text-secondary">
            <div className="text-3xl mb-2">📭</div>
            <p>No payments found</p>
          </div>
        )}
      </div>
    </div>
  );
};

// === TRIALS TAB ===
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
    const code = generateCode(8);
    addTrialKey(selFile, code, trialKey.trim());
    setTrialKey('');
    setShowAdd(false);
    refreshData();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">🎁 Trial System</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary px-4 py-2 rounded-xl text-sm">
          {showAdd ? '✕ Cancel' : '➕ Add Trial'}
        </button>
      </div>

      {showAdd && (
        <div className="glass-card rounded-xl p-4 mb-4 animate-fade-in">
          <select value={selFile} onChange={(e) => setSelFile(parseInt(e.target.value))} className="w-full bg-surface-lighter border border-border rounded-xl px-4 py-2 text-white mb-3 focus:outline-none focus:border-primary">
            <option value={0}>Select file...</option>
            {files.map(f => <option key={f.id} value={f.id}>{f.fileName}</option>)}
          </select>
          <input type="text" value={trialKey} onChange={(e) => setTrialKey(e.target.value)} placeholder="Trial key value..." className="w-full bg-surface-lighter border border-border rounded-xl px-4 py-2 text-white placeholder-text-muted mb-3 focus:outline-none focus:border-primary" />
          <button onClick={handleAdd} disabled={!selFile || !trialKey.trim()} className="btn-accent px-6 py-2 rounded-xl text-sm disabled:opacity-50">✅ Create Trial</button>
        </div>
      )}

      <h4 className="font-medium text-text-secondary text-sm mb-2">Active Trials</h4>
      <div className="space-y-2 mb-6">
        {trials.map(t => {
          const file = files.find(f => f.id === t.fileId);
          return (
            <div key={t.id} className="glass-card rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{file?.fileName || 'Unknown'}</p>
                <p className="text-text-muted text-xs">Code: <code className="text-accent">{t.redeemCode}</code> → <code className="text-success">{t.trialKey}</code></p>
              </div>
              <button onClick={() => { deleteTrialKey(t.id); refreshData(); }} className="text-danger text-sm">🗑️</button>
            </div>
          );
        })}
      </div>

      <h4 className="font-medium text-text-secondary text-sm mb-2">Redemption Logs</h4>
      <div className="space-y-2">
        {logs.length === 0 ? (
          <p className="text-text-muted text-sm">No logs yet</p>
        ) : (
          logs.map(l => (
            <div key={l.id} className="glass-card rounded-xl p-3">
              <p className="text-sm">{l.username} — {l.fileName}</p>
              <p className="text-text-muted text-xs">{formatDate(l.redeemedAt)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// === USERS TAB ===
const UsersTab: React.FC = () => {
  const { refreshData } = useApp();
  const users = getUsers();
  const [search, setSearch] = useState('');

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) || u.id.includes(search)
  );

  const toggleBan = (id: string, banned: boolean) => {
    updateUser(id, { banned: !banned });
    refreshData();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">👥 Users ({users.length})</h3>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search..."
          className="bg-surface-lighter border border-border rounded-xl px-4 py-2 text-sm text-white placeholder-text-muted focus:outline-none focus:border-primary w-48"
        />
      </div>

      <div className="space-y-2">
        {filtered.map(u => (
          <div key={u.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                u.banned ? 'bg-danger/20 text-danger' : 'bg-primary/20 text-primary'
              }`}>
                {u.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{u.username}</p>
                <p className="text-text-muted text-xs">ID: {u.id.slice(0, 16)}... | {formatDate(u.joinDate)}</p>
              </div>
            </div>
            <button
              onClick={() => toggleBan(u.id, u.banned)}
              className={`px-3 py-1 rounded-lg text-xs font-medium ${
                u.banned ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'
              }`}
            >
              {u.banned ? '✅ Unban' : '🚫 Ban'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// === FEEDBACK TAB ===
const FeedbackTab: React.FC = () => {
  const { refreshData } = useApp();
  const feedbacks = getFeedbacks();
  const sorted = [...feedbacks].sort((a, b) => {
    if (a.seen !== b.seen) return a.seen ? 1 : -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="animate-fade-in">
      <h3 className="font-semibold mb-4">💬 Feedback ({feedbacks.length})</h3>
      <div className="space-y-2">
        {sorted.map(fb => (
          <div key={fb.id} className={`glass-card rounded-xl p-4 ${!fb.seen ? 'border-l-4 border-primary' : ''}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{fb.username}</span>
                  {!fb.seen && <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">NEW</span>}
                </div>
                <p className="text-text-secondary text-sm">{fb.content}</p>
                <p className="text-text-muted text-xs mt-1">{formatDate(fb.createdAt)}</p>
              </div>
              {!fb.seen && (
                <button
                  onClick={() => { markFeedbackSeen(fb.id); refreshData(); }}
                  className="bg-primary/20 text-primary px-3 py-1 rounded-lg text-xs"
                >
                  ✅ Seen
                </button>
              )}
            </div>
          </div>
        ))}
        {feedbacks.length === 0 && (
          <div className="text-center py-8 text-text-secondary">
            <div className="text-3xl mb-2">📭</div>
            <p>No feedback yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

// === SETTINGS TAB ===
const SettingsTab: React.FC = () => {
  const { refreshData } = useApp();
  const [upiId, setUpiId] = useState(getSetting('UPI_ID') || '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSetting('UPI_ID', upiId);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    refreshData();
  };

  return (
    <div className="animate-fade-in">
      <h3 className="font-semibold mb-4">⚙️ Settings</h3>
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm text-text-secondary mb-1">UPI ID (for payments)</label>
          <input
            type="text"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="yourname@paytm"
            className="w-full bg-surface-lighter border border-border rounded-xl px-4 py-3 text-white placeholder-text-muted focus:outline-none focus:border-primary"
          />
        </div>
        <button onClick={handleSave} className="btn-primary px-6 py-2 rounded-xl font-semibold">
          💾 Save Settings
        </button>
        {saved && <p className="text-success text-sm">✅ Settings saved!</p>}
      </div>

      <div className="glass-card rounded-xl p-6 mt-4">
        <h4 className="font-medium mb-2">ℹ️ About</h4>
        <p className="text-text-secondary text-sm">KITY Digital Store v1.0</p>
        <p className="text-text-muted text-xs">Made by @KITYGAMER</p>

      </div>
    </div>
  );
};

// === BROADCAST TAB ===
const BroadcastTab: React.FC = () => {
  const { refreshData } = useApp();
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const users = getUsers();

  const handleBroadcast = () => {
    if (!message.trim()) return;
    const groupId = 'bc_' + Date.now();
    users.forEach(u => {
      addBroadcastLog(u.id, message, 'TEXT', groupId);
    });
    setMessage('');
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    refreshData();
  };

  const broadcastLogs = getBroadcastLogs();

  return (
    <div className="animate-fade-in">
      <h3 className="font-semibold mb-4">📢 Broadcast</h3>
      <div className="glass-card rounded-xl p-6 mb-4">
        <p className="text-text-secondary text-sm mb-3">Send a message to all {users.length} users</p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type broadcast message..."
          rows={4}
          className="w-full bg-surface-lighter border border-border rounded-xl px-4 py-3 text-white placeholder-text-muted focus:outline-none focus:border-primary resize-none mb-3"
        />
        <button onClick={handleBroadcast} disabled={!message.trim()} className="btn-primary px-6 py-2 rounded-xl font-semibold disabled:opacity-50">
          📤 Send Broadcast
        </button>
        {sent && <p className="text-success text-sm mt-2">✅ Broadcast sent to {users.length} users!</p>}
      </div>

      <h4 className="font-medium text-text-secondary text-sm mb-2">Recent Broadcasts</h4>
      <div className="space-y-2">
        {[...new Set(broadcastLogs.map(l => l.groupId))].slice(0, 5).map(gid => {
          const logs = broadcastLogs.filter(l => l.groupId === gid);
          return (
            <div key={gid} className="glass-card rounded-xl p-3">
              <p className="text-sm">{logs[0]?.message}</p>
              <p className="text-text-muted text-xs">Sent to {logs.length} users • {formatDate(logs[0]?.sentAt || '')}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminPanel;
