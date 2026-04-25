import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { verifyAdmin } from '../store/db';
import { Icon, IconName } from './Icon';
import { BrandMark } from './ProductVisual';

type Mode = 'mobile' | 'email' | 'admin';

const MODES: { id: Mode; label: string; icon: IconName }[] = [
  { id: 'mobile', label: 'Mobile', icon: 'phone' },
  { id: 'email',  label: 'Gmail',  icon: 'mail' },
  { id: 'admin',  label: 'Admin',  icon: 'lock' },
];

const LoginPage: React.FC = () => {
  const { login, loginAsAdmin, loginByMobile, loginByEmail } = useApp();
  const [mode, setMode] = useState<Mode>('mobile');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showName, setShowName] = useState(false);

  const handleMobileLogin = () => {
    if (!mobile.trim() || mobile.length < 10) { setError('Enter a valid 10-digit mobile number'); return; }
    const existing = loginByMobile(mobile.trim());
    if (existing) return;
    if (!username.trim()) { setShowName(true); setError('Enter your name to register'); return; }
    login(username.trim(), mobile.trim());
  };

  const handleEmailLogin = () => {
    if (!email.trim() || !email.includes('@')) { setError('Enter a valid email address'); return; }
    const existing = loginByEmail(email.trim());
    if (existing) return;
    if (!username.trim()) { setShowName(true); setError('Enter your name to register'); return; }
    login(username.trim(), '', email.trim());
  };

  const handleAdmin = () => {
    if (!mobile.trim() || mobile.length < 10) { setError('Enter mobile number'); return; }
    if (!password.trim()) { setError('Enter password'); return; }
    if (verifyAdmin(mobile.trim(), password.trim())) {
      loginAsAdmin();
    } else {
      setError('Invalid mobile number or password');
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m); setError(''); setShowName(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <BrandMark className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4" />
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary-light via-white to-accent bg-clip-text text-transparent mb-1">
            KITY STORE
          </h1>
          <p className="text-text-secondary text-xs sm:text-sm inline-flex items-center justify-center gap-1.5">
            <Icon name="sparkles" className="w-3.5 h-3.5 text-accent" />
            Premium digital store
          </p>
        </div>

        <div className="panel-card p-5 sm:p-6 space-y-3.5">
          {/* Segmented control */}
          <div className="flex gap-1 p-1 bg-surface-lighter rounded-xl border border-border" role="tablist">
            {MODES.map(m => (
              <button
                key={m.id}
                role="tab"
                aria-selected={mode === m.id}
                onClick={() => switchMode(m.id)}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] sm:text-xs font-medium transition-all ${
                  mode === m.id
                    ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-[0_4px_14px_-4px_rgba(108,99,255,0.6)]'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                <Icon name={m.icon} className="w-3.5 h-3.5" />
                {m.label}
              </button>
            ))}
          </div>

          {/* MOBILE */}
          {mode === 'mobile' && (
            <>
              <div>
                <label className="block text-text-muted text-[10px] mb-1.5 inline-flex items-center gap-1">
                  <Icon name="phone" className="w-3 h-3" /> Mobile number
                </label>
                <div className="flex gap-2">
                  <span className="input-field !w-auto !py-2.5 text-text-muted">+91</span>
                  <input
                    type="tel" value={mobile}
                    onChange={(e) => { setMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); setShowName(false); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleMobileLogin()}
                    placeholder="10-digit number" maxLength={10}
                    className="input-field flex-1 !py-2.5"
                  />
                </div>
              </div>
              {showName && (
                <div className="animate-fade-in">
                  <label className="block text-text-muted text-[10px] mb-1.5 inline-flex items-center gap-1">
                    <Icon name="user" className="w-3 h-3" /> Your name
                  </label>
                  <input
                    type="text" value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleMobileLogin()}
                    placeholder="Enter your name"
                    className="input-field !py-2.5"
                  />
                </div>
              )}
              {error && (
                <p className="text-danger text-xs inline-flex items-center gap-1.5">
                  <Icon name="alert" className="w-3.5 h-3.5" /> {error}
                </p>
              )}
              <button onClick={handleMobileLogin} className="w-full btn-primary py-2.5 rounded-xl text-sm">
                <Icon name="rocket" className="w-4 h-4" />
                {showName ? 'Register & enter' : 'Login with mobile'}
              </button>
              <p className="text-text-muted text-[10px] text-center">New number? Auto-registers on first login</p>
            </>
          )}

          {/* EMAIL */}
          {mode === 'email' && (
            <>
              <div>
                <label className="block text-text-muted text-[10px] mb-1.5 inline-flex items-center gap-1">
                  <Icon name="mail" className="w-3 h-3" /> Email address
                </label>
                <input
                  type="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); setShowName(false); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
                  placeholder="you@gmail.com"
                  className="input-field !py-2.5"
                />
              </div>
              {showName && (
                <div className="animate-fade-in">
                  <label className="block text-text-muted text-[10px] mb-1.5 inline-flex items-center gap-1">
                    <Icon name="user" className="w-3 h-3" /> Your name
                  </label>
                  <input
                    type="text" value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
                    placeholder="Enter your name"
                    className="input-field !py-2.5"
                  />
                </div>
              )}
              {error && (
                <p className="text-danger text-xs inline-flex items-center gap-1.5">
                  <Icon name="alert" className="w-3.5 h-3.5" /> {error}
                </p>
              )}
              <button onClick={handleEmailLogin} className="w-full btn-primary py-2.5 rounded-xl text-sm">
                <Icon name="rocket" className="w-4 h-4" />
                {showName ? 'Register & enter' : 'Login with Gmail'}
              </button>
              <p className="text-text-muted text-[10px] text-center">New email? Auto-registers on first login</p>
            </>
          )}

          {/* ADMIN */}
          {mode === 'admin' && (
            <>
              <div>
                <label className="block text-text-muted text-[10px] mb-1.5 inline-flex items-center gap-1">
                  <Icon name="phone" className="w-3 h-3" /> Mobile number
                </label>
                <div className="flex gap-2">
                  <span className="input-field !w-auto !py-2.5 text-text-muted">+91</span>
                  <input
                    type="tel" value={mobile}
                    onChange={(e) => { setMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdmin()}
                    placeholder="Admin mobile" maxLength={10}
                    className="input-field flex-1 !py-2.5"
                  />
                </div>
              </div>
              <div>
                <label className="block text-text-muted text-[10px] mb-1.5 inline-flex items-center gap-1">
                  <Icon name="lock" className="w-3 h-3" /> Password
                </label>
                <input
                  type="password" value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdmin()}
                  placeholder="Password"
                  className="input-field !py-2.5"
                />
              </div>
              {error && (
                <p className="text-danger text-xs inline-flex items-center gap-1.5">
                  <Icon name="alert" className="w-3.5 h-3.5" /> {error}
                </p>
              )}
              <button onClick={handleAdmin} className="w-full btn-primary py-2.5 rounded-xl text-sm">
                <Icon name="shield" className="w-4 h-4" />
                Admin login
              </button>
            </>
          )}
        </div>

        <p className="text-text-muted text-[10px] text-center mt-4 inline-flex items-center justify-center w-full gap-1.5">
          <Icon name="shield" className="w-3 h-3" /> Secure local-first session
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
