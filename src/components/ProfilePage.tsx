import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { getPayments, addTrialLog, getTrialByCode, getFileById, addFeedback, getNotificationsFor, markNotifRead, markAllNotifsRead } from '../store/db';
import { formatDate } from '../store/helpers';

const ProfilePage: React.FC = () => {
  const { currentUser, currentUserId, navigate, refreshData, refreshNotifs } = useApp();
  const [tab, setTab] = useState<'profile' | 'notifs' | 'trial' | 'feedback' | 'history'>('profile');
  const [trialCode, setTrialCode] = useState('');
  const [trialMsg, setTrialMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  if (!currentUser) return <div className="text-center py-16 px-4"><button onClick={() => navigate('login')} className="btn-primary px-6 py-2 rounded-xl text-sm">Login First</button></div>;

  const payments = getPayments().filter(p => p.userId === currentUserId);
  const approved = payments.filter(p => p.status === 'APPROVED');
  const pending = payments.filter(p => p.status === 'PENDING' || p.status === 'PROOF_UPLOADED');
  const notifications = getNotificationsFor(currentUserId);

  const handleRedeem = () => {
    if (!trialCode.trim()) return;
    const trial = getTrialByCode(trialCode.trim());
    if (trial) {
      const file = getFileById(trial.fileId);
      addTrialLog(currentUserId, currentUser.username, trialCode.trim().toUpperCase(), file?.fileName || '?', trial.trialKey);
      setTrialMsg({ type: 'success', text: `🎉 Key: ${trial.trialKey}` }); setTrialCode(''); refreshData();
    } else {
      setTrialMsg({ type: 'error', text: '❌ Invalid code!' });
    }
  };

  const handleFeedback = () => {
    if (!feedbackText.trim()) return;
    addFeedback(currentUserId, currentUser.username, 'TEXT', feedbackText.trim());
    setFeedbackText(''); setFeedbackSent(true); setTimeout(() => setFeedbackSent(false), 3000); refreshData();
  };

  const tabs = [
    { id: 'profile' as const, l: '👤' },
    { id: 'notifs' as const, l: '🔔' },
    { id: 'history' as const, l: '📋' },
    { id: 'trial' as const, l: '🎁' },
    { id: 'feedback' as const, l: '💬' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xl sm:text-2xl font-bold flex-shrink-0">
            {currentUser.username.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-bold truncate">{currentUser.username}</h2>
            <p className="text-text-muted text-[10px] sm:text-xs">📱 {currentUser.mobile}{currentUser.email ? ` • 📧 ${currentUser.email}` : ''}</p>
            <p className="text-text-muted text-[10px] sm:text-xs">Joined: {formatDate(currentUser.joinDate)}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-3 sm:mt-4">
          <div className="bg-surface-lighter rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
            <p className="text-accent font-bold text-lg sm:text-xl">{approved.length}</p>
            <p className="text-text-muted text-[9px] sm:text-xs">Purchases</p>
          </div>
          <div className="bg-surface-lighter rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
            <p className="text-warning font-bold text-lg sm:text-xl">{pending.length}</p>
            <p className="text-text-muted text-[9px] sm:text-xs">Pending</p>
          </div>
          <div className="bg-surface-lighter rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
            <p className="text-success font-bold text-lg sm:text-xl">{payments.length}</p>
            <p className="text-text-muted text-[9px] sm:text-xs">Total</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 sm:gap-2 mb-4">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 py-2 rounded-xl text-sm sm:text-base transition-all ${tab === t.id ? 'bg-primary text-white' : 'bg-surface-lighter text-text-secondary'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {/* Profile */}
      {tab === 'profile' && (
        <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 animate-fade-in">
          <h3 className="font-semibold text-sm sm:text-base mb-3">👤 Account</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-border"><span className="text-text-secondary">Name</span><span>{currentUser.username}</span></div>
            <div className="flex justify-between py-2 border-b border-border"><span className="text-text-secondary">Mobile</span><span>📱 {currentUser.mobile || '—'}</span></div>
            <div className="flex justify-between py-2 border-b border-border"><span className="text-text-secondary">Email</span><span className="text-xs">📧 {currentUser.email || '—'}</span></div>
            <div className="flex justify-between py-2 border-b border-border"><span className="text-text-secondary">Status</span><span className="text-success">✅ Active</span></div>
            <div className="flex justify-between py-2"><span className="text-text-secondary">Joined</span><span className="text-xs">{formatDate(currentUser.joinDate)}</span></div>
          </div>
          <div className="mt-4 p-3 bg-surface-lighter rounded-xl"><p className="text-text-muted text-xs">🙋 Help? @KITYGAMER</p></div>
        </div>
      )}

      {/* Notifications */}
      {tab === 'notifs' && (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm sm:text-base">🔔 Notifications</h3>
            {notifications.some(n => !n.read) && (
              <button onClick={() => { markAllNotifsRead(currentUserId); refreshNotifs(); refreshData(); }} className="text-primary text-[10px]">Mark all read</button>
            )}
          </div>
          <div className="space-y-2">
            {notifications.length === 0 ? (
              <div className="glass-card rounded-xl p-6 text-center"><div className="text-3xl mb-2">🔕</div><p className="text-text-muted text-sm">No notifications</p></div>
            ) : (
              notifications.map(n => (
                <div key={n.id} onClick={() => { markNotifRead(n.id); refreshNotifs(); }} className={`glass-card rounded-xl p-3 sm:p-4 cursor-pointer transition-all ${!n.read ? 'border-l-4 border-primary bg-primary/5' : ''}`}>
                  <div className="flex items-start gap-2">
                    <span className="text-xl flex-shrink-0">
                      {n.type === 'PAYMENT_APPROVED' ? '✅' : n.type === 'PAYMENT_REJECTED' ? '❌' : '💬'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs sm:text-sm">{n.title}</p>
                      <p className="text-text-secondary text-[10px] sm:text-xs mt-0.5">{n.message}</p>
                      {n.deliveredKey && (
                        <div className="mt-2 bg-success/10 rounded-lg p-2">
                          <p className="text-success text-xs font-medium">🔑 Key: <code className="bg-success/20 px-1.5 py-0.5 rounded select-all">{n.deliveredKey}</code></p>
                          <button onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(n.deliveredKey!); }} className="text-success text-[10px] mt-1">📋 Copy Key</button>
                        </div>
                      )}
                      {n.deliveredFileName && (
                        <p className="text-accent text-[10px] mt-1">📁 File: {n.deliveredFileName}</p>
                      )}
                      <p className="text-text-muted text-[9px] mt-1">{new Date(n.createdAt).toLocaleString('en-IN')}</p>
                    </div>
                    {!n.read && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5"></span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* History */}
      {tab === 'history' && (
        <div className="space-y-2 animate-fade-in">
          {payments.length === 0 ? (
            <div className="glass-card rounded-xl p-6 text-center"><div className="text-3xl mb-2">📭</div><p className="text-text-secondary text-sm">No history</p></div>
          ) : (
            [...payments].reverse().map(pay => {
              const file = getFileById(pay.fileId);
              return (
                <div key={pay.id} className="glass-card rounded-xl p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">#{pay.id} — {file?.fileName || '?'}</p>
                      <p className="text-text-muted text-[10px] sm:text-xs">{formatDate(pay.createdAt)}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-xs font-medium flex-shrink-0 ${
                      pay.status === 'APPROVED' ? 'bg-success/20 text-success' :
                      pay.status === 'PROOF_UPLOADED' ? 'bg-warning/20 text-warning' :
                      pay.status === 'PENDING' ? 'bg-surface-lighter text-text-muted' : 'bg-danger/20 text-danger'
                    }`}>{pay.status === 'PROOF_UPLOADED' ? '📸 PROOF' : pay.status}</span>
                  </div>
                  {pay.status === 'APPROVED' && pay.deliveredKey && (
                    <div className="mt-2 bg-success/10 rounded-lg p-2">
                      <p className="text-success text-xs">🔑 Key: <code className="bg-success/20 px-1 rounded select-all">{pay.deliveredKey}</code></p>
                      <button onClick={() => navigator.clipboard?.writeText(pay.deliveredKey!)} className="text-success text-[10px] mt-1">📋 Copy</button>
                    </div>
                  )}
                  {pay.status === 'APPROVED' && pay.deliveredFile && pay.deliveredFile.startsWith('data:') && !pay.deliveredFile.startsWith('data:image/') && (
                    <div className="mt-2">
                      <a href={pay.deliveredFile} download={pay.deliveredFileName || 'file'} className="btn-accent px-3 py-1 rounded-lg text-[10px] sm:text-xs inline-flex items-center gap-1">📥 {pay.deliveredFileName}</a>
                    </div>
                  )}
                  {pay.status === 'APPROVED' && pay.deliveredFile && pay.deliveredFile.startsWith('data:image/') && (
                    <div className="mt-2"><img src={pay.deliveredFile} alt="File" className="max-h-24 rounded-lg" /></div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Trial */}
      {tab === 'trial' && (
        <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 animate-fade-in">
          <h3 className="font-semibold text-sm sm:text-base mb-3">🎁 Redeem Trial</h3>
          <p className="text-text-secondary text-xs sm:text-sm mb-3">Enter trial code for free access.</p>
          <div className="flex gap-2">
            <input type="text" value={trialCode} onChange={(e) => { setTrialCode(e.target.value.toUpperCase()); setTrialMsg(null); }} placeholder="e.g. TRIAL2024"
              className="flex-1 bg-surface-lighter border border-border rounded-xl px-3 py-2.5 text-white placeholder-text-muted text-sm uppercase" />
            <button onClick={handleRedeem} className="btn-primary px-4 py-2.5 rounded-xl font-semibold text-sm flex-shrink-0">Redeem</button>
          </div>
          {trialMsg && <div className={`mt-2 p-2 rounded-lg text-xs ${trialMsg.type === 'success' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>{trialMsg.text}</div>}
          <div className="mt-3 p-2 bg-surface-lighter rounded-lg"><p className="text-text-muted text-[10px]">💡 Try: TRIAL2024, FREEFIRE</p></div>
        </div>
      )}

      {/* Feedback */}
      {tab === 'feedback' && (
        <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 animate-fade-in">
          <h3 className="font-semibold text-sm sm:text-base mb-3">💬 Send Feedback</h3>
          <textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="Your feedback..." rows={3}
            className="w-full bg-surface-lighter border border-border rounded-xl px-3 py-2.5 text-white placeholder-text-muted text-sm resize-none mb-3" />
          <button onClick={handleFeedback} disabled={!feedbackText.trim()} className="btn-primary px-5 py-2 rounded-xl font-semibold text-sm disabled:opacity-50">📤 Send</button>
          {feedbackSent && <p className="text-success text-xs mt-2">✅ Sent!</p>}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
