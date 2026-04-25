import React, { useEffect, useState } from 'react';
import { useApp } from '../store/AppContext';
import { getPayments, addTrialLog, getTrialByCode, getFileById, addFeedback, getNotificationsFor, markNotifRead, markAllNotifsRead, Notification } from '../store/db';
import { formatDate } from '../store/helpers';
import { Icon, IconName } from './Icon';
import { KityGamerBadge } from './ProductVisual';

type Tab = 'profile' | 'notifs' | 'trial' | 'feedback' | 'history';
const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'profile',  label: 'Profile',  icon: 'user' },
  { id: 'notifs',   label: 'Inbox',    icon: 'bell' },
  { id: 'history',  label: 'Orders',   icon: 'history' },
  { id: 'trial',    label: 'Trial',    icon: 'gift' },
  { id: 'feedback', label: 'Feedback', icon: 'message' },
];

function notifIcon(type: Notification['type']): { name: IconName; cls: string } {
  if (type === 'PAYMENT_APPROVED') return { name: 'check-circle', cls: 'icon-box-success' };
  if (type === 'PAYMENT_REJECTED') return { name: 'x-circle',     cls: 'icon-box-danger'  };
  if (type === 'PAYMENT_PROOF')    return { name: 'camera',       cls: 'icon-box-warning' };
  if (type === 'NEW_USER')         return { name: 'user',         cls: 'icon-box-info'    };
  return { name: 'message', cls: 'icon-box' };
}

function statusBadge(s: string): { cls: string; label: string; icon: IconName } {
  switch (s) {
    case 'APPROVED':        return { cls: 'status-success', label: 'Approved',  icon: 'check-circle' };
    case 'PROOF_UPLOADED':  return { cls: 'status-warning', label: 'In review', icon: 'camera' };
    case 'PENDING':         return { cls: 'status-muted',   label: 'Pending',   icon: 'clock' };
    case 'REJECTED':        return { cls: 'status-danger',  label: 'Rejected',  icon: 'x-circle' };
    default:                return { cls: 'status-muted',   label: s,           icon: 'info' };
  }
}

const ProfilePage: React.FC = () => {
  const { currentUser, currentUserId, navigate, refreshData, refreshNotifs } = useApp();
  const [tab, setTab] = useState<Tab>('profile');
  const [trialCode, setTrialCode] = useState('');
  const [trialError, setTrialError] = useState<string | null>(null);
  const [trialResult, setTrialResult] = useState<{ key: string; fileName: string; code: string } | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!trialResult) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setTrialResult(null); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [trialResult]);

  if (!currentUser) {
    return (
      <div className="text-center py-16 px-4 animate-fade-in">
        <span className="empty-icon"><Icon name="user" className="w-5 h-5" /></span>
        <p className="text-text-secondary text-sm mt-2 mb-4">Please log in to view your profile</p>
        <button onClick={() => navigate('login')} className="btn-primary px-6 py-2 rounded-xl text-sm">
          <Icon name="lock" className="w-4 h-4" /> Login
        </button>
      </div>
    );
  }

  const payments = getPayments().filter(p => p.userId === currentUserId);
  const approved = payments.filter(p => p.status === 'APPROVED');
  const pending = payments.filter(p => p.status === 'PENDING' || p.status === 'PROOF_UPLOADED');
  const notifications = getNotificationsFor(currentUserId);
  const unreadCount = notifications.filter(n => !n.read).length;

  const copyKey = (k: string) => {
    navigator.clipboard?.writeText(k);
    setCopiedKey(k);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleRedeem = () => {
    if (!trialCode.trim()) return;
    const code = trialCode.trim().toUpperCase();
    const trial = getTrialByCode(code);
    if (trial) {
      const file = getFileById(trial.fileId);
      const fileName = file?.fileName || 'Trial product';
      addTrialLog(currentUserId, currentUser.username, code, fileName, trial.trialKey);
      setTrialResult({ key: trial.trialKey, fileName, code });
      setTrialError(null);
      setTrialCode('');
      refreshData();
    } else {
      setTrialError('Invalid trial code. Please check and try again.');
    }
  };

  const handleFeedback = () => {
    if (!feedbackText.trim()) return;
    addFeedback(currentUserId, currentUser.username, 'TEXT', feedbackText.trim());
    setFeedbackText(''); setFeedbackSent(true); setTimeout(() => setFeedbackSent(false), 3000); refreshData();
  };

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 animate-fade-in">
      {/* Header card */}
      <div className="panel-card overflow-hidden mb-4 sm:mb-6">
        <div className="relative h-20 sm:h-24 bg-gradient-to-br from-primary/40 via-primary/20 to-accent/30">
          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:24px_24px]" />
        </div>
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 -mt-10">
          <div className="flex items-end gap-3 sm:gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-bg flex-shrink-0 ring-4 ring-bg shadow-lg">
              {currentUser.username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <h2 className="text-lg sm:text-xl font-extrabold truncate">{currentUser.username}</h2>
              <p className="text-text-muted text-[10px] sm:text-xs truncate inline-flex items-center gap-2 flex-wrap">
                {currentUser.mobile && (
                  <span className="inline-flex items-center gap-1"><Icon name="phone" className="w-3 h-3" /> {currentUser.mobile}</span>
                )}
                {currentUser.email && (
                  <span className="inline-flex items-center gap-1"><Icon name="mail" className="w-3 h-3" /> {currentUser.email}</span>
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4">
            {[
              { label: 'Purchases', value: approved.length, color: 'text-accent' },
              { label: 'Pending',   value: pending.length,  color: 'text-warning' },
              { label: 'Total',     value: payments.length, color: 'text-success' },
            ].map(s => (
              <div key={s.label} className="metric-card p-2.5 sm:p-3 text-center">
                <p className={`${s.color} font-extrabold text-lg sm:text-2xl leading-none`}>{s.value}</p>
                <p className="text-text-muted text-[10px] sm:text-xs mt-1.5 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 sm:gap-1.5 mb-4 overflow-x-auto pb-1 -mx-1 px-1" role="tablist">
        {TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`tab-pill ${tab === t.id ? 'active' : ''}`}
          >
            <Icon name={t.icon} className="w-3.5 h-3.5" />
            <span>{t.label}</span>
            {t.id === 'notifs' && unreadCount > 0 && (
              <span className="bg-danger text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Profile */}
      {tab === 'profile' && (
        <div className="panel-card p-4 sm:p-6 animate-fade-in">
          <h3 className="section-title mb-3"><Icon name="user" className="w-4 h-4" /> Account</h3>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between py-2.5 border-b border-border/60">
              <dt className="text-text-secondary">Name</dt>
              <dd className="font-medium">{currentUser.username}</dd>
            </div>
            <div className="flex justify-between py-2.5 border-b border-border/60">
              <dt className="text-text-secondary inline-flex items-center gap-1.5"><Icon name="phone" className="w-3.5 h-3.5" /> Mobile</dt>
              <dd>{currentUser.mobile || '—'}</dd>
            </div>
            <div className="flex justify-between py-2.5 border-b border-border/60 gap-2">
              <dt className="text-text-secondary inline-flex items-center gap-1.5 flex-shrink-0"><Icon name="mail" className="w-3.5 h-3.5" /> Email</dt>
              <dd className="text-xs truncate">{currentUser.email || '—'}</dd>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-border/60">
              <dt className="text-text-secondary">Status</dt>
              <dd>
                <span className="status-badge status-success"><span className="dot" /> Active</span>
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-text-secondary">Joined</dt>
              <dd className="text-xs">{formatDate(currentUser.joinDate)}</dd>
            </div>
          </dl>
          <div className="mt-4 p-3 rounded-xl bg-primary/[0.06] border border-primary/15 inline-flex items-start gap-2 w-full">
            <Icon name="info" className="w-4 h-4 text-primary-light flex-shrink-0 mt-0.5" />
            <p className="text-text-secondary text-xs inline-flex items-center gap-1.5 flex-wrap">
              <span>Need help? Contact</span>
              <KityGamerBadge />
            </p>
          </div>
        </div>
      )}

      {/* Notifications */}
      {tab === 'notifs' && (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title"><Icon name="bell" className="w-4 h-4" /> Inbox</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => { markAllNotifsRead(currentUserId); refreshNotifs(); refreshData(); }}
                className="text-primary-light hover:text-white text-[11px] font-medium inline-flex items-center gap-1"
              >
                <Icon name="check-double" className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>
          <div className="space-y-2">
            {notifications.length === 0 ? (
              <div className="empty-state panel-card">
                <span className="empty-icon"><Icon name="inbox" className="w-5 h-5" /></span>
                <p className="text-sm">No notifications yet</p>
                <p className="text-text-muted text-xs mt-1">You'll see updates here</p>
              </div>
            ) : (
              notifications.map(n => {
                const ic = notifIcon(n.type);
                return (
                  <div
                    key={n.id}
                    onClick={() => { markNotifRead(n.id); refreshNotifs(); }}
                    className={`panel-card p-3 sm:p-4 cursor-pointer transition-all hover:border-primary/40 ${!n.read ? 'border-l-4 border-l-primary bg-primary/[0.05]' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`icon-box icon-box-sm flex-shrink-0 ${ic.cls}`}>
                        <Icon name={ic.name} className="w-3.5 h-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-xs sm:text-sm truncate flex-1">{n.title}</p>
                          {!n.read && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />}
                        </div>
                        <p className="text-text-secondary text-[11px] sm:text-xs mt-0.5 leading-snug">{n.message}</p>
                        {n.deliveredKey && (
                          <div className="mt-2 bg-success/[0.08] border border-success/20 rounded-lg p-2 flex items-center justify-between gap-2">
                            <code className="text-success font-mono text-xs break-all">{n.deliveredKey}</code>
                            <button
                              onClick={(e) => { e.stopPropagation(); copyKey(n.deliveredKey!); }}
                              className="text-success bg-success/15 hover:bg-success/25 px-2 py-1 rounded inline-flex items-center gap-1 text-[10px] flex-shrink-0 transition-colors"
                            >
                              <Icon name={copiedKey === n.deliveredKey ? 'check' : 'copy'} className="w-3 h-3" />
                              {copiedKey === n.deliveredKey ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                        )}
                        {n.deliveredFileName && (
                          <p className="text-accent text-[10px] mt-1 inline-flex items-center gap-1">
                            <Icon name="file" className="w-3 h-3" /> {n.deliveredFileName}
                          </p>
                        )}
                        <p className="text-text-muted text-[10px] mt-1.5">{formatDate(n.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* History */}
      {tab === 'history' && (
        <div className="space-y-2 animate-fade-in">
          <h3 className="section-title mb-2"><Icon name="history" className="w-4 h-4" /> Order history</h3>
          {payments.length === 0 ? (
            <div className="empty-state panel-card">
              <span className="empty-icon"><Icon name="inbox" className="w-5 h-5" /></span>
              <p className="text-sm">No purchases yet</p>
              <button onClick={() => navigate('games')} className="btn-primary mt-3 px-4 py-2 rounded-xl text-xs">
                <Icon name="gamepad" className="w-3.5 h-3.5" /> Browse store
              </button>
            </div>
          ) : (
            [...payments].reverse().map(pay => {
              const file = getFileById(pay.fileId);
              const sb = statusBadge(pay.status);
              return (
                <div key={pay.id} className="panel-card p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">
                        <span className="text-text-muted">#{pay.id}</span> {file?.fileName || '?'}
                      </p>
                      <p className="text-text-muted text-[10px] sm:text-xs">{formatDate(pay.createdAt)}</p>
                    </div>
                    <span className={`status-badge ${sb.cls} flex-shrink-0`}>
                      <Icon name={sb.icon} className="w-3 h-3" />
                      {sb.label}
                    </span>
                  </div>
                  {pay.status === 'APPROVED' && pay.deliveredKey && (
                    <div className="mt-2 bg-success/[0.08] border border-success/20 rounded-lg p-2 flex items-center justify-between gap-2">
                      <code className="text-success font-mono text-xs break-all select-all">{pay.deliveredKey}</code>
                      <button
                        onClick={() => copyKey(pay.deliveredKey!)}
                        className="text-success bg-success/15 hover:bg-success/25 px-2 py-1 rounded inline-flex items-center gap-1 text-[10px] flex-shrink-0 transition-colors"
                      >
                        <Icon name={copiedKey === pay.deliveredKey ? 'check' : 'copy'} className="w-3 h-3" />
                        {copiedKey === pay.deliveredKey ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  )}
                  {pay.status === 'APPROVED' && pay.deliveredFile && pay.deliveredFile.startsWith('data:') && !pay.deliveredFile.startsWith('data:image/') && (
                    <div className="mt-2">
                      <a
                        href={pay.deliveredFile}
                        download={pay.deliveredFileName || 'file'}
                        className="btn-accent px-3 py-1.5 rounded-lg text-[11px] sm:text-xs inline-flex items-center gap-1.5"
                      >
                        <Icon name="download" className="w-3.5 h-3.5" /> {pay.deliveredFileName}
                      </a>
                    </div>
                  )}
                  {pay.status === 'APPROVED' && pay.deliveredFile && pay.deliveredFile.startsWith('data:image/') && (
                    <div className="mt-2"><img src={pay.deliveredFile} alt="File" className="max-h-28 rounded-lg" /></div>
                  )}
                  {pay.status === 'REJECTED' && pay.rejectReason && (
                    <p className="mt-2 text-danger text-xs inline-flex items-center gap-1.5">
                      <Icon name="alert" className="w-3.5 h-3.5" /> {pay.rejectReason}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Trial */}
      {tab === 'trial' && (
        <div className="panel-card p-4 sm:p-6 animate-fade-in">
          <h3 className="section-title mb-2"><Icon name="gift" className="w-4 h-4 text-warning" /> Redeem trial</h3>
          <p className="text-text-secondary text-xs sm:text-sm mb-3">Enter a trial code to receive a free trial key.</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Icon name="ticket" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="text" value={trialCode}
                onChange={(e) => { setTrialCode(e.target.value.toUpperCase()); setTrialError(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRedeem(); }}
                placeholder="e.g. TRIAL2024"
                className="input-field pl-9 uppercase font-mono"
              />
            </div>
            <button onClick={handleRedeem} className="btn-primary px-4 py-2.5 rounded-xl text-sm flex-shrink-0">
              <Icon name="key" className="w-4 h-4" /> Redeem
            </button>
          </div>
          {trialError && (
            <div className="mt-3 p-3 rounded-lg text-xs inline-flex items-start gap-2 w-full border bg-danger/[0.08] border-danger/25 text-danger">
              <Icon name="x-circle" className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="break-all">{trialError}</span>
            </div>
          )}
          <div className="mt-3 p-3 bg-surface-lighter rounded-lg border border-border inline-flex items-start gap-2 w-full">
            <Icon name="info" className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
            <p className="text-text-muted text-[11px]">Try: <code className="text-primary-light font-mono">TRIAL2024</code>, <code className="text-primary-light font-mono">FREEFIRE</code></p>
          </div>
        </div>
      )}

      {/* Trial Success Modal */}
      {trialResult && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="trial-success-title"
        >
          <div
            className="absolute inset-0 bg-bg/80 backdrop-blur-md"
            onClick={() => setTrialResult(null)}
          />
          <div className="relative w-full sm:max-w-md bg-bg-card border border-border sm:border-success/30 rounded-t-3xl sm:rounded-2xl shadow-[0_-20px_60px_-10px_rgba(0,0,0,0.6)] sm:shadow-[0_20px_60px_-10px_rgba(34,211,155,0.25)] overflow-hidden animate-trial-pop">
            <div className="sm:hidden flex justify-center pt-2.5 pb-1">
              <span className="w-10 h-1.5 rounded-full bg-border" />
            </div>

            <button
              onClick={() => setTrialResult(null)}
              aria-label="Close"
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-white hover:bg-white/10 transition-colors z-10"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>

            <div className="px-5 sm:px-7 pt-6 pb-3 text-center">
              <div className="relative inline-flex mb-3">
                <span className="absolute inset-0 rounded-full bg-success/30 blur-xl animate-pulse-soft" />
                <span className="relative w-16 h-16 rounded-full bg-gradient-to-br from-success to-emerald-400 flex items-center justify-center text-bg shadow-lg ring-4 ring-success/20">
                  <Icon name="check-circle" className="w-8 h-8" />
                </span>
              </div>
              <h3 id="trial-success-title" className="text-xl sm:text-2xl font-extrabold mb-1">Trial activated</h3>
              <p className="text-text-secondary text-xs sm:text-sm">
                Code <code className="text-primary-light font-mono">{trialResult.code}</code> redeemed successfully
              </p>
            </div>

            <div className="px-5 sm:px-7 pb-5">
              <div className="rounded-2xl bg-surface-lighter/60 border border-border p-3 sm:p-4 mb-4">
                <p className="text-text-muted text-[10px] uppercase tracking-wider mb-1.5 inline-flex items-center gap-1.5">
                  <Icon name="file" className="w-3 h-3" /> Product
                </p>
                <p className="font-semibold text-sm sm:text-base break-words">{trialResult.fileName}</p>
              </div>

              <div>
                <p className="text-text-muted text-[10px] uppercase tracking-wider mb-1.5 inline-flex items-center gap-1.5 px-1">
                  <Icon name="key" className="w-3 h-3" /> Your trial key
                </p>
                <div className="bg-success/[0.08] border border-success/25 rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-2 sm:gap-3">
                  <code className="text-success font-mono text-sm sm:text-base font-semibold break-all select-all flex-1">
                    {trialResult.key}
                  </code>
                  <button
                    onClick={() => copyKey(trialResult.key)}
                    className="text-success bg-success/15 hover:bg-success/25 active:scale-95 px-3 py-2 rounded-lg inline-flex items-center gap-1.5 text-xs font-semibold flex-shrink-0 transition-all"
                  >
                    <Icon name={copiedKey === trialResult.key ? 'check' : 'copy'} className="w-3.5 h-3.5" />
                    {copiedKey === trialResult.key ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-text-muted text-[10px] mt-2 px-1 inline-flex items-center gap-1">
                  <Icon name="info" className="w-3 h-3" /> Save this key — it won't be shown again
                </p>
              </div>
            </div>

            <div className="px-5 sm:px-7 pb-5 sm:pb-6 pt-1 border-t border-border/60 bg-surface/40">
              <button
                onClick={() => setTrialResult(null)}
                className="btn-accent w-full py-3 rounded-xl text-sm font-semibold mt-4"
              >
                <Icon name="check" className="w-4 h-4" /> Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback */}
      {tab === 'feedback' && (
        <div className="panel-card p-4 sm:p-6 animate-fade-in">
          <h3 className="section-title mb-2"><Icon name="message" className="w-4 h-4" /> Send feedback</h3>
          <p className="text-text-secondary text-xs sm:text-sm mb-3">Tell us how we can improve KITY Store.</p>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Your feedback..."
            rows={4}
            className="input-field mb-3"
          />
          <button
            onClick={handleFeedback}
            disabled={!feedbackText.trim()}
            className="btn-primary px-5 py-2.5 rounded-xl text-sm"
          >
            <Icon name="rocket" className="w-4 h-4" /> Send feedback
          </button>
          {feedbackSent && (
            <p className="text-success text-xs mt-3 inline-flex items-center gap-1.5">
              <Icon name="check-circle" className="w-3.5 h-3.5" /> Thanks! Feedback sent.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
