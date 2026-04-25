import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { verifyAdmin } from '../store/db';

const LoginPage: React.FC = () => {
  const { login, loginAsAdmin, loginByMobile, loginByEmail } = useApp();
  const [mode, setMode] = useState<'mobile' | 'email' | 'admin'>('mobile');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showName, setShowName] = useState(false);

  // Mobile login
  const handleMobileLogin = () => {
    if (!mobile.trim() || mobile.length < 10) { setError('Enter valid 10-digit mobile number'); return; }
    const existing = loginByMobile(mobile.trim());
    if (existing) return;
    if (!username.trim()) { setShowName(true); setError('Enter your name to register'); return; }
    login(username.trim(), mobile.trim());
  };

  // Email login
  const handleEmailLogin = () => {
    if (!email.trim() || !email.includes('@')) { setError('Enter valid email address'); return; }
    const existing = loginByEmail(email.trim());
    if (existing) return;
    if (!username.trim()) { setShowName(true); setError('Enter your name to register'); return; }
    login(username.trim(), '', email.trim());
  };

  // Admin login
  const handleAdmin = () => {
    if (!mobile.trim() || mobile.length < 10) { setError('Enter mobile number'); return; }
    if (!password.trim()) { setError('Enter password'); return; }
    if (verifyAdmin(mobile.trim(), password.trim())) {
      loginAsAdmin();
    } else {
      setError('Invalid mobile number or password');
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-5xl sm:text-6xl mb-3 animate-float">🎮</div>
          <h1 className="text-2xl sm:text-4xl font-extrabold bg-gradient-to-r from-primary-light via-accent to-primary bg-clip-text text-transparent mb-1">KITY STORE</h1>
          <p className="text-text-secondary text-xs sm:text-sm">Premium Game Keys</p>
        </div>

        <div className="glass-card rounded-xl sm:rounded-2xl p-5 sm:p-6 space-y-3">
          {/* Tab Switch */}
          <div className="flex gap-1 p-1 b
          g-surface-lighter rounded-xl">
            <button onClick={() => { setMode('mobile'); setError(''); setShowName(false); }}
              className={`flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-medium transition-all ${mode === 'mobile' ? 'bg-primary text-white' : 'text-text-secondary'}`}>
              📱 Mobile
            </button>
            <button onClick={() => { setMode('email'); setError(''); setShowName(false); }}
              className={`flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-medium transition-all ${mode === 'email' ? 'bg-primary text-white' : 'text-text-secondary'}`}>
              📧 Gmail
            </button>
            <button onClick={() => { setMode('admin'); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-medium transition-all ${mode === 'admin' ? 'bg-primary text-white' : 'text-text-secondary'}`}>
              🔐 Admin
            </button>
          </div>

          {/* ========= MOBILE LOGIN ========= */}
          {mode === 'mobile' && (
            <>
              <div>
                <label className="block text-text-muted text-[10px] mb-1">📱 Mobile Number</label>
                <div className="flex gap-2">
                  <span className="bg-surface-lighter border border-border rounded-xl px-3 py-2.5 text-text-muted text-sm flex items-center">+91</span>
                  <input type="tel" value={mobile}
                    onChange={(e) => { setMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); setShowName(false); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleMobileLogin()}
                    placeholder="Mobile number" maxLength={10}
                    className="flex-1 bg-surface-lighter border border-border rounded-xl px-4 py-2.5 text-white placeholder-text-muted text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>
              {showName && (
                <div>
                  <label className="block text-text-muted text-[10px] mb-1">👤 Your Name</label>
                  <input type="text" value={username} onChange={(e) => { setUsername(e.target.value); setError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleMobileLogin()}
                    placeholder="Enter your name"
                    className="w-full bg-surface-lighter border border-border rounded-xl px-4 py-2.5 text-white placeholder-text-muted text-sm focus:outline-none focus:border-primary" />
                </div>
              )}
              {error && <p className="text-danger text-xs">{error}</p>}
              <button onClick={handleMobileLogin} className="w-full btn-primary py-2.5 rounded-xl font-semibold text-sm">
                🚀 {showName ? 'Register & Enter' : 'Login with Mobile'}
              </button>
              <p className="text-text-muted text-[10px] text-center">New number? Auto-registers on first login</p>
            </>
          )}

          {/* ========= EMAIL LOGIN ========= */}
          {mode === 'email' && (
            <>
              <div>
                <label className="block text-text-muted text-[10px] mb-1">📧 Email Address</label>
                <input type="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); setShowName(false); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
                  placeholder="you@gmail.com"
                  className="w-full bg-surface-lighter border border-border rounded-xl px-4 py-2.5 text-white placeholder-text-muted text-sm focus:outline-none focus:border-primary" />
              </div>
              {showName && (
                <div>
                  <label className="block text-text-muted text-[10px] mb-1">👤 Your Name</label>
                  <input type="text" value={username} onChange={(e) => { setUsername(e.target.value); setError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
                    placeholder="Enter your name"
                    className="w-full bg-surface-lighter border border-border rounded-xl px-4 py-2.5 text-white placeholder-text-muted text-sm focus:outline-none focus:border-primary" />
                </div>
              )}
              {error && <p className="text-danger text-xs">{error}</p>}
              <button onClick={handleEmailLogin} className="w-full btn-primary py-2.5 rounded-xl font-semibold text-sm">
                🚀 {showName ? 'Register & Enter' : 'Login with Gmail'}
              </button>
              <p className="text-text-muted text-[10px] text-center">New email? Auto-registers on first login</p>
            </>
          )}

          {/* ========= ADMIN LOGIN ========= */}
          {mode === 'admin' && (
            <>
              <div>
                <label className="block text-text-muted text-[10px] mb-1">📱 Mobile Number</label>
                <div className="flex gap-2">
                  <span className="bg-surface-lighter border border-border rounded-xl px-3 py-2.5 text-text-muted text-sm flex items-center">+91</span>
                  <input type="tel" value={mobile}
                    onChange={(e) => { setMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdmin()}
                    placeholder="Admin mobile" maxLength={10}
                    className="flex-1 bg-surface-lighter border border-border rounded-xl px-4 py-2.5 text-white placeholder-text-muted text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="block text-text-muted text-[10px] mb-1">🔒 Password</label>
                <input type="password" value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdmin()}
                  placeholder="Password"
                  className="w-full bg-surface-lighter border border-border rounded-xl px-4 py-2.5 text-white placeholder-text-muted text-sm focus:outline-none focus:border-primary" />
              </div>
              {error && <p className="text-danger text-xs">{error}</p>}
              <button onClick={handleAdmin} className="w-full btn-primary py-2.5 rounded-xl font-semibold text-sm">🔓 Admin Login</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
