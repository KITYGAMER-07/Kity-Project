import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { getPayments, addTrialLog, getTrialByCode, getFileById } from '../store/db';
import { formatDate } from '../store/helpers';
import { addFeedback } from '../store/db';

const ProfilePage: React.FC = () => {
  const { currentUser, currentUserId, navigate, refreshData } = useApp();
  const [activeTab, setActiveTab] = useState<'profile' | 'trial' | 'feedback' | 'history'>('profile');
  const [trialCode, setTrialCode] = useState('');
  const [trialMsg, setTrialMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  if (!currentUser) {
    return (
      <div className="text-center py-20">
        <button onClick={() => navigate('login')} className="btn-primary px-6 py-2 rounded-xl">Login First</button>
      </div>
    );
  }

  const payments = getPayments().filter(p => p.userId === currentUserId);
  const approvedCount = payments.filter(p => p.status === 'APPROVED').length;
  const pendingCount = payments.filter(p => p.status === 'PENDING').length;

  const handleRedeemTrial = () => {
    if (!trialCode.trim()) return;
    const trial = getTrialByCode(trialCode.trim());
    if (trial) {
      const file = getFileById(trial.fileId);
      addTrialLog(currentUserId, currentUser.username, trialCode.trim().toUpperCase(), file?.fileName || 'Unknown', trial.trialKey);
      setTrialMsg({ type: 'success', text: `🎉 Trial activated! Key: ${trial.trialKey}` });
      setTrialCode('');
      refreshData();
    } else {
      setTrialMsg({ type: 'error', text: '❌ Invalid trial code!' });
    }
  };

  const handleSendFeedback = () => {
    if (!feedbackText.trim()) return;
    addFeedback(currentUserId, currentUser.username, 'TEXT', feedbackText.trim());
    setFeedbackText('');
    setFeedbackSent(true);
    setTimeout(() => setFeedbackSent(false), 3000);
    refreshData();
  };

  const tabs = [
    { id: 'profile' as const, label: '👤 Profile', icon: '👤' },
    { id: 'history' as const, label: '📋 History', icon: '📋' },
    { id: 'trial' as const, label: '🎁 Trial', icon: '🎁' },
    { id: 'feedback' as const, label: '💬 Feedback', icon: '💬' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">
      {/* Header Card */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold">
            {currentUser.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold">{currentUser.username}</h2>
            <p className="text-text-muted text-sm">ID: {currentUserId.slice(0, 16)}...</p>
            <p className="text-text-muted text-xs">Joined: {formatDate(currentUser.joinDate)}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-surface-lighter rounded-xl p-3 text-center">
            <p className="text-accent font-bold text-xl">{approvedCount}</p>
            <p className="text-text-muted text-xs">Purchases</p>
          </div>
          <div className="bg-surface-lighter rounded-xl p-3 text-center">
            <p className="text-warning font-bold text-xl">{pendingCount}</p>
            <p className="text-text-muted text-xs">Pending</p>
          </div>
          <div className="bg-surface-lighter rounded-xl p-3 text-center">
            <p className="text-success font-bold text-xl">{payments.length}</p>
            <p className="text-text-muted text-xs">Total</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
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

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div className="glass-card rounded-2xl p-6 animate-fade-in">
          <h3 className="font-semibold mb-4">👤 Account Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-text-secondary">Username</span>
              <span>{currentUser.username}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-text-secondary">Status</span>
              <span className="text-success">✅ Active</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-text-secondary">Join Date</span>
              <span>{formatDate(currentUser.joinDate)}</span>
            </div>
          </div>
          <div className="mt-6 p-4 bg-surface-lighter rounded-xl">
            <p className="text-text-muted text-sm">🙋 Need help? Contact @KITYGAMER</p>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-3 animate-fade-in">
          {payments.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-text-secondary">No payment history</p>
            </div>
          ) : (
            payments.map(pay => (
              <div key={pay.id} className="glass-card rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Payment #{pay.id}</p>
                    <p className="text-text-muted text-xs">{formatDate(pay.createdAt)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    pay.status === 'APPROVED' ? 'bg-success/20 text-success' :
                    pay.status === 'PENDING' ? 'bg-warning/20 text-warning' :
                    'bg-danger/20 text-danger'
                  }`}>
                    {pay.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'trial' && (
        <div className="glass-card rounded-2xl p-6 animate-fade-in">
          <h3 className="font-semibold mb-4">🎁 Redeem Trial Code</h3>
          <p className="text-text-secondary text-sm mb-4">Enter your trial code to get free access to a product.</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={trialCode}
              onChange={(e) => { setTrialCode(e.target.value.toUpperCase()); setTrialMsg(null); }}
              placeholder="e.g. TRIAL2024"
              className="flex-1 bg-surface-lighter border border-border rounded-xl px-4 py-3 text-white placeholder-text-muted focus:outline-none focus:border-primary transition-all uppercase"
            />
            <button onClick={handleRedeemTrial} className="btn-primary px-6 py-3 rounded-xl font-semibold">
              Redeem
            </button>
          </div>
          {trialMsg && (
            <div className={`mt-3 p-3 rounded-xl text-sm ${trialMsg.type === 'success' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
              {trialMsg.text}
            </div>
          )}
          <div className="mt-4 p-3 bg-surface-lighter rounded-xl">
            <p className="text-text-muted text-xs">💡 Try codes: TRIAL2024, FREEFIRE</p>
          </div>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="glass-card rounded-2xl p-6 animate-fade-in">
          <h3 className="font-semibold mb-4">💬 Send Feedback</h3>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Write your feedback here..."
            rows={4}
            className="w-full bg-surface-lighter border border-border rounded-xl px-4 py-3 text-white placeholder-text-muted focus:outline-none focus:border-primary transition-all resize-none mb-3"
          />
          <button
            onClick={handleSendFeedback}
            disabled={!feedbackText.trim()}
            className="btn-primary px-6 py-2 rounded-xl font-semibold disabled:opacity-50"
          >
            📤 Send Feedback
          </button>
          {feedbackSent && (
            <p className="mt-2 text-success text-sm">✅ Feedback sent to admin!</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
