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

const AdminPanel: React.FC = () => {
  const { navigate } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: '📊' },
    { id: 'files', label: '📁' },
    { id: 'prices', label: '💰' },
    { id: 'keys', label: '🔑' },
    { id: 'payments', label: '💳' },
    { id: 'trials', label: '🎁' },
    { id: 'users', label: '👥' },
    { id: 'feedback', label: '💬' },
    { id: 'settings', label: '⚙️' },
    { id: 'broadcast', label: '📢' },
  ];

  return (
    <div className="px-3 sm:px-4 py-4 sm:py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-2xl font-bold">⚙️ Admin Panel</h2>
        <button onClick={() => navigate('home')} className="text-text-secondary hover:text-white text-xs sm:text-sm">
          ← Store
        </button>
      </div>

      <div className="flex gap-1.5 sm:gap-2 mb-5 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`min-w-[44px] px-2.5 sm:px-4 py-2 rounded-xl text-sm sm:text-base transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-white scale-105'
                : 'bg-surface-lighter text-text-secondary hover:text-white'
            }`}
          >
            {tab.label}
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

const DashboardTab: React.FC = () => {
  const files = getFiles();
  const users = getUsers();
  const payments = getPayments();
  const keys = getKeyStock();
  const feedbacks = getFeedbacks();
  const availableKeys = keys.filter(k => k.status === 'AVAILABLE').length;
  const approvedPayments = payments.filter(p => p.status === 'APPROVED').length;
  const pendingPayments = payments.filter(p => p.status === 'PENDING' || p.status === 'PROOF_UPLOADED').length;
  const totalRevenue = payments.filter(p => p.status === 'APPROVED').reduce((sum, p) => {
    const price = getPrices().find(pr => pr.id === p.priceId);
    return sum + (price?.price || 0);
  }, 0);
  const bannedUsers = users.filter(u => u.banned).length;
  const unreadFeedback = feedbacks.filter(f => !f.seen).length;
  const stats = [
    { label: 'Users', value: users.length, icon: '👥', color: 'from-blue-500 to-cyan-500' },
    { label: 'Files', value: files.length, icon: '📁', color: 'from-purple-500 to-pink-500' },
    { label: 'Keys', value: availableKeys, icon: '🔑', color: 'from-green-500 to-teal-500' },
    { label: 'Revenue', value: `₹${totalRevenue}`, icon: '💰', color: 'from-yellow-500 to-orange-500' },
    { label: 'Approved', value: approvedPayments, icon: '✅', color: 'from-emerald-500 to-green-500' },
    { label: 'Pending', value: pendingPayments, icon: '⏳', color: 'from-amber-500 to-yellow-500' },
    { label: 'Banned', value: bannedUsers, icon: '🚫', color: 'from-red-500 to-pink-500' },
    { label: 'Feedbacks', value: unreadFeedback, icon: '💬', color: 'from-indigo-500 to-purple-500' },
  ];
  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {stats.map(stat => (
          <div key={stat.label} className="glass-card rounded-xl p-3 sm:p-4">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-base sm:text-lg mb-1 sm:mb-2`}>{stat.icon}</div>
            <p className="text-lg sm:text-2xl font-bold">{stat.value}</p>
            <p className="text-text-muted text-[10px] sm:text-xs">{stat.label}</p>
          </div>
        ))}
      </div>
      {pendingPayments > 0 && (
        <div className="mt-4 glass-card rounded-xl p-4 border-l-4 border-warning">
          <p className="text-warning text-sm font-medium">⚠️ {pendingPayments} payment(s) pending approval!</p>
        </div>
      )}
    </div>
  );
};

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
    } else {
      setPreviewUrl('');
    }
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
    } else {
      setPreviewUrl('');
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      addFile(fileName.trim() || selectedFile.name, base64, selectedFile.type, `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB`);
      setFileName('');
      setSelectedFile(null);
      setPreviewUrl('');
      setShowAdd(false);
      refreshData();
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this file and all related prices/keys?')) {
      deleteFile(id);
      refreshData();
    }
  };

  const formatFileSize = (size: string) => size;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm sm:text-base">📁 Files ({files.length})</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm">
          {showAdd ? '✕ Cancel' : '➕ Upload File'}
        </button>
      </div>

      {showAdd && (
        <div className="glass-card rounded-xl p-4 mb-4 animate-fade-in">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all mb-3"
          >
            {previewUrl ? (
              <div>
                <img src={previewUrl} alt="Preview" className="max-h-32 mx-auto rounded-lg mb-2" />
                <p className="text-success text-sm">✅ {selectedFile?.name}</p>
              </div>
            ) : selectedFile ? (
              <div>
                <div className="text-4xl mb-2">📄</div>
                <p className="text-success text-sm">✅ {selectedFile.name}</p>
                <p className="text-text-muted text-xs">{formatFileSize(`${(selectedFile.size / 1024 / 1024).toFixed(1)} MB`)}</p>
              </div>
            ) : (
              <div>
                <div className="text-4xl mb-2">📤</div>
                <p className="text-text-secondary text-sm">Drag & drop or click to upload</p>
                <p className="text-text-muted text-xs mt-1">Any file type supported</p>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" />
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="File display name..."
            className="w-full bg-surface-lighter border border-border rounded-xl px-4 py-2 text-white placeholder-text-muted focus:outline-none focus:border-primary mb-3"
          />
          <button onClick={handleUpload} disabled={!selectedFile} className="btn-accent px-6 py-2 rounded-xl text-sm disabled:opacity-50 w-full sm:w-auto">
            ✅ Upload File
          </button>
        </div>
      )}

      <div className="space-y-2">
        {files.map(f => (
          <div key={f.id} className="glass-card rounded-xl p-3 sm:p-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {f.fileData ? (
                f.fileType.startsWith('image/') ? (
                  <img src={f.fileData} alt={f.fileName} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-lg flex-shrink-0">📄</div>
                )
              ) : (
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-lg flex-shrink-0">📦</div>
              )}
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{f.fileName}</p>
                <p className="text-text-muted text-xs">ID: {f.id} • {f.fileSize}</p>
              </div>
            </div>
            <button onClick={() => handleDelete(f.id)} className="text-danger hover:bg-danger/10 px-2 py-1 rounded-lg text-sm flex-shrink-0">🗑️</button>
          </div>
        ))}
      </div>
    </div>
  );
};

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
  const handleDelete = (id: number) => { deletePrice(id); refreshData(); };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm sm:text-base">💰 Prices</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm">
          {showAdd ? '✕ Cancel' : '➕ Add'}
        </button>
      </div>
      {showAdd && (
        <div className="glass-card rounded-xl p-4 mb-4 animate-fade-in">
          <select value={selFile} onChange={(e) => setSelFile(parseInt(e.target.value))} className="w-full bg-surface-lighter border border-border rounded-xl px-4 py-2 text-white mb-3 text-sm">
            <option value={0}>Select file...</option>
            {files.map(f => <option key={f.id} value={f.id}>{f.fileName}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input type="number" value={days} onChange={(e) => setDays(e.target.value)} placeholder="Days" className="bg-surface-lighter border border-border rounded-xl px-4 py-2 text-white placeholder-text-muted text-sm" />
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="₹ Price" className="bg-surface-lighter border border-border rounded-xl px-4 py-2 text-white placeholder-text-muted text-sm" />
          </div>
          <button onClick={handleAdd} disabled={!selFile || !days || !price} className="btn-accent px-6 py-2 rounded-xl text-sm disabled:opacity-50">✅ Add</button>
        </div>
      )}
      <div className="space-y-2">
        {allPrices.map(p => {
          const file = files.find(f => f.id === p.fileId);
          return (
            <div key={p.id} className="glass-card rounded-xl p-3 flex items-center justify-between">
              {editId === p.id ? (
                <div className="flex-1 flex flex-wrap gap-2 items-center">
                  <input type="number" value={editDays} onChange={(e) => setEditDays(e.target.value)} className="w-16 bg-surface-lighter border border-border rounded-lg px-2 py-1 text-sm text-white" />
                  <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="w-16 bg-surface-lighter border border-border rounded-lg px-2 py-1 text-sm text-white" />
                  <button onClick={() => handleEdit(p.id)} className="text-success">✅</button>
                  <button onClick={() => setEditId(null)} className="text-danger">❌</button>
                </div>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{file?.fileName || '?'}</p>
                    <p className="text-text-muted text-xs">{p.durationDays}D — ₹{p.price}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => { setEditId(p.id); setEditDays(String(p.durationDays)); setEditPrice(String(p.price)); }} className="text-primary-light px-2 py-1 text-sm">✏️</button>
                    <button onClick={() => handleDelete(p.id)} className="text-danger px-2 py-1 text-sm">🗑️</button>
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
        <h3 className="font-semibold text-sm sm:text-base">🔑 Keys</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm">
          {showAdd ? '✕ Cancel' : '➕ Add'}
        </button>
      </div>
      {showAdd && (
        <div className="glass-card rounded-xl p-4 mb-4 animate-fade-in">
          <select value={selFile} onChange={(e) => setSelFile(parseInt(e.target.value))} className="w-full bg-surface-lighter border border-border rounded-xl px-4 py-2 text-white mb-3 text-sm">
            <option value={0}>Select file...</option>
            {files.map(f => <option key={f.id} value={f.id}>{f.fileName}</option>)}
          </select>
          <input type="number" value={days} onChange={(e) => setDays(e.target.value)} placeholder="Duration (days)" className="w-full bg-surface-lighter border border-border rounded-xl px-4 py-2 text-white placeholder-text-muted mb-3 text-sm" />
          <textarea value={keysInput} onChange={(e) => setKeysInput(e.target.value)} placeholder="Keys (space/comma separated)" rows={3} className="w-full bg-surface-lighter border border-border rounded-xl px-4 py-2 text-white placeholder-text-muted mb-3 text-sm resize-none" />
          <button onClick={handleAdd} disabled={!selFile || !days || !keysInput.trim()} className="btn-accent px-6 py-2 rounded-xl text-sm disabled:opacity-50 w-full sm:w-auto">✅ Add Keys</button>
        </div>
      )}
      <div className="space-y-3">
        {stockSummary.map(({ file, plans }) => (
          <div key={file.id} className="glass-card rounded-xl p-3">
            <h4 className="font-medium text-sm mb-2">{file.fileName}</h4>
            {plans.length === 0 ? <p className="text-text-muted text-xs">No plans</p> : (
              <div className="space-y-1">
                {plans.map(plan => (
                  <div key={plan.days} className="flex items-center justify-between bg-surface-lighter rounded-lg p-2">
                    <span className="text-xs text-text-secondary">{plan.days}D</span>
                    <div className="flex gap-3 text-xs">
                      <span className="text-success">✅ {plan.available}</span>
                      <span className="text-text-muted">Used: {plan.used}</span>
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

const PaymentsTab: React.FC = () => {
  const { refreshData } = useApp();
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'PROOF_UPLOADED' | 'APPROVED' | 'REJECTED'>('ALL');
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
    if (!key) { alert('⚠️ No keys available!'); return; }
    const file = getFileById(pay.fileId);
    useKey(key.id);
    updatePayment(pid, { 
      status: 'APPROVED', 
      deliveredFile: file?.fileData || '',
      deliveredFileName: file?.fileName || '',
      deliveredKey: key.keyCode
    });
    // Send notification to user
    addUserNotification(
      pay.userId,
      'PAYMENT_APPROVED',
      '✅ Payment Approved!',
      `Your payment for ${file?.fileName || 'file'} (₹${price?.price || 0}) has been approved! Key & file delivered.`,
      pid,
      key.keyCode,
      file?.fileName
    );
    // Mark admin notification as read
    markAllNotifsRead('');
    refreshData();
  };

  const handleReject = (pid: number) => {
    if (!rejectReason.trim()) return;
    const pay = getPaymentById(pid);
    updatePayment(pid, { status: 'REJECTED', rejectReason: rejectReason.trim() });
    if (pay) {
      const file = files.find(f => f.id === pay.fileId);
      addUserNotification(pay.userId, 'PAYMENT_REJECTED', '❌ Payment Rejected', `Your payment for ${file?.fileName || 'file'} was rejected. Reason: ${rejectReason.trim()}`, pid);
    }
    setRejectId(null); setRejectReason(''); refreshData();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4 gap-2">
        <h3 className="font-semibold text-sm sm:text-base">
          💳 Payments {proofCount > 0 && <span className="bg-danger text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1 animate-pulse">{proofCount} NEW</span>}
        </h3>
        <div className="flex gap-1 overflow-x-auto">
          {(['ALL', 'PROOF_UPLOADED', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-1.5 sm:px-2 py-1 rounded-lg text-[9px] sm:text-[10px] font-medium whitespace-nowrap ${filter === f ? 'bg-primary text-white' : 'bg-surface-lighter text-text-secondary'}`}>
              {f === 'PROOF_UPLOADED' ? '📸 Proof' : f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {sorted.map(pay => {
          const file = files.find(f => f.id === pay.fileId);
          const price = prices.find(p => p.id === pay.priceId);
          const user = users.find(u => u.id === pay.userId);
          const hasProof = pay.status === 'PROOF_UPLOADED' || (pay.proofImage && pay.status !== 'PENDING');
          return (
            <div key={pay.id} className={`glass-card rounded-xl p-3 sm:p-4 animate-slide-in ${pay.status === 'PROOF_UPLOADED' ? 'border-l-4 border-warning' : ''}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">#{pay.id} — {file?.fileName || '?'}</p>
                  <p className="text-text-muted text-[10px] sm:text-xs">{user?.username || '?'} • {formatDate(pay.createdAt)}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium flex-shrink-0 ml-2 ${
                  pay.status === 'APPROVED' ? 'bg-success/20 text-success' :
                  pay.status === 'PROOF_UPLOADED' ? 'bg-warning/20 text-warning animate-pulse' :
                  pay.status === 'PENDING' ? 'bg-surface-lighter text-text-muted' : 'bg-danger/20 text-danger'
                }`}>
                  {pay.status === 'PROOF_UPLOADED' ? '📸 PROOF' : pay.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                <div className="bg-surface-lighter rounded-lg p-2">
                  <span className="text-text-muted">Amount</span>
                  <p className="text-accent font-bold">₹{price?.price || 0} ({price?.durationDays || 0}D)</p>
                </div>
                <div className="bg-surface-lighter rounded-lg p-2">
                  <span className="text-text-muted">Proof</span>
                  <p>{hasProof ? '✅ Uploaded' : '❌ None'}</p>
                </div>
              </div>

              {pay.proofImage && (
                <div className="mb-2">
                  <img src={pay.proofImage} alt="Proof" className="max-h-28 sm:max-h-36 rounded-lg w-auto" />
                </div>
              )}

              {pay.status === 'APPROVED' && pay.deliveredKey && (
                <div className="bg-success/10 border border-success/20 rounded-lg p-2 mb-2">
                  <p className="text-success text-xs font-medium">🔑 Key: <code className="bg-success/20 px-1.5 py-0.5 rounded">{pay.deliveredKey}</code></p>
                  <p className="text-success/70 text-[10px]">File: {pay.deliveredFileName || 'N/A'}</p>
                </div>
              )}

              {pay.status === 'REJECTED' && pay.rejectReason && (
                <p className="text-danger text-xs mb-2">Reason: {pay.rejectReason}</p>
              )}

              {(pay.status === 'PENDING' || pay.status === 'PROOF_UPLOADED') && (
                <div className="mt-2">
                  {rejectId === pay.id ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input type="text" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason..." className="flex-1 bg-surface-lighter border border-border rounded-lg px-3 py-1.5 text-xs text-white" />
                      <div className="flex gap-1">
                        <button onClick={() => handleReject(pay.id)} className="btn-danger px-3 py-1.5 rounded-lg text-xs">Submit</button>
                        <button onClick={() => { setRejectId(null); setRejectReason(''); }} className="bg-surface-lighter px-3 py-1.5 rounded-lg text-xs text-text-secondary">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(pay.id)} className="flex-1 bg-success/20 text-success py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-success/30 transition-all">
                        ✅ Approve & Deliver
                      </button>
                      <button onClick={() => setRejectId(pay.id)} className="flex-1 bg-danger/20 text-danger py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-danger/30 transition-all">
                        ❌ Reject
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {sorted.length === 0 && (
          <div className="text-center py-8 text-text-secondary"><div className="text-3xl mb-2">📭</div><p className="text-sm">No payments</p></div>
        )}
      </div>
    </div>
  );
};

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
        <h3 className="font-semibold text-sm sm:text-base">🎁 Trials</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm">{showAdd ? '✕ Cancel' : '➕ Add'}</button>
      </div>
      {showAdd && (
        <div className="glass-card rounded-xl p-4 mb-4 animate-fade-in">
          <select value={selFile} onChange={(e) => setSelFile(parseInt(e.target.value))} className="w-full bg-surface-lighter border border-border rounded-xl px-4 py-2 text-white mb-3 text-sm">
            <option value={0}>Select file...</option>
            {files.map(f => <option key={f.id} value={f.id}>{f.fileName}</option>)}
          </select>
          <input type="text" value={trialKey} onChange={(e) => setTrialKey(e.target.value)} placeholder="Trial key..." className="w-full bg-surface-lighter border border-border rounded-xl px-4 py-2 text-white placeholder-text-muted mb-3 text-sm" />
          <button onClick={handleAdd} disabled={!selFile || !trialKey.trim()} className="btn-accent px-6 py-2 rounded-xl text-sm disabled:opacity-50">✅ Create</button>
        </div>
      )}
      <h4 className="text-text-secondary text-xs mb-2">Active Trials</h4>
      <div className="space-y-2 mb-6">
        {trials.map(t => {
          const file = files.find(f => f.id === t.fileId);
          return (
            <div key={t.id} className="glass-card rounded-xl p-3 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">{file?.fileName || '?'}</p>
                <p className="text-text-muted text-xs"><code className="text-accent">{t.redeemCode}</code> → <code className="text-success">{t.trialKey}</code></p>
              </div>
              <button onClick={() => { deleteTrialKey(t.id); refreshData(); }} className="text-danger text-sm flex-shrink-0 ml-2">🗑️</button>
            </div>
          );
        })}
      </div>
      <h4 className="text-text-secondary text-xs mb-2">Redemption Logs</h4>
      <div className="space-y-2">
        {logs.length === 0 ? <p className="text-text-muted text-xs">No logs</p> : logs.map(l => (
          <div key={l.id} className="glass-card rounded-xl p-3">
            <p className="text-xs">{l.username} — {l.fileName}</p>
            <p className="text-text-muted text-[10px]">{formatDate(l.redeemedAt)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const UsersTab: React.FC = () => {
  const { refreshData } = useApp();
  const users = getUsers();
  const [search, setSearch] = useState('');
  const filtered = users.filter(u => u.username.toLowerCase().includes(search.toLowerCase()));
  const toggleBan = (id: string, banned: boolean) => {
    updateUser(id, { banned: !banned }); refreshData();
  };
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm sm:text-base">👥 Users ({users.length})</h3>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍" className="bg-surface-lighter border border-border rounded-xl px-3 py-2 text-sm text-white w-28 sm:w-48" />
      </div>
      <div className="space-y-2">
        {filtered.map(u => (
          <div key={u.id} className="glass-card rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${u.banned ? 'bg-danger/20 text-danger' : 'bg-primary/20 text-primary'}`}>
                {u.username.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{u.username}</p>
                <p className="text-text-muted text-[10px]">📱 {u.mobile}{u.email ? ` • 📧 ${u.email}` : ''}</p>
              </div>
            </div>
            <button onClick={() => toggleBan(u.id, u.banned)} className={`px-2 py-1 rounded-lg text-[10px] sm:text-xs font-medium flex-shrink-0 ml-2 ${u.banned ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
              {u.banned ? '✅ Unban' : '🚫 Ban'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const FeedbackTab: React.FC = () => {
  const { refreshData } = useApp();
  const feedbacks = getFeedbacks();
  const sorted = [...feedbacks].sort((a, b) => {
    if (a.seen !== b.seen) return a.seen ? 1 : -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  return (
    <div className="animate-fade-in">
      <h3 className="font-semibold text-sm sm:text-base mb-4">💬 Feedback ({feedbacks.length})</h3>
      <div className="space-y-2">
        {sorted.map(fb => (
          <div key={fb.id} className={`glass-card rounded-xl p-3 ${!fb.seen ? 'border-l-4 border-primary' : ''}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-xs">{fb.username}</span>
                  {!fb.seen && <span className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded-full">NEW</span>}
                </div>
                <p className="text-text-secondary text-sm">{fb.content}</p>
                <p className="text-text-muted text-[10px] mt-1">{formatDate(fb.createdAt)}</p>
              </div>
              {!fb.seen && <button onClick={() => { markFeedbackSeen(fb.id); refreshData(); }} className="bg-primary/20 text-primary px-2 py-1 rounded-lg text-[10px] flex-shrink-0">✅</button>}
            </div>
          </div>
        ))}
        {feedbacks.length === 0 && <div className="text-center py-8 text-text-secondary text-sm">No feedback</div>}
      </div>
    </div>
  );
};

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
      <h3 className="font-semibold text-sm sm:text-base mb-4">⚙️ Settings</h3>
      <div className="glass-card rounded-xl p-4 sm:p-6 space-y-4">
        <div>
          <label className="block text-xs text-text-secondary mb-1">UPI ID</label>
          <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="you@paytm" className="w-full bg-surface-lighter border border-border rounded-xl px-4 py-3 text-white placeholder-text-muted text-sm" />
        </div>
        
        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-semibold mb-3">🔐 Admin Login Credentials</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1">📱 Mobile Number</label>
              <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} maxLength={10} placeholder="Mobile number" className="w-full bg-surface-lighter border border-border rounded-xl px-4 py-3 text-white placeholder-text-muted text-sm" />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">🔒 Password</label>
              <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full bg-surface-lighter border border-border rounded-xl px-4 py-3 text-white placeholder-text-muted text-sm" />
            </div>
          </div>
        </div>

        <button onClick={handleSave} className="btn-primary px-6 py-2 rounded-xl font-semibold text-sm w-full sm:w-auto">💾 Save All</button>
        {saved && <p className="text-success text-xs">✅ Settings saved!</p>}
      </div>
      <div className="glass-card rounded-xl p-4 sm:p-6 mt-4">
        <p className="text-text-secondary text-sm">KITY DIGITAL STORE v1.0</p>
        <p className="text-text-muted text-xs">Made by @KITYGAMER</p>
      </div>
    </div>
  );
};

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
      <h3 className="font-semibold text-sm sm:text-base mb-4">📢 Broadcast</h3>
      <div className="glass-card rounded-xl p-4 sm:p-6 mb-4">
        <p className="text-text-secondary text-xs mb-3">{users.length} users</p>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message..." rows={3} className="w-full bg-surface-lighter border border-border rounded-xl px-4 py-3 text-white placeholder-text-muted text-sm resize-none mb-3" />
        <button onClick={handleBroadcast} disabled={!message.trim()} className="btn-primary px-6 py-2 rounded-xl font-semibold text-sm disabled:opacity-50 w-full sm:w-auto">📤 Send</button>
        {sent && <p className="text-success text-xs mt-2">✅ Sent!</p>}
      </div>
      <h4 className="text-text-secondary text-xs mb-2">Recent</h4>
      <div className="space-y-2">
        {[...new Set(broadcastLogs.map(l => l.groupId))].slice(0, 5).map(gid => {
          const logs = broadcastLogs.filter(l => l.groupId === gid);
          return (
            <div key={gid} className="glass-card rounded-xl p-3">
              <p className="text-xs">{logs[0]?.message}</p>
              <p className="text-text-muted text-[10px]">{logs.length} users • {formatDate(logs[0]?.sentAt || '')}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminPanel;
