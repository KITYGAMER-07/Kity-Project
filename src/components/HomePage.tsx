import React from 'react';
import { useApp } from '../store/AppContext';
import { getFiles, getPrices, getSetting } from '../store/db';

const HomePage: React.FC = () => {
  const { currentUser, isAdmin, navigate } = useApp();
  const files = getFiles();
  const prices = getPrices();
  const upi = getSetting('UPI_ID');

  const features = [
    { icon: '🎮', title: 'Premium Games', desc: 'BGMI, Free Fire, PUBG & more' },
    { icon: '🔑', title: 'Instant Keys', desc: 'Get activation keys instantly' },
    { icon: '🔒', title: 'Secure Payment', desc: 'UPI verified transactions' },
    { icon: '🎁', title: 'Free Trials', desc: 'Try before you buy' },
  ];

  const stats = [
    { value: `${files.length}+`, label: 'Products' },
    { value: `${prices.length}+`, label: 'Plans' },
    { value: '24/7', label: 'Support' },
    { value: '₹99', label: 'Starting' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-bg to-accent/20" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl" />
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-accent/10 rounded-full blur-xl" />
          <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-primary/5 rounded-full blur-2xl" />
        </div>
        <div className="relative p-8 sm:p-12 text-center">
          <div className="text-5xl sm:text-7xl mb-4 animate-float">🎮</div>
          <h1 className="text-3xl sm:text-5xl font-extrabold bg-gradient-to-r from-primary-light via-white to-accent bg-clip-text text-transparent mb-3">
            KITY DIGITAL STORE
          </h1>
          <p className="text-text-secondary text-lg sm:text-xl mb-2">
            Premium Game Keys & Digital Products
          </p>
          <p className="text-text-muted text-sm mb-6">Made with ❤️ by @KITYGAMER</p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {currentUser ? (
              <>
                <button
                  onClick={() => navigate('games')}
                  className="btn-accent px-8 py-3 rounded-xl font-semibold text-lg"
                >
                  🎮 Browse Games
                </button>
                {isAdmin && (
                  <button
                    onClick={() => navigate('admin')}
                    className="btn-primary px-8 py-3 rounded-xl font-semibold text-lg"
                  >
                    ⚙️ Admin Panel
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={() => navigate('login')}
                className="btn-accent px-8 py-3 rounded-xl font-semibold text-lg"
              >
                🚀 Get Started
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {stats.map(s => (
          <div key={s.label} className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-light to-accent bg-clip-text text-transparent">
              {s.value}
            </p>
            <p className="text-text-muted text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Features */}
      <h2 className="text-xl font-bold mb-4">✨ Why Choose Us</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {features.map(f => (
          <div key={f.title} className="glass-card rounded-xl p-5 hover:border-primary/30 transition-all">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-semibold mb-1">{f.title}</h3>
            <p className="text-text-muted text-sm">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      {currentUser && (
        <div className="glass-card rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">⚡ Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button onClick={() => navigate('games')} className="bg-surface-lighter hover:bg-primary/20 p-4 rounded-xl text-center transition-all">
              <div className="text-2xl mb-1">🎮</div>
              <p className="text-sm">Games</p>
            </button>
            <button onClick={() => navigate('profile')} className="bg-surface-lighter hover:bg-primary/20 p-4 rounded-xl text-center transition-all">
              <div className="text-2xl mb-1">🎁</div>
              <p className="text-sm">Redeem Trial</p>
            </button>
            <button onClick={() => navigate('profile')} className="bg-surface-lighter hover:bg-primary/20 p-4 rounded-xl text-center transition-all">
              <div className="text-2xl mb-1">👤</div>
              <p className="text-sm">Profile</p>
            </button>
            <button onClick={() => navigate('profile')} className="bg-surface-lighter hover:bg-primary/20 p-4 rounded-xl text-center transition-all">
              <div className="text-2xl mb-1">💬</div>
              <p className="text-sm">Feedback</p>
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center py-6 border-t border-border">
        <p className="text-text-muted text-sm">
          🎮 KITY Digital Store • Made by @KITYGAMER
        </p>
        <p className="text-text-muted text-xs mt-1">
          UPI: {upi || 'Not configured'}
        </p>
      </div>
    </div>
  );
};

export default HomePage;
