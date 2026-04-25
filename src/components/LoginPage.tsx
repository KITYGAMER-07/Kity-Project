import React, { useState } from 'react';
import { useApp } from '../store/AppContext';

const LoginPage: React.FC = () => {
  const { login, loginAsAdmin } = useApp();
  const [username, setUsername] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    login(username.trim());
  };

  const handleAdminLogin = () => {
    if (adminKey === 'sri@1234') {
      loginAsAdmin();
    } else {
      setError('Invalid admin key');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-float">🎮</div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-light via-accent to-primary bg-clip-text text-transparent mb-2">
            KITY DIGITAL STORE
          </h1>
          <p className="text-text-secondary">Premium Game Keys & Digital Products</p>
          <p className="text-text-muted text-sm mt-1">Made by @KITYGAMER</p>
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-4">
          {!showAdminLogin ? (
            <>
              <h2 className="text-xl font-semibold text-center">Welcome!</h2>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Enter your name..."
                  className="w-full bg-surface-lighter border border-border rounded-xl px-4 py-3 text-white placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                />
              </div>
              {error && <p className="text-danger text-sm">{error}</p>}
              <button
                onClick={handleLogin}
                className="w-full btn-primary py-3 rounded-xl font-semibold text-lg"
              >
                🚀 Enter Store
              </button>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-bg-card text-text-muted">or</span></div>
              </div>
              <button
                onClick={() => { setShowAdminLogin(true); setError(''); }}
                className="w-full bg-surface-lighter border border-border py-3 rounded-xl text-text-secondary hover:text-white hover:border-primary/50 transition-all"
              >
                🔑 Admin Login
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-center">🔑 Admin Login</h2>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Admin Key</label>
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => { setAdminKey(e.target.value); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                  placeholder="Enter admin key..."
                  className="w-full bg-surface-lighter border border-border rounded-xl px-4 py-3 text-white placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                />
              </div>
              {error && <p className="text-danger text-sm">{error}</p>}
              <button
                onClick={handleAdminLogin}
                className="w-full btn-primary py-3 rounded-xl font-semibold"
              >
                Login as Admin
              </button>
              <button
                onClick={() => { setShowAdminLogin(false); setError(''); }}
                className="w-full bg-surface-lighter border border-border py-3 rounded-xl text-text-secondary hover:text-white transition-all"
              >
                ← Back
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
